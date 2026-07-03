import { useCallback, useEffect, useState } from 'react'
import { recordInteraction } from './interactionLog'
import { readPersisted, writePersisted } from './usePersisted'

const NODES = [
  { id: 'entrada',     name: '01 · Entrada',     subtitle: 'Contrato de tarea',           contract: { in: 'task_contract',     out: 'structured_objective' }, metric: { riesgo: 'bajo', modo: 'inmutable' } },
  { id: 'contexto',    name: '02 · Contexto',    subtitle: 'Archivos permitidos + repo',  contract: { in: 'working_set',       out: 'scoped_plan' },         metric: { riesgo: 'bajo', modo: 'sandbox' } },
  { id: 'modelo',      name: '03 · Modelo',      subtitle: 'llama3.2:3b · planning',      contract: { in: 'scoped_plan',       out: 'patch_proposal' },      metric: { riesgo: 'medio', modo: 'temperatura 0.2' } },
  { id: 'validacion',  name: '04 · Validación',  subtitle: 'AST · tests · lint',          contract: { in: 'patch_proposal',    out: 'validated_payload' },   metric: { riesgo: 'medio', modo: 'gated' } },
  { id: 'evidencia',   name: '05 · Evidencia',   subtitle: 'claim → prueba',              contract: { in: 'validated_payload', out: 'evidence_bundle' },     metric: { riesgo: 'bajo', modo: 'append-only' } },
  { id: 'aplicacion',  name: '06 · Aplicación',  subtitle: 'staged · reversible',         contract: { in: 'evidence_bundle',   out: 'applied_patch' },       metric: { riesgo: 'medio', modo: 'staged' } },
  { id: 'auditoria',   name: '07 · Auditoría',   subtitle: 'Registro y trazas',           contract: { in: 'applied_patch',     out: 'audit_trail' },         metric: { riesgo: 'bajo', modo: 'append-only' } },
]

const STORAGE_KEY = 'bago.pipeline-state.v1'

export function usePipelineNodes() {
  const persisted = readPersisted(STORAGE_KEY)
  const [activeId, setActiveId] = useState(persisted?.activeId || NODES[0].id)
  const [metrics, setMetrics] = useState(() => persisted?.metrics || {})

  useEffect(() => {
    writePersisted(STORAGE_KEY, { activeId })
  }, [activeId])

  const select = useCallback((id, source = 'click') => {
    if (!NODES.find((n) => n.id === id)) return
    recordInteraction('pipeline-select', { id, source })
    setActiveId(id)
  }, [])

  const advance = useCallback(() => {
    setActiveId((current) => {
      const idx = NODES.findIndex((n) => n.id === current)
      if (idx === -1 || idx >= NODES.length - 1) return current
      return NODES[idx + 1].id
    })
  }, [])

  const setNodeMetric = useCallback((id, metric) => {
    setMetrics((current) => ({ ...current, [id]: { ...(current[id] || {}), ...metric } }))
  }, [])

  return {
    nodes: NODES,
    activeId,
    active: NODES.find((n) => n.id === activeId) || NODES[0],
    metrics,
    select,
    advance,
    setNodeMetric,
  }
}
