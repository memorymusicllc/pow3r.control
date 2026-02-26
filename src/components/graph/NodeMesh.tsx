/**
 * pow3r.control - 3D Node Mesh
 *
 * Purpose:
 * - Renders an XMAP v7 node as a 3D mesh in the R3F scene
 * - Shape varies by node_type: sphere, box, octahedron, torus, etc.
 * - Emissive glow driven by status color
 * - Selection and hover states with scale/outline changes
 * - Billboard label always faces camera
 */
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { XmapNode, NodeType } from '../../lib/types'
import { NODE_TYPE_COLORS, STATUS_COLORS } from '../../lib/types'
import type { Position3D } from './use-force-layout-3d'

interface NodeMeshProps {
  node: XmapNode
  position: Position3D
  isSelected: boolean
  isHovered: boolean
  isDimmed: boolean
  isExpandable?: boolean
  isChild?: boolean
  onClick: () => void
  onDoubleClick?: () => void
  onPointerEnter: () => void
  onPointerLeave: () => void
}

const NODE_SCALE = 2.5

export function NodeMesh({
  node,
  position,
  isSelected,
  isHovered,
  isDimmed,
  isExpandable,
  isChild,
  onClick,
  onDoubleClick,
  onPointerEnter,
  onPointerLeave,
}: NodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [pulsePhase] = useState(() => Math.random() * Math.PI * 2)
  const lastClickTime = useRef(0)

  const typeColor = new THREE.Color(NODE_TYPE_COLORS[node.node_type] ?? '#888888')
  const statusColor = new THREE.Color(STATUS_COLORS[node.status] ?? '#555566')

  const childScale = isChild ? 0.7 : 1.0
  const baseScale = (isSelected ? 1.4 : isHovered ? 1.2 : 1.0) * childScale
  const opacity = isDimmed ? 0.15 : 1.0

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()

    const pulse = node.status === 'failed'
      ? 0.8 + Math.sin(t * 4 + pulsePhase) * 0.2
      : node.status === 'deploying'
        ? 0.9 + Math.sin(t * 2 + pulsePhase) * 0.1
        : 1.0

    meshRef.current.scale.setScalar(baseScale * pulse * NODE_SCALE)

    if (glowRef.current) {
      const glowPulse = 1.0 + Math.sin(t * 1.5 + pulsePhase) * 0.15
      glowRef.current.scale.setScalar(baseScale * glowPulse * NODE_SCALE * 1.6)
    }
  })

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Outer atmospheric glow (larger, softer) */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={isDimmed ? 0.01 : isSelected ? 0.25 : 0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Inner core glow (tighter, brighter) */}
      {!isDimmed && (
        <mesh scale={[NODE_SCALE * 1.15, NODE_SCALE * 1.15, NODE_SCALE * 1.15]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color={isSelected ? '#ffffff' : statusColor}
            transparent
            opacity={isSelected ? 0.15 : 0.05}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Main node mesh */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          const now = Date.now()
          if (onDoubleClick && now - lastClickTime.current < 350) {
            onDoubleClick()
            lastClickTime.current = 0
          } else {
            lastClickTime.current = now
            onClick()
          }
        }}
        onPointerEnter={(e) => { e.stopPropagation(); onPointerEnter() }}
        onPointerLeave={onPointerLeave}
      >
        <NodeGeometry type={node.node_type} />
        <meshStandardMaterial
          color={typeColor}
          emissive={statusColor}
          emissiveIntensity={isDimmed ? 0.03 : isSelected ? 1.8 : 0.7}
          metalness={0.4}
          roughness={0.3}
          transparent
          opacity={opacity}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[NODE_SCALE * 1.8, 0.15, 8, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Expandable indicator: dashed outer ring */}
      {isExpandable && !isChild && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[NODE_SCALE * 2.2, 0.08, 8, 24]} />
          <meshBasicMaterial
            color={typeColor}
            transparent
            opacity={isDimmed ? 0.05 : isHovered ? 0.5 : 0.2}
          />
        </mesh>
      )}

      {/* Label */}
      <Billboard position={[0, -NODE_SCALE * 2.2, 0]}>
        <Text
          fontSize={1.8}
          color={isDimmed ? '#333344' : '#ccccdd'}
          anchorX="center"
          anchorY="top"
          font={undefined}
          maxWidth={30}
        >
          {node.name}
        </Text>
      </Billboard>

      {/* Type abbreviation inside node */}
      <Billboard>
        <Text
          fontSize={1.4}
          color={isDimmed ? '#222233' : typeColor.getStyle()}
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
          font={undefined}
        >
          {nodeTypeAbbrev(node.node_type)}
        </Text>
      </Billboard>
    </group>
  )
}

function NodeGeometry({ type }: { type: NodeType }) {
  switch (type) {
    case 'data':
      return <boxGeometry args={[1.6, 1.6, 1.6]} />
    case 'agent':
      return <octahedronGeometry args={[1.1]} />
    case 'gateway':
      return <torusGeometry args={[0.8, 0.35, 8, 16]} />
    case 'mcp_server':
      return <icosahedronGeometry args={[1.0]} />
    case 'workflow':
      return <cylinderGeometry args={[0.9, 0.9, 1.4, 6]} />
    case 'observer':
      return <dodecahedronGeometry args={[1.0]} />
    case 'component_factory':
      return <boxGeometry args={[1.4, 1.0, 1.4]} />
    case 'ui':
      return <sphereGeometry args={[1.0, 24, 24]} />
    case 'service':
    default:
      return <sphereGeometry args={[1.0, 16, 16]} />
  }
}

function nodeTypeAbbrev(type: NodeType): string {
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
