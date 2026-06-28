import { useFrame, useThree } from '@react-three/fiber'
import { POLAR_MAX, POLAR_MIN } from './cameraRig'
import { lodFactor, lodRef, smooth } from './lod'

type OrbitLike = {
  minPolarAngle: number
  maxPolarAngle: number
}

/**
 * Publishes the survey <-> galaxy LOD factor from camera distance (measured to
 * the origin, which stays the orbit target — a stable reference, no feedback),
 * and opens the pitch clamp at galaxy scale so the disk can be orbited freely
 * above and below. The camera is left entirely to the user: no auto-framing.
 */
export function GalaxyLOD() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null

  useFrame(() => {
    const t = lodFactor(camera.position.length())
    lodRef.t = t
    if (!controls) return
    const tt = smooth(t)
    controls.minPolarAngle = POLAR_MIN * (1 - tt) + 0.02 * tt
    controls.maxPolarAngle = POLAR_MAX * (1 - tt) + (Math.PI - 0.02) * tt
  })

  return null
}
