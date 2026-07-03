export const TURN_COMMAND_ID = import.meta.env.VITE_BAGO_TURN_COMMAND_ID || 'turn.submit';

export const MANAGER_GROUPS = Object.freeze([
  { id: 'operate', label: 'Operar' },
  { id: 'compose', label: 'Componer' },
  { id: 'verify', label: 'Verificar' },
  { id: 'system', label: 'Sistema' },
]);

export const MANAGER_MODULES = Object.freeze([
  { id: 'overview', group: 'operate', label: 'Resumen', short: 'R', icon: '◎', description: 'Estado operativo y acciones recomendadas.' },
  { id: 'workspace', group: 'operate', label: 'Workspace', short: 'W', icon: '▣', description: 'Proyecto, raices, alcance e indice.' },
  { id: 'sessions', group: 'operate', label: 'Sesiones', short: 'S', icon: '◷', description: 'Sesion activa e historial persistido.' },
  { id: 'patchbay', group: 'compose', label: 'Patchbay', short: 'X', icon: '⟠', description: 'Conecta agentes, tools, skills y piezas.' },
  { id: 'pipeline', group: 'compose', label: 'Pipeline', short: 'L', icon: '⇢', description: 'Pasos, trabajos y estado de ejecucion.' },
  { id: 'model', group: 'compose', label: 'Proveedores', short: 'P', icon: '◐', description: 'Provider, modelo y switch del orquestador.' },
  { id: 'tools', group: 'compose', label: 'Herramientas', short: 'T', icon: '⚙', description: 'Disponibilidad, aprobacion y ejecuciones.' },
  { id: 'reflexive', group: 'verify', label: 'Interprete', short: 'I', icon: '◌', description: 'Pregunta, intencion, formalizacion y auditoria.' },
  { id: 'roadmap', group: 'verify', label: 'Roadmap', short: 'M', icon: '✦', description: 'Iteraciones, fases y verificacion.' },
  { id: 'evidence', group: 'verify', label: 'Evidencia', short: 'E', icon: '◈', description: 'Claims, receipts, tests y trazabilidad.' },
  { id: 'context', group: 'system', label: 'Contexto', short: 'C', icon: '⊙', description: 'Presupuesto, envelope, receipt y revision.' },
  { id: 'files', group: 'system', label: 'Archivos', short: 'F', icon: '☰', description: 'Archivos y lectura disponibles.' },
  { id: 'system', group: 'system', label: 'Sistema', short: 'Y', icon: '⎔', description: 'Instalacion, bridge, salud y configuracion.' },
  { id: 'console', group: 'system', label: 'Consola', short: '>', icon: '⌘', description: 'Actividad y resultados del manager.' },
]);

export function moduleDefinition(id) {
  return MANAGER_MODULES.find((item) => item.id === id) || MANAGER_MODULES[0];
}
