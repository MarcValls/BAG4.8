import { useEffect, useMemo, useRef, useState } from 'react';

function scoreAction(action, query) {
  if (!query) return 0;
  const haystack = [
    action.label,
    action.hint,
    action.category,
    ...(action.keywords || []),
  ].join(' ').toLowerCase();
  const normalized = query.toLowerCase();
  if (haystack === normalized) return 100;
  if (haystack.startsWith(normalized)) return 80;
  if (haystack.includes(normalized)) return 60;
  return -1;
}

export default function CommandPalette({ open, actions, onClose, onPick }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setIndex(0);
      return;
    }
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const filtered = useMemo(() => {
    const entries = actions
      .map((action, actionIndex) => ({ ...action, _index: actionIndex, _score: scoreAction(action, query) }))
      .filter((action) => action._score >= 0)
      .sort((a, b) => b._score - a._score || a._index - b._index);
    return entries;
  }, [actions, query]);

  useEffect(() => {
    setIndex((value) => Math.min(value, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  if (!open) return null;

  function commit(nextIndex = index) {
    const action = filtered[nextIndex];
    if (!action) return;
    onPick(action);
    onClose();
  }

  return (
    <div
      className="command-palette-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Paleta de comandos">
        <div className="command-palette-head">
          <div>
            <strong>Paleta de comandos</strong>
            <p>Busca módulos, modos y acciones frecuentes.</p>
          </div>
          <button type="button" className="ui-button ui-button--compact ui-button--ghost" onClick={onClose} aria-label="Cerrar paleta">
            Esc
          </button>
        </div>

        <input
          ref={inputRef}
          className="command-palette-input"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            } else if (event.key === 'ArrowDown') {
              event.preventDefault();
              setIndex((value) => Math.min(value + 1, Math.max(0, filtered.length - 1)));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setIndex((value) => Math.max(value - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
          }}
          placeholder="Buscar módulo, modo, acción o comando"
          aria-label="Buscar comando"
        />

        <div className="command-palette-hints" aria-hidden="true">
          <span>Ctrl+K</span>
          <span>Esc</span>
          <span>Enter</span>
          <span>↑ ↓</span>
        </div>

        <div className="command-palette-results" role="listbox" aria-label="Resultados de comandos">
          {filtered.length ? filtered.map((action, actionIndex) => (
            <button
              key={action.id}
              type="button"
              className={`command-palette-item ${actionIndex === index ? 'is-active' : ''}`}
              onMouseEnter={() => setIndex(actionIndex)}
              onClick={() => commit(actionIndex)}
              role="option"
              aria-selected={actionIndex === index}
              title={action.description || action.hint}
            >
              <span className="command-palette-item-title">
                <strong>{action.label}</strong>
                <small>{action.category}</small>
              </span>
              <span className="command-palette-item-hint">{action.hint}</span>
            </button>
          )) : (
            <div className="command-palette-empty">
              <strong>Sin coincidencias</strong>
              <p>Prueba con un nombre de módulo, `chat`, `manager` o `rail`.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
