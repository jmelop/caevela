import type { FieldSystem } from '../domain/proceduralSystems'

/**
 * A mutable bridge to the dense field's picking data, mirroring the lodRef /
 * viewRef pattern (state that lives outside React to avoid per-frame churn).
 *
 * SystemField publishes a flat positions buffer + the systems array here on
 * mount; SelectionController reads them to screen-space hit-test all instances
 * in one allocation-free pass — so every field system is selectable without a
 * per-instance mesh raycast.
 */
export const fieldRef: {
  positions: Float32Array | null // n*3 world coords, index i ↔ systems[i]
  systems: FieldSystem[]
} = {
  positions: null,
  systems: [],
}
