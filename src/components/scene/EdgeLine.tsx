import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import type { Line2, LineMaterial } from 'three-stdlib'
import type { GraphEdge, PositionedNode } from '@/data/types'
import { EDGE_COLOR, EDGE_DASHED, hashToUnit, widthMultiplierForVolume } from '@/graph/style'
import { getGlowTexture } from '@/graph/textures'

interface EdgeLineProps {
  edge: GraphEdge
  from: PositionedNode
  to: PositionedNode
  isHighlighted: boolean
  isDimmed: boolean
  autoRotate: boolean
}

// Same damping rate as NodeMesh, so edges and their endpoints fade in step.
const SMOOTH_LAMBDA = 10

export function EdgeLine({ edge, from, to, isHighlighted, isDimmed, autoRotate }: EdgeLineProps) {
  const flowRef = useRef<THREE.Sprite>(null)
  const lineRef = useRef<Line2>(null)
  const texture = useMemo(() => getGlowTexture(), [])
  const speedPhase = useMemo(() => hashToUnit(edge.id), [edge.id])
  const flowProgress = useRef(speedPhase)

  const curve = useMemo(() => {
    const start = new THREE.Vector3(from.x, from.y, from.z)
    const end = new THREE.Vector3(to.x, to.y, to.z)
    const mid = start.clone().lerp(end, 0.5)

    // Bow the midpoint outward, perpendicular to the segment, so overlapping
    // edges fan out instead of collapsing into straight overlapping lines.
    const dir = end.clone().sub(start)
    const len = dir.length() || 1
    const arbitrary = Math.abs(dir.y) < len * 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const perp = new THREE.Vector3().crossVectors(dir, arbitrary).normalize()
    const bow = (hashToUnit(edge.id) - 0.5) * len * 0.35
    mid.add(perp.multiplyScalar(bow))

    return new THREE.QuadraticBezierCurve3(start, mid, end)
  }, [from.x, from.y, from.z, to.x, to.y, to.z, edge.id])

  const points = useMemo(() => curve.getPoints(24), [curve])
  const color = EDGE_COLOR[edge.kind]
  const dashed = EDGE_DASHED[edge.kind]

  const targetOpacity = isDimmed ? 0.04 : isHighlighted ? 0.85 : 0.22
  const targetLineWidth = (isHighlighted ? 1.4 : 0.8) * widthMultiplierForVolume(edge.volume)
  const targetFlowOpacity = isDimmed ? 0 : isHighlighted ? 0.9 : 0.5
  const targetFlowScale = isHighlighted ? 3.2 : 2

  const smoothed = useRef({
    opacity: targetOpacity,
    lineWidth: targetLineWidth,
    flowOpacity: targetFlowOpacity,
    flowScale: targetFlowScale,
  })

  useFrame((_state, delta) => {
    const s = smoothed.current
    s.opacity = THREE.MathUtils.damp(s.opacity, targetOpacity, SMOOTH_LAMBDA, delta)
    s.lineWidth = THREE.MathUtils.damp(s.lineWidth, targetLineWidth, SMOOTH_LAMBDA, delta)
    s.flowOpacity = THREE.MathUtils.damp(s.flowOpacity, targetFlowOpacity, SMOOTH_LAMBDA, delta)
    s.flowScale = THREE.MathUtils.damp(s.flowScale, targetFlowScale, SMOOTH_LAMBDA, delta)

    if (lineRef.current) {
      const material = lineRef.current.material as LineMaterial
      material.opacity = s.opacity
      material.linewidth = s.lineWidth
    }

    if (flowRef.current) {
      if (autoRotate) {
        const speed = 0.15 + speedPhase * 0.1
        flowProgress.current = (flowProgress.current + delta * speed) % 1
      }
      const point = curve.getPoint(flowProgress.current)
      flowRef.current.position.copy(point)
      flowRef.current.scale.setScalar(s.flowScale)
      ;(flowRef.current.material as THREE.SpriteMaterial).opacity = s.flowOpacity
    }
  })

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color={color}
        transparent
        opacity={targetOpacity}
        lineWidth={targetLineWidth}
        dashed={dashed}
        dashSize={dashed ? 2 : undefined}
        gapSize={dashed ? 1.2 : undefined}
      />
      <sprite ref={flowRef} scale={targetFlowScale}>
        <spriteMaterial
          map={texture}
          color={color}
          transparent
          opacity={targetFlowOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  )
}
