import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { PositionedNode } from '../data/types'
import { NODE_COLOR, getNodeRadius, hashToUnit } from '../graph/style'
import { getGlowTexture } from '../graph/textures'

interface NodeMeshProps {
  node: PositionedNode
  isHovered: boolean
  isSelected: boolean
  isDimmed: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

// Exponential-damping rate for hover/select/dim transitions — high enough to
// still feel snappy (a few hundred ms), just no longer an instant on/off.
const SMOOTH_LAMBDA = 10

const NORMAL_TEXT_COLOR = new THREE.Color('#eaf1ff')
const DIMMED_TEXT_COLOR = new THREE.Color('#4a5568')

export function NodeMesh({ node, isHovered, isSelected, isDimmed, onHover, onSelect }: NodeMeshProps) {
  const glowRef = useRef<THREE.Sprite>(null)
  const coreRef = useRef<THREE.Sprite>(null)
  const shellRef = useRef<THREE.Mesh>(null)
  // troika-three-text's Text mesh isn't meaningfully typeable here; we only
  // touch .fillOpacity/.color imperatively, same as its own prop handling.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null)
  const scratchColor = useRef(new THREE.Color())
  const phase = useMemo(() => hashToUnit(node.id) * Math.PI * 2, [node.id])
  const texture = useMemo(() => getGlowTexture(), [])
  const color = NODE_COLOR[node.type]
  const baseRadius = getNodeRadius(node)

  const glowScale = baseRadius * (node.type === 'nucleus' ? 7 : 5)
  const coreScale = baseRadius * (node.type === 'nucleus' ? 2.4 : 1.7)

  const targetDimFactor = isDimmed ? 0.12 : 1
  const targetGlowOpacity = (isSelected ? 0.65 : isHovered ? 0.55 : 0.4) * targetDimFactor
  const targetCoreOpacity = (isSelected ? 1 : isHovered ? 0.95 : 0.85) * targetDimFactor
  const targetEmphasis = isSelected ? 1.3 : isHovered ? 1.15 : 1
  const targetShellOpacity = 0.12 * targetDimFactor
  const targetLabelOpacity = isDimmed ? 0.3 : isHovered || isSelected ? 1 : 0.75
  const targetDimAmount = isDimmed ? 1 : 0

  const smoothed = useRef({
    glowOpacity: targetGlowOpacity,
    coreOpacity: targetCoreOpacity,
    emphasis: targetEmphasis,
    shellOpacity: targetShellOpacity,
    labelOpacity: targetLabelOpacity,
    dimAmount: targetDimAmount,
  })

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 1.1 + phase) * 0.08
    const s = smoothed.current

    s.glowOpacity = THREE.MathUtils.damp(s.glowOpacity, targetGlowOpacity, SMOOTH_LAMBDA, delta)
    s.coreOpacity = THREE.MathUtils.damp(s.coreOpacity, targetCoreOpacity, SMOOTH_LAMBDA, delta)
    s.emphasis = THREE.MathUtils.damp(s.emphasis, targetEmphasis, SMOOTH_LAMBDA, delta)
    s.shellOpacity = THREE.MathUtils.damp(s.shellOpacity, targetShellOpacity, SMOOTH_LAMBDA, delta)
    s.labelOpacity = THREE.MathUtils.damp(s.labelOpacity, targetLabelOpacity, SMOOTH_LAMBDA, delta)
    s.dimAmount = THREE.MathUtils.damp(s.dimAmount, targetDimAmount, SMOOTH_LAMBDA, delta)

    if (glowRef.current) {
      glowRef.current.scale.setScalar(glowScale * pulse * s.emphasis)
      ;(glowRef.current.material as THREE.SpriteMaterial).opacity = s.glowOpacity
    }
    if (coreRef.current) {
      coreRef.current.scale.setScalar(coreScale * pulse * s.emphasis)
      ;(coreRef.current.material as THREE.SpriteMaterial).opacity = s.coreOpacity
    }
    if (shellRef.current && node.type === 'nucleus') {
      shellRef.current.rotation.y = -t * 0.06
      shellRef.current.rotation.x = t * 0.04
      ;(shellRef.current.material as THREE.MeshBasicMaterial).opacity = s.shellOpacity
    }
    if (textRef.current) {
      textRef.current.fillOpacity = s.labelOpacity
      scratchColor.current.copy(NORMAL_TEXT_COLOR).lerp(DIMMED_TEXT_COLOR, s.dimAmount)
      textRef.current.color = `#${scratchColor.current.getHexString()}`
    }
  })

  return (
    <group position={[node.x, node.y, node.z]}>
      <sprite ref={glowRef} scale={glowScale}>
        <spriteMaterial
          map={texture}
          color={color}
          transparent
          opacity={targetGlowOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      <sprite
        ref={coreRef}
        scale={coreScale}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(node.id)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          onHover(null)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(node.id)
        }}
      >
        <spriteMaterial
          map={texture}
          color={color}
          transparent
          opacity={targetCoreOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {node.type === 'nucleus' && (
        <mesh ref={shellRef}>
          <icosahedronGeometry args={[baseRadius * 2.1, 1]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={targetShellOpacity} depthWrite={false} />
        </mesh>
      )}

      {node.type === 'nucleus' && <pointLight color={color} intensity={35} distance={140} decay={2} />}

      <Billboard position={[0, baseRadius + 4, 0]}>
        <Text
          ref={textRef}
          fontSize={node.type === 'nucleus' ? 3.4 : 2.2}
          color={isDimmed ? '#4a5568' : '#eaf1ff'}
          outlineWidth={0.04}
          outlineColor="#060911"
          anchorX="center"
          anchorY="bottom"
          fillOpacity={targetLabelOpacity}
        >
          {node.label}
        </Text>
      </Billboard>
    </group>
  )
}
