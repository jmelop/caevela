import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { StarSystem } from '../domain/types'
import { useMapStore } from '../store/mapStore'
import { CAMERA_DEFAULTS, orbitPosition } from './cameraRig'
import { lodRef } from './lod'

const HIT_RADIUS_PX = 24
const DRAG_THRESHOLD_PX = 3
const IDLE_MS = 3500
const AUTO_ROTATE_SPEED = 0.9 // ≈ the prototype's 0.0016 rad/frame drift

type OrbitLike = {
  target: Vector3
  update: () => void
  autoRotate: boolean
  autoRotateSpeed: number
}

/**
 * All pointer/keyboard interaction that the prototype hand-rolled, mapped onto
 * the r3f camera: 24px screen-space hit-test selection (forgiving, unlike a raw
 * mesh raycast), drag<3px counts as a click, hover cursor, idle auto-rotation
 * after 3.5s, and Space to recenter. OrbitControls owns the actual orbit/zoom.
 */
export function SelectionController({ systems }: { systems: StarSystem[] }) {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null

  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const lastInteract = useRef(-Infinity)

  useEffect(() => {
    const el = gl.domElement
    const tmp = new Vector3()

    // Nearest catalogued node within HIT_RADIUS_PX of the pointer, in front of
    // the camera. Returns -1 if none qualifies.
    const hitTest = (clientX: number, clientY: number): number => {
      const rect = el.getBoundingClientRect()
      const mx = clientX - rect.left
      const my = clientY - rect.top
      let best = -1
      let bestDist = HIT_RADIUS_PX
      for (let i = 0; i < systems.length; i++) {
        const p = systems[i].position
        tmp.set(p[0], p[1], p[2])
        // Skip nodes behind the camera (view-space z must be negative).
        if (tmp.clone().applyMatrix4(camera.matrixWorldInverse).z >= 0) continue
        tmp.project(camera)
        const px = (tmp.x * 0.5 + 0.5) * size.width
        const py = (-tmp.y * 0.5 + 0.5) * size.height
        const dist = Math.hypot(px - mx, py - my)
        if (dist < bestDist) {
          bestDist = dist
          best = i
        }
      }
      return best
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
      el.style.cursor = 'grabbing'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (drag.current) {
        const dx = e.clientX - drag.current.x
        const dy = e.clientY - drag.current.y
        if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD_PX) drag.current.moved = true
        lastInteract.current = performance.now()
      } else {
        el.style.cursor = hitTest(e.clientX, e.clientY) >= 0 ? 'pointer' : 'grab'
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (drag.current && !drag.current.moved) {
        const i = hitTest(e.clientX, e.clientY)
        if (i >= 0) useMapStore.getState().select(i)
      }
      drag.current = null
      lastInteract.current = performance.now()
      el.style.cursor = hitTest(e.clientX, e.clientY) >= 0 ? 'pointer' : 'grab'
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
    el.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [gl, camera, size, controls, systems])

  // Idle auto-rotation: drift the camera after 3.5s of no interaction. drei's
  // OrbitControls calls update() each frame (damping on), so toggling the flag
  // is enough.
  useFrame(() => {
    if (!controls) return
    const idle =
      !drag.current && performance.now() - lastInteract.current > IDLE_MS
    controls.autoRotate = idle
    // Slow the drift right down at galaxy scale (a survey-rate spin is dizzying
    // when the whole galaxy is in frame).
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED * (1 - 0.85 * lodRef.t)
  })

  return null
}
