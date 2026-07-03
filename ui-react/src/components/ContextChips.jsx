import { useEffect, useState } from 'react'
import { useToast } from './Toast'
import { readPersisted, writePersisted } from '../usePersisted'

const CONTRACT_PRESETS = [
  { id: 'registered-scripts', label: 'solo scripts registrados',  defaultOn: true },
  { id: 'dry-run-first',      label: 'dry-run primero',           defaultOn: true },
  { id: 'evidence-bundle',    label: 'evidence bundle por tarea', defaultOn: true },
  { id: 'audited-paths',      label: 'audita rutas prohibidas',   defaultOn: true },
  { id: 'append-only',        label: 'append-only en logs',       defaultOn: false },
  { id: 'manual-approval',    label: 'aprobación manual en apply', defaultOn: false },
]

const STORAGE_KEY = 'bago.context-chips.v1'

function initialSelected() {
  const persisted = readPersisted(STORAGE_KEY)
  if (persisted?.selected) return persisted.selected
  return new Set(CONTRACT_PRESETS.filter((p) => p.defaultOn).map((p) => p.id))
}

export default function ContextChips({ onChange }) {
  const { push } = useToast()
  const [selected, setSelected] = useState(initialSelected)

  useEffect(() => {
    writePersisted(STORAGE_KEY, { selected: [...selected] })
    if (onChange) onChange([...selected])
  }, [selected, onChange])

  function toggle(id) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
        push(`Contrato desactivado: ${CONTRACT_PRESETS.find((p) => p.id === id)?.label}`)
      } else {
        next.add(id)
        push(`Contrato activado: ${CONTRACT_PRESETS.find((p) => p.id === id)?.label}`)
      }
      return next
    })
  }

  return (
    <div className="context-strip" role="toolbar" aria-label="Contrato activo">
      <span className="context-strip-label">Contrato</span>
      {CONTRACT_PRESETS.map((preset) => {
        const active = selected.has(preset.id)
        return (
          <button
            key={preset.id}
            type="button"
            className={`context-chip ${active ? 'is-selected' : ''}`}
            onClick={() => toggle(preset.id)}
            aria-pressed={active}
          >
            {preset.label}
          </button>
        )
      })}
    </div>
  )
}
