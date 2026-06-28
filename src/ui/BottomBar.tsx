import type { CSSProperties, ReactNode } from 'react'
import { useMapStore } from '../store/mapStore'

const MONO = "'IBM Plex Mono', monospace"

const wrap: CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '22px 34px',
  zIndex: 10,
  pointerEvents: 'none',
  background: 'linear-gradient(to top, rgba(5,7,13,0.72), rgba(5,7,13,0))',
}

const sideLabel: CSSProperties = {
  fontSize: 12,
  color: '#aebccd',
  letterSpacing: '0.04em',
  textShadow: '0 1px 4px rgba(0,0,0,0.9)',
}

function Keycap({ children, minWidth }: { children: ReactNode; minWidth: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth,
        height: 22,
        padding: '0 8px',
        fontFamily: MONO,
        fontSize: 10,
        color: '#aebccd',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 4,
        boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.4)',
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </span>
  )
}

export function BottomBar() {
  const mode = useMapStore((s) => s.mode)
  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
        <Keycap minWidth={54}>SPACE</Keycap>
        <span style={sideLabel}>Recenter view</span>
      </div>

      <div
        className="bb-hint"
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: '#5d6b80',
          letterSpacing: '0.12em',
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
        }}
      >
        {mode === 'explore'
          ? 'DRAG TO ROTATE  ·  WASD / RIGHT-DRAG TO MOVE  ·  SCROLL TO ZOOM  ·  FREE EXPLORE'
          : 'DRAG TO ROTATE  ·  SCROLL TO ZOOM  ·  CLICK A STAR  ·  1,284 SYSTEMS'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
        <span style={sideLabel}>Leave</span>
        <Keycap minWidth={32}>ESC</Keycap>
      </div>
    </div>
  )
}
