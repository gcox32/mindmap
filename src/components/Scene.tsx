import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { GraphEdge, GraphNode } from '../data/types'
import type { FocusMode } from '../graph/traversal'
import { Graph } from './Graph'
import { OrbitHalo } from './OrbitHalo'
import { CameraReset } from './CameraReset'
import { BACKGROUND_COLOR } from '../graph/style'

interface SceneProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedId: string | null
  hoveredId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string | null) => void
  autoRotate: boolean
  focusMode: FocusMode
  searchMatchIds: Set<string> | null
  resetSignal: number
}

export function Scene({
  nodes,
  edges,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  autoRotate,
  focusMode,
  searchMatchIds,
  resetSignal,
}: SceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)

  return (
    <Canvas
      camera={{ position: [0, 40, 220], fov: 50, near: 0.1, far: 2000 }}
      onPointerMissed={() => onSelect(null)}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[BACKGROUND_COLOR]} />
      <fog attach="fog" args={[BACKGROUND_COLOR, 260, 620]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[120, 150, 100]} intensity={0.4} />

      <CameraReset resetSignal={resetSignal} controlsRef={controlsRef} />

      <Suspense fallback={null}>
        <Stars radius={420} depth={100} count={1000} factor={1.8} saturation={0} fade speed={0.25} />
        <OrbitHalo />
        <Graph
          nodes={nodes}
          edges={edges}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onHover={onHover}
          onSelect={onSelect}
          autoRotate={autoRotate}
          focusMode={focusMode}
          searchMatchIds={searchMatchIds}
          controlsRef={controlsRef}
        />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.4}
        minDistance={40}
        maxDistance={550}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}
