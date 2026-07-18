import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { PositionedNode } from '@/data/types'
import { NODE_COLOR, getNodeRadius, hashToUnit } from '@/graph/style'
import { getGlowTexture } from '@/graph/textures'

interface NodeMeshProps {
  node: PositionedNode
  isHovered: boolean
  isSelected: boolean
  isDimmed: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  interactive: boolean
}

// Exponential-damping rate for hover/select/dim transitions — high enough to
// still feel snappy (a few hundred ms), just no longer an instant on/off.
const SMOOTH_LAMBDA = 10

const NORMAL_TEXT_COLOR = new THREE.Color('#eaf1ff')
const DIMMED_TEXT_COLOR = new THREE.Color('#4a5568')

// Vertical offsets (as a fraction of node radius) for the three plates of the
// `database` subtype's stacked-disc badge — a classic DB-cylinder silhouette
// that reads as its own shape from any camera angle, unlike the billboarded
// glow sprites everything else uses.
const DB_DISC_OFFSETS = [-0.55, 0, 0.55]

// Vertical offsets (as a fraction of node radius) for the four slabs of the
// `server` subtype's rack-unit badge — a stack of square plates that reads
// as a server tower, distinct from the database's smooth disc stack.
const SERVER_RACK_OFFSETS = [-0.6, -0.2, 0.2, 0.6]
const SERVER_RACK_WIDTH = 1.7 // fraction of baseRadius
const SERVER_RACK_UNIT_HEIGHT = 0.28 // fraction of baseRadius

export function NodeMesh({ node, isHovered, isSelected, isDimmed, onHover, onSelect, interactive }: NodeMeshProps) {
  const glowRef = useRef<THREE.Sprite>(null)
  const coreRef = useRef<THREE.Sprite>(null)
  const shellRef = useRef<THREE.Mesh>(null)
  const dbStackRef = useRef<THREE.Group>(null)
  const serverRackRef = useRef<THREE.Group>(null)
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
  const targetBadgeOpacity = (isSelected ? 0.7 : isHovered ? 0.6 : 0.45) * targetDimFactor
  const targetLabelOpacity = isDimmed ? 0.3 : isHovered || isSelected ? 1 : 0.75
  const targetDimAmount = isDimmed ? 1 : 0

  const smoothed = useRef({
    glowOpacity: targetGlowOpacity,
    coreOpacity: targetCoreOpacity,
    emphasis: targetEmphasis,
    shellOpacity: targetShellOpacity,
    badgeOpacity: targetBadgeOpacity,
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
    s.badgeOpacity = THREE.MathUtils.damp(s.badgeOpacity, targetBadgeOpacity, SMOOTH_LAMBDA, delta)
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
    if (dbStackRef.current && node.subtype === 'database') {
      dbStackRef.current.scale.setScalar(s.emphasis)
      for (const child of dbStackRef.current.children) {
        const disc = child as THREE.Group
        const [fill, outline] = disc.children as THREE.Mesh[]
        ;(fill.material as THREE.MeshBasicMaterial).opacity = s.badgeOpacity * 0.45
        ;(outline.material as THREE.MeshBasicMaterial).opacity = s.badgeOpacity
      }
    }
    if (serverRackRef.current && node.subtype === 'server') {
      serverRackRef.current.scale.setScalar(s.emphasis)
      for (const child of serverRackRef.current.children) {
        const unit = child as THREE.Group
        const [fill, outline] = unit.children as THREE.Mesh[]
        ;(fill.material as THREE.MeshBasicMaterial).opacity = s.badgeOpacity * 0.45
        ;(outline.material as THREE.MeshBasicMaterial).opacity = s.badgeOpacity
      }
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
        onPointerOver={
          interactive
            ? (e) => {
                e.stopPropagation()
                onHover(node.id)
              }
            : undefined
        }
        onPointerOut={
          interactive
            ? (e) => {
                e.stopPropagation()
                onHover(null)
              }
            : undefined
        }
        onClick={
          interactive
            ? (e) => {
                e.stopPropagation()
                onSelect(node.id)
              }
            : undefined
        }
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

      {node.subtype === 'database' && (
        <group ref={dbStackRef}>
          {DB_DISC_OFFSETS.map((offset) => (
            <group key={offset} position={[0, offset * baseRadius, 0]}>
              <mesh>
                <cylinderGeometry args={[baseRadius * 0.9, baseRadius * 0.9, baseRadius * 0.32, 28]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={targetBadgeOpacity * 0.45}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
              <mesh>
                <cylinderGeometry args={[baseRadius * 0.9, baseRadius * 0.9, baseRadius * 0.32, 28]} />
                <meshBasicMaterial color={color} wireframe transparent opacity={targetBadgeOpacity} depthWrite={false} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {node.subtype === 'server' && (
        <group ref={serverRackRef}>
          {SERVER_RACK_OFFSETS.map((offset) => (
            <group key={offset} position={[0, offset * baseRadius, 0]}>
              <mesh>
                <boxGeometry
                  args={[baseRadius * SERVER_RACK_WIDTH, baseRadius * SERVER_RACK_UNIT_HEIGHT, baseRadius * SERVER_RACK_WIDTH]}
                />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={targetBadgeOpacity * 0.45}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
              <mesh>
                <boxGeometry
                  args={[baseRadius * SERVER_RACK_WIDTH, baseRadius * SERVER_RACK_UNIT_HEIGHT, baseRadius * SERVER_RACK_WIDTH]}
                />
                <meshBasicMaterial color={color} wireframe transparent opacity={targetBadgeOpacity} depthWrite={false} />
              </mesh>
            </group>
          ))}
        </group>
      )}

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
