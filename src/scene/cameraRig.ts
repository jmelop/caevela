/**
 * Camera behaviour constants and helpers. The camera itself never lives in React
 * state — OrbitControls (and, later, the idle/recenter logic) own it mutably.
 * These map the prototype's yaw/pitch/distance model onto Three's orbit camera.
 */

export const CAMERA_DEFAULTS = { yaw: -0.5, pitch: 0.3, distance: 3.4 } as const

/** Dolly range. Min keeps the survey close; max pulls all the way out to the
 *  galactic backdrop (the survey-only clamp was 6 before the galaxy context). */
export const DISTANCE_MIN = 1.9
export const DISTANCE_MAX = 120

/** Pitch clamp (±1.35 rad) expressed as OrbitControls polar-angle bounds. */
export const PITCH_CLAMP = 1.35
export const POLAR_MIN = Math.PI / 2 - PITCH_CLAMP
export const POLAR_MAX = Math.PI / 2 + PITCH_CLAMP

/** Vertical FOV ≈ the prototype's focal length (f = min(w,h)·1.15). */
export const CAMERA_FOV = 45

/** Camera world position orbiting the origin, from yaw / pitch / distance. */
export function orbitPosition(
  yaw: number,
  pitch: number,
  distance: number,
): [number, number, number] {
  const cp = Math.cos(pitch)
  return [
    distance * cp * Math.sin(yaw),
    distance * Math.sin(pitch),
    distance * cp * Math.cos(yaw),
  ]
}
