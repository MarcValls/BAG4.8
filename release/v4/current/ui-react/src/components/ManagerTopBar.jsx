import './ManagerTopBar.css';
import { MANAGER_MODULES } from '../managerConfig';

function basename(value) {
  const normalized = String(value || '').replace(/\\/g, '/').replace(/\/+$/, '');
  return normalized ? normalized.split('/').pop() : 'No recibido';
}

export default function ManagerTopBar({ snapshot, orchestrator, onRefresh, onOpenPalette, onEnterReview, reviewMode, refreshing, eventConnected }) {
  const authorities = snapshot?.authorities || {};
  const task = snapshot?.task || {};
  const model = snapshot?.model || {};
  const surface = orchestrator.surface || (orchestrator.chatVisible ? 'chat' : 'manager');
  const activeContext = surface === 'chat' ? 'Global' : orchestrator.activeDefinition.label;
  const moduleStatuses = MANAGER_MODULES.map((module) => snapshot?.centers?.[module.id]?.status || 'unknown');
  const healthyCount = moduleStatuses.filter((status) => ['ready', 'confirmed', 'done', 'running'].includes(status)).length;

  return (
    <header className="manager-topbar">
      <div className="topbar-context">
        <span className="ui-kicker">Una interfaz · un estado · un dispatcher</span>
        <div className="topbar-title-row">
          <h1>{task.objective || 'BAGO Manager'}</h1>
          <span className={`ui-pill state-${snapshot?.connection?.status || 'unknown'}`}>
            {snapshot?.connection?.status || 'unknown'}
          </span>
        </div>
        <div className="topbar-facts">
          <span title={authorities.project_root || ''}>project: {basename(authorities.project_root)}</span>
          <span title={authorities.workspace_root || ''}>workspace: {basename(authorities.workspace_root)}</span>
          <span>{model.effective_model || model.configured_model || 'modelo no recibido'}</span>
          <span>{eventConnected ? 'eventos conectados' : 'eventos desconectados'}</span>
        </div>
        {reviewMode ? null : (
          <div className="topbar-system-strip" aria-label="Módulos del sistema">
            <span className="topbar-system-summary">
              <strong>{healthyCount}/{MANAGER_MODULES.length}</strong>
              <small>módulos operativos</small>
            </span>
            <span className="topbar-system-guidance">
              <strong>Destino único</strong>
              <small>El rail lateral concentra la navegación de módulos.</small>
            </span>
          </div>
        )}
      </div>

      <div className="topbar-controls" aria-label="Consola de control">
        <div className="topbar-rack topbar-rack--modes" role="tablist" aria-label="Secciones principales">
          <button
            type="button"
            className={`ui-button ui-button--compact ui-button--tab topbar-switch ${surface === 'chat' ? 'is-active' : ''}`}
            onClick={orchestrator.focusChat}
            aria-pressed={surface === 'chat'}
          >
            <span className="topbar-switch-mark" aria-hidden="true">●</span>
            Chat
          </button>
          <button
            type="button"
            className={`ui-button ui-button--compact ui-button--tab topbar-switch ${surface === 'manager' ? 'is-active' : ''}`}
            onClick={() => orchestrator.focusManager(orchestrator.activeModule)}
            aria-pressed={surface === 'manager'}
          >
            <span className="topbar-switch-mark" aria-hidden="true">●</span>
            Menú
          </button>
          <button
            type="button"
            className={`ui-button ui-button--compact ui-button--tab topbar-switch ${reviewMode ? 'is-active' : ''}`}
            onClick={onEnterReview}
            aria-pressed={reviewMode}
          >
            <span className="topbar-switch-mark" aria-hidden="true">●</span>
            Review
          </button>
        </div>

        <div className="topbar-rack topbar-rack--context" aria-label="Contexto activo">
          <span className="topbar-label">{surface === 'manager' ? 'Módulo' : 'Contexto'}</span>
          <strong>{activeContext}</strong>
        </div>

        <div className="topbar-rack topbar-rack--switches">
          <button type="button" className="ui-button ui-button--compact ui-button--ghost" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button type="button" className="ui-button ui-button--compact ui-button--ghost" onClick={onOpenPalette} aria-label="Abrir paleta de comandos">
            Buscar
          </button>
        </div>
      </div>
    </header>
  );
}
