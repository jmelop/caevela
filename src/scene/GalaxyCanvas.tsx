import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { GalaxySource } from '../domain/GalaxySource'
import { SceneBackground } from './SceneBackground'
import { Starfield } from './Starfield'
import { GalaxyGas } from './GalaxyGas'
import { GalaxyDisk } from './GalaxyDisk'
import { Nebula } from './Nebula'
import { DustField } from './DustField'
import { SystemNodes } from './SystemNodes'
import { SelectionFX } from './SelectionFX'
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

export function GalaxyCanvas({ source }: { source: GalaxySource }) {
  const systems = source.getSystems()
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
      <GalaxyGas />
      <GalaxyDisk />
      <Nebula />
      <DustField dust={dust} />
      <SystemNodes systems={systems} />
      <SelectionFX systems={systems} />
      <SelectionController systems={systems} />
      <CameraBridge />
      <GalaxyLOD />
      <OrbitControls
        makeDefault
        enablePan={false}
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
