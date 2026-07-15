import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useCancelOnUserInput } from '../graph/useCancelOnUserInput'

interface CameraFocusProps {
  /** Identity of the current focus request (e.g. selected node id). A change here (re)starts the fly-in. */
  focusKey: string | null
  targetPosition: { x: number; y: number; z: number } | null
  distance: number
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}

const LERP_FACTOR = 0.06
const CONVERGENCE_EPSILON = 0.5

/**
 * Dollies the camera toward `targetPosition` and re-centers OrbitControls'
 * target on it when `focusKey` changes, keeping the current viewing angle
 * rather than snapping to a canonical one. Stops touching the camera once
 * converged (or once `focusKey` goes null), so the user regains full manual
 * orbit/zoom/pan control instead of it fighting their input forever.
 */
export function CameraFocus({ focusKey, targetPosition, distance, controlsRef }: CameraFocusProps) {
  const { camera } = useThree()
  const target = useRef(new THREE.Vector3())
  const desired = useRef(new THREE.Vector3())
  const lastFocusKey = useRef<string | null>(null)
  const animating = useRef(false)

  useCancelOnUserInput(controlsRef, animating)

  if (focusKey !== lastFocusKey.current) {
    lastFocusKey.current = focusKey
    animating.current = focusKey !== null
  }

  useFrame(() => {
    const controls = controlsRef.current
    if (!animating.current || !targetPosition || !controls) return

    target.current.set(targetPosition.x, targetPosition.y, targetPosition.z)
    controls.target.lerp(target.current, LERP_FACTOR)

    const dir = camera.position.clone().sub(controls.target)
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1)
    dir.normalize().multiplyScalar(distance)
    desired.current.copy(controls.target).add(dir)

    camera.position.lerp(desired.current, LERP_FACTOR)
    controls.update()

    const targetSettled = controls.target.distanceToSquared(target.current) < CONVERGENCE_EPSILON ** 2
    const positionSettled = camera.position.distanceToSquared(desired.current) < CONVERGENCE_EPSILON ** 2
    if (targetSettled && positionSettled) {
      animating.current = false
    }
  })

  return null
}
