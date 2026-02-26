/**
 * pow3r.control - 3D Force-Directed Layout Hook
 *
 * Purpose:
 * - Computes 3D positions for XMAP v7 nodes using d3-force-3d
 * - Returns a Map of node_id -> {x, y, z} updated each simulation tick
 * - Stabilizes after initial layout, then freezes for performance
 */
import { useEffect, useState, useRef } from 'react'
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

  useEffect(() => {
    if (nodes.length === 0) {
      setPositions(new Map())
      return
    }

    if (simRef.current) {
      simRef.current.stop()
    }

    const spread = Math.max(60, nodes.length * 8)

    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.node_id,
      node: n,
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: (Math.random() - 0.5) * spread,
    }))

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
          .distance(40)
          .strength(0.5)
      )
      .force('charge', forceManyBody().strength(-120))
      .force('center', forceCenter(0, 0, 0))
      .force('collide', forceCollide(8))
      .alphaDecay(0.03)
      .velocityDecay(0.3)

    simRef.current = sim

    sim.on('tick', () => {
      const next = new Map<string, Position3D>()
      simNodes.forEach((n) => {
        next.set(n.id, {
          x: n.x ?? 0,
          y: n.y ?? 0,
          z: n.z ?? 0,
        })
      })
      setPositions(new Map(next))
    })

    return () => {
      sim.stop()
      simRef.current = null
    }
  }, [nodes, edges])

  return positions
}
