import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
} from 'three'
import { GALAXY_CENTER, generateGalaxyClouds } from '../domain/galaxy'
import { softCircleTexture } from './radialTexture'
import { lodRef } from './lod'

/**
 * The galaxy's gas: soft additive quads lying flat in the disk plane (so the
 * disk reads as painterly nebula clouds when seen face-on). One InstancedMesh,
 * per-instance colour pre-multiplied by opacity (additive, so brightness scales).
 */
export function GalaxyGas() {
  const mesh = useMemo(() => {
    const clouds = generateGalaxyClouds()
    const geometry = new PlaneGeometry(1, 1)
    const material = new MeshBasicMaterial({
      map: softCircleTexture(),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      toneMapped: false,
    })
    const instanced = new InstancedMesh(geometry, material, clouds.length)

    const dummy = new Object3D()
    const color = new Color()
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i]
      dummy.position.set(c.position[0], c.position[1], c.position[2])
      dummy.rotation.set(-Math.PI / 2, 0, 0) // lie flat in the XZ plane
      dummy.scale.setScalar(c.scale)
      dummy.updateMatrix()
      instanced.setMatrixAt(i, dummy.matrix)
      // Pre-multiply colour by opacity for additive blending.
      color.setRGB(
        (c.color[0] / 255) * c.opacity,
        (c.color[1] / 255) * c.opacity,
        (c.color[2] / 255) * c.opacity,
      )
      instanced.setColorAt(i, color)
    }
    instanced.instanceMatrix.needsUpdate = true
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
    return instanced
  }, [])

  useEffect(
    () => () => {
      mesh.geometry.dispose()
      ;(mesh.material as MeshBasicMaterial).dispose()
    },
    [mesh],
  )

  // Fade in as the camera pulls out to galaxy scale (kills survey-view bleed).
  useFrame(() => {
    ;(mesh.material as MeshBasicMaterial).opacity = lodRef.t
  })

  return <primitive object={mesh} position={GALAXY_CENTER} />
}
