import { Billboard } from '@react-three/drei'
import { useMapStore } from '../store/mapStore'

/**
 * A light hover highlight for whichever system the pointer is over (local or
 * field): a single billboarded ring. Suppressed when the hovered system is the
 * one already wearing the selection FX, so the two don't stack.
 */
export function HoverFX() {
  const hovered = useMapStore((s) => s.hovered)
  const selected = useMapStore((s) => s.selected)
  const panelOpen = useMapStore((s) => s.panelOpen)

  if (!hovered) return null
  if (panelOpen && hovered.id === selected.id) return null

  return (
    <group position={hovered.position}>
      <Billboard>
        <mesh>
          <ringGeometry args={[0.03, 0.04, 40]} />
          <meshBasicMaterial color="#dce8ff" transparent opacity={0.85} toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  )
}
