import type { ReactNode } from 'react';
import type { ActiveSection, UiBootstrapSnapshot } from '@/contracts/backend';

const copy: Record<ActiveSection, { title: string; eyebrow: string; description: string }> = {
  home: { title: 'Centro operativo', eyebrow: 'Inicio', description: 'Acceso directo al chat, al workspace y a la revisión.' },
  chat: { title: 'Conversación', eyebrow: 'Chat', description: 'El punto de entrada para preguntar, decidir y ejecutar acciones.' },
  workspace: { title: 'Workspace', eyebrow: 'Trabajo estructurado', description: 'Proyecto, sesiones y artefactos dentro del alcance autorizado.' },
  graph: { title: 'Nodos', eyebrow: 'Relaciones', description: 'Subgrafo relevante del contexto y de los componentes activos.' },
  pipeline: { title: 'Pipeline', eyebrow: 'Ejecución', description: 'Estado de los pasos, bloqueos y evidencias asociadas.' },
  evidence: { title: 'Evidencia', eyebrow: 'Trazabilidad', description: 'Receipts, claims e historial verificable bajo demanda.' },
  context: { title: 'Contexto', eyebrow: 'Presupuesto', description: 'Uso, reserva, límite y factor limitante del contexto.' },
  system: { title: 'Sistema', eyebrow: 'Salud general', description: 'Backend, sesión, modelo, herramientas, permisos y bridges.' }
};

interface Props {
  activeSection: ActiveSection;
  snapshot: UiBootstrapSnapshot | null;
  mode: 'normal' | 'focus' | 'review';
  children: ReactNode;
}

export function WorkspaceShell(props: Props) {
  return (
    <section className={`workspace-shell mode-${props.mode} section-${props.activeSection}`} data-section={props.activeSection}>
      <div className="surface-body">{props.children}</div>
    </section>
  );
}
