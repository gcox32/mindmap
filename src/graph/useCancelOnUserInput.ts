import { useEffect } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

/**
 * Immediately stops a camera animation the moment the user manually orbits,
 * zooms, or pans — OrbitControls fires 'start' for drags AND wheel zoom.
 * Without this, a fly-to animation only cedes control once it converges
 * (or never, if the user keeps nudging it), which fights manual zoom/orbit
 * for however long the animation is still running.
 */
export function useCancelOnUserInput(
  controlsRef: React.RefObject<OrbitControlsImpl | null>,
  animating: React.RefObject<boolean>,
) {
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const cancel = () => {
      animating.current = false
    }
    controls.addEventListener('start', cancel)
    return () => controls.removeEventListener('start', cancel)
  }, [controlsRef, animating])
}
