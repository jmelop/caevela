/**
 * Spectral type is the MASTER field for a procedural system: roll the class +
 * subclass first, then derive everything physical from it — colour, effective
 * temperature, the stellar descriptor, render size, and how likely the star is
 * to host planets. A cold M8V cannot share a temperature with a G2V, so nothing
 * here is rolled independently of `spec`.
 *
 * This deliberately rehearses the model we'll use once real catalogues (HYG,
 * then Gaia) come in: there too `spec` is the field everything else hangs off.
 */

export type RGB = [number, number, number]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
]

/** Result of resolving a spectral type — the spine of a procedural system. */
export interface SpectralProfile {
  spec: string // e.g. "M3V", "G2V", "K5III"
  cls: string // class letter, "M"
  sub: number // subclass 0–9
  lum: string // luminosity class, "V" / "III"
  tempK: number // effective temperature, kelvin
  temp: string // formatted "3,480 K"
  stellar: string // "M3V · Red Dwarf"
  color: RGB // 0–255 representative colour
  size: number // render size hint (world units, base radius)
  planetChance: number // P(host has any confirmed planets), 0–1
}

interface ClassDef {
  letter: string
  weight: number // relative frequency (≈ a softened IMF: M dominates)
  tempHot: number // subclass 0 (hot end of the class)
  tempCool: number // subclass 9 (cool end)
  colorHot: RGB
  colorCool: RGB
  dwarf: string // luminosity-V descriptor
  size: number // base render radius for a main-sequence member
  planetChance: number
}

/**
 * Seven classes O→M. Weights soften a real IMF so the rare hot stars still show
 * up as occasional blue highlights instead of literally never (O ≈ 0.3%).
 */
const CLASSES: ClassDef[] = [
  { letter: 'O', weight: 0.003, tempHot: 42000, tempCool: 30000, colorHot: [148, 170, 255], colorCool: [162, 182, 255], dwarf: 'Blue Giant', size: 0.05, planetChance: 0.1 },
  { letter: 'B', weight: 0.012, tempHot: 30000, tempCool: 10000, colorHot: [162, 182, 255], colorCool: [188, 202, 255], dwarf: 'Blue-White Star', size: 0.038, planetChance: 0.2 },
  { letter: 'A', weight: 0.02, tempHot: 10000, tempCool: 7500, colorHot: [198, 210, 255], colorCool: [226, 232, 255], dwarf: 'White Star', size: 0.03, planetChance: 0.35 },
  { letter: 'F', weight: 0.045, tempHot: 7500, tempCool: 6000, colorHot: [240, 242, 255], colorCool: [253, 250, 240], dwarf: 'Yellow-White Star', size: 0.026, planetChance: 0.5 },
  { letter: 'G', weight: 0.08, tempHot: 6000, tempCool: 5200, colorHot: [255, 250, 236], colorCool: [255, 242, 214], dwarf: 'Yellow Dwarf', size: 0.023, planetChance: 0.62 },
  { letter: 'K', weight: 0.14, tempHot: 5200, tempCool: 3700, colorHot: [255, 226, 182], colorCool: [255, 200, 150], dwarf: 'Orange Dwarf', size: 0.02, planetChance: 0.6 },
  { letter: 'M', weight: 0.7, tempHot: 3700, tempCool: 2400, colorHot: [255, 190, 142], colorCool: [255, 150, 116], dwarf: 'Red Dwarf', size: 0.016, planetChance: 0.5 },
]

const TOTAL_WEIGHT = CLASSES.reduce((s, c) => s + c.weight, 0)

/** Probability a star is an evolved giant (luminosity III) rather than V. */
const GIANT_CHANCE = 0.03

function pickClass(roll: number): ClassDef {
  let acc = 0
  const target = roll * TOTAL_WEIGHT
  for (const c of CLASSES) {
    acc += c.weight
    if (target <= acc) return c
  }
  return CLASSES[CLASSES.length - 1]
}

const fmtTemp = (k: number) => `${Math.round(k).toLocaleString('en-US')} K`

/**
 * Resolve a full spectral profile from a PRNG. Consumes a fixed number of draws
 * (class, subclass, luminosity) so callers stay deterministic.
 */
export function generateSpectral(rng: () => number): SpectralProfile {
  const def = pickClass(rng())
  const sub = Math.floor(rng() * 10)
  const t = sub / 9

  const tempK = lerp(def.tempHot, def.tempCool, t)
  const color = mixRGB(def.colorHot, def.colorCool, t)

  // Giants are rare, brighter, larger, and slightly warmer in label terms; O
  // stars are effectively always giants already, so don't double-label them.
  const isGiant = def.letter !== 'O' && rng() < GIANT_CHANCE
  const lum = isGiant ? 'III' : 'V'
  const giantWord = def.letter === 'O' || def.letter === 'B' ? 'Blue Giant' : 'Giant'
  const descriptor = isGiant ? `${def.letter}-Type ${giantWord}` : def.dwarf

  const spec = `${def.letter}${sub}${lum}`
  const size = isGiant ? def.size * 2.1 : def.size

  return {
    spec,
    cls: def.letter,
    sub,
    lum,
    tempK: Math.round(tempK),
    temp: fmtTemp(tempK),
    stellar: `${spec} · ${descriptor}`,
    color,
    size,
    // Giants have largely cleared/destabilised their planetary systems.
    planetChance: isGiant ? def.planetChance * 0.3 : def.planetChance,
  }
}
