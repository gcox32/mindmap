import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useCancelOnUserInput } from '@/graph/useCancelOnUserInput'

interface CameraResetProps {
  /** Bump this (e.g. an incrementing counter) to trigger a fresh reset flight. */
  resetSignal: number
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}

const LERP_FACTOR = 0.06
const CONVERGENCE_EPSILON = 0.5

/**
 * Smoothly flies the camera back to OrbitControls' saved initial position/
 * target (`position0`/`target0`) instead of `controls.reset()`'s instant
 * snap. Once close enough, calls the real `reset()` to finalize exactly
 * (clearing zoom/spherical drift), then stops touching the camera.
 */
export function CameraReset({ resetSignal, controlsRef }: CameraResetProps) {
  const { camera } = useThree()
  const lastSignal = useRef(resetSignal)
  const animating = useRef(false)

  useCancelOnUserInput(controlsRef, animating)

  if (resetSignal !== lastSignal.current) {
    lastSignal.current = resetSignal
    animating.current = true
  }

  useFrame(() => {
    const controls = controlsRef.current
    if (!animating.current || !controls) return

    controls.target.lerp(controls.target0, LERP_FACTOR)
    camera.position.lerp(controls.position0, LERP_FACTOR)
    controls.update()

    const targetSettled = controls.target.distanceToSquared(controls.target0) < CONVERGENCE_EPSILON ** 2
    const positionSettled = camera.position.distanceToSquared(controls.position0) < CONVERGENCE_EPSILON ** 2
    if (targetSettled && positionSettled) {
      controls.reset()
      animating.current = false
    }
  })

  return null
}
