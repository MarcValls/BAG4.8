import { useEffect, useMemo, useState } from 'react'

const INSPECTOR_MODES = [
  { id: 'evidence', label: 'Evidencia' },
  { id: 'contract', label: 'Contrato' },
  { id: 'runtime', label: 'Runtime' },
  { id: 'nodes', label: 'Nodos' },
]

function cycleIndex(length, current, delta) {
  if (!length) return 0
  return (current + delta + length) % length
}

function Metric({ label, value, accent }) {
  return (
    <div className="inspector-metric">
      <span>{label}</span>
      <b className={accent ? `metric-${accent}` : ''}>{value}</b>
    </div>
  )
}

function ClaimsList({ claims }) {
  if (!claims?.length) return null
  return (
    <ul className="inspector-claims">
      {claims.map((claim, index) => (
        <li key={`${claim.text}-${index}`} className={claim.ok ? 'is-ok' : 'is-ko'}>
          <span className="claim-toggle" aria-hidden="true">{claim.ok ? '✓' : '○'}</span>
          <div>
            <div className="claim-text">{claim.text}</div>
            <div className="claim-proof">prueba: {claim.proof || '—'}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function RuntimePanel({ runtime }) {
  if (!runtime) return null
  const session = runtime.session || {}
  const simulation = runtime.simulation || {}
  const catalog = runtime.catalog || {}
  const measure = session.context_measure || {}
  const budget = measure.budget || {}
  const benchmark = session.context_benchmark || {}
  const certification = session.context_certification || {}
  return (
    <div className="inspector-runtime">
      <strong>Runtime en vivo</strong>
      <Metric label="Provider" value={session.provider || '—'} />
      <Metric label="Modelo" value={session.model || '—'} />
      <Metric label="Framework" value={session.framework_root || '—'} />
      <Metric label="Project" value={session.project_root || '—'} />
      <Metric label="Workspace" value={session.workspace_state_root || '—'} />
      <Metric label="Scope" value={session.workspace_scope_root || '—'} />
      <Metric label="Workspace ID" value={session.workspace_id || '—'} />
      <Metric label="Binding" value={session.binding_confirmed ? 'Contexto vinculado' : 'Contexto pendiente'} accent={session.binding_confirmed ? 'ok' : 'warn'} />
      <Metric label="Contexto" value={budget.alert_level ? `${budget.alert_level} · ${Math.round((budget.usage_fraction || 0) * 100)}%` : '—'} accent={budget.alert_level === 'red' ? 'warn' : budget.alert_level === 'orange' || budget.alert_level === 'yellow' ? 'warn' : 'muted'} />
      <Metric label="Disponible" value={budget.available_tokens != null ? `${budget.available_tokens} tok` : '—'} />
      <Metric label="Benchmark" value={benchmark.iterations ? `${benchmark.iterations}× · ${benchmark.elapsed_ms?.avg ?? '—'} ms` : '—'} />
      <Metric label="Certificación" value={certification.status || '—'} accent={certification.status === 'CERTIFIED' ? 'ok' : certification.status === 'NO_CERTIFIED' ? 'warn' : 'muted'} />
      <Metric label="BAGO version" value={session.bago_version || 'desconocida'} />
      <Metric label="Simulación" value={simulation.mode || 'off'} accent={simulation.mode && simulation.mode !== 'off' ? 'warn' : 'muted'} />
      <Metric label="Catálogo" value={catalog.mode || 'off'} />
    </div>
  )
}

export default function ManagerInspector({ pipeline, inspector, kit, onClose }) {
  const [mode, setMode] = useState('evidence')
  const [depth, setDepth] = useState(72)
  const [nodeIndex, setNodeIndex] = useState(0)

  useEffect(() => {
    inspector.refreshRuntime()
  }, [inspector])

  const { active, metrics, nodes } = pipeline
  const live = metrics[active.id] || {}
  const contract = active.contract || {}
  const selectedNode = nodes[nodeIndex] || active
  const claimLimit = Math.max(1, Math.round((depth / 100) * Math.max(inspector.evidence.claims?.length || 0, 1)))
  const visibleClaims = inspector.evidence.claims?.slice(0, claimLimit) || []
  const modeLabel = INSPECTOR_MODES.find((entry) => entry.id === mode)?.label || mode
  const readyState = inspector.evidence.state === 'VALIDADA' ? 'ready' : inspector.evidence.tests?.failed ? 'warn' : 'loading'
  const nodeCount = nodes.length || 0
  const nodeTitle = selectedNode?.name || active.name
  const nodeSubtitle = selectedNode?.subtitle || active.subtitle
  const nodeMetric = selectedNode?.metric || active.metric || {}

  const risks = useMemo(() => {
    const map = { bajo: 'ok', medio: 'warn', mínimo: 'muted' }
    return map[live.riesgo || active.metric?.riesgo] || 'muted'
  }, [live, active])

  if (!inspector.open) return null

  return (
    <aside className="manager-inspector" aria-label="Inspector de conversación">
      <header className="inspector-head">
        <div>
          <strong>{nodeTitle}</strong>
          <p>{nodeSubtitle}</p>
        </div>
        <button type="button" className="inspector-close" onClick={onClose} aria-label="Cerrar inspector">✕</button>
      </header>

      <section className="inspector-rack">
        <div className="inspector-rack-top">
          <span className={`inspector-led state-${readyState}`} aria-hidden="true" />
          <div className="inspector-rack-copy">
            <strong>{modeLabel}</strong>
            <span>{kit.installation?.label || 'desconocida'} · {kit.pipeline?.label || 'sin pipeline'} · {nodeCount} nodos</span>
          </div>
          <div className="inspector-rack-controls">
            <button type="button" className="ui-button ui-button--compact ui-button--ghost inspector-stepper" onClick={() => setMode((current) => INSPECTOR_MODES[cycleIndex(INSPECTOR_MODES.length, Math.max(0, INSPECTOR_MODES.findIndex((entry) => entry.id === current)), -1)]?.id || current)} aria-label="Modo anterior">
              ‹
            </button>
            <select className="inspector-select" value={mode} onChange={(event) => setMode(event.target.value)} aria-label="Modo del inspector">
              {INSPECTOR_MODES.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.label}</option>
              ))}
            </select>
            <button type="button" className="ui-button ui-button--compact ui-button--ghost inspector-stepper" onClick={() => setMode((current) => INSPECTOR_MODES[cycleIndex(INSPECTOR_MODES.length, Math.max(0, INSPECTOR_MODES.findIndex((entry) => entry.id === current)), 1)]?.id || current)} aria-label="Modo siguiente">
              ›
            </button>
          </div>
        </div>
        <div className="inspector-rack-bottom">
          <span className="inspector-rack-label">Claims {visibleClaims.length}/{inspector.evidence.claims?.length || 0}</span>
          <input
            className="inspector-rack-range"
            type="range"
            min="0"
            max="100"
            step="1"
            value={depth}
            onChange={(event) => setDepth(Number(event.target.value))}
            aria-label="Profundidad del inspector"
          />
          <span className="inspector-rack-value">{depth}%</span>
        </div>
      </section>

      {mode === 'evidence' ? (
        <section className="inspector-section">
          <h4>Estado de evidencia</h4>
          <Metric label="Validación" value={inspector.evidence.state} accent={inspector.evidence.state === 'VALIDADA' ? 'ok' : 'warn'} />
          <Metric label="Tests" value={`${inspector.evidence.tests?.passed || 0} ok · ${inspector.evidence.tests?.failed || 0} ko`} accent={(inspector.evidence.tests?.failed || 0) === 0 ? 'ok' : 'warn'} />
          <Metric label="Subtests" value={`${inspector.evidence.subtests?.passed || 0} ok`} />
          <Metric label="Duración" value={inspector.evidence.duration || '—'} />
          <h4>Claims verificables</h4>
          <ClaimsList claims={visibleClaims} />
        </section>
      ) : null}

      {mode === 'contract' ? (
        <section className="inspector-section">
          <h4>Contrato del nodo</h4>
          <Metric label="Instalación" value={kit.installation?.label || 'desconocida'} />
          <Metric label="Pipeline" value={kit.pipeline?.label || 'sin pipeline'} />
          <Metric label="Modo" value={live.modo || nodeMetric.modo || '—'} />
          <Metric label="Riesgo" value={live.riesgo || nodeMetric.riesgo || 'bajo'} accent={risks} />
          <Metric label="Entrada" value={contract.in || '—'} />
          <Metric label="Salida" value={contract.out || '—'} />
          <section className="inspector-rec inspector-rec--rack">
            <strong>Recomendación</strong>
            <p>
              Mantén el chat como centro, usa la barra superior como equipamiento de la sesión y
              reserva el inspector para auditar cada nodo antes de aplicarlo.
            </p>
          </section>
        </section>
      ) : null}

      {mode === 'runtime' ? (
        <section className="inspector-section">
          <h4>Vínculo de contexto</h4>
          <Metric label="Framework" value={inspector.runtime?.session?.framework_root || '—'} />
          <Metric label="Project" value={inspector.runtime?.session?.project_root || '—'} />
          <Metric label="Workspace" value={inspector.runtime?.session?.workspace_state_root || '—'} />
          <Metric label="Scope" value={inspector.runtime?.session?.workspace_scope_root || '—'} />
          <Metric label="Workspace ID" value={inspector.runtime?.session?.workspace_id || '—'} />
          <Metric label="Repo" value={inspector.runtime?.session?.repo_branch || inspector.runtime?.session?.repo_root || '—'} />
          <Metric label="Binding" value={inspector.runtime?.session?.binding_confirmed ? 'Contexto vinculado' : 'Contexto pendiente'} accent={inspector.runtime?.session?.binding_confirmed ? 'ok' : 'warn'} />
          <RuntimePanel runtime={inspector.runtime} />
        </section>
      ) : null}

      {mode === 'nodes' ? (
        <section className="inspector-section">
          <h4>Vista global</h4>
          <div className="inspector-rack inspector-rack--nodes">
            <button type="button" className="ui-button ui-button--compact ui-button--ghost inspector-stepper" onClick={() => setNodeIndex((current) => cycleIndex(nodes.length, current, -1))} aria-label="Nodo anterior">
              ‹
            </button>
            <span className="inspector-node-readout">{nodeTitle}</span>
            <button type="button" className="ui-button ui-button--compact ui-button--ghost inspector-stepper" onClick={() => setNodeIndex((current) => cycleIndex(nodes.length, current, 1))} aria-label="Nodo siguiente">
              ›
            </button>
          </div>
          <div className="inspector-nodes">
            {nodes.map((node, index) => (
              <button
                key={node.id}
                type="button"
                className={`inspector-node ${node.id === selectedNode.id ? 'is-active' : ''}`}
                onClick={() => {
                  pipeline.select(node.id)
                  setNodeIndex(index)
                }}
              >
                {node.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  )
}
