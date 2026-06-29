/**
 * A mutable bridge so the DOM panel (outside the Canvas) can ask the camera to
 * fly to a system. The panel bumps `request` and sets `target`; the camera
 * controller (inside the Canvas) animates toward it on the next frames. Same
 * out-of-React pattern as lodRef / fieldRef.
 */
export const flyRef: {
  request: number // bumped on each "fly there" request
  target: [number, number, number] | null // world position to approach
} = {
  request: 0,
  target: null,
}
