/**
 * pow3r.control - 3D Graph Visualization (R3F)
 *
 * Purpose:
 * - Full Three.js scene rendering XMAP v7 nodes and edges in 3D space
 * - Data-as-Light: particles flow along edges, nodes glow by status
 * - Orbit controls for camera (pan, rotate, zoom)
 * - Post-processing bloom for the glow effect
 *
 * Agent Instructions:
 * - This is the core 3D experience from the concept art
 * - Uses @react-three/fiber Canvas, @react-three/drei helpers
 * - Bloom creates the "Data as Light" aesthetic
 */
import { useMemo, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing'
import { useControlStore } from '../../store/control-store'
import { NodeMesh } from './NodeMesh'
import { EdgeBeam } from './EdgeBeam'
import { GuardianGateMesh } from './GuardianGateMesh'
import { TelemetryParticles } from './TelemetryParticles'
import { useForceLayout3D } from './use-force-layout-3d'
import type { XmapNode, XmapEdge } from '../../lib/types'

function useFilteredGraph3D() {
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

function SceneContent() {
  const { nodes: _filteredNodes } = useFilteredGraph3D()
  const config = useControlStore((s) => s.config)
  const allNodes = config?.nodes ?? []
  const allEdges = config?.edges ?? []
  const guardianGates = config?.guardian ?? []
  const showGovernanceOverlay = useControlStore((s) => s.showGovernanceOverlay)
  const positions = useForceLayout3D(allNodes, allEdges)

  const selectedNodeId = useControlStore((s) => s.selectedNodeId)
  const selectedEdgeId = useControlStore((s) => s.selectedEdgeId)
  const hoveredNodeId = useControlStore((s) => s.hoveredNodeId)
  const searchQuery = useControlStore((s) => s.searchQuery)
  const selectNode = useControlStore((s) => s.selectNode)
  const selectEdge = useControlStore((s) => s.selectEdge)
  const setHoveredNode = useControlStore((s) => s.setHoveredNode)

  const gatePositions = useMemo(() => {
    if (!showGovernanceOverlay || guardianGates.length === 0) return []
    const centerPos = positions.get('guardian-system') ?? positions.get('pow3r-config')
    if (!centerPos) return []
    return guardianGates.map((gate, i) => {
      const angle = (2 * Math.PI * i) / guardianGates.length
      const radius = 25 + (gate.type === 'pre-commit' ? 0 : gate.type === 'pre-deploy' ? 8 : 16)
      return {
        gate,
        position: [
          centerPos.x + Math.cos(angle) * radius,
          centerPos.y + (gate.type === 'pre-commit' ? 10 : gate.type === 'pre-deploy' ? 0 : -10),
          centerPos.z + Math.sin(angle) * radius,
        ] as [number, number, number],
      }
    })
  }, [guardianGates, positions, showGovernanceOverlay])

  const visibleNodeIds = useMemo(() => new Set(_filteredNodes.map((n) => n.node_id)), [_filteredNodes])

  const matchedNodeIds = useMemo(() => {
    if (!searchQuery) return new Set<string>()
    const q = searchQuery.toLowerCase()
    return new Set(
      allNodes
        .filter(
          (n) =>
            n.name.toLowerCase().includes(q) ||
            n.node_id.toLowerCase().includes(q) ||
            n.node_type.toLowerCase().includes(q)
        )
        .map((n) => n.node_id)
    )
  }, [allNodes, searchQuery])

  return (
    <>
      {/* Nodes */}
      {allNodes.map((node) => {
        const pos = positions.get(node.node_id)
        if (!pos) return null

        const isVisible = visibleNodeIds.has(node.node_id)
        const isSelected = node.node_id === selectedNodeId
        const isHovered = node.node_id === hoveredNodeId
        const isDimmed = searchQuery
          ? !matchedNodeIds.has(node.node_id) && !isSelected
          : !isVisible

        return (
          <NodeMesh
            key={node.node_id}
            node={node}
            position={pos}
            isSelected={isSelected}
            isHovered={isHovered}
            isDimmed={isDimmed}
            onClick={() => selectNode(node.node_id)}
            onPointerEnter={() => setHoveredNode(node.node_id)}
            onPointerLeave={() => setHoveredNode(null)}
          />
        )
      })}

      {/* Guardian Gates (governance overlay) */}
      {gatePositions.map(({ gate, position }) => (
        <GuardianGateMesh
          key={gate.gate_id}
          gate={gate}
          position={position}
        />
      ))}

      {/* Edges */}
      {allEdges.map((edge) => {
        const srcPos = positions.get(edge.from_node)
        const tgtPos = positions.get(edge.to_node)
        if (!srcPos || !tgtPos) return null

        const isVisible =
          visibleNodeIds.has(edge.from_node) && visibleNodeIds.has(edge.to_node)
        const isSelected = edge.edge_id === selectedEdgeId
        const isConnectedToSelected =
          edge.from_node === selectedNodeId ||
          edge.to_node === selectedNodeId ||
          edge.from_node === hoveredNodeId ||
          edge.to_node === hoveredNodeId

        return (
          <EdgeBeam
            key={edge.edge_id}
            edge={edge}
            sourcePos={srcPos}
            targetPos={tgtPos}
            isSelected={isSelected}
            isConnectedToSelected={isConnectedToSelected}
            isDimmed={!isVisible && !isConnectedToSelected}
            onClick={() => selectEdge(edge.edge_id)}
          />
        )
      })}

      {/* Telemetry particle bursts */}
      <TelemetryParticles positions={positions} />
    </>
  )
}

export function Graph3D() {
  const selectNode = useControlStore((s) => s.selectNode)
  const selectEdge = useControlStore((s) => s.selectEdge)

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [80, 60, 80], fov: 50, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => {
          selectNode(null)
          selectEdge(null)
        }}
        style={{ background: '#000000' }}
      >
        <color attach="background" args={['#000005']} />
        <fog attach="fog" args={['#000005', 150, 400]} />

        {/* Lighting */}
        <ambientLight intensity={0.15} />
        <pointLight position={[50, 80, 50]} intensity={0.6} color="#00E5FF" />
        <pointLight position={[-50, -40, -50]} intensity={0.3} color="#FF00FF" />
        <pointLight position={[0, 100, 0]} intensity={0.2} color="#ffffff" />

        {/* Background stars (PKG knowledge nodes metaphor) */}
        <Stars radius={300} depth={100} count={2000} factor={3} saturation={0} fade speed={0.5} />

        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>

        {/* Camera controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={20}
          maxDistance={300}
          autoRotate={false}
          enablePan
        />

        {/* Post-processing: Bloom for Data-as-Light glow */}
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.1} darkness={0.8} />
        </EffectComposer>
      </Canvas>

      {/* 3D control hints */}
      <div className="absolute bottom-4 left-4 text-[10px] font-mono text-[var(--color-text-muted)] select-none pointer-events-none">
        Drag: rotate | Right-drag: pan | Scroll: zoom | Click: select
      </div>
    </div>
  )
}
