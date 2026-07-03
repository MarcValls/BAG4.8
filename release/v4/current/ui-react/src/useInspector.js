import { useCallback, useEffect, useMemo, useState } from 'react'
import { chatApi } from './api'

const DEFAULT_EVIDENCE = {
  state: 'PENDIENTE',
  tests: { passed: 0, skipped: 0, failed: 0 },
  subtests: { passed: 0, failed: 0 },
  lastRun: '—',
  duration: '—',
  claims: [],
  notes: [
    'Sin evidencia cargada aún. Ejecuta una verificación para poblar el inspector.',
  ],
}

export function useInspector() {
  const [open, setOpen] = useState(true)
  const [evidence, setEvidence] = useState(DEFAULT_EVIDENCE)
  const [runtime, setRuntime] = useState(null)
  const [error, setError] = useState('')

  const toggle = useCallback((force) => {
    setOpen((current) => (typeof force === 'boolean' ? force : !current))
  }, [])

  const refreshRuntime = useCallback(async () => {
    try {
      const [session, simulation, catalog, rl] = await Promise.all([
        chatApi.getSession().catch(() => null),
        chatApi.getSimulationStatus().catch(() => null),
        chatApi.getCatalogStatus().catch(() => null),
        chatApi.getRlStatus().catch(() => null),
      ])
      setRuntime({ session, simulation, catalog, rl, ts: new Date().toISOString() })
      if (session?.bago_version) {
        setEvidence((current) => ({ ...current, version: session.bago_version }))
      }
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const summary = useMemo(() => {
    const claimsOk = evidence.claims.filter((c) => c.ok).length
    return {
      state: evidence.state,
      claimsOk,
      claimsTotal: evidence.claims.length,
      testsPassed: evidence.tests?.passed || 0,
      testsFailed: evidence.tests?.failed || 0,
    }
  }, [evidence])

  return {
    open,
    toggle,
    evidence,
    setEvidence,
    runtime,
    refreshRuntime,
    error,
    summary,
  }
}
