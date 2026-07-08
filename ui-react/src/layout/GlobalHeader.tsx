import type { ActiveSection, UiBootstrapSnapshot } from '@/contracts/backend';
import { Icon } from '@/shared/Icon';

interface Props {
  snapshot: UiBootstrapSnapshot | null;
  workspaceHint?: string;
  apiBase: string;
  apiToken: string;
  activeSection: ActiveSection;
  onApiConfigChange: (patch: { apiBase?: string; apiToken?: string }) => void;
  onOpenPalette: () => void;
  onToggleSidebar: () => void;
  onRefresh: () => void;
  onSetMode: (mode: 'normal' | 'focus' | 'review') => void;
  onRunCommand: (command: string) => void;
  onChooseWorkspace: () => void;
  globalMode: 'normal' | 'focus' | 'review';
  sidebarCollapsed: boolean;
}

const sectionLabels: Record<ActiveSection, string> = {
  home: 'Inicio',
  chat: 'Chat',
  workspace: 'Workspace',
  graph: 'Nodos',
  pipeline: 'Pipeline',
  evidence: 'Evidencia',
  context: 'Contexto',
  system: 'Sistema',
  providers: 'Proveedores'
};

function StatePill({ state }: { state: string }) {
  return (
    <span className={`header-state state-${state}`}>
      <span className="status-dot" />
      {state}
    </span>
  );
}

export function GlobalHeader(props: Props) {
  const workspace = props.snapshot?.workspace.id || props.workspaceHint || 'Sin workspace';
  const model = props.snapshot?.model.effectiveModel || props.snapshot?.model.configuredModel || 'Modelo desconocido';
  const state = props.snapshot?.system.state || 'unknown';

  if (props.globalMode === 'focus') {
    return (
      <header className="global-header focus-header">
        <div className="header-brand compact">
          <div className="brand-mark">B</div>
          <div>
            <strong>Focus</strong>
            <span>{sectionLabels[props.activeSection]} · {workspace}</span>
          </div>
        </div>
        <div className="focus-header-actions">
          <button className="header-button" type="button" onClick={props.onOpenPalette}>
            <Icon name="actions" /> Cambiar tarea
          </button>
          <button className="header-button" type="button" onClick={props.onChooseWorkspace} title="Elegir workspace">
            <Icon name="folder" /> Workspace
          </button>
          <button className="primary-button compact" type="button" onClick={() => props.onSetMode('normal')}>
            Salir de Focus
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className={`global-header mode-${props.globalMode}`}>
      <div className="header-leading">
        <button className="icon-button" type="button" onClick={props.onToggleSidebar} title={props.sidebarCollapsed ? 'Mostrar navegación' : 'Ocultar navegación'}>
          <Icon name="menu" />
        </button>
        <div className="header-brand">
          <div className="brand-mark">B</div>
          <div>
            <strong>BAGO</strong>
            <span>{workspace}</span>
          </div>
        </div>
        <div className="header-divider" />
        <div className="header-location">
          <span>{sectionLabels[props.activeSection]}</span>
          {props.snapshot?.system.objective && <small>{props.snapshot.system.objective}</small>}
        </div>
      </div>

      <div className="header-actions">
        <StatePill state={state} />
        <div className="model-chip" title={`${props.snapshot?.model.provider || 'provider desconocido'} · ${model}`}>
          <Icon name="model" />
          <span>{model}</span>
        </div>
        <button className="header-button" type="button" onClick={props.onOpenPalette}>
          <Icon name="search" />
          <span>Buscar</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button className="header-button" type="button" onClick={props.onChooseWorkspace} title="Elegir workspace">
          <Icon name="folder" />
          <span>Workspace</span>
        </button>
        <button className="header-button" type="button" onClick={props.onOpenPalette}>
          <Icon name="actions" />
          <span>Acciones</span>
        </button>
        <button
          className={`header-button ${props.globalMode === 'review' ? 'is-active' : ''}`}
          type="button"
          aria-pressed={props.globalMode === 'review'}
          onClick={() => props.onSetMode(props.globalMode === 'review' ? 'normal' : 'review')}
        >
          <Icon name="review" />
          <span>{props.globalMode === 'review' ? 'Salir de revisión' : 'Revisión'}</span>
        </button>
        <button className="icon-button" type="button" onClick={() => props.onSetMode('focus')} title="Modo Focus">
          <Icon name="focus" />
        </button>
        <details className="header-connection">
          <summary className="icon-button" title="Conexión y actualización">
            <Icon name="more" />
          </summary>
          <div className="connection-popover">
            <div className="connection-popover-head">
              <div>
                <strong>Conexión</strong>
                <span>{props.snapshot?.system.backendAvailable ? 'Backend accesible' : 'Backend no disponible'}</span>
              </div>
              <button className="icon-button" type="button" onClick={props.onRefresh} title="Actualizar">
                <Icon name="refresh" />
              </button>
            </div>
            <label>
              <span>API base</span>
              <input value={props.apiBase} onChange={(event) => props.onApiConfigChange({ apiBase: event.target.value })} />
            </label>
            <label>
              <span>Token</span>
              <input type="password" value={props.apiToken} onChange={(event) => props.onApiConfigChange({ apiToken: event.target.value })} />
            </label>
            <div className="connection-command-row">
              <button type="button" onClick={() => props.onRunCommand('/status')}>Estado</button>
              <button type="button" onClick={() => props.onRunCommand('/session')}>Sesión</button>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
