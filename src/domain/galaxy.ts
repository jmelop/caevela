import { mulberry32 } from './prng'

/** A single ambient galaxy star (non-interactive backdrop). */
export interface GalaxyStar {
  position: [number, number, number]
  color: [number, number, number] // 0-255 RGB
  size: number
  alpha: number
}

/** A soft gas cloud (flat quad in the disk plane) for the painterly nebula look. */
export interface GalaxyCloud {
  position: [number, number, number]
  scale: number
  color: [number, number, number] // 0-255 RGB
  opacity: number
}

export const GALAXY_SEED = 99221
export const GALAXY_CENTER: [number, number, number] = [-40, 0, 0]
export const GALAXY_RADIUS = 65
export const DEFAULT_GALAXY_COUNT = 46000

const ARMS = 2
const SPIRAL_TURNS = 2.3
const BAR_ANGLE = 0.5 // bar orientation within the disk plane
const BAR_LEN = GALAXY_RADIUS * 0.34

// Palette: warm bar/core -> teal inner (NMS) -> cyan -> blue outer (Milky Way).
const C_CORE: [number, number, number] = [255, 228, 170]
const C_INNER: [number, number, number] = [54, 200, 178]
const C_MID: [number, number, number] = [66, 150, 230]
const C_OUTER: [number, number, number] = [58, 92, 200]
const C_HII: [number, number, number] = [255, 110, 150] // pink star-forming knots

const mix = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

/** Disk gas colour by radius fraction t (0 = core, 1 = rim). */
function diskColor(t: number): [number, number, number] {
  if (t < 0.15) return mix(C_CORE, C_INNER, t / 0.15)
  if (t < 0.5) return mix(C_INNER, C_MID, (t - 0.15) / 0.35)
  return mix(C_MID, C_OUTER, (t - 0.5) / 0.5)
}

/** Rotate (x,z) by the bar angle. */
function barRot(x: number, z: number): [number, number] {
  const c = Math.cos(BAR_ANGLE)
  const s = Math.sin(BAR_ANGLE)
  return [x * c - z * s, x * s + z * c]
}

/** Angle of a spiral arm at radius r (two arms emanate from the bar ends). */
function armTheta(arm: number, r: number): number {
  return BAR_ANGLE + arm * Math.PI + SPIRAL_TURNS * (r / GALAXY_RADIUS) * Math.PI * 2
}

/**
 * A barred two-arm spiral: round bulge, an elongated central bar, two logarithmic
 * arms off the bar ends, inter-arm scatter, and pink HII knots strung along the
 * arms. Deterministic from GALAXY_SEED. Local coords (centre via group).
 */
export function generateGalaxy(
  count: number = DEFAULT_GALAXY_COUNT,
  seed: number = GALAXY_SEED,
): GalaxyStar[] {
  const rng = mulberry32(seed)
  const g3 = () => rng() + rng() + rng() - 1.5
  const R = GALAXY_RADIUS
  const h = R * 0.28

  const stars: GalaxyStar[] = []
  for (let i = 0; i < count; i++) {
    const roll = rng()
    if (roll < 0.15) {
      // Bulge: round, warm.
      const rb = R * 0.16 * Math.pow(rng(), 1.7)
      const ang = rng() * Math.PI * 2
      stars.push({
        position: [Math.cos(ang) * rb, g3() * 2.2, Math.sin(ang) * rb],
        color: mix([255, 236, 200], [255, 208, 150], rng()),
        size: 0.7 + Math.pow(rng(), 2) * 1.5,
        alpha: 0.4 + rng() * 0.4,
      })
    } else if (roll < 0.27) {
      // Bar: elongated, warm.
      const along = g3() * 0.62
      const [x, z] = barRot(along * BAR_LEN, g3() * R * 0.05)
      stars.push({
        position: [x, g3() * 1.3, z],
        color: mix([255, 232, 190], [255, 204, 150], rng()),
        size: 0.7 + Math.pow(rng(), 2) * 1.4,
        alpha: 0.4 + rng() * 0.4,
      })
    } else {
      // Disk arms.
      let r = -h * Math.log(1 - rng() * 0.985)
      if (r > R) r = R * (0.7 + rng() * 0.3)
      const arm = Math.floor(rng() * ARMS)
      const interArm = rng() < 0.16
      const theta = interArm ? rng() * Math.PI * 2 : armTheta(arm, r) + g3() * 0.42
      const t = r / R
      stars.push({
        position: [Math.cos(theta) * r, g3() * 1.5 * (0.4 + 0.6 * (1 - t)), Math.sin(theta) * r],
        color: mix(diskColor(t), [224, 236, 255], 0.45), // lighter than the gas
        size: 0.55 + Math.pow(rng(), 2) * 1.4,
        alpha: 0.3 + rng() * 0.5,
      })
    }
  }

  // HII regions: tight pink knots strung along the arms.
  const clusters = 46
  for (let c = 0; c < clusters; c++) {
    const r = R * (0.25 + rng() * 0.68)
    const arm = Math.floor(rng() * ARMS)
    const theta = armTheta(arm, r) + g3() * 0.16
    const cx = Math.cos(theta) * r
    const cz = Math.sin(theta) * r
    for (let k = 0; k < 60; k++) {
      stars.push({
        position: [cx + g3() * 1.7, g3() * 0.8, cz + g3() * 1.7],
        color: mix(C_HII, [255, 90, 120], rng()),
        size: 0.7 + Math.pow(rng(), 2) * 1.3,
        alpha: 0.45 + rng() * 0.4,
      })
    }
  }

  return stars
}

/**
 * The gas layer: large soft additive clouds that lie flat in the disk plane and
 * give the painterly NMS look. Arms (teal->blue), a bright warm core, the bar,
 * and a warm brown background haze around the whole galaxy.
 */
export function generateGalaxyClouds(seed: number = GALAXY_SEED + 7): GalaxyCloud[] {
  const rng = mulberry32(seed)
  const g3 = () => rng() + rng() + rng() - 1.5
  const R = GALAXY_RADIUS
  const clouds: GalaxyCloud[] = []

  // Arm gas, denser and brighter toward the core.
  for (let i = 0; i < 520; i++) {
    const r = R * Math.pow(rng(), 0.7)
    const arm = Math.floor(rng() * ARMS)
    const theta = armTheta(arm, r) + g3() * 0.5
    const t = r / R
    clouds.push({
      position: [Math.cos(theta) * r + g3() * 2, g3() * 0.6, Math.sin(theta) * r + g3() * 2],
      scale: 6 + rng() * 10 + (1 - t) * 7,
      color: diskColor(t),
      opacity: 0.04 + 0.06 * (1 - t * 0.6),
    })
  }

  // Bright warm core (bloom turns these into the central flare).
  for (let i = 0; i < 6; i++) {
    clouds.push({
      position: [g3() * 1.5, g3(), g3() * 1.5],
      scale: R * (0.18 + rng() * 0.22),
      color: [255, 226, 176],
      opacity: 0.1 + rng() * 0.08,
    })
  }

  // Warm bar haze.
  for (let i = 0; i < 40; i++) {
    const [x, z] = barRot(g3() * 0.55 * BAR_LEN, g3() * R * 0.04)
    clouds.push({
      position: [x, g3() * 0.5, z],
      scale: 5 + rng() * 7,
      color: [255, 220, 165],
      opacity: 0.05 + rng() * 0.05,
    })
  }

  // Warm brown background haze around the galaxy (the NMS surround).
  for (let i = 0; i < 54; i++) {
    const ang = rng() * Math.PI * 2
    const r = R * (0.6 + rng() * 0.95)
    clouds.push({
      position: [Math.cos(ang) * r, g3() * 4, Math.sin(ang) * r],
      scale: 18 + rng() * 30,
      color: [120, 80, 46],
      opacity: 0.05 + rng() * 0.05,
    })
  }

  return clouds
}
