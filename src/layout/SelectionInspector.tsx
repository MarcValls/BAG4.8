import type { InspectorLevel, SelectionRecord } from '@/contracts/backend';
import { Icon } from '@/shared/Icon';

const LEVELS: Array<{ id: InspectorLevel; label: string }> = [
  { id: 'summary', label: 'Resumen' },
  { id: 'detail', label: 'Detalle' },
  { id: 'raw', label: 'Raw' }
];

interface Props {
  selection: SelectionRecord;
  inspectorLevel: InspectorLevel;
  onLevelChange: (level: InspectorLevel) => void;
  onClose: () => void;
}

export function SelectionInspector({ selection, inspectorLevel, onLevelChange, onClose }: Props) {
  return (
    <aside className="selection-inspector" aria-label="Inspector de selección">
      <header className="inspector-header">
        <div>
          <span className="surface-eyebrow">Inspector</span>
          <h2>{selection.title}</h2>
          <p>{selection.kind} · {selection.id}</p>
        </div>
        <button className="icon-button" type="button" onClick={onClose} title="Cerrar inspector">
          <Icon name="close" />
        </button>
      </header>

      <div className="inspector-levels" role="tablist" aria-label="Nivel de detalle">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            role="tab"
            aria-selected={inspectorLevel === level.id}
            className={inspectorLevel === level.id ? 'is-active' : ''}
            onClick={() => onLevelChange(level.id)}
          >
            {level.label}
          </button>
        ))}
      </div>

      <div className="inspector-content">
        <section className="inspector-summary-card">
          <span>Resumen</span>
          <p>{selection.summary}</p>
        </section>

        {inspectorLevel !== 'summary' && (
          <section className="inspector-detail">
            <h3>Detalles</h3>
            <dl>
              {selection.detail.map((line, index) => {
                const separator = line.indexOf(':');
                const key = separator >= 0 ? line.slice(0, separator) : `Dato ${index + 1}`;
                const value = separator >= 0 ? line.slice(separator + 1).trim() : line;
                return (
                  <div key={`${line}-${index}`}>
                    <dt>{key}</dt>
                    <dd>{value || '—'}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}

        {inspectorLevel === 'raw' && (
          <section className="inspector-raw">
            <div className="technical-warning"><Icon name="warning" /> Datos técnicos sin procesar</div>
            <pre>{JSON.stringify(selection.raw, null, 2)}</pre>
          </section>
        )}
      </div>
    </aside>
  );
}
