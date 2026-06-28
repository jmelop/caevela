/**
 * Level-of-detail factor shared between the Canvas and the DOM layers. 0 = the
 * local survey (close), 1 = the galactic backdrop (far). Written each frame by
 * GalaxyLOD from the camera distance; read by the galaxy layers (fade in), the
 * survey chrome/overlay (fade out), and the "you are here" marker (fade in).
 */
export const LOD_NEAR = 8
export const LOD_FAR = 64

export const lodRef = { t: 0 }

export function lodFactor(distance: number): number {
  const t = (distance - LOD_NEAR) / (LOD_FAR - LOD_NEAR)
  return t < 0 ? 0 : t > 1 ? 1 : t
}

/** Smoothstep easing. */
export function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}
