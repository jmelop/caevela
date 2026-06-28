import type { StarSystem } from './types'

/**
 * The 11 sample systems from the prototype — real-ish sample data, and the
 * source of truth for the StarSystem shape. Positions are world coords in
 * ~[-1,1]³ with the origin at the survey centre.
 */
export const SAMPLE_SYSTEMS: StarSystem[] = [
  { id: '2271-088', name: 'Gliese 581',       position: [-0.55, -0.35, 0.3],  status: 'Visited',    region: 'Libra Sector · Orion Arm',       dist: '20.4 LY', spec: 'M3V',   feat: 'Resonant planet chain', stellar: 'M3V · Red Dwarf',   planets: '3 confirmed', zone: '1 candidate world',  temp: '3,480 K' },
  { id: '4471-209', name: 'Kepler-186',       position: [0.45, -0.55, -0.45], status: 'Unexplored', region: 'Cygnus Field · Orion Arm',       dist: '582 LY',  spec: 'M1V',   feat: 'Earth-size analog',     stellar: 'M1V · Red Dwarf',   planets: '5 confirmed', zone: '1 candidate world',  temp: '3,755 K' },
  { id: '2189-051', name: 'Wolf 1061',        position: [-0.4, 0.45, 0.55],   status: 'Visited',    region: 'Ophiuchus Reach · Orion Arm',    dist: '13.8 LY', spec: 'M3V',   feat: 'Compact rocky trio',    stellar: 'M3V · Red Dwarf',   planets: '3 confirmed', zone: '1 candidate world',  temp: '3,342 K' },
  { id: '2104-033', name: 'Ross 128',         position: [0.3, 0.4, -0.25],    status: 'Visited',    region: 'Virgo Margin · Orion Arm',       dist: '11.0 LY', spec: 'M4V',   feat: 'Quiet flare star',      stellar: 'M4V · Red Dwarf',   planets: '1 confirmed', zone: '1 candidate world',  temp: '3,192 K' },
  { id: '3315-140', name: 'LHS 1140',         position: [0.6, 0.1, 0.2],      status: 'Unexplored', region: 'Cetus Verge · Orion Arm',        dist: '48.9 LY', spec: 'M4.5V', feat: 'Dense super-Earth',     stellar: 'M4.5V · Red Dwarf', planets: '2 confirmed', zone: '1 candidate world',  temp: '3,096 K' },
  { id: '2001-001', name: 'Proxima Centauri', position: [-0.7, 0.05, 0.65],   status: 'Visited',    region: 'Centaurus Gate · Orion Arm',     dist: '4.24 LY', spec: 'M5.5V', feat: 'Nearest neighbour',     stellar: 'M5.5V · Red Dwarf', planets: '2 confirmed', zone: '1 candidate world',  temp: '3,042 K' },
  { id: '4101-700', name: 'TOI-700',          position: [0.1, -0.3, -0.6],    status: 'Visited',    region: 'Dorado Span · Orion Arm',        dist: '101 LY',  spec: 'M2V',   feat: 'Multi-habitable',       stellar: 'M2V · Red Dwarf',   planets: '4 confirmed', zone: '2 candidate worlds', temp: '3,480 K' },
  { id: '2124-273', name: "Luyten's Star",    position: [0.5, -0.2, 0.15],    status: 'Unexplored', region: 'Canis Minor · Orion Arm',        dist: '12.4 LY', spec: 'M3.5V', feat: 'Super-Earth host',      stellar: 'M3.5V · Red Dwarf', planets: '2 confirmed', zone: '1 candidate world',  temp: '3,150 K' },
  { id: '2125-401', name: "Teegarden's Star", position: [-0.3, 0.0, 0.4],     status: 'Visited',    region: 'Aries Drift · Orion Arm',        dist: '12.5 LY', spec: 'M7V',   feat: 'Ancient halo star',     stellar: 'M7V · Red Dwarf',   planets: '2 confirmed', zone: '2 candidate worlds', temp: '2,904 K' },
  { id: '2006-244', name: "Barnard's Star",   position: [0.0, 0.55, -0.15],   status: 'Visited',    region: 'Ophiuchus Reach · Orion Arm',    dist: '5.96 LY', spec: 'M4V',   feat: 'High proper motion',    stellar: 'M4V · Red Dwarf',   planets: '1 confirmed', zone: 'No candidates',      temp: '3,134 K' },
  { id: '2306-114', name: 'TRAPPIST-1',       position: [-0.05, -0.05, 0.0],  status: 'Visited',    region: 'Orion Arm · Local Neighborhood', dist: '39.5 LY', spec: 'M8V',   feat: 'Ultra-cool dwarf',      stellar: 'M8V · Red Dwarf',   planets: '7 confirmed', zone: '3 candidate worlds', temp: '2,566 K' },
]

/**
 * Default selection = TRAPPIST-1, which is index 10 (the last entry).
 *
 * NOTE: the handoff's `sampleSystems.ts` body literal said `9`, but that points
 * at Barnard's Star. Every other reference — the handoff's own header comment
 * ("índice 10 (TRAPPIST-1)"), the MapState note, and the prototype's `sel: 10`
 * — agrees on TRAPPIST-1. Using 10 to honour the stated intent.
 */
export const DEFAULT_SELECTION = 10
