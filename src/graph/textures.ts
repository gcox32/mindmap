import * as THREE from 'three'

let glowTexture: THREE.CanvasTexture | null = null

/**
 * A shared white radial-gradient sprite texture (opaque center, fully
 * transparent edge). Node color comes from tinting this via material.color,
 * so every node/particle can reuse one canvas instead of allocating per-node.
 */
export function getGlowTexture(): THREE.CanvasTexture {
  if (glowTexture) return glowTexture

  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.75)')
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.22)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  glowTexture = new THREE.CanvasTexture(canvas)
  return glowTexture
}
