import type { StarSystem } from './types'
import type { RGB } from './spectral'
import { generateSpectral } from './spectral'
import { mulberry32 } from './prng'
import {
  GALAXY_CENTER,
  GALAXY_RADIUS,
  armAngle,
  barRot,
  pickArm,
} from './galaxy'

/**
 * A procedurally-generated system that ALSO carries its render attributes
 * (colour + size), so the InstancedMesh field can be packed straight from it
 * without re-deriving anything. It is still a full StarSystem, so Phase B can
 * open the info panel on it with no gaps.
 */
export interface FieldSystem extends StarSystem {
  color: RGB // 0–255, from the spectral profile
  renderSize: number // base sphere radius in world units
}

export const FIELD_SEED = 70413
export const DEFAULT_FIELD_COUNT = 40000

/**
 * Stylised scale: the disk (diameter ≈ 2·GALAXY_RADIUS) reads as a ~100k-ly
 * galaxy, so a world unit ≈ this many light-years. Distances are measured from
 * the survey origin (where "you are here"), not the galactic core.
 */
const LY_PER_UNIT = 770

// Angular sectors → a constellation-ish name, so the same bearing always reads
// as the same sector (consistent flavour, like the hand-authored 11).
const SECTORS = [
  'Aquila', 'Lyra', 'Cygnus', 'Cassiopeia', 'Perseus', 'Auriga',
  'Orion', 'Carina', 'Vela', 'Centaurus', 'Norma', 'Sagittarius',
]

// Arm labels by radius band (inner → outer), loosely tracking the visual arms.
const ARMS = ['Scutum-Centaurus Arm', 'Sagittarius Arm', 'Orion Spur', 'Perseus Arm', 'Outer Arm']

const NAME_PREFIXES = ['CV', 'GS', 'HX', 'LP', 'Wolf', 'Ross', 'Gliese', 'Luyten', 'LHS', 'TOI', 'Kepler', 'TIC']

const FEATURES = [
  'Resonant planet chain', 'Tidally-locked world', 'Iron-rich debris belt',
  'Dense super-Earth', 'Quiet flare star', 'High proper motion',
  'Binary companion', 'Protoplanetary disk', 'Carbon-rich atmosphere',
  'Deep cometary halo', 'Magnetically active', 'Metal-poor halo star',
  'Compact rocky trio', 'Ocean-world candidate', 'Ring-system anomaly',
]

const FEATURES_BARREN = ['Barren primary', 'No detected bodies', 'Stripped system', 'Quiet flare star', 'High proper motion']

const pad = (n: number, w: number) => n.toString().padStart(w, '0')

function fmtDist(units: number): string {
  const ly = units * LY_PER_UNIT
  if (ly >= 1000) return `${(ly / 1000).toFixed(1)} kly`
  return `${ly.toFixed(1)} LY`
}

function regionFor(theta: number, t: number): string {
  // Normalise theta into [0, 2π) for a stable sector bin.
  const a = ((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const sector = SECTORS[Math.floor((a / (Math.PI * 2)) * SECTORS.length) % SECTORS.length]
  const arm = ARMS[Math.min(ARMS.length - 1, Math.floor(t * ARMS.length))]
  return `${sector} Sector · ${arm}`
}

/**
 * Generate the dense navigable field across the whole galaxy. Distribution
 * mirrors the visual galaxy (bulge / bar / spiral arms via the shared spiral
 * helpers) so navigable systems sit where the stars actually are. Deterministic
 * from FIELD_SEED. Positions are WORLD coords (galaxy-local + GALAXY_CENTER).
 */
export function generateFieldSystems(
  count: number = DEFAULT_FIELD_COUNT,
  seed: number = FIELD_SEED,
): FieldSystem[] {
  const rng = mulberry32(seed)
  const g3 = () => rng() + rng() + rng() - 1.5
  const R = GALAXY_RADIUS
  const h = R * 0.32
  const [gx, gy, gz] = GALAXY_CENTER

  const systems: FieldSystem[] = []
  for (let i = 0; i < count; i++) {
    // --- position: same regions/weights as generateGalaxy (galaxy-local) ---
    const roll = rng()
    let lx: number
    let ly_: number
    let lz: number
    let theta: number
    let t: number // radius fraction 0 (core) → 1 (rim), for region/colour bands
    if (roll < 0.1) {
      const rb = R * 0.13 * Math.pow(rng(), 1.5)
      const u = rng() * 2 - 1
      const ph = rng() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      lx = s * Math.cos(ph) * rb
      ly_ = u * rb * 0.4
      lz = s * Math.sin(ph) * rb
      theta = ph
      t = rb / R
    } else if (roll < 0.28) {
      const along = (rng() * 2 - 1) * (0.55 + 0.45 * rng())
      const taper = 1 - Math.abs(along) * 0.35
      const [bx, bz] = barRot(along * R * 0.42, g3() * R * 0.05 * taper)
      lx = bx
      ly_ = g3() * 1.1 * taper
      lz = bz
      theta = Math.atan2(bz, bx)
      t = Math.hypot(bx, bz) / R
    } else {
      let r = -h * Math.log(1 - rng() * 0.985)
      if (r > R) r = R * (0.7 + rng() * 0.3)
      const arm = pickArm(rng)
      t = r / R
      const jitter = g3() * (0.12 + 0.1 * t) * arm.spread
      theta = armAngle(arm.base, r, jitter)
      lx = Math.cos(theta) * r
      ly_ = g3() * 1.3 * (0.35 + 0.65 * (1 - t))
      lz = Math.sin(theta) * r
    }

    const position: [number, number, number] = [lx + gx, ly_ + gy, lz + gz]

    // --- spec is the master field; everything physical derives from it ---
    const sp = generateSpectral(rng)

    // --- planets / habitable zone, gated by spectral plausibility ---
    const hasPlanets = rng() < sp.planetChance
    const planetCount = hasPlanets ? 1 + Math.floor(Math.pow(rng(), 1.3) * 8) : 0
    const planets = hasPlanets ? `${planetCount} confirmed` : 'No planets detected'
    // G/K/F mid-temp stars host the most habitable candidates.
    const hzFavored = sp.cls === 'G' || sp.cls === 'K' || sp.cls === 'F'
    const maxHz = Math.min(planetCount, hzFavored ? 3 : 1)
    const hzCount = hasPlanets && rng() < (hzFavored ? 0.55 : 0.2) ? 1 + Math.floor(rng() * maxHz) : 0
    const zone =
      hzCount === 0
        ? hasPlanets ? 'No candidates' : '—'
        : hzCount === 1 ? '1 candidate world' : `${hzCount} candidate worlds`

    // --- distance from the survey origin (world space) ---
    const distUnits = Math.hypot(position[0], position[1], position[2])

    // --- status: mostly Unexplored, more likely Visited when nearby ---
    const visitedChance = distUnits < 6 ? 0.4 : distUnits < 22 ? 0.12 : 0.04
    const status: StarSystem['status'] = rng() < visitedChance ? 'Visited' : 'Unexplored'

    // --- catalogue id (unique via index) + survey name ---
    const idPrefix = 1000 + Math.floor(rng() * 9000)
    const id = `${idPrefix}-${pad(i, 5)}`
    const prefix = NAME_PREFIXES[Math.floor(rng() * NAME_PREFIXES.length)]
    const name = `${prefix} ${100 + Math.floor(rng() * 9900)}`

    const feat = hasPlanets
      ? FEATURES[Math.floor(rng() * FEATURES.length)]
      : FEATURES_BARREN[Math.floor(rng() * FEATURES_BARREN.length)]

    systems.push({
      id,
      name,
      position,
      status,
      region: regionFor(theta, t),
      dist: fmtDist(distUnits),
      spec: sp.spec,
      feat,
      stellar: sp.stellar,
      planets,
      zone,
      temp: sp.temp,
      color: sp.color,
      renderSize: sp.size,
    })
  }

  return systems
}
