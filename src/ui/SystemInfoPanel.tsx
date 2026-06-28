import type { CSSProperties, ReactNode } from 'react'
import type { StarSystem } from '../domain/types'
import { useMapStore } from '../store/mapStore'
import {
  CloseIcon,
  CrosshairIcon,
  PlanetIcon,
  SunIcon,
  TargetIcon,
  ThermometerIcon,
} from './Icons'

const MONO = "'IBM Plex Mono', monospace"

const statusStyle = (visited: boolean) => ({
  border: visited ? 'rgba(120,200,160,0.3)' : 'rgba(255,255,255,0.14)',
  bg: visited ? 'rgba(70,170,120,0.1)' : 'rgba(255,255,255,0.04)',
  dot: visited ? '#6fdca0' : '#8a98ab',
  color: visited ? '#92dcb0' : '#aeb9c8',
})

function DataBlock({
  icon,
  label,
  value,
  last,
}: {
  icon: ReactNode
  label: string
  value: string
  last?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 24px',
        borderBottom: last ? undefined : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent)',
          opacity: 0.92,
          flex: 'none',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#6c7a8e',
            fontFamily: MONO,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 15, color: '#e8edf5', marginTop: 3, fontWeight: 500 }}>
          {value}
        </div>
      </div>
    </div>
  )
}

const container: CSSProperties = {
  position: 'absolute',
  top: '14.5vh',
  right: '3.4vw',
  width: '23vw',
  minWidth: 344,
  maxWidth: 404,
  zIndex: 11,
  borderRadius: 9,
  overflow: 'hidden',
  background: 'linear-gradient(165deg, rgba(14,19,30,0.66), rgba(8,11,18,0.76))',
  backdropFilter: 'blur(18px) saturate(135%)',
  WebkitBackdropFilter: 'blur(18px) saturate(135%)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 18px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
}

export function SystemInfoPanel({ systems }: { systems: StarSystem[] }) {
  const selectedIndex = useMapStore((s) => s.selectedIndex)
  const panelOpen = useMapStore((s) => s.panelOpen)
  const mode = useMapStore((s) => s.mode)
  const closePanel = useMapStore((s) => s.closePanel)

  if (!panelOpen) return null
  const sys = systems[selectedIndex]
  if (!sys) return null

  const visited = sys.status === 'Visited'
  const st = statusStyle(visited)
  const actionLabel = mode === 'destination' ? 'SET DESTINATION' : 'INSPECT SYSTEM'

  return (
    <div id="sys-panel" className="info-panel" style={container}>
      {/* Header */}
      <div style={{ padding: '22px 24px 16px', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              'linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 75%, transparent), transparent)',
          }}
        />
        <button
          type="button"
          onClick={closePanel}
          className="panel-close"
          aria-label="Close panel"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 4,
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#8a98ab',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <CloseIcon />
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div
            style={{
              fontSize: 23,
              fontWeight: 600,
              color: 'var(--accent)',
              letterSpacing: '0.01em',
              lineHeight: 1,
              textShadow: '0 0 22px color-mix(in srgb, var(--accent) 40%, transparent)',
            }}
          >
            {sys.name}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 11px',
              border: `1px solid ${st.border}`,
              borderRadius: 20,
              background: st.bg,
              flex: 'none',
              marginRight: 34,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: st.dot,
                boxShadow: `0 0 8px ${st.dot}`,
              }}
            />
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.16em', color: st.color }}>
              {sys.status}
            </span>
          </div>
        </div>
        <div
          style={{
            marginTop: 9,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.14em',
            color: '#8a98ab',
            textTransform: 'uppercase',
          }}
        >
          {sys.region}
        </div>
      </div>

      {/* Key-data band */}
      <div
        style={{
          padding: '13px 24px',
          background: 'color-mix(in srgb, var(--accent) 8%, rgba(0,0,0,0.22))',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontFamily: MONO,
          fontSize: 13,
          letterSpacing: '0.01em',
          color: '#cdd6e4',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{sys.dist}</span>
        <span style={{ color: '#4a5568' }}>//</span>
        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{sys.spec}</span>
        <span style={{ color: '#4a5568' }}>//</span>
        <span style={{ color: '#cdd6e4' }}>{sys.feat}</span>
      </div>

      {/* Data blocks */}
      <div>
        <DataBlock icon={<SunIcon />} label="Stellar Class" value={sys.stellar} />
        <DataBlock icon={<PlanetIcon />} label="Planetary Bodies" value={sys.planets} />
        <DataBlock icon={<TargetIcon />} label="Habitable Zone" value={sys.zone} />
        <DataBlock icon={<ThermometerIcon />} label="Surface Temp" value={sys.temp} last />
      </div>

      {/* Footer */}
      <div style={{ padding: '6px 24px 22px', display: 'flex', flexDirection: 'column', gap: 13 }}>
        <button
          type="button"
          className="panel-action"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 11,
            width: '100%',
            padding: 13,
            background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 52%, transparent)',
            borderRadius: 7,
            color: 'var(--accent)',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.16em',
            cursor: 'pointer',
            textShadow: '0 0 14px color-mix(in srgb, var(--accent) 45%, transparent)',
          }}
        >
          <CrosshairIcon />
          {actionLabel}
        </button>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: MONO,
            fontSize: 10,
            color: '#5d6b80',
            letterSpacing: '0.08em',
          }}
        >
          <span>ENTER to confirm</span>
          <span>SYS-ID {sys.id}</span>
        </div>
      </div>
    </div>
  )
}
