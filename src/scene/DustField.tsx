import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
} from 'three'
import type { DustStar } from '../domain/types'

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSizeScale;
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aTwinkle;
  attribute float aSpeed;
  attribute float aPhase;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    // ~32% of stars twinkle; the rest hold their alpha.
    float tw = mix(1.0, 0.55 + 0.45 * sin(uTime * aSpeed + aPhase), aTwinkle);
    vAlpha = aAlpha * tw;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // Perspective size attenuation: nearer dust draws larger.
    gl_PointSize = clamp(aSize * uSizeScale * uPixelRatio / -mv.z, 1.0, 64.0);
  }
`

const fragmentShader = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    // Soft round sprite.
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, d) * vAlpha;
    if (a <= 0.001) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

export function DustField({ dust }: { dust: DustStar[] }) {
  const pixelRatio = useThree((s) => Math.min(s.gl.getPixelRatio(), 2))
  const materialRef = useRef<ShaderMaterial | null>(null)

  const points = useMemo(() => {
    const n = dust.length
    const position = new Float32Array(n * 3)
    const color = new Float32Array(n * 3)
    const size = new Float32Array(n)
    const alpha = new Float32Array(n)
    const twinkle = new Float32Array(n)
    const speed = new Float32Array(n)
    const phase = new Float32Array(n)

    for (let i = 0; i < n; i++) {
      const d = dust[i]
      position[i * 3] = d.position[0]
      position[i * 3 + 1] = d.position[1]
      position[i * 3 + 2] = d.position[2]
      color[i * 3] = d.color[0] / 255
      color[i * 3 + 1] = d.color[1] / 255
      color[i * 3 + 2] = d.color[2] / 255
      size[i] = d.size
      alpha[i] = d.alpha
      twinkle[i] = d.twinkle ? 1 : 0
      speed[i] = d.twinkleSpeed
      phase[i] = d.twinklePhase
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(position, 3))
    geometry.setAttribute('aColor', new BufferAttribute(color, 3))
    geometry.setAttribute('aSize', new BufferAttribute(size, 1))
    geometry.setAttribute('aAlpha', new BufferAttribute(alpha, 1))
    geometry.setAttribute('aTwinkle', new BufferAttribute(twinkle, 1))
    geometry.setAttribute('aSpeed', new BufferAttribute(speed, 1))
    geometry.setAttribute('aPhase', new BufferAttribute(phase, 1))

    const material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uSizeScale: { value: 9 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    materialRef.current = material
    return new Points(geometry, material)
  }, [dust, pixelRatio])

  useEffect(
    () => () => {
      points.geometry.dispose()
      ;(points.material as ShaderMaterial).dispose()
    },
    [points],
  )

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return <primitive object={points} />
}
