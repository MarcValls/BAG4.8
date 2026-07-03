import './ModuleRail.css';
import { MANAGER_GROUPS, MANAGER_MODULES } from '../managerConfig';

export default function ModuleRail({ orchestrator, snapshot, onRefresh, refreshing }) {
  const authorities = snapshot?.authorities || {};
  const connection = snapshot?.connection || {};

  return (
    <aside className={`module-rail ${orchestrator.railCollapsed ? 'is-collapsed' : ''}`} aria-label="Modulos del manager">
      <div className="rail-brand">
        <div className="rail-mark" aria-hidden="true">◉</div>
        <div className="rail-brand-copy">
          <strong>BAGO</strong>
          <span>Manager unificado</span>
        </div>
        <button
          type="button"
          className="ui-button ui-button--icon ui-button--ghost rail-collapse"
          onClick={() => orchestrator.setRailCollapsed(!orchestrator.railCollapsed)}
          aria-label={orchestrator.railCollapsed ? 'Expandir navegacion' : 'Contraer navegacion'}
          title={orchestrator.railCollapsed ? 'Expandir navegacion' : 'Contraer navegacion'}
        >
          {orchestrator.railCollapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="rail-modules">
        {MANAGER_GROUPS.map((group) => {
          const modules = MANAGER_MODULES.filter((module) => module.group === group.id);
          if (!modules.length) return null;
          return (
            <section className="rail-module-group" key={group.id} aria-label={group.label}>
              <span className="rail-group-label">{group.label}</span>
              {modules.map((module) => {
                const active = orchestrator.panelOpen && orchestrator.activeModule === module.id;
                const centerStatus = snapshot?.centers?.[module.id]?.status;
                return (
                  <button
                    key={module.id}
                    type="button"
                    className={`ui-button ui-button--tab ui-button--ghost rail-module ${active ? 'is-active' : ''}`}
                    onClick={() => orchestrator.openModule(module.id)}
                    title={`${module.label}: ${module.description}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="rail-module-icon" aria-hidden="true">
                      <span className="rail-module-core">{module.icon || module.short}</span>
                      <span className={`rail-module-led state-${centerStatus || 'unknown'}`} />
                    </span>
                    <span className="rail-module-copy">
                      <strong>{module.label}</strong>
                      <small>{module.description}</small>
                    </span>
                    {centerStatus ? <i className={`rail-state state-${centerStatus}`} aria-label={centerStatus} /> : null}
                  </button>
                );
              })}
            </section>
          );
        })}
      </nav>

      <div className="rail-footer">
        <button type="button" className="ui-button ui-button--tab ui-button--ghost" onClick={onRefresh} disabled={refreshing} title="Actualizar snapshot del backend">
          <span className="rail-module-icon" aria-hidden="true">
            <span className="rail-module-core">↻</span>
            <span className="rail-module-led state-ready" />
          </span>
          <span className="rail-module-copy"><strong>Actualizar</strong><small>{refreshing ? 'Consultando backend' : 'Recargar estado'}</small></span>
        </button>
        <div className="rail-runtime">
          <span className={`connection-dot state-${connection.status || 'unknown'}`} />
          <div>
            <strong>{connection.status || 'unknown'}</strong>
            <small>{authorities.workspace_id || 'sin workspace confirmado'}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
