import type { StarSystem } from './types'
import { GALAXY_CENTER } from './galaxy'

/**
 * Supermassive black hole geometry (world units), shared by the renderer
 * (BlackHole) and the picker (SelectionController) so they never drift. Sized at
 * 0.8× the first cut.
 */
export const HORIZON_R = 1.36 // event-horizon (shadow) radius
export const DISK_OUTER = 6.4 // accretion-disk outer radius — also the pick radius

/**
 * Sagittarius A* as a selectable system, so the galactic-core black hole opens
 * the same info panel as any star. Position is the galactic centre.
 */
export const SGR_A_STAR: StarSystem = {
  id: 'SGR-A*',
  name: 'Sagittarius A*',
  position: GALAXY_CENTER,
  status: 'Unexplored',
  region: 'Galactic Core · Sagittarius A*',
  dist: '26.7 kly',
  spec: 'SMBH',
  feat: 'Supermassive black hole',
  stellar: 'Supermassive · 4.3M M☉',
  planets: 'None — event horizon',
  zone: 'No habitable zone',
  temp: '10,000,000 K (disk)',
}
