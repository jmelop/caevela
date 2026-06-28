import { useEffect, useMemo } from 'react'
import {
  AdditiveBlending,
  Color,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
} from 'three'
import type { FieldSystem } from '../domain/proceduralSystems'
import { fieldRef } from './fieldRef'

// Distance attenuation (world units, view-space depth): full detail near, fading
// to a floor far away so the dense field reads as "detail near, impostor far"
// without sub-pixel shimmer dominating at galaxy scale.
const NEAR_FADE = 5
const FAR_FADE = 95
const FAR_FLOOR = 0.34

/**
 * The dense, galaxy-wide navigable field rendered as ONE InstancedMesh (one draw
 * call). Each instance carries its spectral colour (instanceColor) and a base
 * size baked into the instance matrix. A depth-fade injected via onBeforeCompile
 * gives per-fragment distance LOD on the GPU — zero per-frame CPU cost, so this
 * scales to tens of thousands while CPU-throttled.
 *
 * Phase A is render-only: NO pointer/raycast, NO hover, NO labels. Phase B wires
 * interactivity on top once this is proven smooth.
 */
export function SystemField({ systems }: { systems: FieldSystem[] }) {
  const mesh = useMemo(() => {
    const n = systems.length
    const geometry = new IcosahedronGeometry(1, 1) // round enough once bloomed, 80 tris
    const material = new MeshBasicMaterial({
      toneMapped: false, // literal colours, matching the rest of the scene
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uNear = { value: NEAR_FADE }
      shader.uniforms.uFar = { value: FAR_FADE }
      shader.uniforms.uFloor = { value: FAR_FLOOR }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vViewDepth;')
        .replace(
          '#include <project_vertex>',
          '#include <project_vertex>\n  vViewDepth = -mvPosition.z;',
        )
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying float vViewDepth;\nuniform float uNear;\nuniform float uFar;\nuniform float uFloor;',
        )
        .replace(
          '#include <dithering_fragment>',
          '#include <dithering_fragment>\n  gl_FragColor.a *= mix(1.0, uFloor, smoothstep(uNear, uFar, vViewDepth));',
        )
    }

    const inst = new InstancedMesh(geometry, material, n)
    const m = new Matrix4()
    const c = new Color()
    const positions = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const s = systems[i]
      m.makeScale(s.renderSize, s.renderSize, s.renderSize)
      m.setPosition(s.position[0], s.position[1], s.position[2])
      inst.setMatrixAt(i, m)
      // setRGB in the (linear) working space, so values match the raw /255 colours
      // the other star layers feed straight into their shaders.
      c.setRGB(s.color[0] / 255, s.color[1] / 255, s.color[2] / 255)
      inst.setColorAt(i, c)
      positions[i * 3] = s.position[0]
      positions[i * 3 + 1] = s.position[1]
      positions[i * 3 + 2] = s.position[2]
    }
    // Publish a flat positions buffer for screen-space picking (Phase B).
    fieldRef.positions = positions
    fieldRef.systems = systems
    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true
    inst.computeBoundingSphere() // object-level frustum culling
    return inst
  }, [systems])

  useEffect(
    () => () => {
      fieldRef.positions = null
      fieldRef.systems = []
      mesh.geometry.dispose()
      ;(mesh.material as MeshBasicMaterial).dispose()
      mesh.dispose()
    },
    [mesh],
  )

  return <primitive object={mesh} />
}
