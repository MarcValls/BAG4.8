import type { ActiveSection, UiAction, UiBootstrapSnapshot } from '@/contracts/backend';
import type { OpeningDecision } from '@/contracts/backend';
import { Icon, type IconName } from '@/shared/Icon';

const SECTIONS: Array<{ id: ActiveSection; label: string; icon: IconName }> = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'chat', label: 'Chat', icon: 'chat' },
  { id: 'workspace', label: 'Workspace', icon: 'workspace' },
  { id: 'graph', label: 'Nodos', icon: 'graph' },
  { id: 'pipeline', label: 'Pipeline', icon: 'pipeline' },
  { id: 'evidence', label: 'Evidencia', icon: 'evidence' },
  { id: 'context', label: 'Contexto', icon: 'context' },
  { id: 'system', label: 'Sistema', icon: 'system' }
];

interface Props {
  activeSection: ActiveSection;
  snapshot: UiBootstrapSnapshot | null;
  opening: OpeningDecision;
  actions: UiAction[];
  collapsed: boolean;
  onNavigate: (section: ActiveSection) => void;
  onRunAction: (action: UiAction) => void;
}

export function MainSidebar(props: Props) {
  const visibleActions = props.actions.filter((action) => action.visible && action.enabled).slice(0, 2);
  const workspaceState = props.snapshot?.workspace.linkedToSession ? 'Vinculado' : props.opening.label;

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
            <strong>{props.snapshot?.workspace.id || 'BAGO'}</strong>
            <span>{workspaceState}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
