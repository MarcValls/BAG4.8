import './ManagerPanel.css';
import { useEffect, useMemo, useState } from 'react';
import { MANAGER_MODULES } from '../managerConfig';
import {
  CapacityVisual,
  DataVisualGrid,
  FormulaVisual,
  MetricDashboard,
  PipelineVisual,
  RelationMap,
  SemanticBoard,
  StatusVisual,
} from './DataVisuals';

function display(value) {
  if (value === null || value === undefined || value === '') return 'No recibido';
  if (typeof value === 'boolean') return value ? 'si' : 'no';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function Rows({ rows, initialLimit = 6 }) {
  return <DataVisualGrid rows={rows} initialLimit={initialLimit} />;
}

function JsonDetails({ title, value }) {
  if (!value || (typeof value === 'object' && !Object.keys(value).length)) return null;
  return (
    <details className="json-details ui-card">
      <summary>{title}</summary>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function activateOnKey(event, callback) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
}

function metric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : 'No recibido';
}

const MODULE_TONE_CLASS = 'manager-panel--';

function ControlRack({
  label,
  status,
  summary,
  modes,
  mode,
  onModeChange,
}) {
  return (
    <div className="module-rack">
      <div className="module-rack-top">
        <span className={`module-rack-led state-${status || 'unknown'}`} aria-hidden="true" />
        <div className="module-rack-copy">
          <strong>{label}</strong>
          {summary ? <span>{summary}</span> : null}
        </div>
        <div className="module-rack-switches">
          {modes?.length ? (
            <div className="module-rack-tabs" role="tablist" aria-label={label}>
              {modes.map((item) => {
                const active = item.value === mode;
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`ui-button ui-button--compact ui-button--tab module-rack-tab ${active ? 'is-active' : ''}`}
                    onClick={() => onModeChange(item.value)}
                    title={item.label}
                  >
                    <span className="module-rack-tab-mark" aria-hidden="true">{item.icon || '•'}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Actions({ actions, onAction, pending }) {
  if (!actions?.length) return null;
  const primaryActions = actions.slice(0, 2);
  const secondaryActions = actions.slice(2);
  const renderAction = (action) => (
    <button
      key={`${action.command_id}-${action.label}`}
      type="button"
      className={`ui-button ui-button--chip ${action.emphasis === 'primary' ? 'ui-button--primary' : action.emphasis === 'danger' ? 'ui-button--danger' : 'ui-button--ghost'}`}
      onClick={() => onAction(action)}
      disabled={pending || action.enabled === false}
      title={action.blocked_reason || action.description || ''}
    >
      {action.label || action.command_id}
    </button>
  );
  return (
    <div className="module-actions">
      {primaryActions.map(renderAction)}
      {secondaryActions.length ? (
        <details className="module-actions-more">
          <summary>Más acciones ({secondaryActions.length})</summary>
          <div>{secondaryActions.map(renderAction)}</div>
        </details>
      ) : null}
    </div>
  );
}

function ReflexiveList({ title, items }) {
  const safeItems = list(items);
  if (!safeItems.length) return null;
  return (
    <section className="module-section ui-surface ui-surface--subtle reflexive-list">
      <h3>{title}</h3>
      <div className="reflexive-items">
        {safeItems.map((item, index) => {
          const label = item?.label || item?.kind || item?.name || item?.id || 'Sin etiqueta recibida';
          const value = item?.value ?? item?.detail ?? item?.claim ?? item?.description ?? item;
          return (
            <article key={`${title}-${index}`} className="reflexive-item">
              <strong>{display(label)}</strong>
              <span>{display(value)}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ReflexiveInterpreter({ snapshot, onInterpret, onInterpretHistory, onInterpretRules }) {
  const recentUserMessage = [...list(snapshot?.recent_activity)]
    .reverse()
    .find((item) => item?.role === 'user' && item?.content)?.content || '';
  const exampleQuestion = '¿Como traducirias esta pregunta a una formula matematica para entender lo que te estoy preguntando?';
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const analysis = result?.analysis || {};
  const formalization = analysis.formalization || {};
  const metrics = analysis.metrics || {};
  const fixedPoint = analysis.fixed_point || {};
  const audit = result?.audit || analysis.reflexive_audit || {};
  const rulesInfo = rules?.rules || {};

  async function runInterpret() {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      setError('Escribe una pregunta o usa el ultimo turno / ejemplo.');
      return;
    }
    setLoading('analysis');
    setError('');
    try {
      const nextResult = await onInterpret(cleanQuestion);
      setResult(nextResult);
    } catch (nextError) {
      setError(nextError?.message || 'No se pudo analizar la pregunta.');
    } finally {
      setLoading('');
    }
  }

  async function loadHistory() {
    setLoading('history');
    setError('');
    try {
      setHistory(await onInterpretHistory(12));
    } catch (nextError) {
      setError(nextError?.message || 'No se pudo cargar el historial reflexivo.');
    } finally {
      setLoading('');
    }
  }

  async function loadRules() {
    setLoading('rules');
    setError('');
    try {
      setRules(await onInterpretRules());
    } catch (nextError) {
      setError(nextError?.message || 'No se pudieron cargar las reglas reflexivas.');
    } finally {
      setLoading('');
    }
  }

  function selectHistoryItem(item) {
    const nextAnalysis = item?.analysis || {};
    setResult({
      ok: true,
      session_id: item?.session_id,
      provider: item?.provider,
      model: item?.model,
      question: nextAnalysis.literal_reading || '',
      analysis: nextAnalysis,
      report: item?.response_excerpt || '',
      audit: {
        audit_id: item?.audit_id,
        path: history?.path,
        receipt_id: item?.receipt_id,
        question_id: item?.question_id,
      },
    });
    if (nextAnalysis.literal_reading) setQuestion(nextAnalysis.literal_reading);
  }

  return (
    <div className="reflexive-panel">
      <section className="module-section ui-surface ui-surface--subtle">
        <div className="module-section-head">
          <h3>Entrada reflexiva</h3>
          <span className="ui-pill state-confirmed">backend</span>
        </div>
        <textarea
          className="ui-field ui-field--textarea reflexive-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Pregunta a interpretar: literal, intencion, estructura, formalizacion, evidencia y punto fijo."
          disabled={Boolean(loading)}
        />
        <div className="reflexive-actions">
          <button type="button" className="ui-button ui-button--primary" onClick={runInterpret} disabled={Boolean(loading)}>
            {loading === 'analysis' ? 'Analizando...' : 'Analizar pregunta'}
          </button>
          <details className="reflexive-action-menu">
            <summary>Rellenar entrada</summary>
            <div>
              <button type="button" onClick={() => setQuestion(recentUserMessage)} disabled={Boolean(loading) || !recentUserMessage}>Usar último turno</button>
              <button type="button" onClick={() => setQuestion(exampleQuestion)} disabled={Boolean(loading)}>Usar ejemplo</button>
            </div>
          </details>
          <details className="reflexive-action-menu">
            <summary>Consultar</summary>
            <div>
              <button type="button" onClick={loadHistory} disabled={Boolean(loading)}>{loading === 'history' ? 'Cargando...' : 'Historial'}</button>
              <button type="button" onClick={loadRules} disabled={Boolean(loading)}>{loading === 'rules' ? 'Cargando...' : 'Reglas'}</button>
            </div>
          </details>
        </div>
        {error ? <p className="reflexive-error">{error}</p> : null}
      </section>

      {result ? (
        <>
          <section className="reflexive-result-hero">
            <div className="reflexive-result-kicker">Interpretación seleccionada</div>
            <h3>{analysis.intent || 'Intención no recibida'}</h3>
            <p>{analysis.operational_intent || formalization.objective || 'Objetivo operacional no recibido.'}</p>
            <div className="reflexive-result-state">
              <StatusVisual label="Punto fijo" value={fixedPoint.stable} detail={fixedPoint.condition} />
            </div>
          </section>

          <section className="module-section ui-surface ui-surface--subtle">
            <div className="module-section-head">
              <h3>Calidad de la interpretación</h3>
              <span className="reflexive-reading-hint">Cuatro señales, una sola lectura</span>
            </div>
            <MetricDashboard metrics={[
              { label: 'Confianza', value: analysis.confidence, polarity: 'positive', help: 'Seguridad global' },
              { label: 'Fidelidad', value: metrics.fidelity, polarity: 'positive', help: 'Conservación del significado' },
              { label: 'Ambigüedad', value: metrics.ambiguity, polarity: 'negative', help: 'Lecturas alternativas' },
              { label: 'Riesgo de invención', value: metrics.invention_risk, polarity: 'negative', help: 'Contenido no sustentado' },
            ]} />
          </section>

          <section className="module-section ui-surface ui-surface--subtle">
            <FormulaVisual
              schema={formalization.schema}
              type={formalization.type}
              objective={formalization.objective}
              condition={fixedPoint.condition}
            />
            <RelationMap relations={list(formalization.relations)} />
          </section>

          <SemanticBoard title="Datos detectados" items={analysis.data} variant="data" />
          <SemanticBoard title="Incógnitas" items={analysis.unknowns} variant="unknown" />
          <SemanticBoard title="Restricciones" items={analysis.restrictions} variant="restriction" collapsed />
          <SemanticBoard title="Alternativas" items={analysis.alternatives} variant="alternative" collapsed />
          <SemanticBoard title="Evidencia" items={analysis.evidence} variant="evidence" collapsed />

          <section className="module-section ui-surface ui-surface--subtle">
            <h3>Trazabilidad</h3>
            <Rows initialLimit={4} rows={[
              ['question_id', analysis.question_id, 'identifier'],
              ['audit_id', audit.audit_id, 'identifier'],
              ['receipt_id', audit.receipt_id, 'identifier'],
              ['provider', result.provider],
              ['model', result.model],
              ['session_id', result.session_id, 'identifier'],
            ]} />
          </section>

          {result.report ? (
            <details className="json-details ui-card reflexive-technical-output">
              <summary>Salida técnica del terminal</summary>
              <pre className="reflexive-report">{result.report}</pre>
            </details>
          ) : null}
        </>
      ) : (
        <div className="reflexive-empty-state">
          <strong>Sin interpretación activa</strong>
          <p>Introduce una pregunta. La salida aparecerá como mapa visual y el detalle técnico quedará en segundo nivel.</p>
        </div>
      )}

      {history ? (
        <section className="module-section ui-surface ui-surface--subtle">
          <h3>Historial reflexivo</h3>
          {list(history.items).length ? (
            <div className="reflexive-history">
              {list(history.items).map((item, index) => (
                <button
                  key={item.audit_id || index}
                  type="button"
                  className="ui-button ui-button--item ui-button--ghost"
                  onClick={() => selectHistoryItem(item)}
                >
                  <div>
                    <strong>{item.intent || item.analysis?.intent || 'sin intencion'}</strong>
                    <p>{item.analysis?.literal_reading || item.response_excerpt || item.question_id}</p>
                  </div>
                  <span className="ui-pill state-confirmed">{metric(item.confidence)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-copy">No hay auditorias reflexivas registradas.</p>
          )}
        </section>
      ) : null}

      {rules ? (
        <section className="module-section ui-surface ui-surface--subtle">
          <h3>Contrato de reglas</h3>
          <Rows rows={[
            ['version', rulesInfo.contract_version],
            ['fuente', rulesInfo.source],
            ['validacion', rulesInfo.validation?.ok],
            ['objetivos', rulesInfo.objective_count],
            ['marcadores', rulesInfo.interrogative_marker_count],
            ['deicticos', rulesInfo.deictic_term_count],
            ['autorreferencia', rulesInfo.self_reference_term_count],
          ]} />
          <JsonDetails title="Detalle de reglas" value={rulesInfo} />
        </section>
      ) : null}
    </div>
  );
}

function Items({ items, onSelect, selection, compact = false }) {
  if (!items?.length) return <p className="empty-copy">El backend no ha suministrado elementos para este modulo.</p>;
  return (
    <div className={`module-items ${compact ? 'module-items--compact' : ''}`}>
      {items.map((item, index) => {
        const id = item.id || item.command_id || item.label || index;
        const active = selection && (selection.id === id || selection === id);
        const label = item.label || item.name || item.id || item.command_id || 'Sin etiqueta recibida';
        return (
          <button
            key={id}
            type="button"
            className={`ui-button ui-button--item ui-button--ghost ${active ? 'is-selected' : ''}`}
            onClick={() => onSelect(item)}
          >
            <div>
              <strong>{label}</strong>
              {item.description || item.summary ? <p>{item.description || item.summary}</p> : null}
            </div>
            <span className={`ui-pill state-${item.status || 'unknown'}`}>{item.status || 'unknown'}</span>
          </button>
        );
      })}
    </div>
  );
}

function ModuleTopology({ snapshot, onOpenModule }) {
  const centers = snapshot?.centers || {};
  const rows = MANAGER_MODULES.map((module) => {
    const center = centers[module.id] || {};
    return {
      ...module,
      status: center.status || 'unknown',
      metrics: list(center.metrics).length,
      items: list(center.items).length,
      warnings: list(center.warnings).length,
    };
  });
  return (
    <section className="module-section ui-surface ui-surface--subtle">
      <div className="module-section-head">
        <h3>Mapa operativo</h3>
        <span className="ui-pill state-confirmed">snapshot</span>
      </div>
      <div className="module-topology" aria-label="Mapa de módulos del snapshot">
        {rows.map((module) => (
          <button
            key={module.id}
            type="button"
            className={`module-topology-node state-${module.status}`}
            onClick={() => onOpenModule(module.id)}
          >
            <span className="module-topology-mark">{module.icon || module.short}</span>
            <div>
              <strong>{module.label}</strong>
              <small>{module.status}</small>
            </div>
            <footer>
              {module.metrics ? <span>{module.metrics} met</span> : null}
              {module.items ? <span>{module.items} elem</span> : null}
              {module.warnings ? <span className="state-warn">{module.warnings} alertas</span> : null}
            </footer>
          </button>
        ))}
      </div>
    </section>
  );
}

function PipelineSignalMatrix({ steps }) {
  if (!steps.length) return null;
  const signals = [
    { id: 'status', label: 'Estado', read: (step) => step.status || 'unknown' },
    { id: 'kind', label: 'Tipo', read: (step) => step.kind || step.type || step.phase || 'paso' },
    { id: 'source', label: 'Fuente', read: (step) => step.source || step.command_id || step.tool || step.id },
    { id: 'evidence', label: 'Evidencia', read: (step) => step.receipt_id || step.evidence_id || step.output_id || step.result || '' },
  ];
  return (
    <section className="module-section ui-surface ui-surface--subtle">
      <div className="module-section-head">
        <h3>Matriz de señales</h3>
        <span className="ui-pill state-confirmed">{steps.length} pasos</span>
      </div>
      <div className="pipeline-signal-matrix" role="table" aria-label="Matriz de señales del pipeline">
        <div className="pipeline-signal-head" role="row">
          <span role="columnheader">Paso</span>
          {signals.map((signal) => <span key={signal.id} role="columnheader">{signal.label}</span>)}
        </div>
        {steps.map((step, index) => (
          <div className="pipeline-signal-row" role="row" key={step.id || index}>
            <strong role="rowheader">{step.label || step.name || step.id || `Paso ${index + 1}`}</strong>
            {signals.map((signal) => {
              const value = signal.read(step);
              return <span key={signal.id} className={signal.id === 'status' ? `state-${value || 'unknown'}` : ''}>{display(value)}</span>;
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function patchItem(id, label, type, status = 'confirmed', detail = '') {
  return { id: String(id || label || type), label: String(label || id || type), type, status, detail: String(detail || '') };
}

function uniquePatchItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function patchResources(snapshot) {
  const system = snapshot?.system || {};
  const model = snapshot?.model || {};
  const centers = snapshot?.centers || {};
  const tools = uniquePatchItems([
    ...list(system.detail?.tools_available || centers.tools?.active_entity?.tools_available).map((tool) => {
      const id = typeof tool === 'string' ? tool : tool?.name || tool?.id || tool?.label;
      return patchItem(id, id, String(id || '').includes('skill') ? 'skill' : 'tool', 'confirmed', 'tool registry');
    }),
    ...list(centers.tools?.items).map((tool) => patchItem(tool.id || tool.command_id, tool.label, 'tool', tool.status, tool.description)),
  ]);
  const skills = uniquePatchItems([
    ...tools.filter((item) => item.type === 'skill'),
    ...list(centers.reflexive?.items).map((item) => patchItem(item.id || item.command_id, item.label, 'skill', item.status, item.description)),
  ]);
  const agents = uniquePatchItems([
    patchItem(system.active_agent || centers.patchbay?.active_entity?.active_agent || 'main', system.active_agent || 'main', 'agent', system.active_agent ? 'confirmed' : 'unknown', 'agente activo'),
    ...list(system.active_bridges || system.detail?.active_bridges || centers.patchbay?.active_entity?.active_bridges).map((bridge) => patchItem(bridge, bridge, 'agent', 'confirmed', 'bridge activo')),
  ]);
  const pieces = uniquePatchItems([
    ...list(snapshot?.pipeline?.steps).map((step, index) => patchItem(step.id || step.label || index, step.label || step.name || `Paso ${index + 1}`, 'piece', step.status || 'unknown', step.type || step.kind || 'pipeline')),
    ...MANAGER_MODULES.map((module) => patchItem(`module.${module.id}`, module.label, 'piece', centers[module.id]?.status || 'unknown', module.description)),
    model.provider ? patchItem(`provider.${model.provider}`, model.provider, 'piece', 'confirmed', model.effective_model || model.configured_model) : null,
  ].filter(Boolean));
  return {
    agent: agents,
    tool: uniquePatchItems(tools.filter((item) => item.type !== 'skill')),
    skill: skills,
    piece: pieces,
  };
}

function defaultPatchConnections(resources) {
  const source = resources.agent[0] || resources.piece[0];
  if (!source) return [];
  return [
    ...resources.tool.slice(0, 2),
    ...resources.skill.slice(0, 1),
    ...resources.piece.slice(0, 2),
  ].map((target) => ({
    id: `${source.id}->${target.id}`,
    from: source.id,
    fromLabel: source.label,
    to: target.id,
    toLabel: target.label,
    mode: target.type === 'piece' ? 'read-only' : 'available',
    type: target.type,
  }));
}

function Patchbay({ snapshot, center }) {
  const resources = useMemo(() => patchResources(snapshot), [snapshot]);
  const allSources = [...resources.agent, ...resources.piece];
  const allTargets = [...resources.tool, ...resources.skill, ...resources.piece];
  const [selectedSource, setSelectedSource] = useState(allSources[0]?.id || '');
  const [connections, setConnections] = useState([]);
  const [connectMode, setConnectMode] = useState('available');
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const activeSource = allSources.find((item) => item.id === selectedSource) || allSources[0];
  const selectedConnection = selectedItem?.kind === 'connection'
    ? connections.find((connection) => connection.id === selectedItem.id)
    : null;
  const selectedResource = selectedItem?.kind === 'resource'
    ? Object.values(resources).flat().find((item) => item.id === selectedItem.id)
    : null;
  const cleanQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (!selectedSource && allSources[0]) setSelectedSource(allSources[0].id);
  }, [allSources, selectedSource]);

  useEffect(() => {
    setConnections((current) => (current.length ? current : defaultPatchConnections(resources)));
  }, [resources]);

  function connect(target) {
    if (!activeSource || !target || activeSource.id === target.id) return;
    const id = `${activeSource.id}->${target.id}`;
    setConnections((current) => (
      current.some((item) => item.id === id)
        ? current
        : [...current, {
          id,
          from: activeSource.id,
          fromLabel: activeSource.label,
          to: target.id,
          toLabel: target.label,
          mode: connectMode,
          type: target.type,
        }]
    ));
    setSelectedItem({ kind: 'connection', id });
  }

  function updateConnectionMode(id, mode) {
    setConnections((current) => current.map((item) => (item.id === id ? { ...item, mode } : item)));
  }

  function disconnect(id) {
    setConnections((current) => current.filter((item) => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
  }

  const filteredSources = cleanQuery
    ? allSources.filter((item) => [item.label, item.id, item.detail, item.type].join(' ').toLowerCase().includes(cleanQuery))
    : allSources;
  const filteredTargets = cleanQuery
    ? allTargets.filter((item) => [item.label, item.id, item.detail, item.type].join(' ').toLowerCase().includes(cleanQuery))
    : allTargets;

  return (
    <div className="patchbay">
      <section className="module-section ui-surface ui-surface--subtle">
        <ControlRack
          label="Patchbay local"
          status={center?.status || snapshot?.connection?.status || 'unknown'}
          summary="salidas, cables, entradas"
          modes={allSources.map((item) => ({ value: item.id, label: `${item.type}: ${item.label}` }))}
          mode={activeSource?.id || ''}
          onModeChange={setSelectedSource}
        />
        <div className="patchbay-summary">
          <StatusVisual label="OUT" value={activeSource?.label || 'sin salida'} detail={activeSource?.type || 'salida'} />
          <StatusVisual label="CABLES" value={connections.length ? 'confirmed' : 'unknown'} detail={`${connections.length} patch${connections.length === 1 ? '' : 'es'}`} />
          <StatusVisual label="IN" value={filteredTargets.length || 0} detail="entradas visibles" />
        </div>
        <div className="patchbay-toolbar">
          <label>
            <span>Bus</span>
            <select value={connectMode} onChange={(event) => setConnectMode(event.target.value)}>
              <option value="available">Abierto</option>
              <option value="read-only">Lectura</option>
              <option value="blocked">Cerrado</option>
              <option value="isolated">Aislado</option>
            </select>
          </label>
          <label>
            <span>Filtro</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nodo, cable o pieza" />
          </label>
        </div>
      </section>

      <div className="patchbay-workspace">
        <section className="patchbay-board" aria-label="Patchbay de agentes, tools, skills y piezas">
          <div className="patchbay-lane patchbay-lane--source">
            <header>
              <h3>OUT</h3>
              <span>{filteredSources.length}/{allSources.length}</span>
            </header>
            <div className="patchbay-node-list">
              {filteredSources.length ? filteredSources.map((item) => {
                const isSource = activeSource?.id === item.id;
                const connected = connections.some((connection) => connection.to === item.id || connection.from === item.id);
                return (
                  <article
                    key={item.id}
                    className={`patchbay-node state-${item.status || 'unknown'} ${isSource ? 'is-source' : ''} ${connected ? 'is-connected' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedItem({ kind: 'resource', id: item.id })}
                    onKeyDown={(event) => activateOnKey(event, () => setSelectedItem({ kind: 'resource', id: item.id }))}
                  >
                    <div className="patchbay-node-top">
                      <span className="patchbay-node-jack patchbay-node-jack--out" aria-hidden="true" />
                      <div className="patchbay-node-copy">
                        <strong>{item.label}</strong>
                        <span>{item.detail || item.type}</span>
                      </div>
                      <span className="patchbay-node-chip">{item.type}</span>
                    </div>
                    <div className="patchbay-node-actions">
                      <button
                        type="button"
                        className="ui-button ui-button--icon ui-button--ghost"
                        onClick={(event) => { event.stopPropagation(); setSelectedSource(item.id); }}
                        aria-label={isSource ? 'Salida activa' : 'Marcar salida'}
                        title={isSource ? 'Salida activa' : 'Marcar salida'}
                      >
                        {isSource ? '◎' : '◉'}
                      </button>
                      <button
                        type="button"
                        className="ui-button ui-button--icon ui-button--ghost"
                        onClick={(event) => { event.stopPropagation(); connect(item); }}
                        disabled={!activeSource || isSource}
                        aria-label="Cablear nodo"
                        title="Cablear nodo"
                      >
                        ↔
                      </button>
                    </div>
                  </article>
                );
              }) : <p className="empty-copy">Sin salidas visibles.</p>}
            </div>
          </div>

          <div className="patchbay-cablefield">
            <header>
              <h3>PATCH</h3>
              <span>{connections.length}</span>
            </header>
            <div className="patchbay-cable-list">
              {connections.length ? connections.map((connection) => {
                const source = allSources.find((item) => item.id === connection.from);
                const target = allTargets.find((item) => item.id === connection.to);
                return (
                  <article
                    key={connection.id}
                    className={`patchbay-cable state-${source?.status || 'unknown'}`}
                    onClick={() => setSelectedItem({ kind: 'connection', id: connection.id })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => activateOnKey(event, () => setSelectedItem({ kind: 'connection', id: connection.id }))}
                  >
                    <span className="patchbay-cable-plug patchbay-cable-plug--out" aria-hidden="true">◉</span>
                    <div className="patchbay-cable-track">
                      <div className="patchbay-cable-labels">
                        <strong>{source?.label || connection.fromLabel}</strong>
                        <span>{target?.label || connection.toLabel}</span>
                      </div>
                      <div className="patchbay-cable-line" aria-hidden="true">
                        <i />
                      </div>
                    </div>
                    <span className="patchbay-cable-plug patchbay-cable-plug--in" aria-hidden="true">◉</span>
                    <div className="patchbay-cable-actions">
                      <button
                        type="button"
                        className="ui-button ui-button--icon ui-button--ghost"
                        onClick={(event) => { event.stopPropagation(); disconnect(connection.id); }}
                        aria-label="Desconectar cable"
                        title="Desconectar cable"
                      >
                        ✕
                      </button>
                    </div>
                  </article>
                );
              }) : <p className="empty-copy">Sin cables activos.</p>}
            </div>
          </div>

          <div className="patchbay-lane patchbay-lane--target">
            <header>
              <h3>IN</h3>
              <span>{filteredTargets.length}/{allTargets.length}</span>
            </header>
            <div className="patchbay-node-list">
              {filteredTargets.length ? filteredTargets.map((item) => {
                const isSource = activeSource?.id === item.id;
                const connected = connections.some((connection) => connection.to === item.id || connection.from === item.id);
                return (
                  <article
                    key={item.id}
                    className={`patchbay-node state-${item.status || 'unknown'} ${isSource ? 'is-source' : ''} ${connected ? 'is-connected' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedItem({ kind: 'resource', id: item.id })}
                    onKeyDown={(event) => activateOnKey(event, () => setSelectedItem({ kind: 'resource', id: item.id }))}
                  >
                    <div className="patchbay-node-top">
                      <span className="patchbay-node-jack patchbay-node-jack--in" aria-hidden="true" />
                      <div className="patchbay-node-copy">
                        <strong>{item.label}</strong>
                        <span>{item.detail || item.type}</span>
                      </div>
                      <span className="patchbay-node-chip">{item.type}</span>
                    </div>
                    <div className="patchbay-node-actions">
                      <button
                        type="button"
                        className="ui-button ui-button--icon ui-button--ghost"
                        onClick={(event) => { event.stopPropagation(); connect(item); }}
                        disabled={!activeSource || isSource}
                        aria-label="Conectar entrada"
                        title="Conectar entrada"
                      >
                        ↔
                      </button>
                    </div>
                  </article>
                );
              }) : <p className="empty-copy">Sin entradas visibles.</p>}
            </div>
          </div>
        </section>

        <aside className="patchbay-inspector" aria-label="Inspector del patchbay">
          <div className="module-section-head">
            <h3>Inspector</h3>
            <span className="ui-pill state-confirmed">{selectedConnection ? 'enlace' : selectedResource ? selectedResource.type : 'seleccion'}</span>
          </div>
          {selectedConnection ? (
            <Rows rows={[
              ['desde', selectedConnection.fromLabel],
              ['hacia', selectedConnection.toLabel],
              ['tipo', selectedConnection.type],
              ['modo', selectedConnection.mode],
            ]} />
          ) : selectedResource ? (
            <Rows rows={[
              ['id', selectedResource.id, 'identifier'],
              ['tipo', selectedResource.type, 'status'],
              ['estado', selectedResource.status, 'status'],
              ['detalle', selectedResource.detail],
            ]} />
          ) : (
            <p className="empty-copy">Selecciona un nodo o una conexión.</p>
          )}
        </aside>
      </div>

      <section className="module-section ui-surface ui-surface--subtle">
        <div className="module-section-head">
          <h3>Conexiones activas</h3>
          <span className="ui-pill state-confirmed">{connections.length}</span>
        </div>
        <div className="patchbay-connections">
          {connections.length ? connections.map((connection) => (
            <article key={connection.id} className={`patchbay-connection patchbay-connection--${connection.type}`}>
              <strong>{connection.fromLabel}</strong>
              <select value={connection.mode} onChange={(event) => updateConnectionMode(connection.id, event.target.value)} onFocus={() => setSelectedItem({ kind: 'connection', id: connection.id })}>
                <option value="available">Disponible</option>
                <option value="read-only">Solo lectura</option>
                <option value="blocked">Bloqueado</option>
                <option value="isolated">Aislado</option>
              </select>
              <strong>{connection.toLabel}</strong>
              <button type="button" onClick={() => setSelectedItem({ kind: 'connection', id: connection.id })}>Ver</button>
              <button type="button" onClick={() => disconnect(connection.id)}>Desconectar</button>
            </article>
          )) : <p className="empty-copy">Selecciona un origen y conecta tools, skills o piezas.</p>}
        </div>
      </section>
    </div>
  );
}

function Overview({ snapshot, orchestrator }) {
  const [view, setView] = useState('estado');
  const authorities = snapshot?.authorities || {};
  const task = snapshot?.task || {};
  const system = snapshot?.system || {};
  const authorityRows = [
    ['framework_root', authorities.framework_root],
    ['project_root', authorities.project_root],
    ['workspace_root', authorities.workspace_root],
    ['workspace_scope_root', authorities.workspace_scope_root],
    ['workspace_id', authorities.workspace_id],
    ['session_id', authorities.session_id],
    ['context_revision', authorities.context_revision],
    ['pipeline_status', system.pipeline_status],
  ];
  return (
    <>
      <section className="module-section ui-surface ui-surface--subtle">
        <ControlRack
          label="Resumen operativo"
          status={snapshot?.connection?.status || 'unknown'}
          summary="cambia la lectura visible"
          modes={[
            { value: 'estado', label: 'Estado', icon: '◎' },
            { value: 'mapa', label: 'Mapa', icon: '◇' },
            { value: 'autoridades', label: 'Claves', icon: '⊙' },
            { value: 'decisiones', label: 'Decisiones', icon: '✦' },
            { value: 'restricciones', label: 'Límites', icon: '⛝' },
            { value: 'completo', label: 'Todo', icon: '▣' },
          ]}
          mode={view}
          onModeChange={setView}
        />
        <h3>Objetivo activo</h3>
        <p className="lead-copy">{task.objective || 'Backend sin objetivo activo recibido'}</p>
        {task.next_step ? <p className="next-step">Siguiente paso: {task.next_step}</p> : null}
      </section>
      {view === 'estado' ? (
        <section className="module-section ui-surface ui-surface--subtle">
          <h3>Lectura operativa</h3>
          <Rows rows={authorityRows.slice(0, 5)} />
        </section>
      ) : null}
      {view === 'mapa' || view === 'completo' ? (
        <ModuleTopology snapshot={snapshot} onOpenModule={orchestrator.openModule} />
      ) : null}
      {view === 'autoridades' || view === 'completo' ? (
        <section className="module-section ui-surface ui-surface--subtle">
          <h3>Autoridades</h3>
          <Rows rows={authorityRows} />
        </section>
      ) : null}
      {(view === 'decisiones' || view === 'completo') && task.decisions?.length ? (
        <section className="module-section ui-surface ui-surface--subtle">
          <h3>Decisiones</h3>
          <ul>{task.decisions.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </section>
      ) : null}
      {(view === 'restricciones' || view === 'completo') && task.restrictions?.length ? (
        <section className="module-section ui-surface ui-surface--subtle">
          <h3>Restricciones</h3>
          <ul>{task.restrictions.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </section>
      ) : null}
    </>
  );
}

function Workspace({ snapshot, center }) {
  const [view, setView] = useState('detalle');
  const authorities = snapshot?.authorities || {};
  const workspace = snapshot?.workspace || {};
  const rows = [
    ['estado', workspace.status],
    ['workspace_state', workspace.state],
    ['binding_confirmed', workspace.binding_confirmed],
    ['binding_reason', workspace.binding_reason],
    ['manifest_status', workspace.manifest_status],
    ['manifest_exists', workspace.manifest_exists],
    ['source_of_truth', workspace.source_of_truth_version],
    ['repo_branch', workspace.repo_branch],
    ['index_status', workspace.index_status],
    ['project_root', authorities.project_root],
    ['workspace_root', authorities.workspace_root],
    ['scope_root', authorities.workspace_scope_root],
    ['workspace_id', authorities.workspace_id],
    ['repo_root', workspace.repo_root],
    ['manifest_path', workspace.manifest_path],
    ['warnings', list(workspace.warnings).join(', ')],
  ];
  return (
    <>
      <section className="module-section ui-surface ui-surface--subtle">
        <ControlRack
          label="Workspace"
          status={workspace.status || 'unknown'}
          summary="lectura de vinculacion y raices"
          modes={[
            { value: 'vinculacion', label: 'Vinculación', icon: '↔' },
            { value: 'raices', label: 'Raíces', icon: '▤' },
            { value: 'detalle', label: 'Detalle', icon: '⋯' },
          ]}
          mode={view}
          onModeChange={setView}
        />
        <h3>Vinculacion</h3>
        <Rows rows={rows.slice(0, view === 'detalle' ? rows.length : view === 'raices' ? 10 : 6)} />
      </section>
      {view !== 'vinculacion' ? <JsonDetails title="Detalle del workspace" value={center?.detail || workspace.detail} /> : null}
    </>
  );
}

function Context({ snapshot, center }) {
  const [view, setView] = useState('presupuesto');
  const context = snapshot?.context || {};
  const budgetRows = [
    ['estado', context.status],
    ['alerta', context.alert_level],
    ['configurado', context.configured_context, 'tokens'],
    ['modelo max', context.model_context_tokens, 'tokens'],
    ['ocupado', context.occupied_context, 'tokens'],
    ['disponible', context.available_context, 'tokens'],
    ['reserva', context.reserve, 'tokens'],
    ['uso', context.usage_fraction],
    ['mensajes', context.messages_count],
    ['system_tokens', context.system_tokens, 'tokens'],
    ['messages_tokens', context.messages_tokens, 'tokens'],
    ['tools_tokens', context.tools_tokens, 'tokens'],
    ['tools_count', context.tools_count],
    ['truncado', context.truncated],
    ['factor limitante', context.limiting_factor],
    ['ultimo receipt', context.last_receipt_id],
  ];
  return (
    <>
      <section className="module-section ui-surface ui-surface--subtle">
        <ControlRack
          label="Contexto"
          status={context.status || 'unknown'}
          summary="presupuesto, receipt o detalle"
          modes={[
            { value: 'presupuesto', label: 'Presupuesto', icon: '▮' },
            { value: 'receipt', label: 'Receipt', icon: '◷' },
            { value: 'detalle', label: 'Detalle', icon: '⋯' },
          ]}
          mode={view}
          onModeChange={setView}
        />
        <h3>{view === 'receipt' ? 'ContextEnvelope / ContextReceipt' : 'Presupuesto de contexto'}</h3>
        {view === 'presupuesto' ? (
          <>
            <CapacityVisual
              occupied={context.occupied_context}
              reserve={context.reserve}
              available={context.available_context}
              total={context.configured_context || context.model_context_tokens}
            />
            <div className="context-signal-grid">
              <Rows initialLimit={4} rows={[
                ['uso', context.usage_fraction, 'porcentaje', 'metric', 'negative'],
                ['estado', context.status, 'status'],
                ['alerta', context.alert_level, 'status'],
                ['truncado', context.truncated],
                ['factor limitante', context.limiting_factor],
                ['mensajes', context.messages_count],
                ['tools_count', context.tools_count],
              ]} />
            </div>
          </>
        ) : (
          <Rows rows={[
            ['ultimo receipt', context.last_receipt_id, 'identifier'],
            ['estado', context.status, 'status'],
            ['factor limitante', context.limiting_factor],
            ['reserva', context.reserve, 'tokens'],
            ['uso', context.usage_fraction, 'porcentaje', 'metric', 'negative'],
            ['truncado', context.truncated],
          ]} />
        )}
      </section>
      {view !== 'presupuesto' ? <JsonDetails title="ContextEnvelope / ContextReceipt" value={center?.detail || context.detail} /> : null}
    </>
  );
}

function Model({ snapshot, center, orchestrator, onAction, pending }) {
  const model = snapshot?.model || {};
  const [view, setView] = useState('lista');
  const selected = orchestrator.selection;
  const selectedProvider = selected?.models ? selected : null;
  const selectedModel = selectedProvider ? null : (selected?.provider ? selected : null);
  const switchTarget = selectedModel
    ? { provider: selectedModel.provider, model: selectedModel.id }
    : selectedProvider
      ? { provider: selectedProvider.id, model: '' }
      : null;
  const nestedModels = selectedProvider?.models || [];
  const selectableItems = center.items || [];
  const activeItem = selectableItems.find((item) => item.id === selected?.id) || selectableItems[0];

  return (
    <>
      <section className="module-section ui-surface ui-surface--subtle">
        <h3>Inferencia efectiva</h3>
        <Rows rows={[
          ['estado', model.status],
          ['provider', model.provider],
          ['adapter', model.adapter],
          ['runtime', model.runtime],
          ['modelo configurado', model.configured_model],
          ['modelo efectivo', model.effective_model],
        ]} />
      </section>

      <section className="module-section ui-surface ui-surface--subtle">
        <ControlRack
          label="Proveedores"
          status={model.status || 'unknown'}
          summary="lista, activo o raw"
          modes={[
            { value: 'lista', label: 'Lista', icon: '▣' },
            { value: 'activo', label: 'Activo', icon: '◎' },
            { value: 'raw', label: 'Raw', icon: '⋯' },
          ]}
          mode={view}
          onModeChange={setView}
        />
        <div className="module-section-head">
          <h3>Providers y modelos</h3>
          {switchTarget ? (
            <button
              type="button"
              className="ui-button ui-button--chip ui-button--primary"
              onClick={() => onAction({
                command_id: 'switch',
                label: 'Cambiar seleccionado',
                arguments: switchTarget,
              })}
              disabled={pending}
            >
              Cambiar seleccionado
            </button>
          ) : null}
        </div>
        <Items items={center.items} onSelect={orchestrator.setSelection} selection={selected} compact />
        {view === 'activo' && activeItem ? (
          <section className="module-section ui-surface ui-surface--subtle module-inspector">
            <h3>Elemento activo</h3>
            <Rows rows={[
              ['id', activeItem.id || activeItem.command_id],
              ['label', activeItem.label || activeItem.name],
              ['status', activeItem.status],
              ['descripcion', activeItem.description || activeItem.summary],
            ]} />
          </section>
        ) : null}
        {nestedModels.length ? (
          <>
            <h4 className="module-subtitle">Modelos de {selectedProvider.label || selectedProvider.id}</h4>
            <Items items={nestedModels} onSelect={orchestrator.setSelection} selection={selected} compact />
          </>
        ) : null}
      </section>

      <JsonDetails title="Capacidades y configuracion" value={center?.detail || model.detail} />
    </>
  );
}

function Pipeline({ snapshot, center }) {
  const pipeline = snapshot?.pipeline || {};
  const steps = list(pipeline.steps).map((step, index) => ({ ...step, id: step.id || index, label: step.label || step.name || 'Paso sin etiqueta recibida' }));
  const [view, setView] = useState('detalle');
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const selectedStep = steps[selectedStepIndex] || steps[0];
  return (
    <>
      <section className="module-section ui-surface ui-surface--subtle">
        <ControlRack
          label="Pipeline"
          status={pipeline.status || 'unknown'}
          summary="pasos y detalle"
          modes={[
            { value: 'pasos', label: 'Pasos', icon: '⇢' },
            { value: 'detalle', label: 'Detalle', icon: '◎' },
            { value: 'raw', label: 'Raw', icon: '⋯' },
          ]}
          mode={view}
          onModeChange={setView}
        />
        <h3>Ejecucion</h3>
        <Rows rows={[
          ['estado', pipeline.status],
          ['execution_id', pipeline.execution_id],
          ['pasos', steps.length],
          ['paso activo', selectedStep?.label],
        ]} />
      </section>
      {(view === 'pasos' || view === 'detalle') && steps.length ? (
        <section className="module-section ui-surface ui-surface--subtle">
          <h3>Flujo de ejecución</h3>
          <PipelineVisual
            steps={steps}
            selectedId={selectedStep?.id}
            onSelect={(item) => setSelectedStepIndex(Math.max(0, steps.findIndex((step) => step.id === item.id)))}
          />
        </section>
      ) : null}
      {(view === 'pasos' || view === 'detalle') ? <PipelineSignalMatrix steps={steps} /> : null}
      {view === 'detalle' && selectedStep ? (
        <section className="module-section ui-surface ui-surface--subtle module-inspector">
          <h3>Paso activo</h3>
          <Rows rows={[
            ['id', selectedStep.id],
            ['label', selectedStep.label],
            ['status', selectedStep.status],
          ]} />
          <JsonDetails title="Detalle del paso" value={selectedStep} />
        </section>
      ) : null}
      <JsonDetails title="Detalle del pipeline" value={center?.detail || pipeline.detail} />
    </>
  );
}

function Evidence({ snapshot, center, commandResult }) {
  const [view, setView] = useState('resultado');
  const centerDetail = center?.detail || {};
  const evidence = Object.keys(centerDetail).length ? centerDetail : (center?.active_entity || {});
  const lastReceipt = evidence.last_receipt || {};
  const lastEnvelope = evidence.last_envelope || {};
  const receiptRows = [
    ['estado', commandResult?.status || center?.status],
    ['request_id', commandResult?.request_id],
    ['execution_id', commandResult?.execution_id || lastReceipt.execution_id || lastReceipt.envelope_id],
    ['receipt_id', commandResult?.receipt_id || lastReceipt.receipt_id],
    ['envelope_id', lastEnvelope.envelope_id || lastReceipt.envelope_id],
    ['state_revision', commandResult?.state_revision || lastReceipt.context_revision],
    ['adapter_used', lastReceipt.adapter_used],
    ['finish_reason', lastReceipt.finish_reason],
    ['latency_ms', lastReceipt.latency_ms],
    ['files_represented', list(lastReceipt.files_represented).join(', ')],
    ['fragments_recovered', list(lastReceipt.fragments_recovered).length],
    ['claim_warning', lastReceipt.metadata?.claim_warning],
    ['reflexive_audit', lastReceipt.metadata?.reflexive_audit?.audit_id],
  ];
  return (
    <>
      <section className="module-section ui-surface ui-surface--subtle">
        <ControlRack
          label="Evidencia"
          status={commandResult?.status || center?.status || 'unknown'}
          summary="selector de fuente de evidencia"
          modes={[
            { value: 'resultado', label: 'Resultado', icon: '◎' },
            { value: 'centro', label: 'Centro', icon: '◌' },
            { value: 'actividad', label: 'Actividad', icon: '✦' },
            { value: 'raw', label: 'Raw', icon: '⋯' },
          ]}
          mode={view}
          onModeChange={setView}
        />
        <h3>{view === 'resultado' ? 'Ultimo resultado' : view === 'centro' ? 'Evidencia del centro' : 'Actividad reciente'}</h3>
        {view === 'resultado' ? (
          <Rows rows={receiptRows} />
        ) : view === 'centro' ? (
          <JsonDetails title="Evidencia del centro" value={evidence} />
        ) : (
          <JsonDetails title="Actividad reciente" value={snapshot?.recent_activity} />
        )}
      </section>
      {view === 'raw' ? <JsonDetails title="CommandResult" value={commandResult} /> : null}
    </>
  );
}

function Roadmap({ snapshot, center }) {
  const [view, setView] = useState('actual');
  const [selectedIterationIndex, setSelectedIterationIndex] = useState(0);
  const roadmap = snapshot?.roadmap || center?.detail || {};
  const iterations = list(roadmap.iterations);
  const selectedIteration = iterations[selectedIterationIndex] || iterations[0];
  return (
    <>
      <section className="module-section ui-surface ui-surface--subtle">
        <ControlRack
          label="Roadmap"
          status={roadmap.status || 'unknown'}
          summary="iteraciones y estado actual"
          modes={[
            { value: 'iteraciones', label: 'Iteraciones', icon: '✣' },
            { value: 'actual', label: 'Actual', icon: '◎' },
            { value: 'raw', label: 'Raw', icon: '⋯' },
          ]}
          mode={view}
          onModeChange={setView}
        />
        <h3>Estado del plan</h3>
        <Rows rows={[
          ['estado', roadmap.status],
          ['version', roadmap.roadmap_version],
          ['current_iteration', roadmap.current_iteration],
          ['iteraciones', iterations.length],
        ]} />
      </section>

      {(view === 'iteraciones' || view === 'actual') && selectedIteration ? (
        <section key={selectedIteration.id || selectedIteration.title} className="module-section ui-surface ui-surface--subtle">
          <div className="module-section-head">
            <h3>{selectedIteration.title}</h3>
            <span className={`ui-pill state-${selectedIteration.status || 'unknown'}`}>{selectedIteration.status || 'unknown'}</span>
          </div>
          <p className="lead-copy">{selectedIteration.goal}</p>
          <Rows rows={[
            ['id', selectedIteration.id],
            ['fases', list(selectedIteration.phases).length],
          ]} />
          {list(selectedIteration.phases).length ? <ul>{list(selectedIteration.phases).map((phase) => <li key={phase}>{phase}</li>)}</ul> : null}
          {list(selectedIteration.verification).length ? (
            <details className="json-details ui-card">
              <summary>Verificacion</summary>
              <ul>{list(selectedIteration.verification).map((item) => <li key={item}>{item}</li>)}</ul>
            </details>
          ) : null}
        </section>
      ) : null}

      {view === 'raw' ? <JsonDetails title="Detalle del roadmap" value={roadmap.detail || roadmap} /> : null}
    </>
  );
}

function Session({ snapshot, center }) {
  const session = snapshot?.session || {};
  return (
    <>
      <section className="module-section ui-surface ui-surface--subtle"><h3>Sesion activa</h3><Rows rows={[
        ['estado', session.status],
        ['session_id', session.session_id || snapshot?.authorities?.session_id],
        ['persistida', session.persisted],
        ['ultimo guardado', session.last_saved_at],
        ['vinculada', session.linked],
      ]} /></section>
      <JsonDetails title="Detalle de sesion" value={center?.detail || session.detail} />
    </>
  );
}

function System({ snapshot, center, eventConnected }) {
  const connection = snapshot?.connection || {};
  const system = snapshot?.system || {};
  return (
    <>
      <section className="module-section ui-surface ui-surface--subtle"><h3>Backend compartido</h3><Rows rows={[
        ['conexion', connection.status],
        ['backend_version', connection.backend_version],
        ['bridge', connection.bridge],
        ['eventos', eventConnected ? 'conectados' : 'desconectados'],
        ['framework_version', snapshot?.authorities?.framework_version],
        ['framework_root', snapshot?.authorities?.framework_root],
        ['operating_mode', system.operating_mode],
        ['pipeline_status', system.pipeline_status],
        ['health_detail', system.health_detail],
        ['latency_ms', system.latency_ms],
        ['active_agent', system.active_agent],
        ['active_bridges', list(system.active_bridges).join(', ')],
        ['tool_policy', system.tool_approval_policy],
        ['auto_allow_tools', system.auto_allow_tools],
        ['tools_count', system.tools_count],
      ]} /></section>
      <JsonDetails title="Estado del sistema" value={center?.detail || system.detail} />
    </>
  );
}

function Console({ snapshot, lastEvent, commandResult }) {
  return (
    <div className="console-stream">
      <JsonDetails title="Ultimo evento" value={lastEvent} />
      <JsonDetails title="Ultimo resultado" value={commandResult} />
      <JsonDetails title="Actividad reciente" value={snapshot?.recent_activity} />
      {!lastEvent && !commandResult && !snapshot?.recent_activity?.length ? <p className="empty-copy">No hay actividad recibida del backend.</p> : null}
    </div>
  );
}

export default function ManagerPanel({
  snapshot,
  orchestrator,
  pending,
  commandResult,
  lastEvent,
  eventConnected,
  onAction,
  onInterpret,
  onInterpretHistory,
  onInterpretRules,
}) {
  const [rawOpen, setRawOpen] = useState(false);
  const moduleId = orchestrator.activeModule;
  const definition = orchestrator.activeDefinition;
  const center = snapshot?.centers?.[moduleId] || {};
  const actions = useMemo(() => [
    ...(center.recommended_actions || []),
    ...(center.available_actions || []),
  ].filter((item, index, list) => item?.command_id && list.findIndex((entry) => entry.command_id === item.command_id) === index), [center]);
  const items = center.items || [];
  const metrics = center.metrics || [];
  const metricCount = metrics.length;
  const warningCount = center.warnings?.length || 0;
  const itemCount = items.length;
  const statusLabel = center.status || 'unknown';

  let content = null;
  if (moduleId === 'overview') content = <Overview snapshot={snapshot} orchestrator={orchestrator} />;
  else if (moduleId === 'workspace') content = <Workspace snapshot={snapshot} center={center} />;
  else if (moduleId === 'patchbay') content = <Patchbay snapshot={snapshot} center={center} />;
  else if (moduleId === 'context') content = <Context snapshot={snapshot} center={center} />;
  else if (moduleId === 'model') content = <Model snapshot={snapshot} center={center} orchestrator={orchestrator} onAction={onAction} pending={pending} />;
  else if (moduleId === 'reflexive') content = <ReflexiveInterpreter snapshot={snapshot} onInterpret={onInterpret} onInterpretHistory={onInterpretHistory} onInterpretRules={onInterpretRules} />;
  else if (moduleId === 'pipeline') content = <Pipeline snapshot={snapshot} center={center} />;
  else if (moduleId === 'evidence') content = <Evidence snapshot={snapshot} center={center} commandResult={commandResult} />;
  else if (moduleId === 'roadmap') content = <Roadmap snapshot={snapshot} center={center} />;
  else if (moduleId === 'sessions') content = <Session snapshot={snapshot} center={center} />;
  else if (moduleId === 'system') content = <System snapshot={snapshot} center={center} eventConnected={eventConnected} />;
  else if (moduleId === 'console') content = <Console snapshot={snapshot} lastEvent={lastEvent} commandResult={commandResult} />;
  else content = (
    <>
      {metrics.length ? <section className="module-section ui-surface ui-surface--subtle"><h3>Metricas</h3><Rows rows={metrics.map((metric) => [metric.label, metric.value, metric.classification])} /></section> : null}
      <Items items={items} selection={orchestrator.selection} onSelect={orchestrator.setSelection} />
      <JsonDetails title="Detalle suministrado por backend" value={center.detail} />
    </>
  );

  return (
    <aside className={`manager-panel ui-surface ${MODULE_TONE_CLASS}${moduleId}`} aria-label={`Modulo ${definition.label}`}>
      <header className="manager-panel-head">
        <div className="manager-panel-head-left">
          <span className="ui-kicker">Manager</span>
          <h2>{definition.label}</h2>
          <p>{center.summary || definition.description}</p>
          <div className="manager-panel-status-summary" aria-label="Resumen del módulo">
            <span className={`manager-status-token state-${statusLabel}`}>
              <i aria-hidden="true" />{statusLabel}
            </span>
            {metricCount ? <span>{metricCount} métricas</span> : null}
            {itemCount ? <span>{itemCount} elementos</span> : null}
            {warningCount ? <span className="manager-status-warning">{warningCount} alertas</span> : null}
          </div>
        </div>
        <div className="manager-panel-controls">
          <span className={`ui-pill state-${center.status || 'unknown'}`}>{center.status || 'unknown'}</span>
          <button type="button" className="ui-button ui-button--icon ui-button--ghost" onClick={orchestrator.closePanel} aria-label="Cerrar modulo">×</button>
        </div>
      </header>

      <Actions actions={actions} onAction={onAction} pending={pending} />

      <div className="manager-panel-scroll">
        {content}
        {center.warnings?.length ? (
          <section className="module-section ui-surface ui-surface--subtle warning-section"><h3>Advertencias</h3><ul>{center.warnings.map((warning, index) => <li key={index}>{display(warning)}</li>)}</ul></section>
        ) : null}
        <div className="manager-panel-footer-rack">
          <button type="button" className="ui-button ui-button--ghost ui-button--wide raw-toggle" onClick={() => setRawOpen((value) => !value)}>
            {rawOpen ? 'Ocultar snapshot del modulo' : 'Ver snapshot del modulo'}
          </button>
          <span className={`manager-footer-led state-${warningCount ? 'warn' : 'ready'}`} aria-hidden="true" />
          <span className="manager-footer-text">{warningCount ? `${warningCount} alertas` : 'sin alertas'}</span>
        </div>
        {rawOpen ? <pre className="raw-snapshot">{JSON.stringify(center, null, 2)}</pre> : null}
      </div>
    </aside>
  );
}
