import './ManagerStatusStrip.css';

export default function ManagerStatusStrip({ snapshot, orchestrator, pending }) {
  const authorities = snapshot?.authorities || {};
  const context = snapshot?.context || {};
  const model = snapshot?.model || {};
  const status = pending ? 'running' : snapshot?.connection?.status || 'unknown';
  const surface = orchestrator.surface || (orchestrator.chatVisible ? 'chat' : 'manager');
  const railState = orchestrator.railCollapsed ? 'collapsed' : 'open';
  const contextConfigured = Number(context.configured_context) || 0;
  const contextOccupied = Number(context.occupied_context) || 0;
  const contextFill = contextConfigured > 0 ? Math.min(100, Math.round((contextOccupied / contextConfigured) * 100)) : 0;
  const contextLabel = contextConfigured > 0 ? `${contextOccupied}/${contextConfigured}` : 'No recibido';
  const modelLabel = model.effective_model || model.configured_model || 'No recibido';
  return (
    <footer className="manager-status-strip" aria-label="Telemetria compacta del manager">
      <div className="status-rack status-rack--signal">
        <span className={`status-led state-${status}`} aria-hidden="true" />
        <div className="status-rack-copy">
          <strong>{status}</strong>
          <small>{pending ? 'ejecutando' : 'backend conectado'}</small>
        </div>
      </div>

      <div className="status-rack status-rack--readout">
        <span>modulo {orchestrator.activeDefinition.label}</span>
        <span>surface {surface}</span>
        <span>rail {railState}</span>
      </div>

      <div className="status-rack status-rack--meter">
        <span className="status-rack-label">ctx</span>
        <div className="status-meter" aria-label={`Contexto ${contextLabel}`}>
          <i className="status-meter-fill" style={{ width: `${contextFill}%` }} />
        </div>
        <span className="status-rack-value">{contextLabel}</span>
      </div>

      <div className="status-rack status-rack--signals">
        <span title={authorities.session_id || ''}>session {authorities.session_id || 'No recibido'}</span>
        <span>ctx rev {authorities.context_revision ?? 'No recibido'}</span>
        <span title={modelLabel}>model {modelLabel}</span>
        <span>available {context.available_context ?? 'No recibido'}</span>
      </div>
    </footer>
  );
}
