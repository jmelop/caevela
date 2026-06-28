import { create } from 'zustand'
import type { NavMode, StarSystem } from '../domain/types'
import { DEFAULT_SELECTION, SAMPLE_SYSTEMS } from '../domain/sampleSystems'

export type AccentName = 'Amber' | 'Cyan'

/** Accent → hex. Drives both the scene FX and the Venator `--accent` rebind. */
export const ACCENT_HEX: Record<AccentName, string> = {
  Amber: '#ffb84d',
  Cyan: '#3fe0ff',
}

/** Accent → "r,g,b" for canvas-drawn FX (guide line) where a var won't reach. */
export const ACCENT_RGB: Record<AccentName, string> = {
  Amber: '255,184,77',
  Cyan: '63,224,255',
}

interface MapState {
  /** The selected system — a hand-authored local node OR a dense-field system. */
  selected: StarSystem
  /** The hovered system (field or local), for the in-scene hover highlight. */
  hovered: StarSystem | null
  mode: NavMode
  panelOpen: boolean
  accent: AccentName
  select: (system: StarSystem) => void
  setHovered: (system: StarSystem | null) => void
  setMode: (mode: NavMode) => void
  closePanel: () => void
  reopenPanel: () => void
  setAccent: (accent: AccentName) => void
}

/**
 * Selection / hover / mode / panel / accent state. Selection holds the system
 * OBJECT (not an array index) so any of the tens of thousands of field systems
 * is selectable the same way as the 11 local ones. The camera deliberately lives
 * OUTSIDE this store (OrbitControls + mutable refs) to avoid per-frame churn.
 */
export const useMapStore = create<MapState>((set) => ({
  selected: SAMPLE_SYSTEMS[DEFAULT_SELECTION],
  hovered: null,
  mode: 'destination',
  panelOpen: true,
  accent: 'Amber',
  select: (system) => set({ selected: system, panelOpen: true }),
  setHovered: (hovered) => set({ hovered }),
  setMode: (mode) => set({ mode }),
  closePanel: () => set({ panelOpen: false }),
  reopenPanel: () => set({ panelOpen: true }),
  setAccent: (accent) => set({ accent }),
}))
