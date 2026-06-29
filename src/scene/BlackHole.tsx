import { useMemo, useRef } from 'react'
import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  DoubleSide,
  type Group,
  type MeshBasicMaterial,
  ShaderMaterial,
} from 'three'
import { GALAXY_CENTER } from '../domain/galaxy'
import { DISK_OUTER, HORIZON_R } from '../domain/galacticCore'
import { softCircleTexture } from './radialTexture'
import { lodRef } from './lod'

// Sgr A*-ish supermassive black hole at the galactic core. Core geometry
// (HORIZON_R / DISK_OUTER) lives in the domain so the picker shares it.
const INNER_FRAC = (HORIZON_R * 1.12) / DISK_OUTER // disk hole as a fraction of the plane
const GLOW_SCALE = DISK_OUTER * 2.6
const PHOTON_IN = HORIZON_R * 1.02
const PHOTON_OUT = HORIZON_R * 1.16

const diskVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const diskFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uFade;
  uniform float uInner;
  uniform float uIntensity;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;          // 0 centre, 1 plane edge
    float ang = atan(p.y, p.x);
    // Radial envelope: ramp in at the hole edge, fade out before the plane border.
    float env = smoothstep(uInner, uInner + 0.05, r) * (1.0 - smoothstep(0.45, 0.92, r));
    if (env <= 0.001) discard;
    // Swirling streaks, faster toward the inner edge (Keplerian-ish).
    float swirl = 0.62 + 0.38 * sin(ang * 16.0 + uTime * 1.6 * (0.4 + 0.6 / max(r, 0.2)));
    // Relativistic Doppler beaming: one side of the disk runs much brighter.
    float beam = 0.42 + 0.95 * smoothstep(-1.0, 1.0, sin(ang));
    // Hot (blue-white) inner → orange → deep red rim.
    vec3 col = mix(vec3(1.0, 0.96, 0.9), vec3(1.0, 0.62, 0.25), smoothstep(uInner, 0.5, r));
    col = mix(col, vec3(0.95, 0.28, 0.12), smoothstep(0.5, 0.9, r));
    float a = env * swirl * beam * uFade;
    gl_FragColor = vec4(col * uIntensity, a);
  }
`

/**
 * The galactic-core black hole: an opaque event-horizon sphere that occludes the
 * far half of a shader-driven accretion disk (so the disk reads as passing behind
 * it), a bright photon ring hugging the shadow, and a soft warm glow that seeds
 * Bloom. Fades in with the galaxy LOD, like the rest of the backdrop.
 */
export function BlackHole() {
  const groupRef = useRef<Group>(null)
  const photonRef = useRef<MeshBasicMaterial>(null)
  const glowRef = useRef<MeshBasicMaterial>(null)

  const diskMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: diskVertex,
        fragmentShader: diskFragment,
        uniforms: {
          uTime: { value: 0 },
          uFade: { value: 0 },
          uInner: { value: INNER_FRAC },
          uIntensity: { value: 1.9 },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        toneMapped: false,
      }),
    [],
  )

  useFrame((state) => {
    const t = lodRef.t
    diskMat.uniforms.uTime.value = state.clock.elapsedTime
    diskMat.uniforms.uFade.value = t
    if (photonRef.current) photonRef.current.opacity = 0.9 * t
    if (glowRef.current) glowRef.current.opacity = 0.4 * t
    if (groupRef.current) groupRef.current.visible = t > 0.08
  })

  return (
    <group ref={groupRef} position={GALAXY_CENTER} visible={false}>
      {/* Event horizon — opaque, so it occludes the far half of the disk. */}
      <mesh>
        <sphereGeometry args={[HORIZON_R, 48, 48]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>

      {/* Accretion disk, flat in the galaxy plane (XZ). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={DISK_OUTER * 2}>
        <planeGeometry args={[1, 1]} />
        <primitive object={diskMat} attach="material" />
      </mesh>

      {/* Photon ring hugging the shadow's silhouette. */}
      <Billboard>
        <mesh>
          <ringGeometry args={[PHOTON_IN, PHOTON_OUT, 96]} />
          <meshBasicMaterial
            ref={photonRef}
            color="#cfe6ff"
            transparent
            opacity={0}
            blending={AdditiveBlending}
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </Billboard>

      {/* Soft warm glow (Bloom seed) — depth-occluded by the horizon at its core. */}
      <Billboard>
        <mesh scale={GLOW_SCALE}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={glowRef}
            map={softCircleTexture()}
            color="#ffce8f"
            transparent
            opacity={0}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
    </group>
  )
}
