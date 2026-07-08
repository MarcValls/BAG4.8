import type { ActiveSection, UiAction, UiBootstrapSnapshot } from '@/contracts/backend';
import type { OpeningDecision } from '@/contracts/backend';
import { Icon, type IconName } from '@/shared/Icon';

function sectionStatus(id: ActiveSection, snapshot: UiBootstrapSnapshot | null): 'ok' | 'warn' | 'error' | 'unknown' {
  if (!snapshot) return 'unknown';
  switch (id) {
    case 'home':
      return snapshot.system.backendAvailable ? 'ok' : 'error';
    case 'chat':
      return snapshot.permissions.canChat ? 'ok' : snapshot.system.backendAvailable ? 'warn' : 'error';
    case 'workspace':
      return snapshot.workspace.manifestState === 'valid' ? 'ok'
        : snapshot.workspace.manifestState === 'legacy' ? 'warn'
        : snapshot.workspace.manifestState === 'invalid' ? 'error'
        : 'unknown';
    case 'graph':
      return snapshot.context.state === 'confirmed' ? 'ok'
        : snapshot.context.state === 'partial' ? 'warn'
        : snapshot.context.state === 'blocked' ? 'error'
        : 'unknown';
    case 'pipeline':
      return snapshot.session.state === 'valid' ? 'ok'
        : snapshot.session.state === 'recoverable' ? 'warn'
        : snapshot.session.state === 'blocked' ? 'error'
        : 'unknown';
    case 'evidence':
      return snapshot.session.state === 'valid' ? 'ok' : 'unknown';
    case 'context':
      return snapshot.context.state === 'confirmed' ? 'ok'
        : snapshot.context.state === 'stale' ? 'warn'
        : snapshot.context.state === 'blocked' ? 'error'
        : 'unknown';
    case 'system':
      return snapshot.system.state === 'ok' || snapshot.system.state === 'confirmed' ? 'ok'
        : snapshot.system.state === 'degraded' ? 'warn'
        : snapshot.system.state === 'error' ? 'error'
        : 'unknown';
    case 'providers':
      return snapshot.model.state === 'confirmed' ? 'ok'
        : snapshot.model.state === 'degraded' ? 'warn'
        : snapshot.model.state === 'error' ? 'error'
        : 'unknown';
    default:
      return 'unknown';
  }
}

const SECTIONS: Array<{ id: ActiveSection; label: string; icon: IconName }> = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'chat', label: 'Chat', icon: 'chat' },
  { id: 'workspace', label: 'Workspace', icon: 'workspace' },
  { id: 'graph', label: 'Nodos', icon: 'graph' },
  { id: 'pipeline', label: 'Pipeline', icon: 'pipeline' },
  { id: 'evidence', label: 'Evidencia', icon: 'evidence' },
  { id: 'context', label: 'Contexto', icon: 'context' },
  { id: 'system', label: 'Sistema', icon: 'system' },
  { id: 'providers', label: 'Proveedores', icon: 'model' }
];

interface Props {
  activeSection: ActiveSection;
  snapshot: UiBootstrapSnapshot | null;
  opening: OpeningDecision;
  actions: UiAction[];
  workspaceHint?: string;
  collapsed: boolean;
  onNavigate: (section: ActiveSection) => void;
  onRunAction: (action: UiAction) => void;
}

export function MainSidebar(props: Props) {
  const visibleActions = props.actions.filter((action) => action.visible && action.enabled).slice(0, 2);
  const workspaceState = props.snapshot?.workspace.linkedToSession
    ? 'Vinculado'
    : props.workspaceHint
      ? props.workspaceHint
      : props.opening.label;

  return (
    <aside className={`main-sidebar ${props.collapsed ? 'is-collapsed' : ''}`} aria-label="Navegación principal">
      <nav className="sidebar-nav">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`sidebar-item ${props.activeSection === section.id ? 'is-active' : ''}`}
            aria-current={props.activeSection === section.id ? 'page' : undefined}
            title={props.collapsed ? section.label : undefined}
            onClick={() => props.onNavigate(section.id)}
          >
            <Icon name={section.icon} />
            {!props.collapsed && <span>{section.label}</span>}
            <span className={`sidebar-status-dot status-${sectionStatus(section.id, props.snapshot)}`} />
            {props.activeSection === section.id && <span className="sidebar-active-mark" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      {!props.collapsed && visibleActions.length > 0 && (
        <section className="sidebar-actions" aria-label="Acciones recomendadas">
          <div className="sidebar-section-title">Siguiente</div>
          {visibleActions.map((action) => (
            <button key={action.id} type="button" onClick={() => props.onRunAction(action)}>
              <span>{action.label}</span>
              <Icon name="chevron" size={15} />
            </button>
          ))}
        </section>
      )}

      <div className="sidebar-status" title={workspaceState}>
        <span className={`status-orb state-${props.snapshot?.system.state || 'unknown'}`} />
        {!props.collapsed && (
          <div>
            <strong>{props.snapshot?.workspace.id || props.workspaceHint || 'BAGO'}</strong>
            <span>{workspaceState}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
