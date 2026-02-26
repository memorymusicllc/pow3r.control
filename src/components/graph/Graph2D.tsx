/**
 * pow3r.control - 2D Graph Visualization
 *
 * Purpose:
 * - Force-directed 2D graph rendering of XMAP v7 nodes and edges
 * - Interactive pan, zoom, click-to-select
 * - Renders nodes as colored circles, edges as styled paths
 *
 * Agent Instructions:
 * - Uses D3-force for layout simulation
 * - SVG rendering for crisp edges and text
 * - Subscribes to Zustand store for data and selection state
 */
import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import { useControlStore } from '../../store/control-store'
import { NODE_TYPE_COLORS, STATUS_COLORS, EDGE_TYPE_STYLES } from '../../lib/types'
import type { XmapNode, XmapEdge } from '../../lib/types'

interface SimNode extends SimulationNodeDatum {
  id: string
  node: XmapNode
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  edge: XmapEdge
}

function useFilteredGraph() {
  const config = useControlStore((s) => s.config)
  const searchQuery = useControlStore((s) => s.searchQuery)
  const filterNodeTypes = useControlStore((s) => s.filterNodeTypes)
  const filterStatuses = useControlStore((s) => s.filterStatuses)

  return useMemo(() => {
    if (!config) return { nodes: [] as XmapNode[], edges: [] as XmapEdge[] }
    let nodes = config.nodes

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      nodes = nodes.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.node_id.toLowerCase().includes(q) ||
          n.node_type.toLowerCase().includes(q) ||
          (n.description?.toLowerCase().includes(q) ?? false) ||
          (n.tech_stack?.some((t) => t.toLowerCase().includes(q)) ?? false)
      )
    }

    if (filterNodeTypes.size > 0) {
      nodes = nodes.filter((n) => filterNodeTypes.has(n.node_type))
    }

    if (filterStatuses.size > 0) {
      nodes = nodes.filter((n) => filterStatuses.has(n.status))
    }

    const visibleIds = new Set(nodes.map((n) => n.node_id))
    const edges = config.edges.filter(
      (e) => visibleIds.has(e.from_node) && visibleIds.has(e.to_node)
    )

    return { nodes, edges }
  }, [config, searchQuery, filterNodeTypes, filterStatuses])
}

export function Graph2D() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { nodes, edges } = useFilteredGraph()
  const selectedNodeId = useControlStore((s) => s.selectedNodeId)
  const selectedEdgeId = useControlStore((s) => s.selectedEdgeId)
  const hoveredNodeId = useControlStore((s) => s.hoveredNodeId)
  const searchQuery = useControlStore((s) => s.searchQuery)
  const selectNode = useControlStore((s) => s.selectNode)
  const selectEdge = useControlStore((s) => s.selectEdge)
  const setHoveredNode = useControlStore((s) => s.setHoveredNode)

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [containerSize, setContainerSize] = useState({ width: 900, height: 600 })
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

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

  useEffect(() => {
    if (nodes.length === 0) return

    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.node_id,
      node: n,
      x: containerSize.width / 2 + (Math.random() - 0.5) * 200,
      y: containerSize.height / 2 + (Math.random() - 0.5) * 200,
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
          .distance(140)
      )
      .force('charge', forceManyBody().strength(-400))
      .force('center', forceCenter(containerSize.width / 2, containerSize.height / 2))
      .force('collide', forceCollide(50))
      .alphaDecay(0.02)

    simulation.on('tick', () => {
      const next = new Map<string, { x: number; y: number }>()
      simNodes.forEach((n) => {
        next.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 })
      })
      setPositions(new Map(next))
    })

    return () => {
      simulation.stop()
    }
  }, [nodes, edges, containerSize])

  const matchedNodeIds = useMemo(() => {
    if (!searchQuery) return new Set<string>()
    const q = searchQuery.toLowerCase()
    return new Set(
      nodes
        .filter(
          (n) =>
            n.name.toLowerCase().includes(q) ||
            n.node_id.toLowerCase().includes(q) ||
            n.node_type.toLowerCase().includes(q)
        )
        .map((n) => n.node_id)
    )
  }, [nodes, searchQuery])

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

  const handleBackgroundClick = useCallback(() => {
    selectNode(null)
    selectEdge(null)
  }, [selectNode, selectEdge])

  const nodeRadius = (n: XmapNode) => {
    if (n.node_id === selectedNodeId) return 32
    if (n.node_id === hoveredNodeId) return 28
    return 24
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[var(--color-bg-deep)]">
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
        onClick={handleBackgroundClick}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
      >
        <defs>
          {Object.entries(EDGE_TYPE_STYLES).map(([type, style]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
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
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
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
            const isSelected = edge.edge_id === selectedEdgeId
            const isConnected =
              edge.from_node === selectedNodeId ||
              edge.to_node === selectedNodeId ||
              edge.from_node === hoveredNodeId ||
              edge.to_node === hoveredNodeId

            const dx = tgt.x - src.x
            const dy = tgt.y - src.y
            const len = Math.sqrt(dx * dx + dy * dy)
            const nx = len > 0 ? dx / len : 0
            const ny = len > 0 ? dy / len : 0
            const offset = 26
            const x1 = src.x + nx * offset
            const y1 = src.y + ny * offset
            const x2 = tgt.x - nx * offset
            const y2 = tgt.y - ny * offset

            const mx = (x1 + x2) / 2
            const my = (y1 + y2) / 2
            const cx = mx + ny * 30
            const cy = my - nx * 30

            return (
              <g key={edge.edge_id}>
                <path
                  d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                  stroke={style.color}
                  strokeWidth={isSelected ? 3 : isConnected ? 2 : 1.2}
                  strokeDasharray={style.dashArray}
                  strokeOpacity={isSelected ? 1 : isConnected ? 0.8 : 0.35}
                  fill="none"
                  markerEnd={`url(#arrow-${edge.edge_type})`}
                  filter={isSelected ? 'url(#glow)' : undefined}
                  className="cursor-pointer transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    selectEdge(edge.edge_id)
                  }}
                />
                {isSelected && (
                  <text
                    x={cx}
                    y={cy - 8}
                    textAnchor="middle"
                    fill={style.color}
                    fontSize={10}
                    fontFamily="monospace"
                    opacity={0.9}
                  >
                    {style.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = positions.get(node.node_id)
            if (!pos) return null

            const isSelected = node.node_id === selectedNodeId
            const isHovered = node.node_id === hoveredNodeId
            const isSearchMatch = matchedNodeIds.has(node.node_id)
            const r = nodeRadius(node)
            const typeColor = NODE_TYPE_COLORS[node.node_type] ?? '#888'
            const statusColor = STATUS_COLORS[node.status] ?? '#555'

            const dimmed =
              searchQuery && !isSearchMatch && !isSelected

            return (
              <g
                key={node.node_id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  selectNode(node.node_id)
                }}
                onMouseEnter={() => setHoveredNode(node.node_id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Outer glow ring (status) */}
                <circle
                  r={r + 4}
                  fill="none"
                  stroke={statusColor}
                  strokeWidth={isSelected ? 3 : 1.5}
                  opacity={dimmed ? 0.15 : isSelected ? 1 : 0.6}
                  filter={isSelected || isHovered ? 'url(#glow-strong)' : 'url(#glow)'}
                />
                {/* Node body */}
                <circle
                  r={r}
                  fill={dimmed ? '#1a1a24' : `${typeColor}18`}
                  stroke={typeColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  opacity={dimmed ? 0.3 : 1}
                />
                {/* Status dot */}
                <circle
                  r={4}
                  cx={r * 0.7}
                  cy={-r * 0.7}
                  fill={statusColor}
                  opacity={dimmed ? 0.2 : 0.9}
                />
                {/* Label */}
                <text
                  y={r + 16}
                  textAnchor="middle"
                  fill={dimmed ? '#333' : 'var(--color-text-primary)'}
                  fontSize={11}
                  fontFamily="monospace"
                  fontWeight={isSelected ? 600 : 400}
                >
                  {node.name}
                </text>
                {/* Type icon/abbrev */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={dimmed ? '#333' : typeColor}
                  fontSize={10}
                  fontFamily="monospace"
                  fontWeight={600}
                >
                  {nodeTypeAbbrev(node.node_type)}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Bottom-left info */}
      <div className="absolute bottom-4 left-4 text-[10px] font-mono text-[var(--color-text-muted)] select-none pointer-events-none">
        Drag: pan | Scroll: zoom | Click: select
      </div>
    </div>
  )
}

function nodeTypeAbbrev(type: XmapNode['node_type']): string {
  const map: Record<string, string> = {
    service: 'SVC',
    ui: 'UI',
    data: 'DAT',
    workflow: 'WF',
    observer: 'OBS',
    component_factory: 'FAC',
    mcp_server: 'MCP',
    gateway: 'GW',
    agent: 'AGT',
  }
  return map[type] ?? type.slice(0, 3).toUpperCase()
}
