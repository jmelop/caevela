/** A soft additive nebula blob. */
export interface NebulaBlob {
  position: [number, number, number]
  radius: number
  color: [number, number, number] // 0–255 RGB
  alpha: number
}

/** Default nebula intensity multiplier (prototype default; range 0–2). */
export const DEFAULT_NEBULA_INTENSITY = 1.4

/**
 * Six additive radial blobs — copied literal from the prototype. The palette is
 * a cold cyan-green / blue-violet dominant with one warm blob over the core.
 */
export const NEBULA: NebulaBlob[] = [
  { position: [0.0, -0.1, 0.1], radius: 1.35, color: [36, 160, 128], alpha: 0.16 },
  { position: [0.4, -0.4, -0.3], radius: 1.05, color: [48, 124, 205], alpha: 0.11 },
  { position: [-0.55, 0.45, -0.35], radius: 0.95, color: [255, 224, 180], alpha: 0.22 }, // warm over the core
  { position: [0.5, 0.4, 0.3], radius: 1.05, color: [98, 86, 210], alpha: 0.1 },
  { position: [-0.3, 0.0, 0.5], radius: 0.9, color: [44, 190, 156], alpha: 0.12 },
  { position: [0.3, 0.2, -0.6], radius: 0.95, color: [50, 104, 178], alpha: 0.09 },
]
