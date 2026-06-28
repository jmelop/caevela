import { useFrame, useThree } from '@react-three/fiber'
import type { Vector3 } from 'three'
import { POLAR_MAX, POLAR_MIN } from './cameraRig'
import { lodFactor, lodRef, smooth } from './lod'

type OrbitLike = {
  target: Vector3
  minPolarAngle: number
  maxPolarAngle: number
}

/**
 * Publishes the survey <-> galaxy LOD factor from the orbit radius (camera <->
 * target distance = the zoom level). That metric is stable under panning and
 * WASD flight (both translate camera + target together, leaving the radius
 * unchanged), so the galaxy doesn't fade as you move toward it — only zooming
 * changes it. Also opens the pitch clamp at galaxy scale for free orbiting.
 */
export function GalaxyLOD() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null

  useFrame(() => {
    const distance = controls
      ? camera.position.distanceTo(controls.target)
      : camera.position.length()
    const t = lodFactor(distance)
    lodRef.t = t
    if (!controls) return
    const tt = smooth(t)
    controls.minPolarAngle = POLAR_MIN * (1 - tt) + 0.02 * tt
    controls.maxPolarAngle = POLAR_MAX * (1 - tt) + (Math.PI - 0.02) * tt
  })

  return null
}
