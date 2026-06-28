import { SampleSource } from './domain/GalaxySource'
import { DEFAULT_SELECTION, SAMPLE_SYSTEMS } from './domain/sampleSystems'

// Phase 0 placeholder — proves the domain layer wires up and compiles.
// No 3D render yet; the scene arrives with the feature work.
const source = new SampleSource()

export default function App() {
  const systems = source.getSystems()
  const dust = source.getDust()
  const selected = SAMPLE_SYSTEMS[DEFAULT_SELECTION]

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        letterSpacing: '0.04em',
      }}
    >
      <div style={{ color: '#ffb84d', letterSpacing: '0.4em', fontSize: 11 }}>MILKY WAY SURVEY</div>
      <div style={{ fontSize: 22, letterSpacing: '0.24em', color: '#d4dceb' }}>CAEVELA · PHASE 0</div>
      <div style={{ color: '#5d6b80', fontSize: 12 }}>
        {systems.length} catalogued systems · {dust.length} dust stars (seed locked)
      </div>
      <div style={{ color: '#8a98ab', fontSize: 12, marginTop: 8 }}>
        default selection → {selected?.name} ({selected?.id})
      </div>
    </main>
  )
}
