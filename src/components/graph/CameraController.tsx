/**
 * pow3r.control - Camera Controller
 *
 * Purpose:
 * - Smooth camera zoom-to-node animation when a node is selected
 * - Auto-rotate when idle (no interaction for 8 seconds)
 * - Double-tap to reset camera or zoom to selected node
 * - Mobile-tuned: increased maxDistance for seeing all items
 *
 * Agent Instructions:
 * - Uses OrbitControls ref to manipulate camera target
 * - Lerps camera position toward selected node over ~60 frames
 * - Auto-rotate speed is slow (0.3) for ambient feel
 * - Double-tap handler resets camera to default or zooms to selected node
 */
import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useControlStore } from '../../store/control-store'
import type { Position3D } from './use-force-layout-3d'

const DEFAULT_CAMERA_POS = new THREE.Vector3(80, 60, 80)
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0)

interface CameraControllerProps {
  positions: Map<string, Position3D>
}

export function CameraController({ positions }: CameraControllerProps) {
  const controlsRef = useRef<any>(null)
  const { camera, gl } = useThree()

  const selectedNodeId = useControlStore((s) => s.selectedNodeId)
  const targetPos = useRef(new THREE.Vector3(0, 0, 0))
  const isAnimating = useRef(false)
  const lastInteraction = useRef(Date.now())
  const idleRotating = useRef(false)
  const lastTapTime = useRef(0)

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

  const handleDoubleTap = useCallback(() => {
    if (!controlsRef.current) return

    if (selectedNodeId) {
      const pos = positions.get(selectedNodeId)
      if (pos) {
        targetPos.current.set(pos.x, pos.y, pos.z)
        isAnimating.current = true
      }
    } else {
      targetPos.current.copy(DEFAULT_TARGET)
      isAnimating.current = true
      camera.position.copy(DEFAULT_CAMERA_POS)
      controlsRef.current.target.copy(DEFAULT_TARGET)
      controlsRef.current.update()
    }
    lastInteraction.current = Date.now()
    idleRotating.current = false
  }, [selectedNodeId, positions, camera])

  useEffect(() => {
    const domElement = gl.domElement
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const now = Date.now()
        if (now - lastTapTime.current < 300) {
          handleDoubleTap()
          lastTapTime.current = 0
        } else {
          lastTapTime.current = now
        }
      }
    }
    domElement.addEventListener('touchstart', handleTouch, { passive: true })
    return () => domElement.removeEventListener('touchstart', handleTouch)
  }, [gl.domElement, handleDoubleTap])

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
      minDistance={10}
      maxDistance={600}
      enablePan
      panSpeed={0.8}
      rotateSpeed={0.8}
      zoomSpeed={1.2}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      onStart={handleInteraction}
      onChange={handleInteraction}
    />
  )
}
