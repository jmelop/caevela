import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3 } from 'three'
import type { GalaxySource } from '../domain/GalaxySource'
import { useMapStore } from '../store/mapStore'
import { SceneBackground } from './SceneBackground'
import { Starfield } from './Starfield'
import { GalaxyHaze } from './GalaxyHaze'
import { GalaxyGas } from './GalaxyGas'
import { GalaxyDisk } from './GalaxyDisk'
import { Nebula } from './Nebula'
import { DustField } from './DustField'
import { SystemNodes } from './SystemNodes'
import { SystemField } from './SystemField'
import { SelectionFX } from './SelectionFX'
import { HoverFX } from './HoverFX'
import { SelectionController } from './SelectionController'
import { CameraBridge } from './CameraBridge'
import { GalaxyLOD } from './GalaxyLOD'
import { PostFX } from './PostFX'
import {
  CAMERA_DEFAULTS,
  CAMERA_FOV,
  DISTANCE_MAX,
  DISTANCE_MIN,
  POLAR_MAX,
  POLAR_MIN,
  orbitPosition,
} from './cameraRig'

/**
 * Free Explore mode unlocks panning so the camera can move freely around the
 * galaxy (drag the target with right-drag / two-finger). Destination mode keeps
 * the orbit pinned to the survey for picking a target star.
 */
function NavModeControls() {
  const mode = useMapStore((s) => s.mode)
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as
    | { enablePan: boolean; target: Vector3; update: () => void }
    | null
  useEffect(() => {
    if (!controls) return
    controls.enablePan = mode === 'explore'
    if (mode === 'destination') {
      // Switching back to Destination snaps the camera home to the survey
      // (default framing, TRAPPIST-1 centred at the origin).
      const [x, y, z] = orbitPosition(
        CAMERA_DEFAULTS.yaw,
        CAMERA_DEFAULTS.pitch,
        CAMERA_DEFAULTS.distance,
      )
      camera.position.set(x, y, z)
      controls.target.set(0, 0, 0)
      controls.update()
    }
  }, [mode, controls, camera])
  return null
}

const FLY_FORWARD = new Vector3()
const FLY_RIGHT = new Vector3()
const FLY_UP = new Vector3(0, 1, 0)
const FLY_MOVE = new Vector3()

/**
 * WASD flight in Free Explore mode: W/S fly along the view direction, A/D strafe,
 * Q/E lift up/down. Translates camera + target together (a true move through
 * space, leaving the orbit radius — and so the LOD — unchanged). Speed scales
 * with zoom distance so it feels right from survey scale out to galaxy scale.
 */
function KeyboardFly() {
  const mode = useMapStore((s) => s.mode)
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as { target: Vector3 } | null
  const keys = useRef<Record<string, boolean>>({})

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }
    const clear = () => {
      keys.current = {}
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])

  useFrame((_, delta) => {
    if (mode !== 'explore' || !controls) return
    const k = keys.current
    const fwd = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0)
    const strafe = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0)
    const lift = (k.KeyE ? 1 : 0) - (k.KeyQ ? 1 : 0)
    if (!fwd && !strafe && !lift) return

    const target = controls.target
    const distance = camera.position.distanceTo(target)
    const speed = Math.max(1.2, distance * 0.35) * Math.min(delta, 0.05)

    FLY_FORWARD.copy(target).sub(camera.position).normalize()
    FLY_RIGHT.setFromMatrixColumn(camera.matrixWorld, 0).normalize()
    FLY_MOVE.set(0, 0, 0)
      .addScaledVector(FLY_FORWARD, fwd)
      .addScaledVector(FLY_RIGHT, strafe)
      .addScaledVector(FLY_UP, lift)
    if (FLY_MOVE.lengthSq() === 0) return
    FLY_MOVE.normalize().multiplyScalar(speed)
    camera.position.add(FLY_MOVE)
    target.add(FLY_MOVE)
  })

  return null
}

export function GalaxyCanvas({ source }: { source: GalaxySource }) {
  const systems = source.getSystems()
  const field = source.getFieldSystems()
  const dust = source.getDust()
  const cameraPosition = orbitPosition(
    CAMERA_DEFAULTS.yaw,
    CAMERA_DEFAULTS.pitch,
    CAMERA_DEFAULTS.distance,
  )

  return (
    <Canvas
      flat // NoToneMapping — keep colours literal, matching the 2D prototype.
      dpr={[1, 2]}
      gl={{ antialias: true }}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 400, position: cameraPosition }}
    >
      <SceneBackground />
      <Starfield />
      <GalaxyHaze />
      <GalaxyGas />
      <GalaxyDisk />
      <Nebula />
      <DustField dust={dust} />
      <SystemField systems={field} />
      <SystemNodes systems={systems} />
      <SelectionFX />
      <HoverFX />
      <SelectionController systems={systems} />
      <CameraBridge />
      <GalaxyLOD />
      <NavModeControls />
      <KeyboardFly />
      <OrbitControls
        makeDefault
        enablePan={false}
        screenSpacePanning
        panSpeed={1.2}
        enableDamping
        dampingFactor={0.08}
        minDistance={DISTANCE_MIN}
        maxDistance={DISTANCE_MAX}
        minPolarAngle={POLAR_MIN}
        maxPolarAngle={POLAR_MAX}
      />
      <PostFX />
    </Canvas>
  )
}
