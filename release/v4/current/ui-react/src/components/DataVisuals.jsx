import { useMemo, useState } from 'react';
import './DataVisuals.css';

const STATUS_WORDS = new Set([
  'unknown', 'loading', 'degraded', 'error', 'confirmed', 'pending', 'running',
  'done', 'failed', 'blocked', 'ready', 'warn', 'warning', 'connected',
  'disconnected', 'active', 'inactive', 'valid', 'invalid', 'certified',
]);

const ID_PATTERN = /(^|_)(id|uuid|hash|receipt|revision)$/i;
const PATH_PATTERN = /(path|root|directory|folder|file|repo)$/i;
const PERCENT_PATTERN = /(confidence|fidelity|ambiguity|risk|usage|ratio|fraction|percent|progress|quality)/i;
const COUNT_PATTERN = /(count|tokens|messages|tools|steps|items|iterations|fases|objetivos|marcadores|deicticos)/i;

function safeLabel(value) {
  return String(value || 'Dato').replaceAll('_', ' ');
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeFraction(value) {
  const number = finite(value);
  if (number === null) return null;
  return Math.max(0, Math.min(1, number > 1 ? number / 100 : number));
}

function humanNumber(value) {
  const number = finite(value);
  if (number === null) return String(value ?? 'No recibido');
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(number);
}

function humanPercent(value) {
  const normalized = normalizeFraction(value);
  return normalized === null ? 'No recibido' : `${Math.round(normalized * 100)} %`;
}

function statusClass(value) {
  const status = String(value || 'unknown').toLowerCase();
  if (['yes', 'true', 'si', 'sí', 'connected', 'active', 'valid'].includes(status)) return 'confirmed';
  if (['no', 'false', 'disconnected', 'inactive', 'invalid'].includes(status)) return 'error';
  if (status === 'warning') return 'warn';
  return status.replace(/[^a-z0-9-]/g, '-') || 'unknown';
}

function inferKind(label, value, classification) {
  const key = String(label || '');
  const hint = String(classification || '').toLowerCase();
  if (hint.includes('status') || STATUS_WORDS.has(String(value || '').toLowerCase())) return 'status';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'list';
  if (value && typeof value === 'object') return 'object';
  if (PATH_PATTERN.test(key) || hint.includes('path')) return 'path';
  if (ID_PATTERN.test(key) || key.endsWith('_id') || hint.includes('identifier')) return 'identifier';
  if (PERCENT_PATTERN.test(key) || hint.includes('percent')) return 'percentage';
  if (typeof value === 'number' || COUNT_PATTERN.test(key) || hint === 'tokens' || hint === 'ms') return 'number';
  if (typeof value === 'string' && value.length > 100) return 'long-text';
  return 'text';
}

function qualityLabel(value, polarity = 'positive') {
  const normalized = normalizeFraction(value);
  if (normalized === null) return 'Sin medir';
  const score = polarity === 'negative' ? 1 - normalized : normalized;
  if (score >= 0.8) return 'Óptimo';
  if (score >= 0.6) return 'Adecuado';
  if (score >= 0.4) return 'Atención';
  return 'Crítico';
}

async function copyText(value) {
  if (!navigator?.clipboard || value === null || value === undefined) return;
  await navigator.clipboard.writeText(String(value));
}

export function StatusVisual({ label, value, detail }) {
  const status = statusClass(value);
  const text = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value || 'unknown');
  return (
    <article className={`dv-card dv-status state-${status}`}>
      <span className="dv-status-mark" aria-hidden="true" />
      <div>
        <span className="dv-label">{safeLabel(label)}</span>
        <strong>{text}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
    </article>
  );
}

export function MetricVisual({ label, value, polarity = 'positive', help }) {
  const normalized = normalizeFraction(value);
  const style = normalized === null ? undefined : { '--dv-progress': `${normalized * 100}%` };
  return (
    <article className={`dv-card dv-metric dv-polarity-${polarity}`}>
      <div className="dv-metric-head">
        <span className="dv-label">{safeLabel(label)}</span>
        <strong>{humanPercent(value)}</strong>
      </div>
      <div className="dv-track" role="meter" aria-label={safeLabel(label)} aria-valuemin="0" aria-valuemax="100" aria-valuenow={normalized === null ? undefined : Math.round(normalized * 100)}>
        <i style={style} />
      </div>
      <div className="dv-metric-foot">
        <span>{qualityLabel(value, polarity)}</span>
        {help ? <small>{help}</small> : null}
      </div>
    </article>
  );
}

export function StatVisual({ label, value, unit, detail }) {
  return (
    <article className="dv-card dv-stat">
      <span className="dv-label">{safeLabel(label)}</span>
      <div className="dv-stat-value">
        <strong>{humanNumber(value)}</strong>
        {unit ? <span>{unit}</span> : null}
      </div>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export function CodeVisual({ label, value, kind = 'identifier' }) {
  const [copied, setCopied] = useState(false);
  const text = value === null || value === undefined || value === '' ? 'No recibido' : String(value);
  async function handleCopy() {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }
  return (
    <article className={`dv-card dv-code dv-code--${kind}`}>
      <div className="dv-code-head">
        <span className="dv-label">{safeLabel(label)}</span>
        <button type="button" onClick={handleCopy} disabled={text === 'No recibido'}>{copied ? 'Copiado' : 'Copiar'}</button>
      </div>
      <code title={text}>{text}</code>
    </article>
  );
}

export function ChipList({ label, values }) {
  const items = Array.isArray(values) ? values : String(values || '').split(/[,|]/).filter(Boolean);
  return (
    <article className="dv-card dv-list">
      <span className="dv-label">{safeLabel(label)}</span>
      <div className="dv-chips">
        {items.length ? items.map((item, index) => (
          <span key={`${label}-${index}`}>{typeof item === 'object' ? String(item.label || item.name || item.id || JSON.stringify(item)) : String(item).trim()}</span>
        )) : <small>No recibido</small>}
      </div>
    </article>
  );
}

export function TextVisual({ label, value, long = false }) {
  const text = value === null || value === undefined || value === '' ? 'No recibido' : String(value);
  return (
    <article className={`dv-card dv-text ${long ? 'dv-text--long' : ''}`}>
      <span className="dv-label">{safeLabel(label)}</span>
      <p>{text}</p>
    </article>
  );
}

export function ObjectVisual({ label, value }) {
  return (
    <details className="dv-card dv-object">
      <summary>{safeLabel(label)} <span>{Object.keys(value || {}).length} campos</span></summary>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}

export function DataVisual({ label, value, classification, presentation, polarity, help }) {
  const kind = presentation || inferKind(label, value, classification);
  if (kind === 'status') return <StatusVisual label={label} value={value} detail={help || classification} />;
  if (kind === 'boolean') return <StatusVisual label={label} value={value} detail={help} />;
  if (kind === 'percentage' || kind === 'metric') return <MetricVisual label={label} value={value} polarity={polarity || 'positive'} help={help} />;
  if (kind === 'number') return <StatVisual label={label} value={value} unit={classification} detail={help} />;
  if (kind === 'identifier' || kind === 'path') return <CodeVisual label={label} value={value} kind={kind} />;
  if (kind === 'list') return <ChipList label={label} values={value} />;
  if (kind === 'object') return <ObjectVisual label={label} value={value} />;
  return <TextVisual label={label} value={value} long={kind === 'long-text'} />;
}

export function DataVisualGrid({ rows = [], initialLimit = 6, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const normalized = useMemo(() => rows.map((row) => {
    if (Array.isArray(row)) {
      return { label: row[0], value: row[1], classification: row[2], presentation: row[3], polarity: row[4], help: row[5] };
    }
    return row || {};
  }), [rows]);
  const visible = expanded ? normalized : normalized.slice(0, initialLimit);
  const hiddenCount = Math.max(0, normalized.length - visible.length);
  return (
    <div className={`dv-grid ${className}`}>
      {visible.map((item, index) => <DataVisual key={item.id || `${item.label}-${index}`} {...item} />)}
      {hiddenCount ? (
        <button type="button" className="dv-expand" onClick={() => setExpanded(true)}>Mostrar {hiddenCount} datos secundarios</button>
      ) : null}
      {expanded && normalized.length > initialLimit ? (
        <button type="button" className="dv-expand" onClick={() => setExpanded(false)}>Reducir detalle</button>
      ) : null}
    </div>
  );
}

export function MetricDashboard({ metrics = [] }) {
  return (
    <div className="dv-metric-dashboard">
      {metrics.map((item) => <MetricVisual key={item.label} {...item} />)}
    </div>
  );
}

export function FormulaVisual({ schema, type, objective, condition }) {
  return (
    <article className="dv-formula">
      <div className="dv-formula-head">
        <span className="dv-label">Formalización propuesta</span>
        {type ? <span className="dv-type-chip">{type}</span> : null}
      </div>
      <div className="dv-formula-expression">{schema || 'Sin fórmula recibida'}</div>
      {objective ? <div className="dv-formula-callout"><span>Objetivo</span><p>{objective}</p></div> : null}
      {condition ? <div className="dv-formula-callout"><span>Condición de estabilidad</span><p>{condition}</p></div> : null}
    </article>
  );
}

function relationParts(relation) {
  if (relation && typeof relation === 'object') {
    return {
      from: relation.from || relation.source || relation.subject || relation.left,
      verb: relation.label || relation.relation || relation.type || relation.verb || 'relaciona',
      to: relation.to || relation.target || relation.object || relation.right,
    };
  }
  const text = String(relation || '');
  const match = text.match(/^(.+?)\s*(?:->|→|=>|conduce a|determina|restringe|preserva|implica)\s*(.+)$/i);
  if (match) return { from: match[1].trim(), verb: text.slice(match[1].length, text.length - match[2].length).trim(), to: match[2].trim() };
  return { from: '', verb: 'relación', to: text };
}

export function RelationMap({ relations = [] }) {
  const items = relations.map(relationParts).filter((item) => item.to);
  if (!items.length) return null;
  return (
    <div className="dv-relations" aria-label="Mapa de relaciones">
      {items.map((item, index) => (
        <article className="dv-relation" key={`${item.from}-${item.to}-${index}`}>
          {item.from ? <span className="dv-node">{item.from}</span> : null}
          <span className="dv-edge"><i aria-hidden="true" /><small>{item.verb}</small></span>
          <span className="dv-node dv-node--target">{item.to}</span>
        </article>
      ))}
    </div>
  );
}

export function SemanticBoard({ title, items = [], variant = 'neutral', collapsed = false }) {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) return null;
  const content = (
    <div className="dv-semantic-grid">
      {safeItems.map((item, index) => {
        const label = item?.label || item?.kind || item?.name || item?.id || `${title} ${index + 1}`;
        const value = item?.value ?? item?.detail ?? item?.claim ?? item?.description ?? item;
        return (
          <article key={`${title}-${index}`} className={`dv-semantic-card dv-semantic-card--${variant}`}>
            <span className="dv-semantic-index">{String(index + 1).padStart(2, '0')}</span>
            <div><strong>{String(label)}</strong><p>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p></div>
          </article>
        );
      })}
    </div>
  );
  if (collapsed) {
    return (
      <details className="dv-semantic-section">
        <summary><span>{title}</span><small>{safeItems.length}</small></summary>
        {content}
      </details>
    );
  }
  return <section className="dv-semantic-section"><header><h3>{title}</h3><small>{safeItems.length}</small></header>{content}</section>;
}

export function CapacityVisual({ occupied, reserve, available, total, label = 'Distribución del contexto' }) {
  const occupiedNumber = Math.max(0, finite(occupied) || 0);
  const reserveNumber = Math.max(0, finite(reserve) || 0);
  const availableNumber = Math.max(0, finite(available) || 0);
  const totalNumber = Math.max(finite(total) || 0, occupiedNumber + reserveNumber + availableNumber, 1);
  const segments = [
    { key: 'occupied', label: 'Ocupado', value: occupiedNumber },
    { key: 'reserve', label: 'Reserva', value: reserveNumber },
    { key: 'available', label: 'Disponible', value: availableNumber },
  ];
  return (
    <article className="dv-capacity">
      <div className="dv-capacity-head"><span className="dv-label">{label}</span><strong>{humanNumber(totalNumber)} tokens</strong></div>
      <div className="dv-capacity-bar" role="img" aria-label={segments.map((item) => `${item.label}: ${humanNumber(item.value)}`).join('. ')}>
        {segments.map((item) => <i key={item.key} className={`dv-capacity-${item.key}`} style={{ width: `${(item.value / totalNumber) * 100}%` }} />)}
      </div>
      <div className="dv-capacity-legend">
        {segments.map((item) => (
          <div key={item.key}><i className={`dv-capacity-dot dv-capacity-${item.key}`} /><span>{item.label}</span><strong>{humanNumber(item.value)}</strong></div>
        ))}
      </div>
    </article>
  );
}

export function PipelineVisual({ steps = [], selectedId, onSelect }) {
  if (!steps.length) return null;
  return (
    <div className="dv-pipeline" aria-label="Flujo de ejecución">
      {steps.map((step, index) => {
        const id = step.id ?? index;
        const active = id === selectedId;
        return (
          <button type="button" key={id} className={`dv-pipeline-step ${active ? 'is-active' : ''}`} onClick={() => onSelect?.(step)}>
            <span className={`dv-pipeline-marker state-${statusClass(step.status)}`}>{index + 1}</span>
            <span className="dv-pipeline-copy"><strong>{step.label || step.name || `Paso ${index + 1}`}</strong><small>{step.status || 'unknown'}</small></span>
          </button>
        );
      })}
    </div>
  );
}
