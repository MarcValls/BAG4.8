import {
  COMMAND_CONTRACT_VERSION,
  SURFACE_ID,
  UI_CONTRACT_VERSION,
  assertCommandResultShape,
  assertSnapshotShape,
} from './contracts';
import { apiUrl, backendConfig } from './config';

const LEGACY_ROUTES = Object.freeze({
  status: '/status',
  session: '/session',
  history: '/history',
  providers: '/providers',
  menu: '/menu',
  modelsPrefix: '/models/',
  command: '/command',
  interpret: '/interpret',
  interpretHistory: '/interpret/history',
  interpretRules: '/interpret/rules',
});

const IGNORED_ARGUMENT_KEYS = new Set([
  'channel',
  'manager_context',
  'session_id',
  'workspace_id',
  'expected_state_revision',
  'approval_id',
  'idempotency_key',
  'requested_at',
  'source_surface',
  'contract_version',
  'request_id',
]);

export class BackendHttpError extends Error {
  constructor(message, { status, body, url } = {}) {
    super(message);
    this.name = 'BackendHttpError';
    this.status = status;
    this.body = body;
    this.url = url;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asObject(value) {
  return isObject(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const out = String(value).trim();
  return out || fallback;
}

function lower(value) {
  return text(value).toLowerCase();
}

function statusFromValue(value, fallback = 'unknown') {
  const valueText = lower(value);
  if (!valueText) return fallback;
  if (['confirmed', 'verified', 'ready', 'done', 'ok', 'active', 'connected', 'green', 'linked_confirmed'].includes(valueText)) return 'confirmed';
  if (['loading', 'pending', 'running'].includes(valueText)) return valueText;
  if (['degraded', 'warn', 'warning', 'blocked', 'partial', 'yellow', 'orange'].includes(valueText)) return 'degraded';
  if (['error', 'failed', 'rejected', 'invalid'].includes(valueText)) return 'error';
  return valueText;
}

function stateFromBoolean(value, truthy = 'confirmed', falsy = 'unknown') {
  if (typeof value !== 'boolean') return falsy;
  return value ? truthy : falsy;
}

function providerDescription(item, modelCount) {
  if (item.configured === false) return 'credenciales no configuradas';
  if (modelCount > 0) return `${modelCount} modelos reales`;
  if (item.configured === true) return 'configurado sin catalogo recibido';
  return 'estado no recibido';
}

function modelDescription(modelItem) {
  const parts = [
    modelItem.best_for ? `uso: ${modelItem.best_for}` : '',
    modelItem.context_tokens ? `ctx ${modelItem.context_tokens}` : '',
    modelItem.max_output_tokens ? `out ${modelItem.max_output_tokens}` : '',
    modelItem.cost ? `coste ${modelItem.cost}` : '',
  ].filter(Boolean);
  return text(modelItem.description || modelItem.summary || parts.join(' · ') || modelItem.wire_name || '');
}

function makeId(prefix = 'id') {
  const uuid = globalThis.crypto?.randomUUID?.();
  return `${prefix}-${uuid || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

async function readResponseBody(response) {
  const type = response.headers.get('content-type') || '';
  if (type.includes('application/json')) return response.json();
  const body = await response.text();
  return body ? { message: body } : null;
}

async function requestJson(path, options = {}) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), backendConfig.requestTimeoutMs);
  const url = apiUrl(path);

  try {
    const response = await fetch(url, {
      ...options,
      credentials: backendConfig.credentials,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });

    const body = await readResponseBody(response);
    if (!response.ok) {
      throw new BackendHttpError(
        body?.message || body?.error?.message || body?.error || `Backend HTTP ${response.status}`,
        { status: response.status, body, url },
      );
    }
    return body;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new BackendHttpError('Tiempo de espera agotado al conectar con el backend.', { url });
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function safeRequestJson(path, options = {}) {
  try {
    return { ok: true, value: await requestJson(path, options) };
  } catch (error) {
    return { ok: false, error };
  }
}

function normalizeMessage(message, index) {
  if (typeof message === 'string') {
    return {
      id: `msg-${index}`,
      role: 'system',
      content: message,
      created_at: '',
      execution_id: '',
      receipt_id: '',
      evidence: [],
      warnings: [],
    };
  }

  const item = asObject(message);
  const role = lower(item.role);
  const normalizedRole = ['user', 'assistant', 'system', 'tool'].includes(role) ? role : 'system';
  const content = text(item.content ?? item.message ?? item.text ?? item.response ?? '');

  return {
    id: text(item.id, `msg-${index}`),
    role: normalizedRole,
    content,
    created_at: text(item.created_at ?? item.createdAt ?? item.timestamp ?? item.time ?? ''),
    execution_id: text(item.execution_id ?? item.executionId ?? ''),
    receipt_id: text(item.receipt_id ?? item.receiptId ?? ''),
    evidence: asArray(item.evidence),
    warnings: asArray(item.warnings).map((warning) => text(warning)),
  };
}

function normalizeAction(action, index = 0) {
  const item = asObject(action);
  const commandId = text(
    item.command_id
    ?? item.command
    ?? item.nombre
    ?? item.name
    ?? item.id
    ?? '',
  );
  if (!commandId) return null;

  const cleanCommandId = commandId.startsWith('/') ? commandId.slice(1) : commandId;
  const emphasis = lower(item.emphasis || (item.confirm ? 'danger' : 'normal'));

  return {
    command_id: cleanCommandId,
    label: text(item.label || item.title || item.description || item.command || item.nombre || cleanCommandId || 'Accion sin etiqueta recibida'),
    description: text(item.description || item.descripcion || item.args_prompt || item.args || item.wizard || ''),
    contract_id: text(item.contract_id || ''),
    emphasis: emphasis === 'primary' || emphasis === 'danger' ? emphasis : 'normal',
    modifies_state: Boolean(item.modifies_state || item.confirm || item.wizard),
    requires_approval: Boolean(item.requires_approval || item.confirm),
    approval_id: text(item.approval_id || ''),
    enabled: item.enabled !== false,
    blocked_reason: text(item.blocked_reason || item.reason || ''),
    arguments_schema: asObject(item.arguments_schema),
  };
}

function normalizeSectionActions(section) {
  const source = asObject(section);
  const items = asArray(source.items || source.actions);
  return items
    .map((item, index) => normalizeAction(item, index))
    .filter(Boolean);
}

function uniqueActions(actions) {
  const seen = new Set();
  const out = [];
  for (const action of actions) {
    if (!action?.command_id || seen.has(action.command_id)) continue;
    seen.add(action.command_id);
    out.push(action);
  }
  return out;
}

function normalizeCommandLine(commandId, argumentsValue = {}) {
  const cleanId = text(commandId).replace(/^\//, '');
  if (!cleanId) return '/';
  if (cleanId === 'turn.submit') {
    const bodyText = text(argumentsValue.text ?? argumentsValue.message ?? argumentsValue.input ?? '');
    return bodyText ? `/turn.submit ${bodyText}` : '/turn.submit';
  }

  const parts = [];
  if (argumentsValue && typeof argumentsValue === 'object' && !Array.isArray(argumentsValue)) {
    for (const [key, value] of Object.entries(argumentsValue)) {
      if (IGNORED_ARGUMENT_KEYS.has(key) || value === undefined || value === null || value === '') {
        continue;
      }
      if (Array.isArray(value)) {
        parts.push(...value.map((entry) => text(entry)).filter(Boolean));
        continue;
      }
      if (typeof value === 'object') {
        parts.push(JSON.stringify(value));
        continue;
      }
      parts.push(text(value));
    }
  } else if (Array.isArray(argumentsValue)) {
    parts.push(...argumentsValue.map((entry) => text(entry)).filter(Boolean));
  } else if (argumentsValue) {
    parts.push(text(argumentsValue));
  }

  return parts.length ? `/${cleanId} ${parts.join(' ')}` : `/${cleanId}`;
}

function normalizeProviderItem(provider, activeProvider, activeModel) {
  const item = asObject(provider);
  const providerName = text(item.name || item.provider || item.id || item.key || '');
  if (!providerName) return null;

  const models = asArray(item.models).map((model, index) => {
    const modelItem = asObject(model);
    const primitiveModel = typeof model === 'string' || typeof model === 'number' ? model : '';
    const modelId = text(
      primitiveModel
      || modelItem.id
      || modelItem.model_id
      || modelItem.name
      || modelItem.model
      || modelItem.wire_name
      || '',
    );
    if (!modelId) return null;
    return {
      id: modelId,
      label: modelId,
      description: modelDescription(modelItem),
      status: statusFromValue(modelId === activeModel ? 'confirmed' : (modelItem.status || (modelItem.available === false ? 'degraded' : 'confirmed'))),
      provider: providerName,
      raw: modelItem,
    };
  }).filter(Boolean);

  return {
    id: providerName,
    label: providerName,
    description: providerDescription(item, models.length),
    status: providerName === activeProvider ? 'confirmed' : stateFromBoolean(item.configured, 'confirmed', 'degraded'),
    provider: providerName,
    configured: item.configured !== false,
    models,
    raw: item,
  };
}

function commandToModule(commandId) {
  const id = text(commandId).replace(/^\//, '');
  if (!id) return 'overview';
  if (['project'].includes(id)) return 'workspace';
  if (['files', 'files.list', 'files.read', 'file.read'].includes(id)) return 'files';
  if (['context'].includes(id)) return 'context';
  if (['providers', 'switch', 'models', 'bridges', 'orchestrate'].includes(id)) return 'model';
  if (['tools', 'scripts', 'inventory', 'allow', 'deny'].includes(id)) return 'tools';
  if (['roadmap'].includes(id)) return 'roadmap';
  if (['plan', 'autopilot', 'train'].includes(id)) return 'pipeline';
  if (['memory', 'good', 'feedback', 'agents', 'agent'].includes(id)) return 'evidence';
  if (['config', 'credentials', 'update', 'help', 'quit'].includes(id)) return 'system';
  if (['status', 'session', 'save', 'load', 'mode', 'menu', 'commands'].includes(id)) return 'sessions';
  return 'overview';
}

function createCenter(centerId, label, summary, status = 'unknown') {
  return {
    center_id: centerId,
    state_revision: '',
    status,
    summary,
    active_entity: {},
    metrics: [],
    items: [],
    recommended_actions: [],
    available_actions: [],
    blocked_actions: [],
    recent_activity: [],
    evidence_refs: [],
    warnings: [],
    detail: {},
    label,
  };
}

function normalizeLegacySnapshot({ statusData, sessionData, historyData, menuData, providersData, modelCatalogData }) {
  const statusSnapshot = asObject(statusData);
  const sessionSnapshot = asObject(sessionData);
  const historyMessages = asArray(historyData?.messages).map(normalizeMessage);
  const menuSections = asArray(menuData?.sections || menuData?.centros_operativos || sessionSnapshot?.menu_state?.sections);
  const sectionActions = uniqueActions(menuSections.flatMap((section) => normalizeSectionActions(section)));
  const providerList = asArray(providersData?.providers);
  const activeProvider = text(statusSnapshot.provider || sessionSnapshot.provider || '');
  const activeModel = text(statusSnapshot.model || sessionSnapshot.model || '');
  const providerItems = providerList
    .map((provider) => normalizeProviderItem(provider, activeProvider, activeModel))
    .filter(Boolean);
  const catalogItems = asArray(modelCatalogData?.items || modelCatalogData?.models).map((model, index) => {
    const modelItem = asObject(model);
    const primitiveModel = typeof model === 'string' || typeof model === 'number' ? model : '';
    const modelId = text(
      primitiveModel
      || modelItem.id
      || modelItem.model_id
      || modelItem.name
      || modelItem.model
      || modelItem.wire_name
      || '',
    );
    if (!modelId) return null;
    return {
      id: modelId,
      label: modelId,
      description: modelDescription(modelItem),
      status: statusFromValue(modelId === activeModel ? 'confirmed' : (modelItem.status || (modelItem.available === false ? 'degraded' : 'confirmed'))),
      provider: activeProvider,
      raw: modelItem,
    };
  }).filter(Boolean);
  const effectiveProviderItems = providerItems.map((provider) => (
    provider.id === activeProvider && catalogItems.length
      ? { ...provider, models: catalogItems }
      : provider
  ));

  const connectionStatus = statusFromValue(
    statusSnapshot.status_error ? 'error'
      : statusSnapshot.health?.ok === false ? 'degraded'
        : statusSnapshot.session_id ? 'confirmed' : 'loading',
  );
  const workspaceState = asObject(sessionSnapshot.workspace_state || statusSnapshot.workspace_state);
  const welcomeState = asObject(sessionSnapshot.welcome_state || statusSnapshot.welcome_state);
  const binding = asObject(sessionSnapshot.binding || {});
  const health = asObject(statusSnapshot.health);
  const contextMeasure = asObject(statusSnapshot.context_measure);
  const contextBudget = asObject(contextMeasure.budget);
  const contextBinding = asObject(contextMeasure.binding);
  const lastReceipt = asObject(statusSnapshot.last_receipt);
  const lastEnvelope = asObject(statusSnapshot.last_envelope);
  const menuState = asObject(sessionSnapshot.menu_state || menuData);
  const menuWorkspaceState = asObject(menuState.workspace_state);
  const activeAgent = text(sessionSnapshot.active_agent || statusSnapshot.active_agent || 'main');
  const toolPolicy = text(statusSnapshot.tool_approval_policy || sessionSnapshot.tool_calling || 'ask');
  const modelMode = text(sessionSnapshot.model_catalog_mode || statusSnapshot.model_catalog_mode || 'all');
  const objective = text(statusSnapshot.objective || binding.objective || '');
  const workspaceSummary = text(workspaceState.summary || welcomeState.summary || binding.binding_reason || contextBinding.binding_reason || 'Workspace');
  const contextSummary = text(contextBudget.alert_level || contextMeasure.limiting_factor || contextMeasure.summary || 'Context');
  const modelSummary = text(activeModel || activeProvider || 'Sin modelo activo recibido');
  const systemSummary = text(health.detail || 'Backend legacy-http');
  const sessionId = text(statusSnapshot.session_id || sessionSnapshot.session_id || '');

  const centers = {
    overview: createCenter('overview', 'Resumen', objective || welcomeState.summary || 'Sin objetivo recibido del backend', connectionStatus),
    workspace: createCenter('workspace', 'Workspace', workspaceSummary, statusFromValue(workspaceState.state || workspaceState.status || 'loading')),
    files: createCenter('files', 'Archivos', text(statusSnapshot.workspace_manifest || 'Backend no envio manifest'), 'unknown'),
    context: createCenter('context', 'Contexto', contextSummary, statusFromValue(contextMeasure.status || contextBudget.alert_level || 'unknown')),
    model: createCenter('model', 'Proveedores y modelos', modelSummary, activeProvider || activeModel ? 'confirmed' : 'loading'),
    tools: createCenter('tools', 'Herramientas', `Policy: ${toolPolicy}`, toolPolicy ? 'confirmed' : 'loading'),
    patchbay: createCenter('patchbay', 'Patchbay', 'Agentes, tools, skills y piezas conectables', connectionStatus),
    roadmap: createCenter('roadmap', 'Roadmap', 'Iteraciones y evidencia de cierre', statusFromValue(statusSnapshot.roadmap?.status || 'confirmed')),
    pipeline: createCenter('pipeline', 'Pipeline', text(lastReceipt.execution_id || lastReceipt.envelope_id || 'Sin ejecucion recibida'), statusFromValue(lastReceipt.finish_reason || 'unknown')),
    evidence: createCenter('evidence', 'Evidencia', text(lastReceipt.receipt_id || lastReceipt.execution_id || lastReceipt.envelope_id || lastEnvelope.envelope_id || 'Sin receipt recibido'), Object.keys(lastReceipt).length || Object.keys(lastEnvelope).length ? 'confirmed' : 'unknown'),
    sessions: createCenter('sessions', 'Sesiones', sessionId || 'Sin sesion recibida', sessionId ? 'confirmed' : 'loading'),
    system: createCenter('system', 'Sistema', systemSummary, connectionStatus),
    console: createCenter('console', 'Consola', historyMessages.length ? 'Actividad reciente' : 'Sin historial recibido', historyMessages.length ? 'confirmed' : 'unknown'),
  };

  centers.overview.active_entity = {
    objective,
    binding,
    health,
    active_agent: activeAgent,
    provider: activeProvider,
    model: activeModel,
  };
  centers.workspace.active_entity = {
    ...menuWorkspaceState,
    ...workspaceState,
    binding: {
      ...contextBinding,
      ...binding,
      binding_confirmed: statusSnapshot.binding_confirmed ?? workspaceState.binding_confirmed ?? binding.binding_confirmed ?? contextBinding.binding_confirmed,
      binding_reason: statusSnapshot.binding_reason || workspaceState.binding_reason || binding.binding_reason || contextBinding.binding_reason,
    },
  };
  centers.files.active_entity = {
    workspace_manifest: statusSnapshot.workspace_manifest,
    workspace_manifest_exists: statusSnapshot.workspace_manifest_exists,
  };
  centers.context.active_entity = {
    ...contextMeasure,
    budget: contextBudget,
    binding: contextBinding,
    last_receipt: lastReceipt,
    last_envelope: lastEnvelope,
  };
  centers.model.active_entity = {
    provider: activeProvider,
    model: activeModel,
    model_catalog_mode: modelMode,
    providers: effectiveProviderItems,
  };
  centers.tools.active_entity = {
    tool_approval_policy: toolPolicy,
    auto_allow_tools: Boolean(statusSnapshot.auto_allow_tools),
    tools_count: contextMeasure.tools_count,
    tools_available: asArray(contextMeasure.tools_available),
  };
  centers.patchbay.active_entity = {
    active_agent: activeAgent,
    active_bridges: asArray(statusSnapshot.active_bridges || sessionSnapshot.active_bridges),
    provider: activeProvider,
    model: activeModel,
    tools_available: asArray(contextMeasure.tools_available),
    tool_approval_policy: toolPolicy,
    pipeline_steps: asArray(lastEnvelope.steps || lastReceipt.steps),
  };
  centers.roadmap.active_entity = asObject(statusSnapshot.roadmap);
  centers.pipeline.active_entity = {
    last_receipt: lastReceipt,
    last_envelope: lastEnvelope,
  };
  centers.evidence.active_entity = {
    last_receipt: lastReceipt,
    last_envelope: lastEnvelope,
  };
  centers.sessions.active_entity = {
    session_id: sessionId,
    created_at: statusSnapshot.created_at,
    total_tokens: statusSnapshot.total_tokens,
    total_calls: statusSnapshot.total_calls,
  };
  centers.system.active_entity = {
    connection: connectionStatus,
    health,
    active_agent: activeAgent,
    active_bridges: asArray(statusSnapshot.active_bridges || sessionSnapshot.active_bridges),
    tool_approval_policy: toolPolicy,
    auto_allow_tools: Boolean(statusSnapshot.auto_allow_tools),
    tools_count: contextMeasure.tools_count,
    tools_available: asArray(contextMeasure.tools_available),
    latency_ms: health.latency_ms,
  };
  centers.console.active_entity = historyMessages.at(-1) || null;

  for (const action of sectionActions) {
    const target = commandToModule(action.command_id);
    const center = centers[target] || centers.overview;
    const item = {
      id: action.command_id,
      label: action.label,
      description: action.description,
      status: action.enabled === false || action.blocked_reason ? 'blocked' : 'confirmed',
      command_id: action.command_id,
      emphasis: action.emphasis,
      blocked_reason: action.blocked_reason,
      requires_approval: action.requires_approval,
      modifies_state: action.modifies_state,
    };
    center.items.push(item);
    if (action.enabled === false || action.blocked_reason) {
      center.blocked_actions.push(action);
    } else {
      center.available_actions.push(action);
    }
    center.recommended_actions.push(action);
  }

  if (effectiveProviderItems.length) {
    centers.model.items = effectiveProviderItems;
    centers.model.metrics.push(
      { label: 'providers', value: effectiveProviderItems.length, classification: 'catalog' },
      { label: 'models', value: effectiveProviderItems.reduce((count, provider) => count + asArray(provider.models).length, 0), classification: 'catalog' },
    );
  }
  if (catalogItems.length) {
    centers.model.detail = {
      provider_catalog: effectiveProviderItems,
      model_catalog: catalogItems,
      raw: modelCatalogData,
    };
  }

  if (!centers.files.items.length && statusSnapshot.workspace_manifest) {
    centers.files.items = [
      {
        id: statusSnapshot.workspace_manifest,
        label: text(statusSnapshot.workspace_manifest),
        description: statusSnapshot.workspace_manifest_exists ? 'manifest confirmado por backend' : 'manifest declarado pero no encontrado',
        status: statusSnapshot.workspace_manifest_exists ? 'confirmed' : 'degraded',
      },
    ];
  } else if (!centers.files.items.length) {
    centers.files.warnings.push('Backend no envio manifest ni lista de archivos.');
  }

  centers.overview.metrics = [
    { label: 'messages', value: historyMessages.length, classification: 'chat' },
    { label: 'calls', value: statusSnapshot.total_calls ?? 0, classification: 'usage' },
    { label: 'tokens', value: statusSnapshot.total_tokens ?? 0, classification: 'usage' },
  ];
  centers.workspace.metrics = [
    { label: 'workspace_id', value: text(statusSnapshot.workspace_id || binding.workspace_id || ''), classification: 'identity' },
    { label: 'state', value: text(workspaceState.state || workspaceState.workspace_state || ''), classification: 'state' },
    { label: 'branch', value: text(statusSnapshot.repo_branch || binding.repo_branch || ''), classification: 'git' },
  ];
  centers.context.metrics = [
    { label: 'available', value: contextMeasure.available_context ?? contextMeasure.available ?? contextBudget.available_tokens ?? 0, classification: 'tokens' },
    { label: 'occupied', value: contextMeasure.occupied_context ?? contextMeasure.occupied ?? contextBudget.estimated_input_tokens ?? 0, classification: 'tokens' },
    { label: 'reserve', value: contextMeasure.reserve ?? contextBudget.output_reserve ?? 0, classification: 'tokens' },
    { label: 'alert', value: text(contextBudget.alert_level || ''), classification: 'budget' },
  ];
  centers.tools.metrics = [
    { label: 'policy', value: toolPolicy, classification: 'policy' },
    { label: 'auto_allow', value: Boolean(statusSnapshot.auto_allow_tools), classification: 'boolean' },
    { label: 'tools', value: contextMeasure.tools_count ?? asArray(contextMeasure.tools_available).length, classification: 'count' },
  ];
  centers.patchbay.metrics = [
    { label: 'agent', value: activeAgent, classification: 'agent' },
    { label: 'tools', value: contextMeasure.tools_count ?? asArray(contextMeasure.tools_available).length, classification: 'count' },
    { label: 'bridges', value: asArray(statusSnapshot.active_bridges || sessionSnapshot.active_bridges).length, classification: 'count' },
  ];
  centers.roadmap.metrics = [
    { label: 'iteraciones', value: asArray(statusSnapshot.roadmap?.iterations).length || 0, classification: 'plan' },
    { label: 'estado', value: text(statusSnapshot.roadmap?.status || ''), classification: 'plan' },
  ];
  centers.pipeline.metrics = [
    { label: 'switches', value: statusSnapshot.switches ?? 0, classification: 'usage' },
    { label: 'receipt', value: lastReceipt.receipt_id || null, classification: 'trace' },
  ];
  centers.evidence.metrics = [
    { label: 'receipt', value: lastReceipt.receipt_id || null, classification: 'trace' },
    { label: 'envelope', value: lastEnvelope.envelope_id || null, classification: 'trace' },
  ];
  centers.sessions.metrics = [
    { label: 'session', value: sessionId || null, classification: 'identity' },
    { label: 'created', value: statusSnapshot.created_at || null, classification: 'time' },
  ];
  centers.system.metrics = [
    { label: 'health', value: health.ok === false ? 'error' : 'ok', classification: 'health' },
    { label: 'agent', value: activeAgent, classification: 'agent' },
  ];
  centers.console.metrics = [
    { label: 'history', value: historyMessages.length, classification: 'activity' },
    { label: 'last', value: historyMessages.at(-1)?.role || null, classification: 'activity' },
  ];

  const menuActions = uniqueActions(sectionActions);
  const snapshot = {
    contract_version: UI_CONTRACT_VERSION,
    state_revision: text(statusSnapshot.context_revision || sessionSnapshot.status?.context_revision || historyMessages.length),
    source_revision: text(statusSnapshot.total_calls ?? historyMessages.length),
    generated_at: new Date().toISOString(),
    connection: {
      status: connectionStatus,
      backend_version: text(statusSnapshot.contract_version || sessionSnapshot.contract_version || 'legacy-http'),
      bridge: 'legacy-http',
      error: statusSnapshot.status_error ? { message: text(statusSnapshot.status_error) } : undefined,
    },
    authorities: {
      framework_version: text(statusSnapshot.framework_version || ''),
      framework_root: text(statusSnapshot.framework_root || ''),
      project_root: text(statusSnapshot.project_root || ''),
      workspace_root: text(statusSnapshot.workspace_state_root || statusSnapshot.workspace_root || ''),
      workspace_scope_root: text(statusSnapshot.workspace_scope_root || ''),
      workspace_id: text(statusSnapshot.workspace_id || ''),
      session_id: sessionId,
      context_revision: text(statusSnapshot.context_revision || ''),
    },
    task: {
      status: connectionStatus,
      objective,
      decisions: asArray(statusSnapshot.decisions),
      restrictions: asArray(statusSnapshot.restrictions),
      next_step: text(statusSnapshot.next_step || ''),
      active_execution: asObject(statusSnapshot.active_execution),
      roadmap: asObject(statusSnapshot.roadmap),
    },
    session: {
      status: stateFromBoolean(Boolean(sessionId), 'confirmed', 'loading'),
      session_id: sessionId,
      persisted: true,
      last_saved_at: text(statusSnapshot.last_switch_at || ''),
      linked: Boolean(statusSnapshot.binding_confirmed),
      detail: sessionSnapshot,
    },
    workspace: {
      status: statusFromValue(workspaceState.status || workspaceState.state || 'unknown'),
      state: text(workspaceState.state || workspaceState.workspace_state || ''),
      manifest_status: text(workspaceState.manifest_status || ''),
      index_status: text(workspaceState.index_status || ''),
      manifest_exists: workspaceState.manifest_exists ?? statusSnapshot.workspace_manifest_exists,
      manifest_path: text(workspaceState.manifest_path || statusSnapshot.workspace_manifest || ''),
      binding_confirmed: statusSnapshot.binding_confirmed ?? workspaceState.binding_confirmed ?? binding.binding_confirmed ?? contextBinding.binding_confirmed,
      binding_reason: text(statusSnapshot.binding_reason || workspaceState.binding_reason || binding.binding_reason || contextBinding.binding_reason || ''),
      repo_root: text(statusSnapshot.repo_root || binding.repo_root || ''),
      repo_branch: text(statusSnapshot.repo_branch || binding.repo_branch || ''),
      source_of_truth_version: text(workspaceState.source_of_truth_version || menuWorkspaceState.source_of_truth_version || ''),
      warnings: asArray(workspaceState.warnings || workspaceState.advertencias || menuState.advertencias),
      detail: {
        ...menuWorkspaceState,
        ...workspaceState,
        binding,
        context_binding: contextBinding,
      },
    },
    context: {
      status: statusFromValue(contextMeasure.status || contextBudget.alert_level || 'unknown'),
      configured_context: contextMeasure.configured_context ?? contextMeasure.configured ?? contextBudget.input_budget ?? contextBudget.model_context_tokens ?? null,
      occupied_context: contextMeasure.occupied_context ?? contextMeasure.occupied ?? contextBudget.estimated_input_tokens ?? null,
      available_context: contextMeasure.available_context ?? contextMeasure.available ?? contextBudget.available_tokens ?? null,
      reserve: contextMeasure.reserve ?? contextBudget.output_reserve ?? null,
      limiting_factor: text(contextMeasure.limiting_factor || contextBudget.alert_level || ''),
      usage_fraction: contextBudget.usage_fraction ?? null,
      alert_level: text(contextBudget.alert_level || ''),
      model_context_tokens: contextBudget.model_context_tokens ?? contextMeasure.model_context_tokens ?? null,
      system_tokens: contextBudget.system_tokens ?? null,
      messages_tokens: contextBudget.messages_tokens ?? null,
      tools_tokens: contextBudget.tools_tokens ?? null,
      messages_count: contextBudget.messages_count ?? contextMeasure.history_messages ?? null,
      tools_count: contextMeasure.tools_count ?? asArray(contextMeasure.tools_available).length,
      truncated: contextBudget.truncated,
      last_receipt_id: text(lastReceipt.receipt_id || lastReceipt.execution_id || ''),
      detail: {
        ...contextMeasure,
        budget: contextBudget,
        binding: contextBinding,
        last_receipt: lastReceipt,
        last_envelope: lastEnvelope,
      },
    },
    model: {
      status: activeProvider || activeModel ? 'confirmed' : 'loading',
      provider: activeProvider,
      adapter: text(statusSnapshot.adapter || activeProvider || ''),
      runtime: text(statusSnapshot.runtime || ''),
      configured_model: activeModel,
      effective_model: activeModel,
      detail: {
        providers: effectiveProviderItems,
        model_catalog: catalogItems,
        model_catalog_mode: modelMode,
        raw: modelCatalogData,
      },
    },
    system: {
      status: connectionStatus,
      operating_mode: text(statusSnapshot.bago_mode || ''),
      pipeline_status: statusFromValue(lastReceipt.finish_reason || 'unknown'),
      health_detail: text(health.detail || ''),
      latency_ms: health.latency_ms ?? null,
      active_agent: activeAgent,
      active_bridges: asArray(statusSnapshot.active_bridges || sessionSnapshot.active_bridges),
      tool_approval_policy: toolPolicy,
      auto_allow_tools: Boolean(statusSnapshot.auto_allow_tools),
      tools_count: contextMeasure.tools_count ?? asArray(contextMeasure.tools_available).length,
      detail: {
        health,
        tool_approval_policy: toolPolicy,
        auto_allow_tools: Boolean(statusSnapshot.auto_allow_tools),
        active_agent: activeAgent,
        active_bridges: asArray(statusSnapshot.active_bridges || sessionSnapshot.active_bridges),
        tools_count: contextMeasure.tools_count,
        tools_available: asArray(contextMeasure.tools_available),
      },
    },
    roadmap: {
      status: statusFromValue(statusSnapshot.roadmap?.status || 'unknown'),
      summary: text(statusSnapshot.roadmap?.summary || ''),
      current_iteration: text(statusSnapshot.roadmap?.current_iteration || ''),
      roadmap_version: text(statusSnapshot.roadmap?.roadmap_version || ''),
      iterations: asArray(statusSnapshot.roadmap?.iterations),
      detail: asObject(statusSnapshot.roadmap),
    },
    chat: {
      status: historyMessages.length ? 'confirmed' : 'loading',
      enabled: health.ok !== false,
      messages: historyMessages,
    },
    centers,
    menu: {
      recommended_actions: menuActions,
      available_actions: menuActions,
    },
    pipeline: {
      status: statusFromValue(lastReceipt.finish_reason || 'unknown'),
      steps: asArray(lastEnvelope.steps || lastReceipt.steps),
      execution_id: text(lastReceipt.execution_id || lastReceipt.envelope_id || ''),
    },
    recent_activity: historyMessages.slice(-20),
  };

  return assertSnapshotShape(snapshot);
}

function normalizeLegacyCommandResult(rawResult, requestId, commandId, argumentsValue, context = {}) {
  const result = asObject(rawResult);
  const ok = result.ok !== false && result.error == null;
  const data = result.data ?? result.result ?? result.response ?? result.payload ?? null;
  const executionId = text(result.execution_id || data?.execution_id || data?.receipt_id || context.execution_id || requestId);
  const stateRevision = result.state_revision ?? data?.state_revision ?? context.expected_state_revision ?? '';
  const warningList = asArray(result.warnings || data?.warnings).filter(Boolean);
  const commandLine = normalizeCommandLine(commandId, argumentsValue);

  return assertCommandResultShape({
    request_id: text(result.request_id || requestId),
    execution_id: executionId,
    status: ok ? 'done' : 'failed',
    state_revision: stateRevision,
    data: data && typeof data === 'object' ? data : (data !== null && data !== undefined ? { value: data } : {}),
    warnings: warningList,
    error: ok ? undefined : (asObject(result.error) || { message: text(result.message || `Legacy command failed: ${commandLine}`) }),
    receipt_id: text(result.receipt_id || data?.receipt_id || ''),
    completed_at: text(result.completed_at || new Date().toISOString()),
  });
}

export class BagoBackendClient {
  async getBootstrap() {
    const [statusRes, sessionRes, historyRes, providersRes, menuRes] = await Promise.all([
      safeRequestJson(LEGACY_ROUTES.status),
      safeRequestJson(LEGACY_ROUTES.session),
      safeRequestJson(LEGACY_ROUTES.history),
      safeRequestJson(LEGACY_ROUTES.providers),
      safeRequestJson(LEGACY_ROUTES.menu),
    ]);

    const statusData = statusRes.ok ? statusRes.value : {};
    const sessionData = sessionRes.ok ? sessionRes.value : {};
    const providersData = providersRes.ok ? providersRes.value : {};
    const menuData = menuRes.ok ? menuRes.value : {};

    const legacySupported = [statusRes, sessionRes, historyRes, providersRes, menuRes].some((entry) => entry.ok);
    if (legacySupported) {
      let modelCatalogData = {};
      const providerName = text(statusData.provider || sessionData.provider || '');
      if (providerName) {
        const modelsRes = await safeRequestJson(`${LEGACY_ROUTES.modelsPrefix}${encodeURIComponent(providerName)}`);
        modelCatalogData = modelsRes.ok ? modelsRes.value : {};
      }

      return normalizeLegacySnapshot({
        statusData,
        sessionData,
        historyData: historyRes.ok ? historyRes.value : {},
        menuData,
        providersData,
        modelCatalogData,
      });
    }

    const modern = await safeRequestJson(backendConfig.bootstrapPath, { method: 'GET' });
    if (modern.ok) {
      try {
        return assertSnapshotShape(modern.value);
      } catch (error) {
        modern.error = error;
      }
    }

    let modelCatalogData = {};
    const providerName = text(statusData.provider || sessionData.provider || '');
    if (providerName) {
      const modelsRes = await safeRequestJson(`${LEGACY_ROUTES.modelsPrefix}${encodeURIComponent(providerName)}`);
      modelCatalogData = modelsRes.ok ? modelsRes.value : {};
    }

    const legacySnapshot = normalizeLegacySnapshot({
      statusData,
      sessionData,
      historyData: historyRes.ok ? historyRes.value : {},
      menuData,
      providersData,
      modelCatalogData,
    });
    return legacySnapshot;
  }

  async execute(commandId, argumentsValue = {}, context = {}) {
    const requestId = makeId('req');
    const request = {
      request_id: requestId,
      command_id: commandId,
      contract_version: COMMAND_CONTRACT_VERSION,
      source_surface: SURFACE_ID,
      session_id: context.session_id,
      workspace_id: context.workspace_id,
      expected_state_revision: context.expected_state_revision,
      arguments: argumentsValue,
      idempotency_key: context.idempotency_key || makeId('idem'),
      approval_id: context.approval_id,
      requested_at: new Date().toISOString(),
    };

    const modern = await safeRequestJson(backendConfig.commandPath, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (modern.ok) {
      try {
        return assertCommandResultShape(modern.value);
      } catch (error) {
        modern.error = error;
      }
    }

    const legacyCommand = normalizeCommandLine(commandId, argumentsValue);
    const legacy = await requestJson(LEGACY_ROUTES.command, {
      method: 'POST',
      body: JSON.stringify({
        command: legacyCommand,
        channel: context.channel || 'manager',
      }),
    });
    return normalizeLegacyCommandResult(legacy, requestId, commandId, argumentsValue, context);
  }

  async interpretQuestion(question) {
    const cleanQuestion = text(question);
    if (!cleanQuestion) {
      throw new BackendHttpError('Pregunta requerida para el interprete reflexivo.', {
        status: 400,
        url: apiUrl(LEGACY_ROUTES.interpret),
      });
    }
    return requestJson(LEGACY_ROUTES.interpret, {
      method: 'POST',
      body: JSON.stringify({ question: cleanQuestion }),
    });
  }

  async getInterpretHistory(limit = 10) {
    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 50)) : 10;
    return requestJson(`${LEGACY_ROUTES.interpretHistory}?limit=${encodeURIComponent(safeLimit)}`, {
      method: 'GET',
    });
  }

  async getInterpretRules() {
    return requestJson(LEGACY_ROUTES.interpretRules, { method: 'GET' });
  }

  subscribe({ sessionId, onOpen, onEvent, onError }) {
    if (backendConfig.eventsEnabled && typeof EventSource !== 'undefined') {
      const url = new URL(apiUrl(backendConfig.eventsPath), window.location.origin);
      if (sessionId) url.searchParams.set('session_id', sessionId);
      url.searchParams.set('surface', SURFACE_ID);

      const source = new EventSource(url.toString(), { withCredentials: true });
      source.onopen = () => onOpen?.();
      source.onmessage = (event) => {
        try {
          onEvent?.(JSON.parse(event.data), event.type);
        } catch (error) {
          onError?.(error);
        }
      };

      const namedEvents = [
        'state.snapshot',
        'state.changed',
        'chat.message',
        'execution.proposed',
        'execution.validated',
        'execution.started',
        'execution.progress',
        'execution.completed',
        'execution.failed',
        'execution.blocked',
        'receipt.created',
        'receipt.validated',
        'contradiction.detected',
      ];

      namedEvents.forEach((eventName) => {
        source.addEventListener(eventName, (event) => {
          try {
            onEvent?.(JSON.parse(event.data), eventName);
          } catch (error) {
            onError?.(error);
          }
        });
      });

      source.onerror = (error) => onError?.(error);
      return () => source.close();
    }

    let stopped = false;
    let timer = null;
    onOpen?.();

    const poll = async () => {
      if (stopped) return;
      try {
        const snapshot = await this.getBootstrap();
        if (!stopped) {
          onEvent?.(snapshot, 'state.snapshot');
        }
      } catch (error) {
        onError?.(error);
      } finally {
        if (!stopped) {
          timer = globalThis.setTimeout(poll, 4000);
        }
      }
    };

    timer = globalThis.setTimeout(poll, 500);
    return () => {
      stopped = true;
      if (timer !== null) {
        globalThis.clearTimeout(timer);
      }
    };
  }
}

export const bagoBackend = new BagoBackendClient();
