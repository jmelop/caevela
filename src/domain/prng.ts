import type { DustStar } from './types'
import { starColor } from './starColor'

/** Fixed seed for the survey — the whole dust field is reproducible from this. */
export const DUST_SEED = 20260625

/** Galactic core in world space (origin = survey centre). */
export const GALACTIC_CORE: [number, number, number] = [-0.55, 0.45, -0.35]

/** Default dust count (prototype default; valid range 300–1400). */
export const DEFAULT_DUST_DENSITY = 1200

/**
 * mulberry32 — deterministic PRNG, ported verbatim from the prototype.
 * Returns a function yielding values in [0, 1).
 */
export function mulberry32(a: number): () => number {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Reproduces the prototype's dust distribution exactly. 30% of stars cluster in
 * the galactic core via a gaussian approximation; the rest fill [-1,1]³ evenly.
 *
 * The ORDER of rng() consumption is load-bearing for determinism — keep the
 * branch and the field initialisation order byte-for-byte with the prototype.
 */
export function generateDust(
  density: number = DEFAULT_DUST_DENSITY,
  seed: number = DUST_SEED,
): DustStar[] {
  const rng = mulberry32(seed)
  const [cx, cy, cz] = GALACTIC_CORE
  const g3 = () => rng() + rng() + rng() - 1.5 // ~gaussian (sum of 3 uniforms)

  const dust: DustStar[] = []
  for (let i = 0; i < density; i++) {
    let x: number
    let y: number
    let z: number
    let near = false
    if (rng() < 0.3) {
      x = cx + g3() * 0.24
      y = cy + g3() * 0.17
      z = cz + g3() * 0.24
      near = true
    } else {
      x = rng() * 2 - 1
      y = rng() * 2 - 1
      z = rng() * 2 - 1
    }
    dust.push({
      position: [x, y, z],
      size: 0.35 + Math.pow(rng(), 2) * (near ? 1.0 : 1.4),
      color: starColor(rng()),
      alpha: 0.32 + rng() * 0.5,
      twinkle: rng() < 0.32,
      twinkleSpeed: 0.5 + rng() * 1.6,
      twinklePhase: rng() * 6.28,
    })
  }
  return dust
}
