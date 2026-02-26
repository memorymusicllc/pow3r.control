/**
 * pow3r.control - Telemetry Particle Bursts (3D)
 *
 * Purpose:
 * - Spawns particle bursts at node positions when X-System events arrive
 * - Particles rise upward from the event source node, then fade
 * - Color by severity: cyan (info), amber (medium), red (high/critical)
 * - Creates the "Data as Light" living system effect
 *
 * Agent Instructions:
 * - Subscribes to X-System store events
 * - Each event spawns a burst at the corresponding node position
 * - Particles use additive blending for glow
 */
import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useXSystemStore } from '../../store/x-system-store'
import { SEVERITY_COLORS } from '../../lib/x-system-types'
import type { Position3D } from './use-force-layout-3d'

interface TelemetryParticlesProps {
  positions: Map<string, Position3D>
}

interface ParticleBurst {
  id: string
  position: THREE.Vector3
  color: THREE.Color
  birthTime: number
  lifetime: number
}

const MAX_BURSTS = 30
const PARTICLES_PER_BURST = 8

export function TelemetryParticles({ positions }: TelemetryParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const burstsRef = useRef<ParticleBurst[]>([])
  const lastEventCount = useRef(0)

  const events = useXSystemStore((s) => s.events)
  const isConnected = useXSystemStore((s) => s.isConnected)

  const totalParticles = MAX_BURSTS * PARTICLES_PER_BURST
  const positionArray = useMemo(() => new Float32Array(totalParticles * 3), [totalParticles])
  const colorArray = useMemo(() => new Float32Array(totalParticles * 3), [totalParticles])
  const sizeArray = useMemo(() => new Float32Array(totalParticles).fill(0), [totalParticles])

  useEffect(() => {
    if (!isConnected) return
    if (events.length <= lastEventCount.current) return

    const newEvents = events.slice(lastEventCount.current)
    lastEventCount.current = events.length

    const now = performance.now() / 1000

    for (const event of newEvents) {
      if (!event.nodeId) continue
      const pos = positions.get(event.nodeId)
      if (!pos) continue

      const sevColor = SEVERITY_COLORS[event.severity] ?? '#00E5FF'

      const burst: ParticleBurst = {
        id: event.id,
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        color: new THREE.Color(sevColor),
        birthTime: now,
        lifetime: 2.0 + Math.random() * 1.0,
      }

      burstsRef.current.push(burst)
      if (burstsRef.current.length > MAX_BURSTS) {
        burstsRef.current.shift()
      }
    }
  }, [events, positions, isConnected])

  useFrame(() => {
    if (!pointsRef.current) return
    const now = performance.now() / 1000
    const geo = pointsRef.current.geometry

    let idx = 0
    for (const burst of burstsRef.current) {
      const age = now - burst.birthTime
      const progress = age / burst.lifetime
      if (progress > 1) continue

      const fade = 1 - progress
      for (let p = 0; p < PARTICLES_PER_BURST; p++) {
        if (idx >= totalParticles) break

        const angle = (2 * Math.PI * p) / PARTICLES_PER_BURST
        const radius = progress * 5 + Math.random() * 0.5
        const lift = progress * 8 + Math.sin(age * 3 + p) * 1

        positionArray[idx * 3] = burst.position.x + Math.cos(angle) * radius
        positionArray[idx * 3 + 1] = burst.position.y + lift
        positionArray[idx * 3 + 2] = burst.position.z + Math.sin(angle) * radius

        colorArray[idx * 3] = burst.color.r * fade
        colorArray[idx * 3 + 1] = burst.color.g * fade
        colorArray[idx * 3 + 2] = burst.color.b * fade

        sizeArray[idx] = fade * 1.5

        idx++
      }
    }

    for (let i = idx; i < totalParticles; i++) {
      sizeArray[i] = 0
    }

    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
    geo.attributes.size.needsUpdate = true
  })

  if (!isConnected) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positionArray, 3]}
          count={totalParticles}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colorArray, 3]}
          count={totalParticles}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizeArray, 1]}
          count={totalParticles}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={1.5}
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
