import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { StarSystem } from '../domain/types'
import { useMapStore } from '../store/mapStore'
import { CAMERA_DEFAULTS, orbitPosition } from './cameraRig'
import { lodRef, smooth } from './lod'
import { fieldRef } from './fieldRef'
import { flyRef } from './flyRef'

const HIT_RADIUS_PX = 24 // forgiving radius for the hand-authored local cluster
const FIELD_HIT_PX = 11 // tighter for the dense field, so dense regions don't over-grab
const DRAG_THRESHOLD_PX = 3
const IDLE_MS = 3500
const AUTO_ROTATE_SPEED = 0.9 // ≈ the prototype's 0.0016 rad/frame drift
const FLY_DURATION = 0.7 // seconds for the "inspect" fly-to-system animation

type OrbitLike = {
  target: Vector3
  update: () => void
  autoRotate: boolean
  autoRotateSpeed: number
}

/**
 * All pointer/keyboard interaction: 24px screen-space hit-test for the local
 * cluster (forgiving, like the prototype), a tight allocation-free screen-space
 * pass over the dense field so EVERY field system is selectable, drag<3px counts
 * as a click, hover cursor + in-scene highlight, idle auto-rotation, Space to
 * recenter. OrbitControls owns the actual orbit/zoom.
 *
 * Field picking is screen-space nearest (not a mesh raycast): a 0.02-unit star is
 * near-impossible to hit with a pixel-exact ray, and a typed-array sweep over
 * tens of thousands runs in well under a millisecond — and gives the same
 * forgiving feel the 11 local nodes already have. Hover runs at most once per
 * frame (driven from the render loop), never per pointer event.
 */
export function SelectionController({ systems }: { systems: StarSystem[] }) {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null

  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const lastInteract = useRef(-Infinity)
  // Canvas-relative pointer, updated on move; consumed once per frame for hover.
  const pointer = useRef<{ x: number; y: number; over: boolean }>({ x: 0, y: 0, over: false })
  const hoveredId = useRef<string | null>(null)
  const cursor = useRef<string>('grab')
  // Bound inside the effect; invoked once per frame from useFrame for hover.
  const frameHover = useRef<(() => void) | null>(null)
  // Inspect fly-to animation state (start/end camera pos + orbit target).
  const fly = useRef({
    active: false,
    t: 0,
    handled: 0,
    sp: new Vector3(),
    st: new Vector3(),
    ep: new Vector3(),
    et: new Vector3(),
  })

  useEffect(() => {
    const el = gl.domElement
    const tmp = new Vector3()

    // Nearest local node within HIT_RADIUS_PX of (mx,my) [canvas-relative], in
    // front of the camera. Cheap — only 11 of them.
    const hitLocal = (mx: number, my: number): StarSystem | null => {
      let best: StarSystem | null = null
      let bestDist = HIT_RADIUS_PX
      for (let i = 0; i < systems.length; i++) {
        const p = systems[i].position
        tmp.set(p[0], p[1], p[2])
        if (tmp.clone().applyMatrix4(camera.matrixWorldInverse).z >= 0) continue
        tmp.project(camera)
        const px = (tmp.x * 0.5 + 0.5) * size.width
        const py = (-tmp.y * 0.5 + 0.5) * size.height
        const dist = Math.hypot(px - mx, py - my)
        if (dist < bestDist) {
          bestDist = dist
          best = systems[i]
        }
      }
      return best
    }

    // Nearest field instance within FIELD_HIT_PX. Allocation-free sweep over the
    // flat positions buffer — manual mat4 transforms, squared-distance compares.
    const hitField = (mx: number, my: number): StarSystem | null => {
      const pos = fieldRef.positions
      if (!pos) return null
      const ve = camera.matrixWorldInverse.elements
      const pe = camera.projectionMatrix.elements
      const W = size.width
      const H = size.height
      const n = fieldRef.systems.length
      let best = -1
      let bestSq = FIELD_HIT_PX * FIELD_HIT_PX
      for (let i = 0; i < n; i++) {
        const x = pos[i * 3]
        const y = pos[i * 3 + 1]
        const z = pos[i * 3 + 2]
        // View space (column-major). Skip anything not in front of the camera.
        const vz = ve[2] * x + ve[6] * y + ve[10] * z + ve[14]
        if (vz >= 0) continue
        const vx = ve[0] * x + ve[4] * y + ve[8] * z + ve[12]
        const vy = ve[1] * x + ve[5] * y + ve[9] * z + ve[13]
        // Clip space.
        const cw = pe[3] * vx + pe[7] * vy + pe[11] * vz + pe[15]
        if (cw <= 0) continue
        const cx = pe[0] * vx + pe[4] * vy + pe[8] * vz + pe[12]
        const cy = pe[1] * vx + pe[5] * vy + pe[9] * vz + pe[13]
        const sx = ((cx / cw) * 0.5 + 0.5) * W
        const sy = (-(cy / cw) * 0.5 + 0.5) * H
        const dx = sx - mx
        const dy = sy - my
        const d = dx * dx + dy * dy
        if (d < bestSq) {
          bestSq = d
          best = i
        }
      }
      return best >= 0 ? fieldRef.systems[best] : null
    }

    // Local cluster wins ties (it's the highlighted survey); else the field.
    const pick = (mx: number, my: number): StarSystem | null => hitLocal(mx, my) ?? hitField(mx, my)

    const toCanvas = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      return { mx: clientX - rect.left, my: clientY - rect.top }
    }

    const recenter = () => {
      const [x, y, z] = orbitPosition(
        CAMERA_DEFAULTS.yaw,
        CAMERA_DEFAULTS.pitch,
        CAMERA_DEFAULTS.distance,
      )
      camera.position.set(x, y, z)
      if (controls) {
        controls.target.set(0, 0, 0)
        controls.update()
      }
      lastInteract.current = performance.now()
    }

    const onPointerDown = (e: PointerEvent) => {
      drag.current = { x: e.clientX, y: e.clientY, moved: false }
      lastInteract.current = performance.now()
      fly.current.active = false // a drag cancels any in-flight inspect fly
      el.style.cursor = 'grabbing'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (drag.current) {
        const dx = e.clientX - drag.current.x
        const dy = e.clientY - drag.current.y
        if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD_PX) drag.current.moved = true
        lastInteract.current = performance.now()
        pointer.current.over = false // suppress hover while dragging
      } else {
        const { mx, my } = toCanvas(e.clientX, e.clientY)
        pointer.current.x = mx
        pointer.current.y = my
        pointer.current.over = e.target === el
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (drag.current && !drag.current.moved) {
        const { mx, my } = toCanvas(e.clientX, e.clientY)
        const sys = pick(mx, my)
        if (sys) useMapStore.getState().select(sys)
      }
      drag.current = null
      lastInteract.current = performance.now()
    }

    const onPointerLeave = () => {
      pointer.current.over = false
    }

    const onWheel = () => {
      lastInteract.current = performance.now()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        recenter()
      }
    }

    el.style.cursor = 'grab'
    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointerleave', onPointerLeave)
    el.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKeyDown)

    // Expose pick to the frame loop via a ref-bound closure.
    frameHover.current = () => {
      if (drag.current || !pointer.current.over) {
        if (hoveredId.current !== null) {
          hoveredId.current = null
          useMapStore.getState().setHovered(null)
        }
        if (cursor.current !== 'grab') {
          cursor.current = 'grab'
          el.style.cursor = 'grab'
        }
        return
      }
      const sys = pick(pointer.current.x, pointer.current.y)
      const id = sys ? sys.id : null
      if (id !== hoveredId.current) {
        hoveredId.current = id
        useMapStore.getState().setHovered(sys)
      }
      const want = sys ? 'pointer' : 'grab'
      if (cursor.current !== want) {
        cursor.current = want
        el.style.cursor = want
      }
    }

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointerleave', onPointerLeave)
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      frameHover.current = null
    }
  }, [gl, camera, size, controls, systems])

  // Inspect fly-to + hover detection + idle auto-rotation, all bounded to once
  // per frame.
  useFrame((_, delta) => {
    frameHover.current?.()
    if (!controls) return

    // A new fly request starts an animation toward the system, ending in the
    // same default framing Space uses — just centred on that system.
    const f = fly.current
    if (flyRef.request !== f.handled && flyRef.target) {
      f.handled = flyRef.request
      f.sp.copy(camera.position)
      f.st.copy(controls.target)
      f.et.set(flyRef.target[0], flyRef.target[1], flyRef.target[2])
      const [ox, oy, oz] = orbitPosition(
        CAMERA_DEFAULTS.yaw,
        CAMERA_DEFAULTS.pitch,
        CAMERA_DEFAULTS.distance,
      )
      f.ep.set(f.et.x + ox, f.et.y + oy, f.et.z + oz)
      f.active = true
      f.t = 0
    }
    if (f.active) {
      f.t = Math.min(1, f.t + delta / FLY_DURATION)
      const e = smooth(f.t)
      camera.position.lerpVectors(f.sp, f.ep, e)
      controls.target.lerpVectors(f.st, f.et, e)
      controls.autoRotate = false
      controls.update()
      lastInteract.current = performance.now() // keep idle drift suppressed
      if (f.t >= 1) f.active = false
      return
    }

    const idle = !drag.current && performance.now() - lastInteract.current > IDLE_MS
    controls.autoRotate = idle
    // Slow the drift right down at galaxy scale (a survey-rate spin is dizzying
    // when the whole galaxy is in frame).
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED * (1 - 0.85 * lodRef.t)
  })

  return null
}
