import type { Camera } from 'three'

/**
 * A mutable bridge from inside the Canvas to the DOM overlay layer (which can't
 * use useThree). CameraBridge keeps this current; the overlay's rAF loop reads
 * it to project world positions to screen pixels — same trick the prototype used.
 *
 * Projection is hand-rolled (reading the camera's matrices) rather than calling
 * three at runtime, so this eager module keeps `three` out of the entry chunk —
 * the whole 3D stack stays in the lazily-loaded GalaxyCanvas chunk.
 */
export const viewRef: { camera: Camera | null; width: number; height: number } = {
  camera: null,
  width: 0,
  height: 0,
}

export interface Projected {
  x: number
  y: number
  inFront: boolean
  /** View-space depth (distance in front of the camera). */
  depth: number
}

// Apply a column-major Matrix4 (its .elements) to the point (x,y,z,1).
function applyMat4(e: ArrayLike<number>, x: number, y: number, z: number) {
  return {
    x: e[0] * x + e[4] * y + e[8] * z + e[12],
    y: e[1] * x + e[5] * y + e[9] * z + e[13],
    z: e[2] * x + e[6] * y + e[10] * z + e[14],
    w: e[3] * x + e[7] * y + e[11] * z + e[15],
  }
}

/** Project a world position to screen pixels using the bridged camera. */
export function project(position: [number, number, number]): Projected | null {
  const cam = viewRef.camera
  if (!cam) return null
  const view = applyMat4(cam.matrixWorldInverse.elements, position[0], position[1], position[2])
  const clip = applyMat4(cam.projectionMatrix.elements, view.x, view.y, view.z)
  const w = clip.w || 1e-6
  return {
    x: ((clip.x / w) * 0.5 + 0.5) * viewRef.width,
    y: (-(clip.y / w) * 0.5 + 0.5) * viewRef.height,
    inFront: view.z < 0, // view-space looks down -z
    depth: -view.z,
  }
}

/** Current camera distance from the origin (the orbit target). */
export function cameraDistance(): number {
  const cam = viewRef.camera
  if (!cam) return 3.4
  const p = cam.position
  return Math.hypot(p.x, p.y, p.z)
}
