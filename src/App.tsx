import { lazy, Suspense, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { SampleSource } from './domain/GalaxySource'
import { Overlay } from './overlay/Overlay'
import { ChromeLayer } from './ui/ChromeLayer'
import { TopBar } from './ui/TopBar'
import { BottomBar } from './ui/BottomBar'
import { SystemInfoPanel } from './ui/SystemInfoPanel'
import { ACCENT_HEX, useMapStore } from './store/mapStore'

// Code-split the heavy 3D stack (three + drei + postprocessing) so the initial
// chunk is just React + the DOM chrome; the scene loads as its own chunk.
const GalaxyCanvas = lazy(() =>
  import('./scene/GalaxyCanvas').then((m) => ({ default: m.GalaxyCanvas })),
)

function Splash() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div style={{ color: 'var(--accent)', letterSpacing: '0.42em', fontSize: 11, opacity: 0.85 }}>
        MILKY WAY SURVEY
      </div>
      <div style={{ color: '#5d6b80', letterSpacing: '0.24em', fontSize: 10 }}>INITIALIZING…</div>
    </div>
  )
}

export default function App() {
  // The chrome consumes the GalaxySource interface, never SAMPLE_SYSTEMS directly.
  const source = useMemo(() => new SampleSource(), [])
  const systems = useMemo(() => source.getSystems(), [source])
  const accent = useMapStore((s) => s.accent)

  // Rebind Venator's --accent token to the survey accent (amber default). Every
  // accent-driven bit of chrome + overlay follows from this one swap.
  const accentVars = {
    '--accent': ACCENT_HEX[accent],
    '--accent-ink': '#000',
  } as unknown as CSSProperties

  const rootStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    fontFamily: "'Space Grotesk', sans-serif",
    color: '#e8edf5',
    ...accentVars,
  }

  return (
    <div style={rootStyle}>
      <Suspense fallback={<Splash />}>
        <GalaxyCanvas source={source} />
      </Suspense>
      <Overlay systems={systems} />
      <ChromeLayer>
        <TopBar />
        <BottomBar />
        <SystemInfoPanel systems={systems} />
      </ChromeLayer>
    </div>
  )
}
