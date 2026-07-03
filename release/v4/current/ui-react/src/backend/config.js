const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const envApiBase = import.meta.env.VITE_BAGO_API_URL || import.meta.env.VITE_BAGO_API_BASE || '';
const defaultApiBase = '';

/**
 * Configuración de integración. Por defecto usa el mismo origen que la UI.
 * No hay fallback a datos locales ni a respuestas simuladas.
 */
export const backendConfig = Object.freeze({
  apiBase: trimTrailingSlash(envApiBase || defaultApiBase),
  bootstrapPath: import.meta.env.VITE_BAGO_BOOTSTRAP_PATH || '/api/v1/ui/bootstrap',
  commandPath: import.meta.env.VITE_BAGO_COMMAND_PATH || '/api/v1/commands',
  eventsPath: import.meta.env.VITE_BAGO_EVENTS_PATH || '/api/v1/events',
  credentials: import.meta.env.VITE_BAGO_CREDENTIALS || 'same-origin',
  requestTimeoutMs: Number(import.meta.env.VITE_BAGO_REQUEST_TIMEOUT_MS || 15000),
  eventsEnabled: import.meta.env.VITE_BAGO_EVENTS_ENABLED !== 'false',
});

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${backendConfig.apiBase}${path}`;
}
