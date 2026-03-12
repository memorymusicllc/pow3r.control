/**
 * pow3r.control - 3D Edge Beam with Particle Trail
 *
 * Purpose:
 * - Renders an XMAP v7 edge as a luminous tube between two 3D nodes
 * - Animated particles flow along the edge path (Data-as-Light)
 * - Color and dash style driven by edge_type
 * - Selection and hover highlighting
 */
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Line as ThreeLine } from 'three'
import type { XmapEdge } from '../../lib/types'
import { getEdgeStyle } from '../../lib/types'
import { useThemeStore } from '../../store/theme-store'
import type { Position3D } from './use-force-layout-3d'

interface EdgeBeamProps {
  edge: XmapEdge
  sourcePos: Position3D
  targetPos: Position3D
  isSelected: boolean
  isConnectedToSelected: boolean
  isDimmed: boolean
  layerOpacity?: number
  onClick: () => void
}

const PARTICLE_COUNT = 20
const PARTICLE_SPEED = 0.5

export function EdgeBeam({
  edge,
  sourcePos,
  targetPos,
  isSelected,
  isConnectedToSelected,
  isDimmed,
  layerOpacity = 1,
  onClick,
}: EdgeBeamProps) {
  const lineRef = useRef<ThreeLine>(null!)
  const particlesRef = useRef<THREE.Points>(null)
  const resolved = useThemeStore((s) => s.resolved)

  const style = getEdgeStyle(edge.edge_type, resolved)
  const edgeColor = new THREE.Color(style.color)

  const { curve } = useMemo(() => {
    const src = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z)
    const tgt = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
    const mid = new THREE.Vector3().addVectors(src, tgt).multiplyScalar(0.5)

    const dir = new THREE.Vector3().subVectors(tgt, src)
    const len = dir.length()
    const perpOffset = len * 0.15

    const up = new THREE.Vector3(0, 1, 0)
    const perp = new THREE.Vector3().crossVectors(dir, up).normalize()
    if (perp.length() < 0.01) {
      perp.set(1, 0, 0)
    }
    mid.addScaledVector(perp, perpOffset)

    const curve = new THREE.QuadraticBezierCurve3(src, mid, tgt)
    return { curve }
  }, [sourcePos.x, sourcePos.y, sourcePos.z, targetPos.x, targetPos.y, targetPos.z])

  const linePoints = useMemo(() => {
    return curve.getPoints(32)
  }, [curve])

  const particlePositions = useMemo(() => {
    return new Float32Array(PARTICLE_COUNT * 3)
  }, [])

  const particleSizes = useMemo(() => {
    return new Float32Array(PARTICLE_COUNT).fill(0.6)
  }, [])

  const particleOffsets = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => i / PARTICLE_COUNT)
  }, [])

  useFrame(({ clock }) => {
    if (!particlesRef.current || isDimmed) return
    const t = clock.getElapsedTime()
    const positions = particlesRef.current.geometry.attributes.position

    if (!positions) return

    const speedMult = edge.edge_type === 'control' ? 1.5
      : edge.edge_type === 'event' ? 2.0
      : edge.edge_type === 'api' ? 0.8
      : 1.0

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const progress = (particleOffsets[i] + t * PARTICLE_SPEED * speedMult) % 1
      const point = curve.getPoint(progress)
      positions.setXYZ(i, point.x, point.y, point.z)
    }
    positions.needsUpdate = true
  })

  const isLight = resolved === 'light'
  const baseLine = isDimmed ? 0.04 : isSelected ? 0.9 : isConnectedToSelected ? 0.5 : 0.2
  const baseParticle = isDimmed ? 0 : isSelected ? 0.9 : isConnectedToSelected ? 0.5 : 0.25
  const lineOpacity = (isLight ? Math.min(1, baseLine * 3.0) : baseLine) * layerOpacity
  const particleOpacity = (isLight ? Math.min(1, baseParticle * 2.5) : baseParticle) * layerOpacity

  useEffect(() => {
    if (lineRef.current) {
      const geo = new THREE.BufferGeometry().setFromPoints(linePoints)
      lineRef.current.geometry = geo
    }
  }, [linePoints])

  return (
    <group>
      {/* Edge line */}
      <primitive
        object={new ThreeLine(
          new THREE.BufferGeometry().setFromPoints(linePoints),
          new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: lineOpacity })
        )}
        ref={lineRef}
      />

      {/* Invisible thicker line for easier click target */}
      <mesh onClick={(e) => { e.stopPropagation(); onClick() }}>
        <tubeGeometry args={[curve, 16, isSelected ? 0.4 : 0.2, 4, false]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Solid tube: always visible in light mode, glow in dark mode when selected */}
      {(isSelected || isConnectedToSelected || isLight) && (
        <mesh>
          <tubeGeometry args={[curve, 16, isLight ? 0.3 : 0.15, 6, false]} />
          <meshBasicMaterial
            color={edgeColor}
            transparent
            opacity={(isLight ? (isSelected ? 0.85 : isConnectedToSelected ? 0.65 : 0.5) : (isSelected ? 0.3 : 0.1)) * layerOpacity}
            depthWrite={isLight}
          />
        </mesh>
      )}

      {/* Flowing particles */}
      {!isDimmed && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
              count={PARTICLE_COUNT}
            />
            <bufferAttribute
              attach="attributes-size"
              args={[particleSizes, 1]}
              count={PARTICLE_COUNT}
            />
          </bufferGeometry>
          <pointsMaterial
            color={isLight ? edgeColor : edgeColor}
            size={isLight ? (isSelected ? 2.2 : 1.4) : (isSelected ? 1.8 : 0.9)}
            transparent
            opacity={particleOpacity * (isLight ? 1.8 : 1.3)}
            sizeAttenuation
            depthWrite={false}
            blending={isLight ? THREE.NormalBlending : THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Arrow indicator near target */}
      {!isDimmed && (
        <mesh position={curve.getPoint(0.85).toArray()}>
          <coneGeometry args={[isLight ? 0.4 : 0.3, isLight ? 1.0 : 0.8, 4]} />
          <meshBasicMaterial
            color={edgeColor}
            transparent={!isLight}
            opacity={isLight ? 1.0 : lineOpacity * 0.8}
          />
        </mesh>
      )}
    </group>
  )
}
