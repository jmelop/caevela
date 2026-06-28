import { Bloom, EffectComposer } from '@react-three/postprocessing'

/**
 * Real glow: UnrealBloom over the scene. The bright node cores, dust, and the
 * selection halo exceed the luminance threshold and "burn" — this is the whole
 * reason for the Three.js route over the prototype's hand-painted gradients.
 */
export function PostFX() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.72}
        luminanceSmoothing={0.8}
        intensity={0.85}
        radius={0.5}
        mipmapBlur
      />
    </EffectComposer>
  )
}
