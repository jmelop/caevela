import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { StarSystem } from '../domain/types'
import { ACCENT_RGB, useMapStore } from '../store/mapStore'
import { lodRef, smooth } from '../scene/lod'
import { fieldRef } from '../scene/fieldRef'
import { cameraDistance, project, viewRef } from './viewRef'

const MONO = "'IBM Plex Mono', monospace"

// Declutter thresholds: two label anchors closer than this (px) collide.
const LABEL_GAP_X = 92
const LABEL_GAP_Y = 16

// Field labels: a small reusable pool, never one-per-system. Each frame we label
// the nearest + brightest few field systems plus the hovered one; the rest stay
// blank. FIELD_SCAN is how many nearest candidates we project before placing.
const N_FIELD_LABELS = 16
const FIELD_SCAN = 40

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
  const selected = useMapStore((s) => s.selected)
  const mode = useMapStore((s) => s.mode)

  const labelRefs = useRef<(HTMLDivElement | null)[]>([])
  const fieldLabelRefs = useRef<(HTMLDivElement | null)[]>([])
  const reticleRef = useRef<HTMLDivElement | null>(null)
  const tagRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const youHereRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const { selected: sel, panelOpen, accent } = useMapStore.getState()
      const rgb = ACCENT_RGB[accent]
      const D = cameraDistance()
      const surveyFade = 1 - lodRef.t // survey overlay dims out at galaxy scale

      // Labels. Project all candidates, then declutter: nearest wins, and any
      // label whose anchor overlaps an already-placed one is hidden.
      const candidates: { el: HTMLDivElement; x: number; y: number; depth: number }[] = []
      for (let i = 0; i < systems.length; i++) {
        const el = labelRefs.current[i]
        if (!el) continue
        const p = project(systems[i].position)
        if (!p || !p.inFront || p.depth <= 0.45 || (systems[i].id === sel.id && panelOpen)) {
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
        c.el.style.opacity = (clamp((D + 1.7 - c.depth) / 2.4, 0.12, 0.72) * surveyFade).toFixed(3)
      }

      // Field labels: only when zoomed in (they fade out with the survey), and
      // only for the nearest + brightest handful, plus the hovered system. The
      // heavy sweep over all field positions is skipped entirely at galaxy scale.
      const flabels = fieldLabelRefs.current
      const fpos = fieldRef.positions
      const fsys = fieldRef.systems
      const cam = viewRef.camera
      let fUsed = 0
      if (fpos && cam && surveyFade > 0.05) {
        const cpx = cam.position.x
        const cpy = cam.position.y
        const cpz = cam.position.z
        // Keep the K nearest-by-score (distance discounted by brightness, so a
        // bright giant gets labelled from a little farther than a dim red dwarf).
        const idxBuf: number[] = []
        const scBuf: number[] = []
        let worst = -1
        let worstScore = -Infinity
        const n = fsys.length
        for (let i = 0; i < n; i++) {
          const dx = fpos[i * 3] - cpx
          const dy = fpos[i * 3 + 1] - cpy
          const dz = fpos[i * 3 + 2] - cpz
          const score = (dx * dx + dy * dy + dz * dz) / (1 + fsys[i].renderSize * 20)
          if (idxBuf.length < FIELD_SCAN) {
            idxBuf.push(i)
            scBuf.push(score)
            if (idxBuf.length === FIELD_SCAN) {
              worstScore = -Infinity
              for (let j = 0; j < FIELD_SCAN; j++) if (scBuf[j] > worstScore) { worstScore = scBuf[j]; worst = j }
            }
          } else if (score < worstScore) {
            idxBuf[worst] = i
            scBuf[worst] = score
            worstScore = -Infinity
            for (let j = 0; j < FIELD_SCAN; j++) if (scBuf[j] > worstScore) { worstScore = scBuf[j]; worst = j }
          }
        }
        const hoveredId = useMapStore.getState().hovered?.id ?? null
        const fcand: { i: number; x: number; y: number; depth: number }[] = []
        for (let j = 0; j < idxBuf.length; j++) {
          const i = idxBuf[j]
          const p = project([fpos[i * 3], fpos[i * 3 + 1], fpos[i * 3 + 2]])
          if (!p || !p.inFront || p.depth <= 0.45) continue
          fcand.push({ i, x: p.x, y: p.y, depth: p.depth })
        }
        fcand.sort((a, b) => a.depth - b.depth)
        for (const fc of fcand) {
          if (fUsed >= flabels.length - 1) break // reserve one slot for the hovered label
          const collides = placed.some(
            (q) => Math.abs(fc.x - q.x) < LABEL_GAP_X && Math.abs(fc.y - q.y) < LABEL_GAP_Y,
          )
          if (collides) continue
          const el = flabels[fUsed]
          if (!el) continue
          placed.push({ x: fc.x, y: fc.y })
          el.textContent = fsys[fc.i].name
          el.style.display = 'block'
          el.style.left = `${fc.x}px`
          el.style.top = `${fc.y}px`
          el.style.opacity = (clamp((D + 1.7 - fc.depth) / 2.4, 0.1, 0.6) * surveyFade).toFixed(3)
          fUsed++
        }
        // Always label the hovered field system, even if it wasn't near/bright.
        if (hoveredId && fUsed < flabels.length) {
          const hi = fsys.findIndex((s) => s.id === hoveredId)
          if (hi >= 0) {
            const p = project([fpos[hi * 3], fpos[hi * 3 + 1], fpos[hi * 3 + 2]])
            if (p && p.inFront && p.depth > 0.45) {
              const el = flabels[fUsed]
              if (el) {
                el.textContent = fsys[hi].name
                el.style.display = 'block'
                el.style.left = `${p.x}px`
                el.style.top = `${p.y}px`
                el.style.opacity = (0.85 * surveyFade).toFixed(3)
                fUsed++
              }
            }
          }
        }
      }
      for (let k = fUsed; k < flabels.length; k++) {
        const el = flabels[k]
        if (el) el.style.display = 'none'
      }

      // Selected: reticle + tag + guide line.
      const ps = project(sel.position)
      const showSel = !!ps && panelOpen && ps.inFront && ps.depth > 0.45
      const reticle = reticleRef.current
      const tag = tagRef.current
      // The selection marker (reticle + tag + guide line) stays visible at EVERY
      // scale — unlike the survey labels, you should always see what's selected,
      // including the core black hole out at galaxy scale. So it ignores surveyFade.
      if (reticle) {
        reticle.style.display = showSel ? 'block' : 'none'
        if (showSel && ps) {
          reticle.style.left = `${ps.x}px`
          reticle.style.top = `${ps.y}px`
          reticle.style.opacity = '1'
        }
      }
      if (tag) {
        tag.style.display = showSel ? 'block' : 'none'
        if (showSel && ps) {
          tag.style.left = `${ps.x}px`
          tag.style.top = `${ps.y}px`
          tag.style.opacity = '1'
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

      // "You are here" marker at the survey origin — fades in at galaxy scale.
      const yhere = youHereRef.current
      if (yhere) {
        const yt = smooth(lodRef.t)
        const po = project([0, 0, 0])
        if (yt > 0.02 && po && po.inFront) {
          yhere.style.display = 'block'
          yhere.style.left = `${po.x}px`
          yhere.style.top = `${po.y}px`
          yhere.style.opacity = yt.toFixed(3)
        } else {
          yhere.style.display = 'none'
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [systems])

  const selName = selected.name
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

      {/* Reusable pool for field labels — text/position written each frame. */}
      {Array.from({ length: N_FIELD_LABELS }).map((_, i) => (
        <div
          key={`field-label-${i}`}
          ref={(el) => {
            fieldLabelRefs.current[i] = el
          }}
          style={labelStyle}
        />
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

      <div
        ref={youHereRef}
        style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-50%,-50%)', textAlign: 'center', display: 'none' }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '1.5px solid var(--accent)',
            margin: '0 auto',
            boxShadow: '0 0 12px color-mix(in srgb, var(--accent) 60%, transparent)',
          }}
        />
        <div
          style={{
            marginTop: 8,
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.28em',
            color: 'var(--accent)',
            whiteSpace: 'nowrap',
            textShadow: '0 0 10px rgba(0,0,0,0.9)',
          }}
        >
          YOU ARE HERE
        </div>
        <div
          style={{
            marginTop: 3,
            fontFamily: MONO,
            fontSize: 8,
            letterSpacing: '0.3em',
            color: 'rgba(180,195,215,0.6)',
            whiteSpace: 'nowrap',
          }}
        >
          LOCAL SURVEY
        </div>
      </div>
    </div>
  )
}
