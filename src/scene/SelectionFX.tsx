import { useRef } from 'react'
import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide } from 'three'
import type { Mesh, MeshBasicMaterial } from 'three'
import { ACCENT_HEX, useMapStore } from '../store/mapStore'
import { softCircleTexture } from './radialTexture'

/**
 * The selected system's in-scene FX (shown while the panel is open, where
 * SystemNodes hides the plain node): a warm + accent halo that Bloom turns into
 * real glow, a steady selection ring, two expanding/fading pulse rings, and a
 * hot white core. The DOM reticle/tag/guide line sit on top of this.
 */
export function SelectionFX() {
  const selected = useMapStore((s) => s.selected)
  const panelOpen = useMapStore((s) => s.panelOpen)
  const accent = useMapStore((s) => s.accent)
  const accentHex = ACCENT_HEX[accent]

  const pulse0 = useRef<Mesh>(null)
  const pulse1 = useRef<Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const rings = [pulse0.current, pulse1.current]
    for (let k = 0; k < 2; k++) {
      const mesh = rings[k]
      if (!mesh) continue
      const pz = (t * 0.4 + k * 0.5) % 1 // period 2.5s, half-phase apart
      mesh.scale.setScalar(0.05 + pz * 0.22)
      ;(mesh.material as MeshBasicMaterial).opacity = (1 - pz) * 0.5
    }
  })

  if (!panelOpen) return null
  const sys = selected

  return (
    <group position={sys.position}>
      <Billboard>
        {/* Halo glow (Bloom amplifies these). */}
        <mesh scale={0.5}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={softCircleTexture()}
            color={accentHex}
            transparent
            opacity={0.5}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={0.32}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={softCircleTexture()}
            color="#fff0d4"
            transparent
            opacity={0.5}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Steady selection ring. */}
        <mesh>
          <ringGeometry args={[0.05, 0.058, 64]} />
          <meshBasicMaterial color={accentHex} transparent opacity={0.9} side={DoubleSide} toneMapped={false} />
        </mesh>
        {/* Expanding pulse rings (unit ring, scaled in useFrame). */}
        <mesh ref={pulse0}>
          <ringGeometry args={[0.94, 1, 64]} />
          <meshBasicMaterial
            color={accentHex}
            transparent
            opacity={0.4}
            blending={AdditiveBlending}
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={pulse1}>
          <ringGeometry args={[0.94, 1, 64]} />
          <meshBasicMaterial
            color={accentHex}
            transparent
            opacity={0.4}
            blending={AdditiveBlending}
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
      {/* Hot core. */}
      <mesh>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}
