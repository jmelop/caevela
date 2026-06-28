/**
 * Star colour from a 0–1 temperature draw. Exact thresholds copied from the
 * prototype — the field's palette depends on these boundaries, do not retune.
 */
export function starColor(r: number): [number, number, number] {
  if (r < 0.1) return [180, 205, 255] // blue-white
  if (r < 0.45) return [255, 255, 255] // white
  if (r < 0.72) return [255, 243, 214] // warm white
  if (r < 0.88) return [255, 210, 150] // amber
  return [255, 150, 120] // red
}
