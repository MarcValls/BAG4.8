import type {
  BackendCommandResult,
  BackendHistory,
  BackendMenu,
  BackendProviders,
  BackendRoutes,
  BackendSession,
  BackendStatus,
  UiBootData
} from '@/contracts/backend';

const FALLBACK_BASE = 'http://127.0.0.1:8080';
const STORAGE_BASE = 'bago.ui.apiBase';
const STORAGE_TOKEN = 'bago.ui.apiToken';

export function resolveDefaultApiBase(): string {
  if (typeof window === 'undefined') {
    return FALLBACK_BASE;
  }
  const envBase = import.meta.env.VITE_BAGO_API_BASE as string | undefined;
  if (envBase && envBase.trim()) {
    return envBase.trim().replace(/\/+$/, '');
  }
  const host = window.location.hostname;
  const port = window.location.port;
  if (window.location.protocol === 'file:') {
    return FALLBACK_BASE;
  }
  if (host === '127.0.0.1' || host === 'localhost') {
    if (port && port !== '8080' && port !== '80' && port !== '443') {
      return FALLBACK_BASE;
    }
  }
  return window.location.origin.replace(/\/+$/, '');
}

export function readStoredApiBase(): string {
  return typeof window === 'undefined' ? FALLBACK_BASE : localStorage.getItem(STORAGE_BASE) || resolveDefaultApiBase();
}

export function readStoredApiToken(): string {
  return typeof window === 'undefined' ? '' : localStorage.getItem(STORAGE_TOKEN) || (import.meta.env.VITE_BAGO_TOKEN as string | undefined) || '';
}

export function persistApiConfig(apiBase: string, apiToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_BASE, apiBase.trim().replace(/\/+$/, ''));
  localStorage.setItem(STORAGE_TOKEN, apiToken.trim());
}

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

class BagoHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'BagoHttpError';
    this.status = status;
  }
}

function shouldFallbackToLegacy(error: unknown): boolean {
  if (error instanceof BagoHttpError) {
    return [404, 405, 501].includes(error.status);
  }
  return error instanceof TypeError;
}

export class BagoClient {
  constructor(
    private apiBase: string,
    private apiToken: string
  ) {}

  setConfig(apiBase: string, apiToken: string): void {
    this.apiBase = apiBase.trim().replace(/\/+$/, '');
    this.apiToken = apiToken.trim();
  }

  private headers(extra?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(extra || {})
    };
    if (this.apiToken) {
      headers['X-Bago-Token'] = this.apiToken;
    }
    headers['X-Bago-Channel'] = 'ui-react';
    return headers;
  }

  private url(path: string): string {
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiBase}${clean}`;
  }

  private modernUrl(path: string): string {
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiBase}/api/v1${clean}`;
  }

  async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers || {});
    for (const [key, value] of Object.entries(this.headers() as Record<string, string>)) {
      headers.set(key, value);
    }
    const response = await fetch(this.url(path), {
      ...init,
      headers
    });
    if (!response.ok) {
      throw new BagoHttpError(response.status, `HTTP ${response.status} ${response.statusText}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async bootstrap(): Promise<UiBootData> {
    try {
      const modern = await this.request<UiBootData>('/api/v1/ui/bootstrap', { method: 'GET' });
      if (modern) {
        return modern;
      }
    } catch (error) {
      if (!shouldFallbackToLegacy(error)) {
        throw error;
      }
    }
    const [status, session, providers, menu, routes, history, files, evidence, jobs, schedule] = await Promise.all([
      this.getStatus().catch(() => undefined),
      this.getSession().catch(() => undefined),
      this.getProviders().catch(() => undefined),
      this.getMenu().catch(() => undefined),
      this.getRoutes().catch(() => undefined),
      this.getHistory().catch(() => undefined),
      this.listFiles().catch(() => undefined),
      this.getEvidenceLatest().catch(() => undefined),
      this.listJobs().catch(() => undefined),
      this.listSchedule().catch(() => undefined)
    ]);
    return { status, session, providers, menu, routes, history, files, evidence, jobs, schedule };
  }

  async bootstrapModern(): Promise<UiBootData> {
    return this.request<UiBootData>('/api/v1/ui/bootstrap', { method: 'GET' });
  }

  getStatus(): Promise<BackendStatus> {
    return this.request<BackendStatus>('/status', { method: 'GET' });
  }

  getSession(): Promise<BackendSession> {
    return this.request<BackendSession>('/session', { method: 'GET' });
  }

  getProviders(): Promise<BackendProviders> {
    return this.request<BackendProviders>('/providers', { method: 'GET' });
  }

  getModels(provider: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/models/${encodeURIComponent(provider)}`, { method: 'GET' });
  }

  getMenu(): Promise<BackendMenu> {
    return this.request<BackendMenu>('/menu', { method: 'GET' });
  }

  getRoutes(): Promise<BackendRoutes> {
    return this.request<BackendRoutes>('/routes', { method: 'GET' });
  }

  getHistory(): Promise<BackendHistory> {
    return this.request<BackendHistory>('/history', { method: 'GET' });
  }

  listFiles(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/files/list', { method: 'GET' });
  }

  getEvidenceLatest(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/evidence/latest', { method: 'GET' });
  }

  listEvidenceClaims(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/evidence/claims', { method: 'GET' });
  }

  listEvidenceReceipts(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/evidence/receipts', { method: 'GET' });
  }

  getEvidenceReceipt(receiptId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/evidence/receipts/${encodeURIComponent(receiptId)}`, { method: 'GET' });
  }

  getEvidenceClaim(claimId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/evidence/claims/${encodeURIComponent(claimId)}`, { method: 'GET' });
  }

  listJobs(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/jobs/list', { method: 'GET' });
  }

  getJob(executionId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/jobs/${encodeURIComponent(executionId)}`, { method: 'GET' });
  }

  cancelJob(executionId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/jobs/${encodeURIComponent(executionId)}/cancel`, { method: 'POST' });
  }

  retryJob(executionId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/jobs/${encodeURIComponent(executionId)}/retry`, { method: 'POST' });
  }

  listSchedule(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/schedule/list', { method: 'GET' });
  }

  readFile(filePath: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/files/read/${encodeURIComponent(filePath)}`, { method: 'GET' });
  }

  runCommand(command: string): Promise<BackendCommandResult> {
    const body = JSON.stringify({ command, channel: 'ui-react', surface: 'ui-react' });
    return this.request<BackendCommandResult>('/api/v1/commands', {
      method: 'POST',
      body
    }).catch((error) => {
      if (!shouldFallbackToLegacy(error)) {
        throw error;
      }
      return this.request<BackendCommandResult>('/command', {
        method: 'POST',
        body
      });
    });
  }

  runCommandLegacy(command: string): Promise<BackendCommandResult> {
    return this.request<BackendCommandResult>('/command', {
      method: 'POST',
      body: JSON.stringify({ command, channel: 'ui-react' })
    });
  }

  async sendChat(message: string): Promise<Record<string, unknown>> {
    const body = JSON.stringify({ message, channel: 'ui-react', surface: 'ui-react' });
    return this.request<Record<string, unknown>>('/chat', {
      method: 'POST',
      body
    });
  }

  async sendChatModern(message: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/api/v1/commands', {
      method: 'POST',
      body: JSON.stringify({ command: 'chat', message, channel: 'ui-react', surface: 'ui-react' })
    });
  }

  async streamChat(
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<Record<string, unknown>> {
    const response = await fetch(this.url('/chat/stream'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ message, channel: 'ui-react' })
    });
    if (!response.ok || !response.body) {
      return this.sendChat(message);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalPayload: Record<string, unknown> = {};
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index = buffer.indexOf('\n\n');
      while (index >= 0) {
        const packet = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 2);
        index = buffer.indexOf('\n\n');
        if (!packet.startsWith('data:')) {
          continue;
        }
        const payloadText = packet.slice(5).trim();
        if (!payloadText) continue;
        try {
          const payload = JSON.parse(payloadText) as Record<string, unknown>;
          if (typeof payload.chunk === 'string') {
            onChunk(payload.chunk);
          }
          finalPayload = payload;
        } catch {
          // ignore malformed packet
        }
      }
    }
    return finalPayload;
  }

  async streamEvents(
    onEvent: (eventName: string, payload: Record<string, unknown>) => void
  ): Promise<void> {
    const response = await fetch(this.modernUrl('/events'), {
      method: 'GET',
      headers: this.headers()
    });
    if (!response.ok || !response.body) {
      return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index = buffer.indexOf('\n\n');
      while (index >= 0) {
        const packet = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 2);
        index = buffer.indexOf('\n\n');
        if (!packet) continue;
        const lines = packet.split('\n');
        const eventLine = lines.find((line) => line.startsWith('event:'));
        const dataLine = lines.find((line) => line.startsWith('data:'));
        if (!dataLine) continue;
        const eventName = eventLine ? eventLine.slice(6).trim() : 'message';
        const payloadText = dataLine.slice(5).trim();
        if (!payloadText) continue;
        try {
          onEvent(eventName, JSON.parse(payloadText) as Record<string, unknown>);
        } catch {
          onEvent(eventName, { raw: payloadText });
        }
      }
    }
  }
}

export function createBagoClient(apiBase: string, apiToken: string): BagoClient {
  return new BagoClient(apiBase.trim().replace(/\/+$/, ''), apiToken);
}

export function jsonToText(value: unknown): string {
  if (value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function safeJson(value: unknown): JsonValue {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map((entry) => safeJson(entry)) as Array<unknown>;
  if (typeof value === 'object' && value) {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = safeJson(entry);
    }
    return out;
  }
  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return value as string | number | boolean;
  }
  return null;
}
