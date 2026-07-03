import './ChatCore.css';
import { useEffect, useMemo, useRef, useState } from 'react';

function cleanContent(value) {
  return String(value || '').trim().replace(/^\[BAGO_CTX:[^\]]*\]\n/, '');
}

const CHAT_MODES = Object.freeze([
  { value: 'live', label: 'Live' },
  { value: 'focus', label: 'Focus' },
  { value: 'trace', label: 'Trace' },
]);

const CHAT_PATCHES = Object.freeze([
  { id: 'status', label: 'Status', command: '/status' },
  { id: 'providers', label: 'Providers', command: '/providers' },
  { id: 'context', label: 'Context', command: '/context' },
  { id: 'session', label: 'Session', command: '/session' },
  { id: 'roadmap', label: 'Roadmap', command: '/roadmap' },
  { id: 'models', label: 'Models', command: '/models' },
]);

function cycleIndex(length, current, delta) {
  if (!length) return 0;
  return (current + delta + length) % length;
}

function Message({ message, showTrace }) {
  const role = message?.role || 'system';
  const label = role === 'assistant' ? 'BAGO' : role === 'user' ? 'Tu' : role === 'tool' ? 'Herramienta' : 'Sistema';
  return (
    <article className={`chat-message role-${role}`}>
      <div className="chat-message-meta">
        <strong>{label}</strong>
        {message?.created_at ? <time>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time> : null}
      </div>
      <div className="chat-message-content">{cleanContent(message?.content) || '(sin contenido)'}</div>
      {showTrace && (message?.receipt_id || message?.execution_id) ? (
        <div className="chat-message-trace">
          {message?.execution_id ? <span>execution {message.execution_id}</span> : null}
          {message?.receipt_id ? <span>receipt {message.receipt_id}</span> : null}
        </div>
      ) : null}
    </article>
  );
}

function ChatRack({
  mode,
  onModeChange,
  density,
  onDensityChange,
  presetIndex,
  onPresetPrev,
  onPresetNext,
  preset,
  onInsertPreset,
  showTrace,
  onToggleTrace,
  visibleCount,
  totalCount,
}) {
  return (
    <div className="chat-rack">
      <div className="chat-rack-top">
        <span className={`chat-rack-led ${showTrace ? 'is-hot' : ''}`} aria-hidden="true" />
        <div className="chat-rack-copy">
          <strong>Console chat</strong>
          <span>{visibleCount}/{totalCount} mensajes · patch {presetIndex + 1}</span>
        </div>
        <div className="chat-rack-controls">
          <select className="chat-rack-select" value={mode} onChange={(event) => onModeChange(event.target.value)} aria-label="Modo de lectura del chat">
            {CHAT_MODES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button type="button" className="ui-button ui-button--compact ui-button--ghost chat-rack-stepper" onClick={onPresetPrev} aria-label="Parche anterior">
            ‹
          </button>
          <button type="button" className="ui-button ui-button--compact ui-button--ghost chat-rack-stepper" onClick={onPresetNext} aria-label="Parche siguiente">
            ›
          </button>
          <button type="button" className={`ui-button ui-button--compact ui-button--ghost chat-rack-switch ${showTrace ? 'is-active' : ''}`} onClick={onToggleTrace} aria-pressed={showTrace}>
            Trace {showTrace ? 'on' : 'off'}
          </button>
        </div>
      </div>
      <div className="chat-rack-bottom">
        <span className="chat-rack-label">Densidad</span>
        <input
          className="chat-rack-range"
          type="range"
          min="25"
          max="100"
          step="5"
          value={density}
          onChange={(event) => onDensityChange(Number(event.target.value))}
          aria-label="Densidad de mensajes visibles"
        />
        <span className="chat-rack-value">{density}%</span>
      </div>
      <div className="chat-rack-patch">
        <span className="chat-rack-label">Patch bay</span>
        <div className="chat-rack-patch-strip">
          <span className="chat-patch-preview">{preset.command}</span>
          <button type="button" className="ui-button ui-button--compact ui-button--primary" onClick={onInsertPreset}>
            Pegar
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionStrip({ actions, onAction, pending }) {
  if (!actions.length) return null;
  return (
    <div className="chat-actions" aria-label="Acciones recomendadas por el backend">
      {actions.slice(0, 8).map((action) => (
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
      ))}
    </div>
  );
}

function compact(value, fallback = 'pendiente') {
  const text = String(value || '').trim();
  if (!text) return fallback;
  return text.length > 34 ? `${text.slice(0, 31)}...` : text;
}

function TurnPath({ snapshot, commandResult, pending, orchestrator }) {
  const context = snapshot?.context || {};
  const model = snapshot?.model || {};
  const system = snapshot?.system || {};
  const evidence = snapshot?.centers?.evidence?.active_entity || {};
  const receipt = evidence.last_receipt || {};
  const steps = [
    {
      id: 'input',
      icon: '↘',
      label: 'Entrada',
      detail: pending ? 'turno en curso' : 'mensaje listo',
      status: pending ? 'running' : 'confirmed',
      module: 'overview',
    },
    {
      id: 'session',
      icon: '◎',
      label: 'Sesión',
      detail: compact(snapshot?.session?.session_id || snapshot?.authorities?.session_id),
      status: snapshot?.session?.status || 'unknown',
      module: 'sessions',
    },
    {
      id: 'context',
      icon: '◌',
      label: 'Contexto',
      detail: compact(context.limiting_factor || context.alert_level || `${context.available_context || 0} tokens`),
      status: context.status || 'unknown',
      module: 'context',
    },
    {
      id: 'model',
      icon: '◉',
      label: 'Modelo',
      detail: compact(model.effective_model || model.configured_model || model.provider),
      status: model.status || 'unknown',
      module: 'model',
    },
    {
      id: 'tools',
      icon: '✣',
      label: 'Tools',
      detail: `${system.tools_count ?? context.tools_count ?? 0} disponibles`,
      status: system.tool_approval_policy ? 'confirmed' : 'unknown',
      module: 'patchbay',
    },
    {
      id: 'execution',
      icon: '▶',
      label: 'Ejecución',
      detail: compact(commandResult?.execution_id || snapshot?.pipeline?.execution_id),
      status: pending ? 'running' : snapshot?.pipeline?.status || 'unknown',
      module: 'pipeline',
    },
    {
      id: 'evidence',
      icon: '◇',
      label: 'Evidencia',
      detail: compact(commandResult?.receipt_id || receipt.receipt_id || receipt.envelope_id),
      status: commandResult?.receipt_id || receipt.receipt_id ? 'confirmed' : 'unknown',
      module: 'evidence',
    },
    {
      id: 'output',
      icon: '↗',
      label: 'Salida',
      detail: commandResult?.status || (pending ? 'esperando' : 'última respuesta'),
      status: commandResult?.status || (pending ? 'running' : 'confirmed'),
      module: 'console',
    },
  ];
  const branches = [
    { id: 'fast', from: 3, to: 5, label: 'directo', active: !Number(system.tools_count ?? context.tools_count ?? 0) },
    { id: 'tools', from: 4, to: 5, label: 'tools', active: Number(system.tools_count ?? context.tools_count ?? 0) > 0 },
  ];
  return (
    <section className="turn-path" aria-label="Camino de entrada a salida">
      <div className="turn-path-head">
        <strong>Flujo</strong>
        <span>↘ → ◎ → ◌ → ◉ → ✣/▶ → ◇ → ↗</span>
      </div>
      <div className="turn-path-track">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={`turn-path-step state-${step.status || 'unknown'}`}
            onClick={() => orchestrator.openModule(step.module)}
            aria-label={`${step.label}: ${step.detail}`}
            title={`${step.label}: ${step.detail}`}
          >
            <span className="turn-path-index">{step.icon}</span>
            <span className="turn-path-label">{step.label}</span>
          </button>
        ))}
        <div className="turn-path-branches" aria-hidden="true">
          {branches.map((branch) => (
            <span
              key={branch.id}
              className={`turn-path-branch ${branch.active ? 'is-active' : ''}`}
              style={{ '--branch-from': branch.from, '--branch-to': branch.to }}
            >
              {branch.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ChatCore({ snapshot, pending, commandResult, error, onSubmit, onAction, orchestrator }) {
  const [value, setValue] = useState('');
  const [mode, setMode] = useState('live');
  const [density, setDensity] = useState(75);
  const [showTrace, setShowTrace] = useState(true);
  const [presetIndex, setPresetIndex] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const messages = snapshot?.chat?.messages || [];
  const enabled = snapshot?.chat?.enabled === true;
  const layoutLabel = orchestrator.surface === 'manager'
      ? 'Pestaña gestor'
      : 'Pestaña chat';
  const preset = CHAT_PATCHES[presetIndex] || CHAT_PATCHES[0];
  const menuActions = useMemo(() => [
    ...(snapshot?.menu?.recommended_actions || []),
    ...(snapshot?.centers?.[orchestrator.activeModule]?.recommended_actions || []),
  ].filter((item, index, list) => item?.command_id && list.findIndex((entry) => entry.command_id === item.command_id) === index), [snapshot, orchestrator.activeModule]);
  const visibleMessages = useMemo(() => {
    const filtered = mode === 'focus'
      ? messages.filter((message) => ['user', 'assistant'].includes(message?.role))
      : messages;
    const visibleCount = Math.max(3, Math.round((density / 100) * Math.max(filtered.length, 1)));
    return filtered.slice(-visibleCount);
  }, [density, messages, mode]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [visibleMessages.length, commandResult]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(event) {
    event.preventDefault();
    const text = value.trim();
    if (!text || !enabled || pending) return;
    setValue('');
    await onSubmit(text);
  }

  function insertPreset(command) {
    setValue(command);
    inputRef.current?.focus();
  }

  return (
    <section className="chat-core ui-surface" aria-label="Chat central de BAGO">
      <header className="chat-core-head">
        <div>
          <span className="ui-kicker">Centro de mando</span>
          <h2>Chat</h2>
        </div>
        <div className="chat-core-head-meta">
          <span className="ui-pill state-confirmed chat-layout-pill">{layoutLabel}</span>
          <span className="ui-pill state-confirmed chat-layout-pill">{mode}</span>
        </div>
      </header>

      <ChatRack
        mode={mode}
        onModeChange={setMode}
        density={density}
        onDensityChange={setDensity}
        presetIndex={presetIndex}
        onPresetPrev={() => setPresetIndex((current) => cycleIndex(CHAT_PATCHES.length, current, -1))}
        onPresetNext={() => setPresetIndex((current) => cycleIndex(CHAT_PATCHES.length, current, 1))}
        preset={preset}
        onInsertPreset={() => insertPreset(preset.command)}
        showTrace={showTrace}
        onToggleTrace={() => setShowTrace((current) => !current)}
        visibleCount={visibleMessages.length}
        totalCount={messages.length}
      />

      <ActionStrip actions={menuActions} onAction={onAction} pending={pending} />

      <TurnPath snapshot={snapshot} commandResult={commandResult} pending={pending} orchestrator={orchestrator} />

      <div className="chat-scroll" ref={scrollRef} aria-live="polite">
        {visibleMessages.length ? visibleMessages.map((message, index) => (
          <Message key={message.id || `${message.role}-${index}`} message={message} showTrace={showTrace || mode === 'trace'} />
        )) : (
          <div className="chat-empty">
            <div className="chat-empty-mark">B</div>
            <h3>El chat gobierna el manager</h3>
            <p>
              Las operaciones, selecciones y aperturas de panel se resuelven en este mismo turno.
              La interfaz espera el snapshot del backend, no inventa estado.
            </p>
          </div>
        )}
      </div>

      {error ? <div className="chat-error ui-banner ui-banner--error">{error.message || String(error)}</div> : null}
      {commandResult?.status ? (
        <div className={`chat-result ui-banner state-${commandResult.status}`}>
          <strong>{commandResult.status}</strong>
          {commandResult.execution_id ? <span>execution {commandResult.execution_id}</span> : null}
          {commandResult.receipt_id ? <span>receipt {commandResult.receipt_id}</span> : null}
        </div>
      ) : null}

      <form className="chat-composer ui-surface ui-surface--subtle" onSubmit={submit}>
        <textarea
          ref={inputRef}
          className="ui-field ui-field--textarea"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit(event);
            }
          }}
          rows={1}
          autoFocus
          placeholder={enabled ? 'Ejemplo: /switch ollama-local llama3.2:3b' : 'Chat bloqueado hasta que el backend lo habilite'}
          disabled={!enabled || pending}
          aria-label="Mensaje al manager"
        />
        <div className="chat-composer-footer">
          <span>
            contexto: Chat global
            {orchestrator.selection ? ' · seleccion activa' : ''}
          </span>
          <button type="submit" className="ui-button ui-button--primary" disabled={!enabled || pending || !value.trim()}>
            {pending ? 'Ejecutando...' : 'Enviar'}
          </button>
        </div>
        <div className="chat-composer-hint">
          <span>Enter envía</span>
          <span>Shift+Enter nueva linea</span>
          <span>Prueba /status, /providers o /context</span>
        </div>
      </form>
    </section>
  );
}
