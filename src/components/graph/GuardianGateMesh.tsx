/**
 * pow3r.control - 3D Guardian Gate Mesh
 *
 * Purpose:
 * - Renders Guardian gates as hexagonal shield meshes in the 3D scene
 * - Positioned between workflow step nodes on the workflow path
 * - Color indicates gate phase: cyan (pre-commit), amber (pre-deploy), green (post-deploy)
 * - Pulses/rotates to draw attention
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { GuardianGate } from '../../lib/types'

interface GuardianGateMeshProps {
  gate: GuardianGate
  position: [number, number, number]
  isSelected?: boolean
}

const PHASE_COLORS: Record<string, string> = {
  'pre-commit': '#00E5FF',
  'pre-deploy': '#FFB300',
  'post-deploy': '#00E676',
}

export function GuardianGateMesh({ gate, position, isSelected }: GuardianGateMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const color = new THREE.Color(PHASE_COLORS[gate.type] ?? '#888888')

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    meshRef.current.rotation.y = t * 0.5
    meshRef.current.rotation.z = Math.sin(t * 0.8) * 0.1
  })

  const scale = isSelected ? 2.5 : 1.8

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[scale * 1.3, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Hexagonal prism (shield shape) */}
      <mesh ref={meshRef} scale={[scale, scale, scale * 0.3]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.5 : 0.6}
          metalness={0.5}
          roughness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Inner shield icon (smaller hex) */}
      <mesh scale={[scale * 0.5, scale * 0.5, scale * 0.5]}>
        <cylinderGeometry args={[0.6, 0.6, 0.4, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Label */}
      <Billboard position={[0, -scale * 1.8, 0]}>
        <Text
          fontSize={1.2}
          color={color.getStyle()}
          anchorX="center"
          anchorY="top"
          font={undefined}
          maxWidth={25}
        >
          {formatGateName(gate.gate_id)}
        </Text>
      </Billboard>
    </group>
  )
}

function formatGateName(gateId: string): string {
  return gateId
    .replace(/Gate$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
}
