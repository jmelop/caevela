import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
} from 'three'
import { GALAXY_CENTER, generateGalaxyHaze } from '../domain/galaxy'
import { softCircleTexture } from './radialTexture'
import { lodRef } from './lod'

/**
 * The warm background haze, as camera-facing billboards (re-oriented each frame)
 * so the NMS-style surround reads as volume from any angle. Fades in with the
 * galaxy LOD, like the disk gas.
 */
export function GalaxyHaze() {
  const camera = useThree((s) => s.camera)
  const data = useMemo(() => generateGalaxyHaze(), [])
  const dummy = useMemo(() => new Object3D(), [])

  const mesh = useMemo(() => {
    const geometry = new PlaneGeometry(1, 1)
    const material = new MeshBasicMaterial({
      map: softCircleTexture(),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      toneMapped: false,
    })
    const instanced = new InstancedMesh(geometry, material, data.length)
    const color = new Color()
    for (let i = 0; i < data.length; i++) {
      const c = data[i]
      color.setRGB(
        (c.color[0] / 255) * c.opacity,
        (c.color[1] / 255) * c.opacity,
        (c.color[2] / 255) * c.opacity,
      )
      instanced.setColorAt(i, color)
    }
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
    return instanced
  }, [data])

  useEffect(
    () => () => {
      mesh.geometry.dispose()
      ;(mesh.material as MeshBasicMaterial).dispose()
    },
    [mesh],
  )

  useFrame(() => {
    ;(mesh.material as MeshBasicMaterial).opacity = lodRef.t
    for (let i = 0; i < data.length; i++) {
      const c = data[i]
      dummy.position.set(
        GALAXY_CENTER[0] + c.position[0],
        GALAXY_CENTER[1] + c.position[1],
        GALAXY_CENTER[2] + c.position[2],
      )
      dummy.quaternion.copy(camera.quaternion) // face the camera
      dummy.scale.setScalar(c.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return <primitive object={mesh} />
}
