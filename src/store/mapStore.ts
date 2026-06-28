import { create } from 'zustand'
import type { NavMode } from '../domain/types'
import { DEFAULT_SELECTION } from '../domain/sampleSystems'

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
  selectedIndex: number
  mode: NavMode
  panelOpen: boolean
  accent: AccentName
  select: (index: number) => void
  setMode: (mode: NavMode) => void
  closePanel: () => void
  reopenPanel: () => void
  setAccent: (accent: AccentName) => void
}

/**
 * Selection / mode / panel / accent state. The camera deliberately lives OUTSIDE
 * this store (in OrbitControls + a mutable interaction ref) to avoid re-render
 * churn every frame.
 */
export const useMapStore = create<MapState>((set) => ({
  selectedIndex: DEFAULT_SELECTION,
  mode: 'destination',
  panelOpen: true,
  accent: 'Amber',
  select: (index) => set({ selectedIndex: index, panelOpen: true }),
  setMode: (mode) => set({ mode }),
  closePanel: () => set({ panelOpen: false }),
  reopenPanel: () => set({ panelOpen: true }),
  setAccent: (accent) => set({ accent }),
}))
