export type StarStatus = 'Visited' | 'Unexplored'
export type NavMode = 'destination' | 'explore'

/** A catalogued, navigable star system (a node in the map). */
export interface StarSystem {
  id: string // SYS-ID, e.g. "2306-114"
  name: string // "TRAPPIST-1"
  position: [number, number, number] // world coords in ~[-1,1]³, origin = survey centre
  status: StarStatus
  region: string // "Orion Arm · Local Neighborhood"
  dist: string // "39.5 LY" (string with unit, verbatim)
  spec: string // spectral type "M8V"
  feat: string // feature "Ultra-cool dwarf"
  stellar: string // "M8V · Red Dwarf"
  planets: string // "7 confirmed"
  zone: string // "3 candidate worlds"
  temp: string // "2,566 K"
}

/**
 * A background dust star — atmospheric, non-interactive. Framework-agnostic so
 * the scene can pack it into a Float32Array / InstancedMesh as it sees fit.
 */
export interface DustStar {
  position: [number, number, number]
  size: number
  color: [number, number, number] // 0–255 RGB
  alpha: number
  twinkle: boolean
  twinkleSpeed: number
  twinklePhase: number
}
