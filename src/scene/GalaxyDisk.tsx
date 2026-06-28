import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
} from 'three'
import { GALAXY_CENTER, generateGalaxy } from '../domain/galaxy'
import { lodRef } from './lod'

const vertexShader = /* glsl */ `
  uniform float uScale;
  uniform float uFade;
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha * uFade;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uScale / -mv.z, 0.6, 40.0);
  }
`

const fragmentShader = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vAlpha;
    if (a <= 0.001) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

/**
 * The ambient galactic backdrop: ~40k procedural spiral stars as one additive
 * Points cloud, placed so the survey sits in an outer arm. Non-interactive; the
 * zoom-out LOD (next step) fades it in as the survey shrinks to a speck.
 */
export function GalaxyDisk() {
  const points = useMemo(() => {
    const stars = generateGalaxy()
    const n = stars.length
    const position = new Float32Array(n * 3)
    const color = new Float32Array(n * 3)
    const size = new Float32Array(n)
    const alpha = new Float32Array(n)

    for (let i = 0; i < n; i++) {
      const s = stars[i]
      position[i * 3] = s.position[0]
      position[i * 3 + 1] = s.position[1]
      position[i * 3 + 2] = s.position[2]
      color[i * 3] = s.color[0] / 255
      color[i * 3 + 1] = s.color[1] / 255
      color[i * 3 + 2] = s.color[2] / 255
      size[i] = s.size
      alpha[i] = s.alpha
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(position, 3))
    geometry.setAttribute('aColor', new BufferAttribute(color, 3))
    geometry.setAttribute('aSize', new BufferAttribute(size, 1))
    geometry.setAttribute('aAlpha', new BufferAttribute(alpha, 1))

    const material = new ShaderMaterial({
      uniforms: { uScale: { value: 180 }, uFade: { value: 0 } },
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

  // Fade in with the galaxy LOD.
  useFrame(() => {
    ;(points.material as ShaderMaterial).uniforms.uFade.value = lodRef.t
  })

  return <primitive object={points} position={GALAXY_CENTER} />
}
