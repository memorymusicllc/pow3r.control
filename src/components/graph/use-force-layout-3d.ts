/**
 * pow3r.control - 3D Force-Directed Layout Hook
 *
 * Purpose:
 * - Computes 3D positions for XMAP v7 nodes using d3-force-3d
 * - Returns a Map of node_id -> {x, y, z} updated each simulation tick
 * - Stabilizes after initial layout, then freezes for performance
 *
 * React #185 fix: Effect depends on layoutKey (graph structure only), not nodes/edges
 * references. XMAP WS status updates (patchNodeStatuses) create new node refs but same
 * structure; without this, effect would re-run on every status batch -> sim restart ->
 * tick cascade -> setPositions -> re-render -> loop.
 */
import { useEffect, useState, useRef, useMemo } from 'react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force-3d'
import type { XmapNode, XmapEdge } from '../../lib/types'

export interface Position3D {
  x: number
  y: number
  z: number
}

interface SimNode {
  id: string
  node: XmapNode
  x?: number
  y?: number
  z?: number
  vx?: number
  vy?: number
  vz?: number
}

interface SimLink {
  source: string | SimNode
  target: string | SimNode
  edge: XmapEdge
}

export function useForceLayout3D(
  nodes: XmapNode[],
  edges: XmapEdge[]
): Map<string, Position3D> {
  const [positions, setPositions] = useState<Map<string, Position3D>>(new Map())
  const simRef = useRef<ReturnType<typeof forceSimulation> | null>(null)
  const positionsRef = useRef<Map<string, Position3D>>(new Map())
  const rafIdRef = useRef<number>(0)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  nodesRef.current = nodes
  edgesRef.current = edges

  const layoutKey = useMemo(() => {
    const nodeIds = nodes.map((n) => n.node_id).sort().join(',')
    const edgeKeys = edges.map((e) => `${e.from_node}->${e.to_node}`).sort().join('|')
    return `${nodeIds}|${edgeKeys}`
  }, [nodes, edges])

  useEffect(() => {
    const nodes = nodesRef.current
    const edges = edgesRef.current
    if (nodes.length === 0) {
      setPositions(new Map())
      return
    }

    if (simRef.current) {
      simRef.current.stop()
    }

    const spread = Math.min(80, Math.max(30, nodes.length * 0.5))
    const prev = positionsRef.current

    const simNodes: SimNode[] = nodes.map((n) => {
      const existing = prev.get(n.node_id)
      if (existing) return { id: n.node_id, node: n, x: existing.x, y: existing.y, z: existing.z }
      return {
        id: n.node_id,
        node: n,
        x: (Math.random() - 0.5) * spread,
        y: (Math.random() - 0.5) * spread,
        z: (Math.random() - 0.5) * spread,
      }
    })

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]))

    const simLinks: SimLink[] = edges
      .filter((e) => nodeMap.has(e.from_node) && nodeMap.has(e.to_node))
      .map((e) => ({
        source: e.from_node,
        target: e.to_node,
        edge: e,
      }))

    const sim = forceSimulation(simNodes, 3)
      .force(
        'link',
        forceLink(simLinks)
          .id((d: SimNode) => d.id)
          .distance(25)
          .strength(0.6)
      )
      .force('charge', forceManyBody().strength(-80).distanceMax(150))
      .force('center', forceCenter(0, 0, 0).strength(0.1))
      .force('collide', forceCollide(8).iterations(2))
      .alphaDecay(0.02)
      .velocityDecay(0.4)

    simRef.current = sim

    let pendingUpdate = false
    sim.on('tick', () => {
      const next = new Map<string, Position3D>()
      simNodes.forEach((n) => {
        next.set(n.id, {
          x: n.x ?? 0,
          y: n.y ?? 0,
          z: n.z ?? 0,
        })
      })
      positionsRef.current = next
      if (!pendingUpdate) {
        pendingUpdate = true
        rafIdRef.current = requestAnimationFrame(() => {
          pendingUpdate = false
          setPositions(new Map(positionsRef.current))
        })
      }
    })

    return () => {
      sim.stop()
      cancelAnimationFrame(rafIdRef.current)
      simRef.current = null
    }
  }, [layoutKey])

  return positions
}
