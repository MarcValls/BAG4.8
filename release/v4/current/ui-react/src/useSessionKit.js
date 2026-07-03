import { useCallback, useEffect, useMemo, useState } from 'react'
import { chatApi } from './api'
import { recordInteraction } from './interactionLog'

const DEFAULT_KIT = {
  installation: { id: '', label: 'desconocido', version: '', status: 'loading' },
  model: { id: '', label: 'sin modelo', provider: '' },
  pipeline: { id: '', label: 'sin pipeline', variant: 'unknown' },
  policy: { id: '', label: 'sin política', risk: 'unknown' },
  pieces: { count: 0, label: '0 piezas' },
  simulation: { mode: 'off' },
  catalog: { mode: 'off' },
  context: { revision: '', binding: {}, receipt: {}, measure: {}, benchmark: {}, cognitive: {}, certification: {} },
}

export function useSessionKit() {
  const [kit, setKit] = useState(DEFAULT_KIT)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = useCallback((patch, source = 'local') => {
    recordInteraction('kit-update', { source, patch })
    setKit((current) => ({ ...current, ...patch }))
  }, [])

  const setInstallation = useCallback((installation) => {
    update({ installation }, 'set-installation')
  }, [update])

  const setModel = useCallback((model, provider) => {
    update({ model: { ...(model && typeof model === 'object' ? model : { id: model }), provider: provider || 'ollama' } }, 'set-model')
  }, [update])

  const setPipeline = useCallback((pipeline) => {
    update({ pipeline }, 'set-pipeline')
  }, [update])

  const setPolicy = useCallback((policy) => {
    update({ policy }, 'set-policy')
  }, [update])

  const setSimulation = useCallback((mode) => {
    update({ simulation: { mode } }, 'set-simulation')
  }, [update])

  const setCatalog = useCallback((mode) => {
    update({ catalog: { mode } }, 'set-catalog')
  }, [update])

  const refreshFromBackend = useCallback(async () => {
    setBusy(true)
    try {
      const [session, simulation, catalog] = await Promise.all([
        chatApi.getSession(),
        chatApi.getSimulationStatus().catch(() => null),
        chatApi.getCatalogStatus().catch(() => null),
      ])
      const status = session?.status || session || {}
      const binding = session?.binding || status.binding || {}
      const workspaceState = session?.workspace_state || status.workspace_state || {}
      setKit((current) => {
        const next = { ...current }
        if (session?.provider || status?.provider) {
          next.model = {
            id: session?.model || status.model || '',
            label: session?.model || status.model || 'sin modelo',
            provider: session?.provider || status.provider || '',
          }
          next.installation = {
            ...(current.installation || DEFAULT_KIT.installation),
            version: session?.bago_version || status.bago_version || current.installation?.version || '',
            framework_root: status.framework_root || binding.framework_root || '',
            project_root: status.project_root || binding.project_root || '',
            workspace_state_root: status.workspace_state_root || binding.workspace_root || '',
            workspace_root: status.workspace_root || binding.workspace_root || '',
            workspace_scope_root: status.workspace_scope_root || binding.workspace_scope_root || '',
            workspace_id: status.workspace_id || binding.workspace_id || '',
            workspace_state: workspaceState.state || workspaceState.workspace_state || '',
            workspace_state_label: workspaceState.state || workspaceState.workspace_state || '',
            repo_root: binding.repo_root || status.repo_root || '',
            repo_branch: binding.repo_branch || status.repo_branch || '',
          }
          next.context = {
            revision: status.context_revision || binding.context_revision || '',
            binding,
            receipt: status.last_receipt || session?.receipt || {},
            measure: status.context_measure || {},
            benchmark: status.context_benchmark || {},
            cognitive: status.cognitive_benchmark || {},
            certification: status.context_certification || {},
            workspace_state: workspaceState,
          }
        }
        if (simulation?.mode) next.simulation = { mode: simulation.mode }
        if (catalog?.mode) next.catalog = { mode: catalog.mode }
        return next
      })
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [])

  const summary = useMemo(() => {
    const pieces = kit.pieces?.count ?? 0
      return {
        installationLabel: kit.installation?.label || 'desconocido',
        modelLabel: kit.model?.label || kit.model?.id || 'sin modelo',
        frameworkLabel: kit.installation?.framework_root || 'sin framework',
        projectLabel: kit.installation?.project_root || 'sin proyecto',
      workspaceLabel: kit.installation?.workspace_state_root || 'sin workspace',
      workspaceStateLabel: kit.installation?.workspace_state_label || 'unknown',
      scopeLabel: kit.installation?.workspace_scope_root || 'sin scope',
      repoLabel: kit.installation?.repo_branch || kit.installation?.repo_root || 'sin repo',
      contextLabel: kit.context?.revision ? `ctx ${kit.context.revision.slice(0, 8)}` : 'ctx sin revisar',
      cognitiveLabel: kit.context?.cognitive?.score != null
        ? `cog ${Math.round((kit.context.cognitive.score || 0) * 100) / 100}`
        : 'cog sin medir',
      pipelineLabel: `${kit.pipeline?.label || 'sin pipeline'} · ${kit.pipeline?.variant || 'unknown'}`,
      piecesLabel: `${pieces} piezas`,
      policyLabel: kit.policy?.label || 'sin política',
      simulationLabel: `simulación: ${kit.simulation?.mode || 'off'}`,
      catalogLabel: `catálogo: ${kit.catalog?.mode || 'off'}`,
    }
  }, [kit])

  useEffect(() => {
    refreshFromBackend()
  }, [refreshFromBackend])

  return {
    kit,
    busy,
    error,
    summary,
    update,
    setInstallation,
    setModel,
    setPipeline,
    setPolicy,
    setSimulation,
    setCatalog,
    refreshFromBackend,
  }
}
