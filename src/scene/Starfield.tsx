import { useEffect, useMemo } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
} from 'three'
import { mulberry32 } from '../domain/prng'

const STAR_COUNT = 5500
const STARFIELD_SEED = 51877

const vertexShader = /* glsl */ `
  uniform float uScale;
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uScale / -mv.z, 0.5, 3.0);
  }
`

const fragmentShader = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, d) * vAlpha;
    if (a <= 0.001) discard;
    gl_FragColor = vec4(0.82, 0.86, 1.0, a);
  }
`

/**
 * A faint distant starfield on a large sphere shell around the origin — the
 * "we're inside the universe" backdrop, present at every zoom level. Far enough
 * out that it reads as background (little parallax) behind the galaxy.
 */
export function Starfield() {
  const points = useMemo(() => {
    const rng = mulberry32(STARFIELD_SEED)
    const position = new Float32Array(STAR_COUNT * 3)
    const size = new Float32Array(STAR_COUNT)
    const alpha = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      // Uniform direction on the sphere, radius in a thick shell.
      const u = rng() * 2 - 1
      const phi = rng() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      const r = 180 + rng() * 110
      position[i * 3] = s * Math.cos(phi) * r
      position[i * 3 + 1] = u * r
      position[i * 3 + 2] = s * Math.sin(phi) * r
      size[i] = 0.6 + rng() * 1.3
      alpha[i] = 0.18 + Math.pow(rng(), 2) * 0.55
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(position, 3))
    geometry.setAttribute('aSize', new BufferAttribute(size, 1))
    geometry.setAttribute('aAlpha', new BufferAttribute(alpha, 1))

    const material = new ShaderMaterial({
      uniforms: { uScale: { value: 320 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    return new Points(geometry, material)
  }, [])

  useEffect(
    () => () => {
      points.geometry.dispose()
      ;(points.material as ShaderMaterial).dispose()
    },
    [points],
  )

  return <primitive object={points} />
}
