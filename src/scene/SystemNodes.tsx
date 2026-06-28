import { Billboard } from '@react-three/drei'
import type { StarSystem } from '../domain/types'
import { useMapStore } from '../store/mapStore'

/**
 * The catalogued, navigable nodes: a bright core plus a faint billboarded
 * "catalogued" ring. The selected node is hidden while the panel is open — the
 * DOM reticle (and, in Phase 4, the halo/pulse) takes its place there.
 *
 * 11 nodes → individual meshes are clearer than an InstancedMesh here; the
 * InstancedMesh path matters when GalaxySource swaps to a massive real catalogue.
 */
export function SystemNodes({ systems }: { systems: StarSystem[] }) {
  const selected = useMapStore((s) => s.selected)
  const panelOpen = useMapStore((s) => s.panelOpen)

  return (
    <group>
      {systems.map((system, index) => {
        if (panelOpen && system.id === selected.id) return null
        return (
          <group key={system.id} position={system.position} userData={{ index }}>
            <mesh>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshBasicMaterial color="#eef4ff" toneMapped={false} />
            </mesh>
            <Billboard>
              <mesh>
                <ringGeometry args={[0.04, 0.047, 48]} />
                <meshBasicMaterial
                  color="#afc8ee"
                  transparent
                  opacity={0.26}
                  toneMapped={false}
                />
              </mesh>
            </Billboard>
          </group>
        )
      })}
    </group>
  )
}
