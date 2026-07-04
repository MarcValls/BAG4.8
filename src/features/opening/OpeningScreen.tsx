import type { OpeningDecision, UiBootstrapSnapshot } from '@/contracts/backend';
import { Icon } from '@/shared/Icon';

interface Props {
  snapshot: UiBootstrapSnapshot | null;
  opening: OpeningDecision;
  booting: boolean;
  apiBase: string;
  apiToken: string;
  onApiConfigChange: (patch: { apiBase?: string; apiToken?: string }) => void;
  onPrimary: () => void;
  onContinue: () => void;
  onExplore: () => void;
  onOpenPalette: () => void;
  onRefresh: () => void;
}

function stateLabel(snapshot: UiBootstrapSnapshot | null): string {
  if (!snapshot) return 'Comprobando';
  if (!snapshot.system.backendAvailable) return 'Sin conexión';
  if (snapshot.system.state === 'confirmed') return 'Confirmado';
  if (snapshot.system.state === 'degraded') return 'Degradado';
  if (snapshot.system.state === 'blocked') return 'Bloqueado';
  if (snapshot.system.state === 'error') return 'Error';
  return 'Desconocido';
}

export function OpeningScreen(props: Props) {
  const workspace = props.snapshot?.workspace.id || props.snapshot?.workspace.root || 'No confirmado';
  const model = props.snapshot?.model.effectiveModel || props.snapshot?.model.configuredModel || 'No confirmado';
  const state = stateLabel(props.snapshot);
  const isOffline = !props.snapshot?.system.backendAvailable;

  return (
    <main className="opening-screen">
      <div className="opening-backdrop" aria-hidden="true" />
      <section className="opening-card" aria-labelledby="opening-title">
        <div className="opening-brand-row">
          <div className="opening-logo">B</div>
          <div>
            <div className="opening-brand">BAGO</div>
            <div className="opening-version">Control Plane {props.snapshot?.framework.version || '4.8'}</div>
          </div>
          <button className="icon-button opening-command" type="button" onClick={props.onOpenPalette} title="Comandos rápidos">
            <Icon name="command" />
            <span>Ctrl+K</span>
          </button>
        </div>

        <div className="opening-copy">
          <span className={`status-badge state-${props.snapshot?.system.state || 'loading'}`}>
            <span className="status-dot" />
            {props.booting ? 'Conectando' : state}
          </span>
          <h1 id="opening-title">{props.opening.label}</h1>
          <p>{props.opening.reason}</p>
        </div>

        <div className="opening-facts">
          <div>
            <span>Backend</span>
            <strong>{props.snapshot?.system.backendAvailable ? props.apiBase : 'No disponible'}</strong>
          </div>
          <div>
            <span>Workspace</span>
            <strong>{workspace}</strong>
          </div>
          <div>
            <span>Modelo</span>
            <strong>{model}</strong>
          </div>
        </div>

        <div className="opening-mode-switch" aria-label="Modo inicial">
          <button type="button" className="is-active" onClick={props.onPrimary}>
            <Icon name="chat" /> Conversar
          </button>
          <button type="button" onClick={props.onExplore}>
            <Icon name="workspace" /> Workspace
          </button>
          <button type="button" onClick={props.onExplore}>
            <Icon name="review" /> Revisar
          </button>
        </div>

        <div className="opening-actions">
          <button className="primary-button" type="button" onClick={props.onPrimary} disabled={props.booting}>
            {props.opening.actionLabel}
            <Icon name="arrowRight" />
          </button>
          <button className="secondary-button" type="button" onClick={props.onContinue} disabled={props.booting || isOffline}>
            Continuar última
          </button>
          <button className="ghost-button" type="button" onClick={props.onExplore}>
            Explorar
          </button>
          <button className="icon-button" type="button" onClick={props.onRefresh} title="Reintentar conexión">
            <Icon name="refresh" />
          </button>
        </div>

        {isOffline && (
          <details className="opening-connection">
            <summary>Configurar conexión</summary>
            <div className="connection-grid">
              <label>
                <span>API base</span>
                <input value={props.apiBase} onChange={(event) => props.onApiConfigChange({ apiBase: event.target.value })} />
              </label>
              <label>
                <span>Token</span>
                <input type="password" value={props.apiToken} onChange={(event) => props.onApiConfigChange({ apiToken: event.target.value })} />
              </label>
            </div>
          </details>
        )}
      </section>
    </main>
  );
}
