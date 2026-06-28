import type { CSSProperties } from 'react'
import { useMapStore } from '../store/mapStore'
import { ChevronDestination, ChevronExplore, FilterIcon } from './Icons'

const MONO = "'IBM Plex Mono', monospace"
const ACCENT_MIX = 'color-mix(in srgb, var(--accent) 14%, transparent)'

const wrap: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '26px 34px 40px',
  zIndex: 10,
  pointerEvents: 'none',
  background: 'linear-gradient(to bottom, rgba(5,7,13,0.6), rgba(5,7,13,0))',
}

const eyebrow: CSSProperties = {
  fontFamily: MONO,
  fontSize: 9,
  letterSpacing: '0.28em',
  color: '#5d6b80',
}

const group: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  overflow: 'hidden',
  background: 'rgba(10,14,22,0.5)',
  backdropFilter: 'blur(14px) saturate(120%)',
  WebkitBackdropFilter: 'blur(14px) saturate(120%)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 7,
  boxShadow: '0 8px 26px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
}

const item: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '9px 15px',
  cursor: 'pointer',
}

const divider: CSSProperties = { width: 1, background: 'rgba(255,255,255,0.08)' }
const segLabel: CSSProperties = { fontSize: 12, fontWeight: 600, letterSpacing: '0.1em' }

export function TopBar() {
  const mode = useMapStore((s) => s.mode)
  const setMode = useMapStore((s) => s.setMode)

  return (
    <div style={wrap}>
      <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...eyebrow, paddingLeft: 3 }}>NAVIGATION</div>
        <div style={group}>
          <div
            onClick={() => setMode('destination')}
            style={{
              ...item,
              background: mode === 'destination' ? ACCENT_MIX : 'transparent',
              color: mode === 'destination' ? 'var(--accent)' : '#7d8a9c',
            }}
          >
            <ChevronDestination />
            <span style={segLabel}>DESTINATION</span>
          </div>
          <div style={divider} />
          <div
            onClick={() => setMode('explore')}
            style={{
              ...item,
              background: mode === 'explore' ? ACCENT_MIX : 'transparent',
              color: mode === 'explore' ? 'var(--accent)' : '#7d8a9c',
            }}
          >
            <span style={segLabel}>FREE EXPLORE</span>
            <ChevronExplore />
          </div>
        </div>
      </div>

      <div className="tb-center" style={{ textAlign: 'center', pointerEvents: 'none', paddingTop: 3 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.42em',
            color: 'var(--accent)',
            opacity: 0.85,
            textShadow: '0 0 16px color-mix(in srgb, var(--accent) 30%, transparent)',
          }}
        >
          MILKY WAY SURVEY
        </div>
        <div
          style={{
            fontSize: 15,
            letterSpacing: '0.24em',
            marginTop: 6,
            color: '#d4dceb',
            textShadow: '0 1px 6px rgba(0,0,0,0.9)',
          }}
        >
          ORION–CYGNUS ARM
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 9.5,
            letterSpacing: '0.18em',
            color: '#5d6b80',
            marginTop: 6,
          }}
        >
          VOLUMETRIC SURVEY · 8.2 KPC FROM CORE
        </div>
      </div>

      <div
        className="tb-filter"
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <div style={{ ...eyebrow, paddingRight: 3 }}>DISPLAY FILTER</div>
        <div style={group}>
          <div style={{ ...item, color: '#7d8a9c' }}>
            <FilterIcon />
            <span style={{ ...segLabel, fontWeight: 500 }}>FILTER</span>
          </div>
          <div style={divider} />
          <div style={{ ...item, background: ACCENT_MIX, color: 'var(--accent)' }}>
            <span style={segLabel}>NO FILTER</span>
          </div>
        </div>
      </div>
    </div>
  )
}
