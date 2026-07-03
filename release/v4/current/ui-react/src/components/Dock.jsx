import { useEffect, useState } from 'react'
import { chatApi } from '../api'

function visibleCount(total, focus, minimum = 1) {
  return Math.max(minimum, Math.min(total, Math.ceil((focus / 100) * total)))
}

function PipelineStep({ node, isActive, onSelect, onAdvance }) {
  return (
    <div className={`dock-step ${isActive ? 'is-active' : ''}`}>
      <button type="button" className="dock-step-node" onClick={onSelect}>
        <span className="dock-step-num">{node.name}</span>
        <span className="dock-step-sub">{node.subtitle}</span>
      </button>
      {isActive && (
        <button type="button" className="dock-step-advance" onClick={onAdvance} title="Avanzar">
          →
        </button>
      )}
    </div>
  )
}

function StepConfig({ node, models, onAssign }) {
  const [provider, setProvider] = useState(node.assignedProvider || '')
  const [model, setModel] = useState(node.assignedModel || '')

  useEffect(() => {
    setProvider(node.assignedProvider || '')
    setModel(node.assignedModel || '')
  }, [node.id])

  const availableModels = models.filter((m) => !provider || m.provider === provider)

  function handleChange(field, value) {
    if (field === 'provider') {
      setProvider(value)
      setModel('')
      onAssign(node.id, value, '')
    } else {
      setModel(value)
      onAssign(node.id, provider, value)
    }
  }

  return (
    <div className="dock-step-config">
      <div className="dock-config-row">
        <label className="dock-config-label">Provider</label>
        <select
          className="dock-config-select"
          value={provider}
          onChange={(e) => handleChange('provider', e.target.value)}
        >
          <option value="">Auto</option>
          {[...new Set(models.map((m) => m.provider))].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="dock-config-row">
        <label className="dock-config-label">Modelo</label>
        <select
          className="dock-config-select"
          value={model}
          onChange={(e) => handleChange('model', e.target.value)}
          disabled={!provider}
        >
          <option value="">Auto</option>
          {availableModels.map((m) => (
            <option key={m.id} value={m.id}>{m.id}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function Dock({ pipeline, models, onAssignStep, compact }) {
  const [open, setOpen] = useState(true)
  const [activeStepId, setActiveStepId] = useState(pipeline?.active?.id || null)
  const [allModels, setAllModels] = useState(models || [])
  const [mode, setMode] = useState('sequence')
  const [focus, setFocus] = useState(80)

  useEffect(() => {
    if (!models || models.length) {
      setAllModels(models || [])
    } else {
      chatApi.getModels('ollama-local').then((d) => setAllModels(d.items || [])).catch(() => {})
    }
  }, [models])

  if (!pipeline) return null
  const { nodes, active, select, advance } = pipeline
  const activeNode = nodes.find((node) => node.id === activeStepId) || active
  const visibleNodes = mode === 'active' ? [activeNode] : nodes.slice(0, visibleCount(nodes.length, focus, 1))
  const readyState = active.id === nodes[nodes.length - 1]?.id ? 'ready' : 'loading'

  return (
    <section className={`dock ${open ? 'is-open' : 'is-closed'} is-${mode} ${compact ? 'is-compact' : ''}`} aria-label="Pipeline Dock">
      <header className="dock-head">
        <div className="dock-title">
          <strong>Pipeline</strong>
          <span>{nodes.length} pasos · {mode}</span>
        </div>
        <div className="dock-rack">
          <span className={`dock-led state-${readyState}`} aria-hidden="true" />
          <select className="dock-mode-select" value={mode} onChange={(event) => setMode(event.target.value)} aria-label="Modo del dock">
            <option value="sequence">Secuencia</option>
            <option value="active">Activo</option>
            <option value="assign">Asignación</option>
          </select>
          <input
            className="dock-range"
            type="range"
            min="25"
            max="100"
            step="5"
            value={focus}
            onChange={(event) => setFocus(Number(event.target.value))}
            aria-label="Profundidad del dock"
          />
          <span className="dock-range-value">{focus}%</span>
        </div>
        <div className="dock-actions">
          <button
            type="button"
            className="dock-btn"
            onClick={() => { advance(); setOpen(true) }}
            disabled={active.id === nodes[nodes.length - 1]?.id}
          >
            ⇥ Avanzar
          </button>
          <button
            type="button"
            className="dock-btn"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </header>

      {open && (
        <div className="dock-body">
          <div className="dock-summary">
            <span>activo: {activeNode?.name || active.name}</span>
            <span>visible: {visibleNodes.length}/{nodes.length}</span>
            <span>provider: {activeNode?.assignedProvider || 'auto'}</span>
            <span>model: {activeNode?.assignedModel || 'auto'}</span>
          </div>

          {(mode === 'sequence' || mode === 'assign') && (
            <div className="dock-steps" role="list">
              {visibleNodes.map((node, index) => (
                <div key={node.id} className="dock-step-row" role="listitem">
                  <PipelineStep
                    node={node}
                    isActive={node.id === active.id}
                    onSelect={() => {
                      select(node.id)
                      setActiveStepId(node.id)
                    }}
                    onAdvance={() => advance()}
                  />
                  {index < visibleNodes.length - 1 && <span className="dock-arrow" aria-hidden="true">↓</span>}
                </div>
              ))}
            </div>
          )}

          {(mode === 'active' || mode === 'assign') && activeNode && (
            <div className="dock-sequencer">
              <div className="dock-sequencer-title">
                Configurar paso: <strong>{activeNode.name}</strong>
              </div>
              <StepConfig
                node={{ ...activeNode, assignedProvider: activeNode.assignedProvider, assignedModel: activeNode.assignedModel }}
                models={allModels}
                onAssign={(stepId, prov, mdl) => {
                  onAssignStep?.(stepId, prov, mdl)
                }}
              />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
