import type { DustStar, StarSystem } from './types'
import { SAMPLE_SYSTEMS } from './sampleSystems'
import { DEFAULT_DUST_DENSITY, generateDust } from './prng'

/**
 * The scene never consumes SAMPLE_SYSTEMS directly — it goes through this
 * interface, so swapping in a real catalogue (HYG ~120k, then Gaia) later never
 * touches the rendering layer.
 */
export interface GalaxySource {
  getSystems(): StarSystem[] // catalogued, navigable nodes
  getDust(): DustStar[] // background dust (non-interactive)
}

/**
 * MVP source: the 11 sample systems plus deterministic dust from the fixed seed.
 * v2 HygSource / GaiaSource implement the same interface with streaming inside.
 */
export class SampleSource implements GalaxySource {
  private readonly density: number
  private dust: DustStar[] | null = null

  constructor(density: number = DEFAULT_DUST_DENSITY) {
    this.density = density
  }

  getSystems(): StarSystem[] {
    return SAMPLE_SYSTEMS
  }

  getDust(): DustStar[] {
    // Generated once, then cached — deterministic, so caching is safe.
    return (this.dust ??= generateDust(this.density))
  }
}
