/**
 * pow3r.control - Camera Controller
 *
 * Purpose:
 * - Calculate graph bounds and set optimal camera position
 * - Smooth camera zoom-to-node animation when a node is selected
 * - Auto-rotate when idle (no interaction for 8 seconds)
 * - Double-tap/double-click to reset camera to fit entire graph
 * - Mobile-tuned: explicit touch mappings
 *
 * Agent Instructions:
 * - Uses OrbitControls ref to manipulate camera target
 * - Graph bounds calculated from all node positions
 * - Camera positioned to see entire graph with padding
 * - Lerps camera position toward selected node over ~60 frames
 * - Auto-rotate speed is slow (0.3) for ambient feel
 */
import { useRef, useEffect, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useControlStore } from '../../store/control-store'
import type { Position3D } from './use-force-layout-3d'

interface CameraControllerProps {
  positions: Map<string, Position3D>
}

interface GraphBounds {
  center: THREE.Vector3
  size: THREE.Vector3
  radius: number
  min: THREE.Vector3
  max: THREE.Vector3
}

function calculateGraphBounds(positions: Map<string, Position3D>): GraphBounds | null {
  if (positions.size === 0) return null

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  let validCount = 0

  positions.forEach((pos) => {
    if (typeof pos.x !== 'number' || isNaN(pos.x)) return
    if (typeof pos.y !== 'number' || isNaN(pos.y)) return
    if (typeof pos.z !== 'number' || isNaN(pos.z)) return

    minX = Math.min(minX, pos.x)
    minY = Math.min(minY, pos.y)
    minZ = Math.min(minZ, pos.z)
    maxX = Math.max(maxX, pos.x)
    maxY = Math.max(maxY, pos.y)
    maxZ = Math.max(maxZ, pos.z)
    validCount++
  })

  if (validCount === 0) return null

  const center = new THREE.Vector3(
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2
  )

  const size = new THREE.Vector3(
    maxX - minX,
    maxY - minY,
    maxZ - minZ
  )

  const radius = Math.max(size.x, size.y, size.z) / 2

  return {
    center,
    size,
    radius,
    min: new THREE.Vector3(minX, minY, minZ),
    max: new THREE.Vector3(maxX, maxY, maxZ),
  }
}

function calculateOptimalCameraPosition(bounds: GraphBounds, fov: number = 45): THREE.Vector3 {
  const padding = 1.5
  const distance = (bounds.radius * padding) / Math.tan((fov * Math.PI) / 360)
  const safeDistance = Math.max(distance, 50)
  
  return new THREE.Vector3(
    bounds.center.x + safeDistance * 0.7,
    bounds.center.y + safeDistance * 0.5,
    bounds.center.z + safeDistance * 0.7
  )
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
  const hasInitialized = useRef(false)
  const lastPositionCount = useRef(0)
  const boundsRef = useRef<GraphBounds | null>(null)

  const bounds = useMemo(() => {
    const b = calculateGraphBounds(positions)
    boundsRef.current = b
    return b
  }, [positions])

  useEffect(() => {
    if (!bounds || !controlsRef.current) return

    const positionsChanged = positions.size !== lastPositionCount.current
    const needsInit = !hasInitialized.current && positions.size > 0

    if (needsInit || (positionsChanged && lastPositionCount.current === 0)) {
      hasInitialized.current = true
      lastPositionCount.current = positions.size

      const optimalPos = calculateOptimalCameraPosition(bounds, 45)
      
      const initCamera = () => {
        if (!controlsRef.current) return
        
        camera.position.copy(optimalPos)
        controlsRef.current.target.copy(bounds.center)
        controlsRef.current.update()
        targetPos.current.copy(bounds.center)
        
        camera.updateProjectionMatrix()
      }

      initCamera()
      setTimeout(initCamera, 50)
      setTimeout(initCamera, 200)
      setTimeout(initCamera, 500)
    }

    lastPositionCount.current = positions.size
  }, [bounds, positions.size, camera])

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

  const resetToFitGraph = useCallback(() => {
    if (!controlsRef.current || !boundsRef.current) return

    const b = boundsRef.current
    const optimalPos = calculateOptimalCameraPosition(b, 45)

    camera.position.copy(optimalPos)
    controlsRef.current.target.copy(b.center)
    controlsRef.current.update()
    targetPos.current.copy(b.center)
    isAnimating.current = false

    lastInteraction.current = Date.now()
    idleRotating.current = false
  }, [camera])

  const handleDoubleTap = useCallback(() => {
    if (!controlsRef.current) return

    if (selectedNodeId) {
      const pos = positions.get(selectedNodeId)
      if (pos) {
        targetPos.current.set(pos.x, pos.y, pos.z)
        isAnimating.current = true
      }
    } else {
      resetToFitGraph()
    }
    lastInteraction.current = Date.now()
    idleRotating.current = false
  }, [selectedNodeId, positions, resetToFitGraph])

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

    const handleDoubleClick = () => {
      handleDoubleTap()
    }

    domElement.addEventListener('touchstart', handleTouch, { passive: true })
    domElement.addEventListener('dblclick', handleDoubleClick)

    return () => {
      domElement.removeEventListener('touchstart', handleTouch)
      domElement.removeEventListener('dblclick', handleDoubleClick)
    }
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

  const maxDist = bounds ? Math.max(bounds.radius * 4, 300) : 600

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={10}
      maxDistance={maxDist}
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
