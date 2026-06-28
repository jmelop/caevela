import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { StarSystem } from '../domain/types'
import { ACCENT_RGB, useMapStore } from '../store/mapStore'
import { cameraDistance, project } from './viewRef'

const MONO = "'IBM Plex Mono', monospace"

// Declutter thresholds: two label anchors closer than this (px) collide.
const LABEL_GAP_X = 92
const LABEL_GAP_Y = 16

const labelStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  transform: 'translate(10px,-50%)',
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.05em',
  color: 'rgba(198,210,228,0.66)',
  textShadow: '0 1px 5px rgba(0,0,0,0.95)',
  whiteSpace: 'nowrap',
  display: 'none',
  willChange: 'left, top, opacity',
}

const bracket = (corner: 'tl' | 'tr' | 'bl' | 'br'): CSSProperties => {
  const a = '1.5px solid var(--accent)'
  return {
    position: 'absolute',
    width: 15,
    height: 15,
    top: corner[0] === 't' ? 0 : undefined,
    bottom: corner[0] === 'b' ? 0 : undefined,
    left: corner[1] === 'l' ? 0 : undefined,
    right: corner[1] === 'r' ? 0 : undefined,
    borderTop: corner[0] === 't' ? a : undefined,
    borderBottom: corner[0] === 'b' ? a : undefined,
    borderLeft: corner[1] === 'l' ? a : undefined,
    borderRight: corner[1] === 'r' ? a : undefined,
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/**
 * The z:8 DOM layer tracked to the 3D scene: star labels, the selection reticle,
 * the selection tag, and the star→panel guide line (drawn on a 2D canvas, like
 * the prototype). Positions are written every frame from the bridged camera; no
 * React re-render in the loop (only the tag's text reacts to selection/mode).
 */
export function Overlay({ systems }: { systems: StarSystem[] }) {
  const selectedIndex = useMapStore((s) => s.selectedIndex)
  const mode = useMapStore((s) => s.mode)

  const labelRefs = useRef<(HTMLDivElement | null)[]>([])
  const reticleRef = useRef<HTMLDivElement | null>(null)
  const tagRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const { selectedIndex: sel, panelOpen, accent } = useMapStore.getState()
      const rgb = ACCENT_RGB[accent]
      const D = cameraDistance()

      // Labels. Project all candidates, then declutter: nearest wins, and any
      // label whose anchor overlaps an already-placed one is hidden.
      const candidates: { el: HTMLDivElement; x: number; y: number; depth: number }[] = []
      for (let i = 0; i < systems.length; i++) {
        const el = labelRefs.current[i]
        if (!el) continue
        const p = project(systems[i].position)
        if (!p || !p.inFront || p.depth <= 0.45 || (i === sel && panelOpen)) {
          el.style.display = 'none'
          continue
        }
        candidates.push({ el, x: p.x, y: p.y, depth: p.depth })
      }
      candidates.sort((a, b) => a.depth - b.depth)
      const placed: { x: number; y: number }[] = []
      for (const c of candidates) {
        const collides = placed.some(
          (q) => Math.abs(c.x - q.x) < LABEL_GAP_X && Math.abs(c.y - q.y) < LABEL_GAP_Y,
        )
        if (collides) {
          c.el.style.display = 'none'
          continue
        }
        placed.push({ x: c.x, y: c.y })
        c.el.style.display = 'block'
        c.el.style.left = `${c.x}px`
        c.el.style.top = `${c.y}px`
        c.el.style.opacity = clamp((D + 1.7 - c.depth) / 2.4, 0.12, 0.72).toFixed(2)
      }

      // Selected: reticle + tag + guide line.
      const ps = project(systems[sel].position)
      const showSel = !!ps && panelOpen && ps.inFront && ps.depth > 0.45
      const reticle = reticleRef.current
      const tag = tagRef.current
      if (reticle) {
        reticle.style.display = showSel ? 'block' : 'none'
        if (showSel && ps) {
          reticle.style.left = `${ps.x}px`
          reticle.style.top = `${ps.y}px`
        }
      }
      if (tag) {
        tag.style.display = showSel ? 'block' : 'none'
        if (showSel && ps) {
          tag.style.left = `${ps.x}px`
          tag.style.top = `${ps.y}px`
        }
      }

      // Guide line on the 2D canvas.
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const vw = window.innerWidth
        const vh = window.innerHeight
        if (canvas.width !== Math.round(vw * dpr) || canvas.height !== Math.round(vh * dpr)) {
          canvas.width = Math.round(vw * dpr)
          canvas.height = Math.round(vh * dpr)
        }
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          ctx.clearRect(0, 0, vw, vh)
          const panel = document.getElementById('sys-panel')
          if (showSel && ps && panel) {
            const r = panel.getBoundingClientRect()
            const ex = r.left
            const ey = r.top + 52
            const dx = ex - ps.x
            const dy = ey - ps.y
            const len = Math.hypot(dx, dy) || 1
            const sx = ps.x + (dx / len) * 46
            const sy = ps.y + (dy / len) * 46
            const grad = ctx.createLinearGradient(sx, sy, ex, ey)
            grad.addColorStop(0, `rgba(${rgb},0.12)`)
            grad.addColorStop(1, `rgba(${rgb},0.55)`)
            ctx.strokeStyle = grad
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(sx, sy)
            ctx.lineTo(ex, ey)
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(ex, ey, 3, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${rgb},0.9)`
            ctx.fill()
            ctx.beginPath()
            ctx.arc(ex, ey, 6, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(${rgb},0.35)`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [systems])

  const selName = systems[selectedIndex]?.name ?? ''
  const selTag = mode === 'destination' ? 'TARGET LOCKED' : 'SELECTED'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 8, pointerEvents: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {systems.map((system, i) => (
        <div
          key={system.id}
          ref={(el) => {
            labelRefs.current[i] = el
          }}
          style={labelStyle}
        >
          {system.name}
        </div>
      ))}

      <div ref={reticleRef} style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-50%,-50%)', width: 96, height: 96, display: 'none' }}>
        <div style={bracket('tl')} />
        <div style={bracket('tr')} />
        <div style={bracket('bl')} />
        <div style={bracket('br')} />
        <div
          style={{
            position: 'absolute',
            inset: 14,
            borderRadius: '50%',
            border: '1px dashed color-mix(in srgb, var(--accent) 32%, transparent)',
            animation: 'om-spin 18s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 30,
            borderRadius: '50%',
            border: '1px solid color-mix(in srgb, var(--accent) 16%, transparent)',
            animation: 'om-spin-rev 26s linear infinite',
          }}
        />
      </div>

      <div ref={tagRef} style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-50%,60px)', textAlign: 'center', display: 'none' }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: '0.22em',
            color: 'var(--accent)',
            textShadow: '0 0 14px color-mix(in srgb, var(--accent) 50%, transparent)',
            whiteSpace: 'nowrap',
          }}
        >
          {selName}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 8.5,
            letterSpacing: '0.3em',
            color: 'rgba(180,195,215,0.5)',
            marginTop: 4,
          }}
        >
          {selTag}
        </div>
      </div>
    </div>
  )
}
