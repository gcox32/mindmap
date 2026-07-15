import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RingSpec {
  radius: number
  tube: number
  tilt: [number, number, number]
  opacity: number
  speed: number
}

const RINGS: RingSpec[] = [
  { radius: 150, tube: 0.25, tilt: [Math.PI / 2.4, 0, 0], opacity: 0.14, speed: 0.02 },
  { radius: 195, tube: 0.18, tilt: [Math.PI / 1.8, 0.4, 0], opacity: 0.08, speed: -0.015 },
]

function Ring({ spec }: { spec: RingSpec }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * spec.speed
  })

  return (
    <mesh ref={ref} rotation={spec.tilt}>
      <torusGeometry args={[spec.radius, spec.tube, 8, 128]} />
      <meshBasicMaterial
        color="#8fb8ff"
        transparent
        opacity={spec.opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

/** Faint tilted orbital rings around the nucleus — an atmospheric halo, purely decorative. */
export function OrbitHalo() {
  return (
    <group>
      {RINGS.map((spec, i) => (
        <Ring key={i} spec={spec} />
      ))}
    </group>
  )
}
