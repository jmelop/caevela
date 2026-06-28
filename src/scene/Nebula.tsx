import { Billboard } from '@react-three/drei'
import { AdditiveBlending } from 'three'
import { DEFAULT_NEBULA_INTENSITY, NEBULA } from '../domain/nebula'
import { softCircleTexture } from './radialTexture'

/**
 * Six large additive radial blobs — a cold cyan-green / blue-violet dominant
 * with one warm blob over the galactic core. Billboarded so they read as soft
 * volumetric clouds from any angle.
 */
export function Nebula({ intensity = DEFAULT_NEBULA_INTENSITY }: { intensity?: number }) {
  const tex = softCircleTexture()
  return (
    <group>
      {NEBULA.map((blob, i) => (
        <Billboard key={`neb-${i}`} position={blob.position}>
          <mesh scale={blob.radius * 1.7}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={tex}
              color={`rgb(${blob.color[0]},${blob.color[1]},${blob.color[2]})`}
              transparent
              opacity={blob.alpha * intensity * 0.34}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      ))}
    </group>
  )
}
