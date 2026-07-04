import type { UiBootstrapSnapshot } from '@/contracts/backend';

interface Props {
  snapshot: UiBootstrapSnapshot | null;
  booting: boolean;
  lastMessage: string;
  openingLabel: string;
}

export function StatusBar(props: Props) {
  const snapshot = props.snapshot;
  const used = snapshot?.context.occupied;
  const limit = snapshot?.context.limit;
  return (
    <footer className="status-bar">
      <div className="status-bar-leading">
        <span className={`status-orb state-${props.booting ? 'loading' : snapshot?.system.state || 'unknown'}`} />
        <span>{props.lastMessage || props.openingLabel}</span>
      </div>
      <div className="status-bar-meta">
        <span>{snapshot?.session.id || 'sin sesión'}</span>
        <span>{snapshot?.model.provider || 'provider desconocido'}</span>
        <span>{used !== undefined && limit !== undefined ? `${used.toLocaleString()} / ${limit.toLocaleString()} tokens` : `contexto ${snapshot?.context.state || 'unknown'}`}</span>
      </div>
    </footer>
  );
}
