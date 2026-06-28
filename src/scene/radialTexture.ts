import { CanvasTexture, SRGBColorSpace } from 'three'

let cached: CanvasTexture | null = null

/**
 * A soft white radial-falloff sprite, shared by the nebula blobs and the
 * selection halo. White so each consumer can tint it via material.color and
 * accumulate with additive blending.
 */
export function softCircleTexture(): CanvasTexture {
  if (cached) return cached
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  cached = new CanvasTexture(canvas)
  cached.colorSpace = SRGBColorSpace
  return cached
}
