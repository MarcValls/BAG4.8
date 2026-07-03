import { useEffect, useMemo, useState } from 'react'
import { chatApi } from '../api'
import { createDatum, selectVisual } from '../semantics'
import './ChatStatusMeters.css'

const SCALE_MIN = 0
const SCALE_MAX = 100

function statusFromPct(pct) {
  if (pct >= 60) return { label: 'Operativo', symbol: '✓', cssClass: 'is-ok' }
  if (pct >= 25) return { label: 'Degradado', symbol: '△', cssClass: 'is-warn' }
  return { label: 'Crítico', symbol: '✕', cssClass: 'is-crit' }
}

function normalize(value, rawMin, rawMax) {
  if (rawMax === rawMin) return SCALE_MIN
  const clamped = Math.max(rawMin, Math.min(rawMax, value))
  return Math.round(SCALE_MIN + ((clamped - rawMin) / (rawMax - rawMin)) * (SCALE_MAX - SCALE_MIN))
}

function DotRow({ datum, pct, status, displayValue }) {
  const symbol = status.symbol
  const label = status.label
  const cssClass = status.cssClass

  return (
    <div className="dot-row" role="listitem">
      <span className="dot-row-label">{datum.label}</span>
      <div
        className="dot-row-track"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={SCALE_MIN}
        aria-valuemax={SCALE_MAX}
        aria-label={`${datum.label}: ${label}`}
      >
        <span className="dot-row-tick" style={{ left: '25%' }} />
        <span className="dot-row-tick" style={{ left: '50%' }} />
        <span className="dot-row-tick" style={{ left: '75%' }} />
        <span
          className={`dot-row-marker ${cssClass}`}
          style={{ left: `${pct}%` }}
        >
          <span className="dot-row-marker-symbol" aria-hidden="true">{symbol}</span>
        </span>
      </div>
      <span className={`dot-row-status ${cssClass}`}>
        <span aria-hidden="true">{symbol}</span>
        <span className="dot-row-status-label">{label}</span>
      </span>
      <span className="dot-row-value">{displayValue}</span>
    </div>
  )
}

export default function ChatStatusMeters({ session, busy }) {
  const [providers, setProviders] = useState(null)
  const [rlStatus, setRlStatus] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function poll() {
      try {
        const [p, rl] = await Promise.all([
          chatApi.listProviders().catch(() => null),
          chatApi.getRlStatus().catch(() => null),
        ])
        if (!active) return
        setProviders(p)
        setRlStatus(rl)
        setError('')
      } catch (err) {
        if (!active) return
        setError(err.message)
      }
    }

    poll()
    const timer = setInterval(poll, 8000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const providerCount = providers?.providers?.length || 0
  const activeModel = session?.model || '—'
  const rlTokens = rlStatus?.can_execute != null
    ? (rlStatus?.can_execute ? 5 : 0)
    : 0
  const uptimeS = session?.uptime_s || session?.uptime || 0

  const metrics = useMemo(() => {
    const providerPct = normalize(providerCount, 0, Math.max(providerCount, 1))
    const modelPct = activeModel !== '—' ? 100 : 0
    const ratePct = normalize(rlTokens, 0, 5)
    const uptimePct = normalize(Math.round(uptimeS), 0, 300)

    const make = (id, label, value, pct, rawMax) =>
      createDatum({
        id,
        label,
        value: pct,
        dataKind: 'quantitative',
        task: 'compare',
        role: 'diagnostic',
        domain: [SCALE_MIN, SCALE_MAX],
      })

    return [
      {
        datum: make('provider', 'Provider', providerCount, providerPct, Math.max(providerCount, 1)),
        pct: providerPct,
        status: statusFromPct(providerPct),
        displayValue: `${providerCount}`,
      },
      {
        datum: make('model', 'Modelo', activeModel !== '—' ? 1 : 0, modelPct, 1),
        pct: modelPct,
        status: statusFromPct(modelPct),
        displayValue: activeModel !== '—' ? activeModel : '—',
      },
      {
        datum: make('rate', 'Rate', rlTokens, ratePct, 5),
        pct: ratePct,
        status: statusFromPct(ratePct),
        displayValue: `${rlTokens}/5`,
      },
      {
        datum: make('uptime', 'Uptime', Math.round(uptimeS), uptimePct, 300),
        pct: uptimePct,
        status: statusFromPct(uptimePct),
        displayValue: `${Math.round(uptimeS)}s`,
      },
    ]
  }, [providerCount, activeModel, rlTokens, uptimeS])

  const spec = useMemo(() => {
    const d = metrics[0]?.datum
    return d ? selectVisual(d) : null
  }, [metrics])

  return (
    <div
      className="chat-status-meters"
      role="region"
      aria-label="Salud del sistema"
      data-visual={spec?.visual || 'dot-plot'}
    >
      <div className="status-meters-header">
        <span className="status-meters-title">HP</span>
        {busy && <span className="status-meters-busy">● activo</span>}
      </div>
      <div className="dot-plot" role="list">
        {metrics.map((m) => (
          <DotRow
            key={m.datum.id}
            datum={m.datum}
            pct={m.pct}
            status={m.status}
            displayValue={m.displayValue}
          />
        ))}
      </div>
      {error && <div className="status-meters-error">{error}</div>}
    </div>
  )
}