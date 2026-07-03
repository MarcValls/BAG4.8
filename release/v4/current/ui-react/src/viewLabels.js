/**
 * viewLabels.js — shared manager view label map.
 *
 * Used by useManagerContext and ManagerOverlay so they don't each
 * carry their own copy of the same dict.
 */

export const VIEW_LABELS = {
  patch: 'Patch Bay',
  installations: 'Instalaciones',
  matrix: 'Matriz',
  pieces: 'Piezas',
  releases: 'Releases',
  jobs: 'Trabajos',
  sessions: 'Sesiones',
  system: 'Sistema',
  health: 'Salud',
  audit: 'Auditoría',
  bago: 'BAGO Chat',
}