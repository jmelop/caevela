import type { DustStar, StarSystem } from './types'
import type { FieldSystem } from './proceduralSystems'
import { SAMPLE_SYSTEMS } from './sampleSystems'
import { DEFAULT_DUST_DENSITY, generateDust } from './prng'
import { DEFAULT_FIELD_COUNT, generateFieldSystems } from './proceduralSystems'

/**
 * The scene never consumes SAMPLE_SYSTEMS directly — it goes through this
 * interface, so swapping in a real catalogue (HYG ~120k, then Gaia) later never
 * touches the rendering layer.
 *
 * - getSystems(): the hand-authored local cluster — the highlighted "you are
 *   here" survey, fully interactive (labels, reticle, panel). Small.
 * - getFieldSystems(): the dense procedural field spread across the whole galaxy,
 *   rendered as one InstancedMesh. Added without touching the getSystems() path.
 */
export interface GalaxySource {
  getSystems(): StarSystem[] // catalogued, navigable local cluster
  getFieldSystems(): FieldSystem[] // dense galaxy-wide field (render via InstancedMesh)
  getDust(): DustStar[] // background dust (non-interactive)
}

/**
 * MVP source: the 11 sample systems (local cluster) + a dense procedural field
 * across the galaxy + deterministic dust. v2 HygSource / GaiaSource implement the
 * same interface with streaming inside.
 */
export class SampleSource implements GalaxySource {
  private readonly density: number
  private readonly fieldCount: number
  private dust: DustStar[] | null = null
  private field: FieldSystem[] | null = null

  constructor(density: number = DEFAULT_DUST_DENSITY, fieldCount: number = DEFAULT_FIELD_COUNT) {
    this.density = density
    this.fieldCount = fieldCount
  }

  getSystems(): StarSystem[] {
    return SAMPLE_SYSTEMS
  }

  getFieldSystems(): FieldSystem[] {
    // Generated once, then cached — deterministic, so caching is safe.
    return (this.field ??= generateFieldSystems(this.fieldCount))
  }

  getDust(): DustStar[] {
    // Generated once, then cached — deterministic, so caching is safe.
    return (this.dust ??= generateDust(this.density))
  }
}
