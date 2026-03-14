/**
 * pow3r.control - SubGraph 2D Visualization
 *
 * Purpose:
 * - Renders a sub-graph inside the ExpandedNodeView
 * - Accepts nodes and edges as props (decoupled from global store)
 * - Supports failure highlighting (red glow)
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import { NODE_TYPE_COLORS, STATUS_COLORS, EDGE_TYPE_STYLES } from '../../lib/types'
import type { XmapNode, XmapEdge } from '../../lib/types'

interface SimNode extends SimulationNodeDatum {
  id: string
  node: XmapNode
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  edge: XmapEdge
}

interface SubGraph2DProps {
  nodes: XmapNode[]
  edges: XmapEdge[]
  failures?: { nodeFailures: any[]; edgeFailures: any[] }
  onNodeClick?: (nodeId: string) => void
}

export function SubGraph2D({ nodes, edges, failures, onNodeClick }: SubGraph2DProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 })
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [containerSize, setContainerSize] = useState({ width: 400, height: 300 })
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  // Failure sets for O(1) lookup
  const failedNodeIds = new Set(failures?.nodeFailures.map(f => f.nodeId))
  const failedEdgeIds = new Set(failures?.edgeFailures.map(f => f.edgeId))

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width, height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // React #185 fix: layoutKey excludes containerSize; throttle setPositions
  const layoutKey = `${nodes.map((n) => n.node_id).sort().join(',')}|${edges.map((e) => `${e.from_node}->${e.to_node}`).sort().join('|')}`
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const rafIdRef = useRef<number>(0)
  const containerSizeRef = useRef(containerSize)
  containerSizeRef.current = containerSize

  useEffect(() => {
    if (nodes.length === 0) return
    const size = containerSizeRef.current

    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.node_id,
      node: n,
      x: size.width / 2 + (Math.random() - 0.5) * 50,
      y: size.height / 2 + (Math.random() - 0.5) * 50,
    }))

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]))

    const simLinks: SimLink[] = edges
      .filter((e) => nodeMap.has(e.from_node) && nodeMap.has(e.to_node))
      .map((e) => ({
        source: e.from_node,
        target: e.to_node,
        edge: e,
      }))

    const simulation = forceSimulation(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(80)
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(size.width / 2, size.height / 2))
      .force('collide', forceCollide(30))
      .alphaDecay(0.05)

    let pendingUpdate = false
    let lastUpdateAt = 0
    simulation.on('tick', () => {
      const next = new Map<string, { x: number; y: number }>()
      simNodes.forEach((n) => {
        next.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 })
      })
      positionsRef.current = next
      if (!pendingUpdate) {
        const now = Date.now()
        if (lastUpdateAt > 0 && now - lastUpdateAt < 60) return
        pendingUpdate = true
        lastUpdateAt = now
        rafIdRef.current = requestAnimationFrame(() => {
          pendingUpdate = false
          setPositions(new Map(positionsRef.current))
        })
      }
    })

    return () => {
      simulation.stop()
      cancelAnimationFrame(rafIdRef.current)
    }
  }, [layoutKey])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform((t) => ({
      ...t,
      scale: Math.max(0.1, Math.min(5, t.scale * delta)),
    }))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === 'svg') {
      isDragging.current = true
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return (
    <div ref={containerRef} className="w-full h-[400px] relative overflow-hidden bg-[var(--color-bg-deep)] rounded border border-[var(--color-border)]">
      <svg
        ref={svgRef}
        width={containerSize.width}
        height={containerSize.height}
        className="absolute inset-0"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
      >
        <defs>
          {Object.entries(EDGE_TYPE_STYLES).map(([type, style]) => (
            <marker
              key={type}
              id={`sub-arrow-${type}`}
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={style.color} opacity={0.7} />
            </marker>
          ))}
          <filter id="sub-glow-fail">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="var(--color-error)" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Edges */}
          {edges.map((edge) => {
            const src = positions.get(edge.from_node)
            const tgt = positions.get(edge.to_node)
            if (!src || !tgt) return null

            const style = EDGE_TYPE_STYLES[edge.edge_type] ?? EDGE_TYPE_STYLES.data
            const isFailed = failedEdgeIds.has(edge.edge_id)

            const dx = tgt.x - src.x
            const dy = tgt.y - src.y
            const len = Math.sqrt(dx * dx + dy * dy)
            const nx = len > 0 ? dx / len : 0
            const ny = len > 0 ? dy / len : 0
            const offset = 20
            const x1 = src.x + nx * offset
            const y1 = src.y + ny * offset
            const x2 = tgt.x - nx * offset
            const y2 = tgt.y - ny * offset

            return (
              <path
                key={edge.edge_id}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                stroke={isFailed ? 'var(--color-error)' : style.color}
                strokeWidth={isFailed ? 2 : 1}
                strokeDasharray={style.dashArray}
                strokeOpacity={0.6}
                fill="none"
                markerEnd={`url(#sub-arrow-${edge.edge_type})`}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = positions.get(node.node_id)
            if (!pos) return null

            const isFailed = failedNodeIds.has(node.node_id)
            const r = 18
            const typeColor = NODE_TYPE_COLORS[node.node_type] ?? '#888'
            const statusColor = STATUS_COLORS[node.status] ?? '#555'

            return (
              <g
                key={node.node_id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onNodeClick?.(node.node_id)
                }}
              >
                {/* Failure glow */}
                {isFailed && (
                  <circle
                    r={r + 6}
                    fill="none"
                    stroke="var(--color-error)"
                    strokeWidth={2}
                    opacity={0.8}
                    filter="url(#sub-glow-fail)"
                    className="animate-pulse"
                  />
                )}
                
                {/* Node body */}
                <circle
                  r={r}
                  fill={`${typeColor}20`}
                  stroke={typeColor}
                  strokeWidth={1.5}
                />
                
                {/* Status dot */}
                <circle
                  r={3}
                  cx={r * 0.7}
                  cy={-r * 0.7}
                  fill={statusColor}
                />
                
                {/* Label */}
                <text
                  y={r + 12}
                  textAnchor="middle"
                  fill="var(--color-text-primary)"
                  fontSize={8}
                  fontFamily="monospace"
                >
                  {node.name.length > 15 ? node.name.slice(0, 12) + '...' : node.name}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
