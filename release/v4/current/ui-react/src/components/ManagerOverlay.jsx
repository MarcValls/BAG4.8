import { useEffect, useState } from 'react'
import { useToast } from './Toast'
import { VIEW_LABELS } from '../viewLabels'

const OVERLAY_VIEWS = [
  { id: 'bago', label: 'Chat', hint: 'Volver a la conversación' },
  { id: 'installations', label: 'Instalaciones', hint: 'Versiones de BAGO activas' },
  { id: 'pieces', label: 'Piezas', hint: 'Componentes y parches' },
  { id: 'patch', label: 'Patch Bay', hint: 'Inyectar modificaciones' },
  { id: 'matrix', label: 'Matriz', hint: 'Compatibilidad cruzada' },
  { id: 'releases', label: 'Releases', hint: 'Versiones publicadas' },
  { id: 'jobs', label: 'Trabajos', hint: 'Tareas en curso' },
  { id: 'sessions', label: 'Sesiones', hint: 'Historial activo' },
  { id: 'system', label: 'Sistema', hint: 'Runtime y salud' },
  { id: 'health', label: 'Salud', hint: 'Diagnóstico' },
  { id: 'audit', label: 'Auditoría', hint: 'Trazas inmutables' },
]

function cycleIndex(length, current, delta) {
  if (!length) return 0
  return (current + delta + length) % length
}

export default function ManagerOverlay({ onClose, managerContext, kit, inspectorSummary }) {
  const [view, setView] = useState(managerContext?.view || 'bago')
  const [detail, setDetail] = useState(72)
  const [iframeUrl, setIframeUrl] = useState(null)
  const [iframeReady, setIframeReady] = useState(false)
  const [bridgeIssue, setBridgeIssue] = useState('')
  const { push } = useToast()

  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.bagoElectron : null
    let cancelled = false

    if (!api) {
      setIframeReady(true)
      return () => {
        cancelled = true
      }
    }

    if (typeof api.getManagerUrl !== 'function') {
      setBridgeIssue('Electron está presente, pero window.bagoElectron.getManagerUrl no existe.')
      setIframeReady(true)
      return () => {
        cancelled = true
      }
    }

    api.getManagerUrl()
      .then((url) => {
        if (cancelled) return
        if (url) {
          setIframeUrl(String(url))
          setBridgeIssue('')
        } else {
          setBridgeIssue('Electron respondió sin URL para el gestor.')
        }
      })
      .catch((error) => {
        if (cancelled) return
        setBridgeIssue(error?.message || 'No se pudo resolver la URL del gestor desde Electron.')
      })
      .finally(() => {
        if (!cancelled) setIframeReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (managerContext?.view) setView(managerContext.view)
  }, [managerContext?.view])

  const activeIndex = Math.max(0, OVERLAY_VIEWS.findIndex((entry) => entry.id === view))
  const activeView = OVERLAY_VIEWS[activeIndex] || OVERLAY_VIEWS[0]
  const readyLed = iframeReady && iframeUrl ? 'ready' : iframeReady ? 'warn' : 'loading'
  const hasBridgeIssue = Boolean(bridgeIssue)
  const claimRatio = `${inspectorSummary.claimsOk}/${inspectorSummary.claimsTotal}`
  const installLabel = kit.installation?.label || 'desconocida'
  const modelLabel = kit.model?.label || 'sin modelo'
  const pipelineLabel = kit.pipeline?.label || 'sin pipeline'
  const detailLabel = detail > 66 ? 'alta' : detail > 33 ? 'media' : 'baja'

  return (
    <aside className="manager-overlay" aria-label="Panel del Gestor">
      <header className="overlay-head">
        <div>
          <strong>Gestor</strong>
          <p>Vista activa: {VIEW_LABELS[view] || view}</p>
        </div>
        <button
          type="button"
          className="overlay-close"
          onClick={() => {
            onClose()
            push('Gestor colapsado — chat como pieza central')
          }}
          aria-label="Cerrar gestor"
        >
          ✕
        </button>
      </header>

      <section className="overlay-rack" aria-label="Controles del gestor">
        <div className="overlay-rack-top">
          <span className={`overlay-led state-${readyLed}`} aria-hidden="true" />
          <div className="overlay-rack-copy">
            <strong>{activeView.label}</strong>
            <span>{installLabel} · {modelLabel} · {pipelineLabel}</span>
          </div>
          <div className="overlay-rack-controls">
            <button
              type="button"
              className="ui-button ui-button--compact ui-button--ghost overlay-stepper"
              onClick={() => setView((current) => {
                const next = OVERLAY_VIEWS[cycleIndex(OVERLAY_VIEWS.length, Math.max(0, OVERLAY_VIEWS.findIndex((entry) => entry.id === current)), -1)]
                return next?.id || current
              })}
              aria-label="Vista anterior"
            >
              ‹
            </button>
            <select
              className="overlay-select"
              value={view}
              onChange={(event) => setView(event.target.value)}
              aria-label="Selector de vista"
            >
              {OVERLAY_VIEWS.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.label}</option>
              ))}
            </select>
            <button
              type="button"
              className="ui-button ui-button--compact ui-button--ghost overlay-stepper"
              onClick={() => setView((current) => {
                const next = OVERLAY_VIEWS[cycleIndex(OVERLAY_VIEWS.length, Math.max(0, OVERLAY_VIEWS.findIndex((entry) => entry.id === current)), 1)]
                return next?.id || current
              })}
              aria-label="Vista siguiente"
            >
              ›
            </button>
          </div>
        </div>
        <div className="overlay-rack-bottom">
          <span className="overlay-rack-label">Claims {claimRatio}</span>
          <input
            className="overlay-rack-range"
            type="range"
            min="0"
            max="100"
            step="1"
            value={detail}
            onChange={(event) => setDetail(Number(event.target.value))}
            aria-label="Profundidad del gestor"
          />
          <span className="overlay-rack-value">{detailLabel}</span>
        </div>
      </section>

      <nav className="overlay-tabs" aria-label="Vistas del Gestor">
        {OVERLAY_VIEWS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`overlay-tab ${entry.id === view ? 'is-active' : ''}`}
            onClick={() => {
              setView(entry.id)
              push(`Vista gestor: ${entry.label}`)
            }}
            aria-pressed={entry.id === view}
            title={entry.hint}
          >
            {entry.label}
          </button>
        ))}
      </nav>

      <div className="overlay-body">
        {hasBridgeIssue ? (
          <div className="overlay-placeholder">
            <div className="overlay-placeholder-mark" style={{ background: 'linear-gradient(135deg, var(--danger), var(--orange))' }}>!</div>
            <strong>Gestor no disponible desde Electron</strong>
            <p>{bridgeIssue}</p>
            <p>
              {installLabel} ({kit.installation?.version || 'sin versión'}) · {modelLabel} · pipeline {pipelineLabel}
            </p>
            <small>
              Esto no es un preview browser-only: la app encontró `window.bagoElectron`, pero el bridge necesario no está expuesto.
            </small>
          </div>
        ) : iframeReady && iframeUrl ? (
          <iframe
            key={view}
            src={iframeUrl}
            title={`BAGO · ${VIEW_LABELS[view] || view}`}
            className="overlay-iframe"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          />
        ) : (
          <div className="overlay-placeholder">
            <div className="overlay-placeholder-mark">{VIEW_LABELS[view]?.[0] || 'B'}</div>
            <strong>{VIEW_LABELS[view] || view}</strong>
            <p>
              {installLabel} ({kit.installation?.version || 'sin versión'}) · {modelLabel} · pipeline {pipelineLabel}
            </p>
            <p>claims {claimRatio} · {inspectorSummary.state} · detalle {detailLabel}</p>
            <small>
              Lanzar el .exe para acceder al iframe del Gestor completo. Esta vista previa
              mantiene el chat como pieza central y resume el estado actual de la sesión.
            </small>
          </div>
        )}
      </div>
    </aside>
  )
}
