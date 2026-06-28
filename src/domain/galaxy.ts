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

const SPIRAL_TURNS = 1.85 // looser, more readable arms (like the reference)
const BAR_ANGLE = 0.5 // bar orientation within the disk plane
const BAR_LEN = GALAXY_RADIUS * 0.42

// Palette: warm bar/core -> teal inner -> cyan -> blue outer.
const C_CORE: [number, number, number] = [255, 232, 184]
const C_INNER: [number, number, number] = [86, 196, 184]
const C_MID: [number, number, number] = [78, 150, 224]
const C_OUTER: [number, number, number] = [70, 100, 205]
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
  if (t < 0.16) return mix(C_CORE, C_INNER, t / 0.16)
  if (t < 0.5) return mix(C_INNER, C_MID, (t - 0.16) / 0.34)
  return mix(C_MID, C_OUTER, (t - 0.5) / 0.5)
}

/** Rotate (x,z) by the bar angle. */
export function barRot(x: number, z: number): [number, number] {
  const c = Math.cos(BAR_ANGLE)
  const s = Math.sin(BAR_ANGLE)
  return [x * c - z * s, x * s + z * c]
}

/**
 * Pick a spiral arm: two major arms emanate from the bar ends, two minor spurs
 * sit between them, and a rare few stars scatter inter-arm. `spread` widens the
 * angular jitter for the looser arms.
 */
export function pickArm(rng: () => number): { base: number; spread: number } {
  const roll = rng()
  if (roll < 0.72) return { base: BAR_ANGLE + (rng() < 0.5 ? 0 : Math.PI), spread: 1 }
  if (roll < 0.95) {
    return { base: BAR_ANGLE + Math.PI * 0.5 + (rng() < 0.5 ? 0 : Math.PI), spread: 1.5 }
  }
  return { base: rng() * Math.PI * 2, spread: 6 }
}

/** Logarithmic-arm angle at radius r for a given arm base + jitter. */
export function armAngle(base: number, r: number, jitter: number): number {
  return base + SPIRAL_TURNS * (r / GALAXY_RADIUS) * Math.PI * 2 + jitter
}

/**
 * A barred two-major-arm spiral (plus minor spurs): a small flattened bulge, an
 * elongated warm bar, tight logarithmic arms, and pink HII knots strung along
 * the major arms. Deterministic from GALAXY_SEED. Local coords (centre via group).
 */
export function generateGalaxy(
  count: number = DEFAULT_GALAXY_COUNT,
  seed: number = GALAXY_SEED,
): GalaxyStar[] {
  const rng = mulberry32(seed)
  const g3 = () => rng() + rng() + rng() - 1.5
  const R = GALAXY_RADIUS
  const h = R * 0.32

  const stars: GalaxyStar[] = []
  for (let i = 0; i < count; i++) {
    const roll = rng()
    if (roll < 0.1) {
      // Bulge: small + fairly flat, so the centre doesn't balloon.
      const rb = R * 0.13 * Math.pow(rng(), 1.5)
      const u = rng() * 2 - 1
      const ph = rng() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      stars.push({
        position: [s * Math.cos(ph) * rb, u * rb * 0.4, s * Math.sin(ph) * rb],
        color: mix([255, 236, 200], [255, 210, 154], rng()),
        size: 0.7 + Math.pow(rng(), 2) * 1.4,
        alpha: 0.4 + rng() * 0.4,
      })
    } else if (roll < 0.28) {
      // Bar: an elongated warm spine through the centre.
      const along = (rng() * 2 - 1) * (0.55 + 0.45 * rng())
      const taper = 1 - Math.abs(along) * 0.35
      const [x, z] = barRot(along * BAR_LEN, g3() * R * 0.05 * taper)
      stars.push({
        position: [x, g3() * 1.1 * taper, z],
        color: mix([255, 230, 186], [255, 202, 150], rng()),
        size: 0.75 + Math.pow(rng(), 2) * 1.4,
        alpha: 0.5 + rng() * 0.4,
      })
    } else {
      // Disk arms: tight logarithmic arms, dark gaps between them.
      let r = -h * Math.log(1 - rng() * 0.985)
      if (r > R) r = R * (0.7 + rng() * 0.3)
      const arm = pickArm(rng)
      const t = r / R
      const jitter = g3() * (0.12 + 0.1 * t) * arm.spread
      const theta = armAngle(arm.base, r, jitter)
      stars.push({
        position: [Math.cos(theta) * r, g3() * 1.3 * (0.35 + 0.65 * (1 - t)), Math.sin(theta) * r],
        color: mix(diskColor(t), [226, 238, 255], 0.42),
        size: 0.55 + Math.pow(rng(), 2) * 1.3,
        alpha: 0.3 + rng() * 0.5,
      })
    }
  }

  // HII regions: tight pink knots strung along the major arms.
  const clusters = 44
  for (let c = 0; c < clusters; c++) {
    const r = R * (0.28 + rng() * 0.62)
    const base = BAR_ANGLE + (rng() < 0.5 ? 0 : Math.PI)
    const cx = Math.cos(armAngle(base, r, g3() * 0.1)) * r
    const cz = Math.sin(armAngle(base, r, g3() * 0.1)) * r
    for (let k = 0; k < 55; k++) {
      stars.push({
        position: [cx + g3() * 1.6, g3() * 0.7, cz + g3() * 1.6],
        color: mix(C_HII, [255, 90, 120], rng()),
        size: 0.7 + Math.pow(rng(), 2) * 1.3,
        alpha: 0.45 + rng() * 0.4,
      })
    }
  }

  return stars
}

/**
 * The gas layer: large soft additive clouds that hug the arms (tight, so the
 * arms read as defined glowing lanes), a bright warm core, and the bar.
 */
export function generateGalaxyClouds(seed: number = GALAXY_SEED + 7): GalaxyCloud[] {
  const rng = mulberry32(seed)
  const g3 = () => rng() + rng() + rng() - 1.5
  const R = GALAXY_RADIUS
  const clouds: GalaxyCloud[] = []

  // Arm gas, hugging the arms (tight jitter) and brighter toward the core.
  for (let i = 0; i < 560; i++) {
    const r = R * Math.pow(rng(), 0.68)
    const arm = pickArm(rng)
    const t = r / R
    const theta = armAngle(arm.base, r, g3() * 0.22 * arm.spread)
    clouds.push({
      position: [Math.cos(theta) * r + g3() * 1.4, g3() * 0.9, Math.sin(theta) * r + g3() * 1.4],
      scale: 5 + rng() * 8 + (1 - t) * 6,
      color: diskColor(t),
      opacity: 0.04 + 0.06 * (1 - t * 0.6),
    })
  }

  // Bright warm core (bloom turns this into the central flare).
  for (let i = 0; i < 4; i++) {
    clouds.push({
      position: [g3() * 1.2, g3(), g3() * 1.2],
      scale: R * (0.11 + rng() * 0.13),
      color: [255, 226, 174],
      opacity: 0.05 + rng() * 0.04,
    })
  }

  // Warm bar gas — an elongated glow that makes the bar read.
  for (let i = 0; i < 70; i++) {
    const along = (rng() * 2 - 1) * (0.6 + 0.4 * rng())
    const [x, z] = barRot(along * BAR_LEN, g3() * R * 0.04)
    clouds.push({
      position: [x, g3() * 0.5, z],
      scale: 6 + rng() * 9,
      color: [255, 220, 166],
      opacity: 0.05 + rng() * 0.05,
    })
  }

  return clouds
}

/**
 * Warm brown background haze surrounding the galaxy in 3D (the NMS surround).
 * Rendered as billboards (not flat in the disk) so it reads as volume from any
 * angle. Kept subtle so it tints rather than floods.
 */
export function generateGalaxyHaze(seed: number = GALAXY_SEED + 13): GalaxyCloud[] {
  const rng = mulberry32(seed)
  const g3 = () => rng() + rng() + rng() - 1.5
  const R = GALAXY_RADIUS
  const haze: GalaxyCloud[] = []

  for (let i = 0; i < 56; i++) {
    const ang = rng() * Math.PI * 2
    const r = R * (0.5 + rng() * 1.1)
    const warm = 1 - ((r / R - 0.5) / 1.1) * 0.35
    haze.push({
      position: [Math.cos(ang) * r, g3() * R * 0.4, Math.sin(ang) * r],
      scale: 22 + rng() * 40,
      color: [128 * warm, 86 * warm, 52 * warm],
      opacity: 0.02 + rng() * 0.026,
    })
  }

  for (let i = 0; i < 8; i++) {
    haze.push({
      position: [g3() * R * 0.3, g3() * R * 0.5, g3() * R * 0.3],
      scale: 36 + rng() * 50,
      color: [112, 78, 48],
      opacity: 0.02 + rng() * 0.02,
    })
  }

  return haze
}
