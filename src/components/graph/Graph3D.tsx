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
import { useMemo, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
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
import { CameraController } from './CameraController'
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

      {/* Camera controller with zoom-to-node and auto-rotate */}
      <CameraController positions={positions} />
    </>
  )
}

function AmbientParticles() {
  const ref = useRef<THREE.Points>(null)
  const count = 500
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 300
      arr[i * 3 + 1] = (Math.random() - 0.5) * 300
      arr[i * 3 + 2] = (Math.random() - 0.5) * 300
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.getElapsedTime() * 0.01
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.005) * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        color="#00E5FF"
        size={0.3}
        transparent
        opacity={0.15}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function Graph3D() {
  const selectNode = useControlStore((s) => s.selectNode)
  const selectEdge = useControlStore((s) => s.selectEdge)

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [80, 60, 80], fov: 45, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerMissed={() => {
          selectNode(null)
          selectEdge(null)
        }}
        style={{ background: '#000000' }}
      >
        <color attach="background" args={['#000003']} />
        <fog attach="fog" args={['#000003', 120, 350]} />

        {/* Enhanced multi-point lighting for depth */}
        <ambientLight intensity={0.08} />
        <pointLight position={[60, 90, 60]} intensity={0.8} color="#00E5FF" distance={250} decay={2} />
        <pointLight position={[-60, -50, -60]} intensity={0.4} color="#FF00FF" distance={200} decay={2} />
        <pointLight position={[0, 120, 0]} intensity={0.15} color="#ffffff" distance={300} />
        <pointLight position={[-80, 30, 80]} intensity={0.2} color="#A855F7" distance={180} decay={2} />
        <hemisphereLight args={['#000820', '#000005', 0.1]} />

        {/* Star field (PKG knowledge constellation) */}
        <Stars radius={250} depth={80} count={3000} factor={4} saturation={0.1} fade speed={0.3} />

        {/* Ambient floating particles (Data-as-Light atmosphere) */}
        <AmbientParticles />

        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>

        {/* Enhanced post-processing */}
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.95}
            mipmapBlur
            radius={0.85}
          />
          <Vignette eskil={false} offset={0.15} darkness={0.9} />
        </EffectComposer>
      </Canvas>

      {/* 3D control hints */}
      <div className="absolute bottom-4 left-4 text-[10px] font-mono text-[var(--color-text-muted)] select-none pointer-events-none">
        Drag: rotate | Right-drag: pan | Scroll: zoom | Click: select | Idle: auto-rotate
      </div>
    </div>
  )
}
