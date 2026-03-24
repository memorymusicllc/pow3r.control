/**
 * pow3r.control - Pow3r 3D Data Graph
 *
 * Renders a v7-style declarative graph (nodes, edges, menu) from JSON.
 * Design Playbook / XMAP agent extension point: load alternate manifests from config API.
 */
import { useCallback, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { Pow3rDataGraphConfig, Pow3rDataGraphEdge, Pow3rDataGraphNode } from './pow3r-data-graph-types'
import defaultManifest from './pow3r-data-graph-default.json'

const DEFAULT_MANIFEST = defaultManifest as Pow3rDataGraphConfig

function edgePoints(from: Pow3rDataGraphNode, to: Pow3rDataGraphNode): [number, number, number][] {
  const [ax, ay, az] = from.position
  const [bx, by, bz] = to.position
  const dist = Math.hypot(bx - ax, by - ay, bz - az)
  if (dist < 1e-3) {
    const r = (from.ui.size ?? 1) * 2
    const segs = 32
    const pts: [number, number, number][] = []
    for (let i = 0; i <= segs; i++) {
      const t = (i / segs) * Math.PI
      pts.push([ax + r * Math.cos(t), ay + r * Math.sin(t), az])
    }
    return pts
  }
  return [
    [ax, ay, az],
    [bx, by, bz],
  ]
}

function GraphNodeMesh({
  node,
  highlightColor,
  isSelected,
  onPick,
}: {
  node: Pow3rDataGraphNode
  highlightColor: string
  isSelected: boolean
  onPick: (n: Pow3rDataGraphNode) => void
}) {
  const { shape = 'sphere', color = '#888888', size = 1, label = node.node_id } = node.ui
  const [hover, setHover] = useState(false)
  const displayColor = hover || isSelected ? highlightColor : color

  const mesh = (
    <mesh
      position={node.position}
      onClick={(e) => {
        e.stopPropagation()
        onPick(node)
      }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      {shape === 'sphere' && <sphereGeometry args={[size, 32, 32]} />}
      {shape === 'box' && <boxGeometry args={[size, size, size]} />}
      {shape === 'cylinder' && <cylinderGeometry args={[size / 2, size / 2, size * 2, 32]} />}
      <meshStandardMaterial color={displayColor} />
    </mesh>
  )

  return (
    <group>
      {mesh}
      <Html
        position={node.position}
        distanceFactor={10}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: '11px',
            fontFamily: 'ui-monospace, monospace',
            textAlign: 'center',
            textShadow: '0 0 6px #000',
            whiteSpace: 'nowrap',
            transform: 'translate(-50%, -120%)',
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  )
}

function GraphEdgeLine({
  points,
  color,
  lineWidth,
  highlight,
  highlightColor,
  widthBoost,
}: {
  points: [number, number, number][]
  color: string
  lineWidth: number
  highlight: boolean
  highlightColor: string
  widthBoost: number
}) {
  const c = highlight ? highlightColor : color
  const w = highlight ? lineWidth + widthBoost : lineWidth
  return <Line points={points.map((p) => new THREE.Vector3(...p))} color={c} lineWidth={w} dashed={false} />
}

function GraphScene({
  manifest,
  selectedId,
  onSelectNode,
  visualCues,
}: {
  manifest: Pow3rDataGraphConfig
  selectedId: string | null
  onSelectNode: (n: Pow3rDataGraphNode) => void
  visualCues: NonNullable<NonNullable<Pow3rDataGraphConfig['scene']>['ui']>['visualCues']
}) {
  const nodeHighlight = visualCues?.nodeHighlight ?? '#00FFFF'
  const edgeHighlight = visualCues?.edgeHighlight ?? '#FF00FF'

  const nodeById = useMemo(() => {
    const m = new Map<string, Pow3rDataGraphNode>()
    for (const n of manifest.nodes) m.set(n.node_id, n)
    return m
  }, [manifest.nodes])

  const edgeWidthBoost = 2

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[12, 14, 10]} intensity={1.1} />
      <OrbitControls makeDefault enablePan enableZoom enableRotate />

      {manifest.edges.map((edge: Pow3rDataGraphEdge) => {
        const from = nodeById.get(edge.from_node)
        const to = nodeById.get(edge.to_node)
        if (!from || !to) return null
        const pts = edgePoints(from, to)
        const isEdgeSelected = selectedId === edge.edge_id
        const isEndpointSelected =
          selectedId === edge.from_node || selectedId === edge.to_node
        const highlight = isEdgeSelected || isEndpointSelected
        return (
          <GraphEdgeLine
            key={edge.edge_id}
            points={pts}
            color={edge.ui.color ?? '#cccccc'}
            lineWidth={edge.ui.lineWidth ?? 2}
            highlight={highlight}
            highlightColor={edgeHighlight}
            widthBoost={edgeWidthBoost}
          />
        )
      })}

      {manifest.nodes.map((node) => (
        <GraphNodeMesh
          key={node.node_id}
          node={node}
          highlightColor={nodeHighlight}
          isSelected={selectedId === node.node_id}
          onPick={onSelectNode}
        />
      ))}
    </>
  )
}

export interface Pow3rDataGraph3DProps {
  /** Optional manifest; defaults to bundled Design Playbook sample */
  manifest?: Pow3rDataGraphConfig
  className?: string
}

export function Pow3rDataGraph3D({ manifest = DEFAULT_MANIFEST, className }: Pow3rDataGraph3DProps) {
  const [manifestState, setManifestState] = useState<Pow3rDataGraphConfig>(() => ({
    ...manifest,
    nodes: manifest.nodes.map((n) => ({ ...n, ui: { ...n.ui } })),
  }))

  const visualCues = manifestState.scene?.ui?.visualCues
  const menuBg = visualCues?.menuBackground ?? '#111111'
  const menuFg = visualCues?.fontColor ?? '#ffffff'

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const inspector = useMemo(() => {
    if (!selectedId) return { title: 'Pow3r 3D Data Graph', body: 'Select a node or edge from the menu or click a node.' }
    const node = manifestState.nodes.find((n) => n.node_id === selectedId)
    if (node) {
      return {
        title: node.metadata?.reference ?? node.name ?? node.node_id,
        body: `node_id: ${node.node_id} | type: ${node.node_type ?? '—'}`,
      }
    }
    const edge = manifestState.edges.find((e) => e.edge_id === selectedId)
    if (edge) {
      return {
        title: edge.metadata?.reference ?? edge.edge_id,
        body: `${edge.from_node} -> ${edge.to_node} | ${edge.edge_type ?? 'edge'}`,
      }
    }
    return { title: selectedId, body: '' }
  }, [manifestState.edges, manifestState.nodes, selectedId])

  const onSelectNode = useCallback((n: Pow3rDataGraphNode) => {
    setSelectedId(n.node_id)
    if (n.node_id === 'mediaGen1') {
      setManifestState((prev) => {
        const nodes = prev.nodes.map((x) => {
          if (x.node_id !== 'mediaGen1') return x
          const cur = x.ui.color ?? '#00AAFF'
          const next = cur === '#00AAFF' ? '#FF5500' : '#00AAFF'
          return { ...x, ui: { ...x.ui, color: next } }
        })
        return { ...prev, nodes }
      })
    }
  }, [])

  const menuItems = manifestState.menu?.items ?? []

  return (
    <div className={`relative h-full w-full min-h-[320px] bg-[var(--color-bg-deep)] ${className ?? ''}`}>
      <Canvas camera={{ position: [0, 2, 18], fov: 50 }} className="h-full w-full">
        <GraphScene
          manifest={manifestState}
          selectedId={selectedId}
          onSelectNode={onSelectNode}
          visualCues={visualCues}
        />
      </Canvas>

      {manifestState.menu?.enabled !== false && menuItems.length > 0 && (
        <div
          className="absolute top-3 right-3 z-10 max-h-[min(70vh,420px)] overflow-y-auto rounded-lg border border-[var(--color-border)] p-2 shadow-xl"
          style={{ backgroundColor: menuBg, color: menuFg, maxWidth: 260 }}
        >
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider opacity-80">Graph</div>
          {menuItems.map((item) => (
            <button
              key={`${item.action}-${item.target}`}
              type="button"
              onClick={() => setSelectedId(item.target)}
              className={`mb-0.5 w-full rounded px-2 py-1.5 text-left font-mono text-[11px] transition-colors ${
                selectedId === item.target ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)]/95 px-3 py-2 backdrop-blur-sm">
        <p className="font-mono text-[11px] font-semibold text-[var(--color-cyan)]">{inspector.title}</p>
        <p className="font-mono text-[10px] text-[var(--color-text-muted)]">{inspector.body}</p>
      </div>
    </div>
  )
}
