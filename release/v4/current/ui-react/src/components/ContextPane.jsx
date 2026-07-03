import { useEffect, useState } from 'react'
import { chatApi } from '../api'

const VIEWS = [
  { id: 'routes', label: 'Rutas', icon: '⊕' },
  { id: 'memory', label: 'Memoria', icon: '◇' },
  { id: 'schedule', label: 'Agenda', icon: '◷' },
  { id: 'subagents', label: 'Agentes', icon: '◐' },
  { id: 'providers', label: 'Providers', icon: '▣' },
  { id: 'files', label: 'Archivos', icon: '☰' },
  { id: 'router', label: 'Router', icon: '↻' },
  { id: 'simulation', label: 'Simul', icon: '◌' },
]

function cycleIndex(length, current, delta) {
  if (!length) return 0
  return (current + delta + length) % length
}

function visibleCount(total, detail, minimum = 4) {
  return Math.max(minimum, Math.min(total, Math.ceil((detail / 100) * total)))
}

function ContextRack({ session, activeView, detail, onDetail, onPrev, onNext, onSelectView }) {
  const binding = session?.status?.binding_confirmed || session?.binding?.binding_confirmed
  const viewIndex = Math.max(0, VIEWS.findIndex((view) => view.id === activeView))
  const view = VIEWS[viewIndex] || VIEWS[0]
  return (
    <section className="context-pane-rack" aria-label="Controles del panel de contexto">
      <div className="context-pane-rack-top">
        <span className={`context-pane-led ${binding ? 'is-on' : ''}`} aria-hidden="true" />
        <div className="context-pane-rack-copy">
          <strong>{view.label}</strong>
          <span>
            {session?.status?.framework_root || session?.binding?.framework_root || 'sin framework'} ·{' '}
            {session?.status?.workspace_id || session?.binding?.workspace_id || 'sin id'}
          </span>
        </div>
        <div className="context-pane-rack-controls">
          <button type="button" className="ui-button ui-button--compact ui-button--ghost context-pane-stepper" onClick={onPrev} aria-label="Vista anterior">
            ‹
          </button>
          <select
            className="context-pane-select"
            value={activeView}
            onChange={(event) => onSelectView(event.target.value)}
            aria-label="Selector de vista"
          >
            {VIEWS.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.label}</option>
            ))}
          </select>
          <button type="button" className="ui-button ui-button--compact ui-button--ghost context-pane-stepper" onClick={onNext} aria-label="Vista siguiente">
            ›
          </button>
        </div>
      </div>
      <div className="context-pane-rack-bottom">
        <span className="context-pane-rack-label">Binding {binding ? 'on' : 'off'}</span>
        <input
          className="context-pane-range"
          type="range"
          min="25"
          max="100"
          step="5"
          value={detail}
          onChange={(event) => onDetail(Number(event.target.value))}
          aria-label="Profundidad del panel de contexto"
        />
        <span className="context-pane-rack-value">{detail}%</span>
      </div>
    </section>
  )
}

function RoutesView({ detail }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    chatApi.listRoutes().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="ctx-error">{error}</div>
  if (!data) return <div className="ctx-loading">Cargando rutas…</div>

  const routes = data.routes || data
  const arrayRoutes = Array.isArray(routes) ? routes : null
  const limit = visibleCount(arrayRoutes ? arrayRoutes.length : Object.keys(routes).length, detail, 4)
  const rows = arrayRoutes ? arrayRoutes.slice(0, limit) : Object.entries(routes).slice(0, limit)

  return (
    <div className="ctx-routes">
      <table className="ctx-table">
        <thead>
          <tr><th>Método</th><th>Ruta</th><th>Módulo</th><th>Handler</th></tr>
        </thead>
        <tbody>
          {arrayRoutes ? rows.map((r, i) => (
            <tr key={i}>
              <td className={`ctx-method ctx-method-${(r.method || 'GET').toLowerCase()}`}>{r.method || 'GET'}</td>
              <td>{r.path}</td>
              <td>{r.module || '—'}</td>
              <td>{r.handler || '—'}</td>
            </tr>
          )) : rows.map(([path, info]) => (
            <tr key={path}>
              <td className="ctx-method ctx-method-get">GET</td>
              <td>{path}</td>
              <td>{info.module || '—'}</td>
              <td>{info.handler || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(arrayRoutes ? arrayRoutes.length : Object.keys(routes).length) > limit ? (
        <div className="ctx-files-more">{(arrayRoutes ? arrayRoutes.length : Object.keys(routes).length) - limit} rutas más…</div>
      ) : null}
    </div>
  )
}

function MemoryView({ detail }) {
  const [scope, setScope] = useState('user')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    chatApi.listMemory(scope).then(setData).catch((e) => setError(e.message))
  }, [scope])

  return (
    <div className="ctx-memory">
      <div className="ctx-scope-tabs">
        <button type="button" className={scope === 'user' ? 'active' : ''} onClick={() => setScope('user')}>Usuario</button>
        <button type="button" className={scope === 'project' ? 'active' : ''} onClick={() => setScope('project')}>Proyecto</button>
      </div>
      {error && <div className="ctx-error">{error}</div>}
      {!data && !error && <div className="ctx-loading">Cargando memoria…</div>}
      {data?.entries && (
        <ul className="ctx-memory-list">
          {data.entries.slice(0, visibleCount(data.entries.length, detail, 3)).map((entry, i) => (
            <li key={i} className="ctx-memory-item">
              <span className="ctx-memory-name">{entry.name || entry.title || '—'}</span>
              <span className="ctx-memory-desc">{entry.description || ''}</span>
            </li>
          ))}
        </ul>
      )}
      {data?.entries?.length > visibleCount(data.entries.length, detail, 3) && (
        <div className="ctx-files-more">{data.entries.length - visibleCount(data.entries.length, detail, 3)} memorias más…</div>
      )}
      {data?.entries?.length === 0 && <div className="ctx-empty">Sin memorias registradas</div>}
    </div>
  )
}

function ScheduleView({ detail }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    chatApi.listSchedule().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="ctx-error">{error}</div>
  if (!data) return <div className="ctx-loading">Cargando agenda…</div>

  const jobs = data.jobs || data.schedule || []
  const limit = visibleCount(jobs.length, detail, 3)
  return (
    <div className="ctx-schedule">
      {jobs.length === 0 ? (
        <div className="ctx-empty">Sin tareas programadas</div>
      ) : (
        <ul className="ctx-schedule-list">
          {jobs.slice(0, limit).map((job, i) => (
            <li key={i} className="ctx-schedule-item">
              <span className="ctx-schedule-id">{job.id || job.name || `job-${i}`}</span>
              <span className="ctx-schedule-when">{job.cron || job.when || '—'}</span>
              <span className="ctx-schedule-prompt">{job.prompt || ''}</span>
            </li>
          ))}
        </ul>
      )}
      {jobs.length > limit && <div className="ctx-files-more">{jobs.length - limit} tareas más…</div>}
    </div>
  )
}

function SubagentsView({ detail }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    chatApi.listSubagents().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="ctx-error">{error}</div>
  if (!data) return <div className="ctx-loading">Cargando agentes…</div>

  const agents = data.agents || data.catalogue || []
  const limit = visibleCount(agents.length, detail, 3)
  return (
    <div className="ctx-subagents">
      {agents.length === 0 ? (
        <div className="ctx-empty">Sin subagentes registrados</div>
      ) : (
        <ul className="ctx-subagents-list">
          {agents.slice(0, limit).map((agent, i) => (
            <li key={i} className="ctx-subagent-item">
              <span className="ctx-subagent-name">{agent.name || agent.id || '—'}</span>
              <span className="ctx-subagent-desc">{agent.description || ''}</span>
            </li>
          ))}
        </ul>
      )}
      {agents.length > limit && <div className="ctx-files-more">{agents.length - limit} agentes más…</div>}
    </div>
  )
}

function ProvidersView({ detail }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    chatApi.listProviders().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="ctx-error">{error}</div>
  if (!data) return <div className="ctx-loading">Cargando providers…</div>

  const providers = data.providers || []
  const limit = visibleCount(providers.length, detail, 2)
  return (
    <div className="ctx-providers">
      <div className="ctx-providers-mode">Modo catálogo: {data.mode || 'all'}</div>
      <ul className="ctx-providers-list">
        {providers.slice(0, limit).map((p, i) => (
          <li key={i} className="ctx-provider-item">
            <span className={`ctx-provider-dot ${p.available ? 'on' : 'off'}`}>●</span>
            <span className="ctx-provider-name">{p.name || p.id || '—'}</span>
            {p.model_count != null && (
              <span className="ctx-provider-count">{p.model_count} modelos</span>
            )}
          </li>
        ))}
      </ul>
      {providers.length > limit && <div className="ctx-files-more">{providers.length - limit} providers más…</div>}
    </div>
  )
}

function RouterView({ detail }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    try {
      const d = await chatApi.listRouter()
      setData(d)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function toggle(key) {
    try {
      await chatApi.toggleRouterModel(key)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function setAuto(enabled) {
    try {
      await chatApi.setRouterAuto(enabled)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  if (error) return <div className="ctx-error">{error}</div>
  if (!data) return <div className="ctx-loading">Cargando router…</div>

  const entries = data.entries || data.models || []
  const auto = data.auto_switch ?? data.auto
  const limit = visibleCount(entries.length, detail, 3)

  return (
    <div className="ctx-router">
      <div className="ctx-router-header">
        <label className="ctx-router-auto">
          <input type="checkbox" checked={!!auto} onChange={(e) => setAuto(e.target.checked)} />
          Auto-switch
        </label>
        <button type="button" onClick={() => load()}>↻</button>
      </div>
      <ul className="ctx-router-list">
        {entries.slice(0, limit).map((entry, i) => (
          <li key={i} className={`ctx-router-item ${entry.available ? '' : 'unavailable'} ${entry.selected ? 'selected' : ''}`}>
            <button
              type="button"
              className="ctx-router-toggle"
              onClick={() => toggle(entry.key || entry.model_id || entry.id)}
            >
              {entry.selected ? '◉' : entry.available ? '○' : '✕'}
            </button>
            <span className="ctx-router-model">{entry.wire_name || entry.model_id || entry.model || '—'}</span>
            <span className="ctx-router-provider">{entry.provider}</span>
            {entry.best_for && <span className="ctx-router-best">{entry.best_for}</span>}
          </li>
        ))}
      </ul>
      {entries.length > limit && <div className="ctx-files-more">{entries.length - limit} modelos más…</div>}
    </div>
  )
}

function SimulationView({ detail }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    chatApi.getSimulationStatus().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="ctx-error">{error}</div>
  if (!data) return <div className="ctx-loading">Cargando simulación…</div>

  return (
    <div className="ctx-simulation">
      <div className="ctx-sim-mode">Modo: <strong>{data.mode || 'shadow'}</strong></div>
      {data.events_count != null && (
        <div className="ctx-sim-stat">{data.events_count} eventos registrados</div>
      )}
      {data.last_event && (
        <div className="ctx-sim-last">{data.last_event}</div>
      )}
      <div className="ctx-sim-stat">Profundidad: {detail}%</div>
    </div>
  )
}

function FilesView({ detail }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    chatApi.getFilesList().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="ctx-error">{error}</div>
  if (!data) return <div className="ctx-loading">Cargando archivos…</div>

  const entries = data.entries || []
  const limit = Math.min(200, visibleCount(entries.length, detail, 20))
  return (
    <div className="ctx-files">
      <div className="ctx-files-base">{data.base_path || ''}</div>
      {entries.length === 0 ? (
        <div className="ctx-empty">Sin archivos en el workspace</div>
      ) : (
        <ul className="ctx-files-list">
          {entries.slice(0, limit).map((entry, i) => (
            <li key={i} className={`ctx-file-item ${entry.dir ? 'is-dir' : 'is-file'}`}>
              <span className="ctx-file-icon">{entry.dir ? '▸' : '·'}</span>
              <span className="ctx-file-name">{entry.name || entry.path || '—'}</span>
              {entry.size != null && <span className="ctx-file-size">{entry.size} B</span>}
            </li>
          ))}
        </ul>
      )}
      {entries.length > limit && (
        <div className="ctx-files-more">{entries.length - limit} archivos más…</div>
      )}
    </div>
  )
}

const VIEW_COMPONENTS = {
  routes: RoutesView,
  memory: MemoryView,
  schedule: ScheduleView,
  subagents: SubagentsView,
  providers: ProvidersView,
  files: FilesView,
  router: RouterView,
  simulation: SimulationView,
}

export default function ContextPane({ open, onClose }) {
  const [activeView, setActiveView] = useState('routes')
  const [detail, setDetail] = useState(75)
  const [session, setSession] = useState(null)
  const ActiveComponent = VIEW_COMPONENTS[activeView] || RoutesView

  useEffect(() => {
    if (!open) return
    chatApi.getSession().then(setSession).catch(() => setSession(null))
  }, [open])

  if (!open) return null

  const activeIndex = Math.max(0, VIEWS.findIndex((view) => view.id === activeView))

  return (
    <aside className="context-pane" role="complementary" aria-label="Panel de contexto">
      <div className="context-pane-status">
        <span className="context-pane-status-label">Binding</span>
        <strong>{session?.status?.binding_confirmed || session?.binding?.binding_confirmed ? 'Contexto vinculado' : 'Contexto pendiente'}</strong>
        <span>framework: {session?.status?.framework_root || session?.binding?.framework_root || 'sin framework'}</span>
        <span>project: {session?.status?.project_root || session?.binding?.project_root || 'sin proyecto'}</span>
        <span>workspace: {session?.status?.workspace_state_root || session?.binding?.workspace_state_root || 'sin workspace'}</span>
        <span>scope: {session?.status?.workspace_scope_root || session?.binding?.workspace_scope_root || 'sin scope'}</span>
        <span>id: {session?.status?.workspace_id || session?.binding?.workspace_id || 'sin id'}</span>
        <span>{session?.status?.repo_branch || session?.binding?.repo_branch || session?.status?.repo_root || session?.binding?.repo_root || 'sin repo'}</span>
        <span>
          {session?.status?.context_measure?.budget
            ? `ctx ${Math.round((session.status.context_measure.budget.usage_fraction || 0) * 100)}% · ${session.status.context_measure.budget.available_tokens ?? '—'} tok`
            : 'ctx sin medir'}
        </span>
        <span>
          {session?.status?.cognitive_benchmark?.score != null
            ? `cog ${Math.round((session.status.cognitive_benchmark.score || 0) * 100) / 100} · ${session.status.cognitive_benchmark.pass_count ?? 0}/${session.status.cognitive_benchmark.cases ?? 0}`
            : 'cog sin medir'}
        </span>
      </div>

      <ContextRack
        session={session}
        activeView={activeView}
        detail={detail}
        onDetail={setDetail}
        onPrev={() => setActiveView(VIEWS[cycleIndex(VIEWS.length, activeIndex, -1)]?.id || activeView)}
        onNext={() => setActiveView(VIEWS[cycleIndex(VIEWS.length, activeIndex, 1)]?.id || activeView)}
        onSelectView={setActiveView}
      />

      <div className="context-pane-tabs">
        {VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            className={`context-pane-tab ${activeView === view.id ? 'active' : ''}`}
            onClick={() => setActiveView(view.id)}
            title={view.label}
          >
            <span className="ctx-tab-icon">{view.icon}</span>
            <span className="ctx-tab-label">{view.label}</span>
          </button>
        ))}
        <button type="button" className="context-pane-close" onClick={onClose} title="Cerrar">
          ✕
        </button>
      </div>
      <div className="context-pane-body">
        <ActiveComponent detail={detail} />
      </div>
    </aside>
  )
}
