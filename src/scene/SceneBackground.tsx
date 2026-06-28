import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace } from 'three'

/**
 * Deep-space radial gradient (#0a0e1a → #06080f → #04050a, centred at 0.5/0.46),
 * baked into a CanvasTexture and set as scene.background so the additive dust and
 * nebula blend against it in the same framebuffer.
 */
function makeGradientTexture(): CanvasTexture {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(
    size * 0.5,
    size * 0.46,
    0,
    size * 0.5,
    size * 0.46,
    size * 0.85,
  )
  g.addColorStop(0, '#0a0e1a')
  g.addColorStop(0.5, '#06080f')
  g.addColorStop(1, '#04050a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  return tex
}

export function SceneBackground() {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const tex = makeGradientTexture()
    const prev = scene.background
    scene.background = tex
    return () => {
      scene.background = prev
      tex.dispose()
    }
  }, [scene])
  return null
}
