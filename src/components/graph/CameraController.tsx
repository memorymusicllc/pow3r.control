/**
 * pow3r.control - Camera Controller
 *
 * Purpose:
 * - Smooth camera zoom-to-node animation when a node is selected
 * - Auto-rotate when idle (no interaction for 8 seconds)
 * - Breathing camera motion for cinematic feel
 *
 * Agent Instructions:
 * - Uses OrbitControls ref to manipulate camera target
 * - Lerps camera position toward selected node over ~60 frames
 * - Auto-rotate speed is slow (0.3) for ambient feel
 */
import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useControlStore } from '../../store/control-store'
import type { Position3D } from './use-force-layout-3d'

interface CameraControllerProps {
  positions: Map<string, Position3D>
}

export function CameraController({ positions }: CameraControllerProps) {
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()

  const selectedNodeId = useControlStore((s) => s.selectedNodeId)
  const targetPos = useRef(new THREE.Vector3(0, 0, 0))
  const isAnimating = useRef(false)
  const lastInteraction = useRef(Date.now())
  const idleRotating = useRef(false)

  useEffect(() => {
    if (!selectedNodeId) {
      isAnimating.current = false
      return
    }

    const pos = positions.get(selectedNodeId)
    if (!pos) return

    targetPos.current.set(pos.x, pos.y, pos.z)
    isAnimating.current = true
    lastInteraction.current = Date.now()
    idleRotating.current = false
  }, [selectedNodeId, positions])

  useFrame(() => {
    if (!controlsRef.current) return

    const controls = controlsRef.current

    if (isAnimating.current) {
      const target = controls.target as THREE.Vector3
      target.lerp(targetPos.current, 0.06)

      const camDir = new THREE.Vector3()
        .subVectors(camera.position, target)
        .normalize()
      const idealDist = 50
      const idealPos = new THREE.Vector3()
        .copy(targetPos.current)
        .add(camDir.multiplyScalar(idealDist))

      camera.position.lerp(idealPos, 0.04)

      const dist = target.distanceTo(targetPos.current)
      if (dist < 0.5) {
        isAnimating.current = false
        lastInteraction.current = Date.now()
      }

      controls.update()
    }

    const idleTime = Date.now() - lastInteraction.current
    const shouldAutoRotate = idleTime > 8000

    if (shouldAutoRotate && !idleRotating.current) {
      idleRotating.current = true
    }
    if (!shouldAutoRotate && idleRotating.current) {
      idleRotating.current = false
    }

    controls.autoRotate = idleRotating.current
    controls.autoRotateSpeed = 0.3
  })

  const handleInteraction = () => {
    lastInteraction.current = Date.now()
    idleRotating.current = false
  }

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={15}
      maxDistance={300}
      enablePan
      onStart={handleInteraction}
      onChange={handleInteraction}
    />
  )
}
