import { describe, expect, it } from 'vitest'
import { DUST_SEED, generateDust, mulberry32 } from './prng'
import { SampleSource } from './GalaxySource'
import { DEFAULT_SELECTION, SAMPLE_SYSTEMS } from './sampleSystems'

describe('mulberry32', () => {
  it('is deterministic for a fixed seed', () => {
    const a = mulberry32(DUST_SEED)
    const b = mulberry32(DUST_SEED)
    const seqA = Array.from({ length: 16 }, () => a())
    const seqB = Array.from({ length: 16 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('yields values in [0, 1)', () => {
    const rng = mulberry32(DUST_SEED)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('generateDust', () => {
  it('produces identical dust across two runs with the fixed seed', () => {
    expect(generateDust(1200)).toEqual(generateDust(1200))
  })

  it('respects the requested density', () => {
    expect(generateDust(300)).toHaveLength(300)
    expect(generateDust(1400)).toHaveLength(1400)
  })

  it('keeps dust positions within a sane bound', () => {
    for (const star of generateDust(1200)) {
      for (const c of star.position) expect(Math.abs(c)).toBeLessThan(3)
      expect(star.alpha).toBeGreaterThan(0)
    }
  })
})

describe('SampleSource', () => {
  it('returns the 11 catalogued systems', () => {
    const sys = new SampleSource().getSystems()
    expect(sys).toHaveLength(11)
    expect(sys).toBe(SAMPLE_SYSTEMS)
  })

  it('exposes the same deterministic dust as generateDust', () => {
    expect(new SampleSource(800).getDust()).toEqual(generateDust(800))
  })

  it('default selection points at TRAPPIST-1', () => {
    expect(SAMPLE_SYSTEMS[DEFAULT_SELECTION]?.name).toBe('TRAPPIST-1')
  })
})
