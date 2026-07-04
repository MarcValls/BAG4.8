import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActiveSection, BackendCommandResult, BackendHistory, BackendMenu, BackendProviders, BackendRoutes, ChatTurn, InspectorLevel, SelectionRecord, UiAction, UiBootstrapSnapshot } from '@/contracts/backend';
import { createBagoClient, persistApiConfig, readStoredApiBase, readStoredApiToken, safeJson } from '@/api/client';
import { GlobalHeader } from '@/layout/GlobalHeader';
import { MainSidebar } from '@/layout/MainSidebar';
import { SelectionInspector } from '@/layout/SelectionInspector';
import { StatusBar } from '@/layout/StatusBar';
import { WorkspaceShell } from '@/layout/WorkspaceShell';
import { ControlSections } from '@/features/sections';
import { resolveOpeningState } from '@/features/opening/opening';
import { OpeningScreen } from '@/features/opening/OpeningScreen';
import { createDefaultUiState, loadUiState, patchUiState, persistUiState, type UiState } from '@/state/uiStore';

function nowStamp(): string {
  return new Date().toISOString();
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry)).filter(Boolean);
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry)) as Array<Record<string, unknown>> : [];
}

function extractRecordArray(value: unknown, keys: string[]): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return asRecordArray(value);
  }
  if (!value || typeof value !== 'object') {
    return [];
  }
  const data = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = data[key];
    if (Array.isArray(candidate)) {
      return asRecordArray(candidate);
    }
  }
  return [];
}

function readReceiptId(receipt: unknown): string | undefined {
  if (!receipt || typeof receipt !== 'object') return undefined;
  const data = receipt as Record<string, unknown>;
  return readText(data.envelope_id || data.id || data.receipt_id);
}

function readCertificationStatus(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const data = value as Record<string, unknown>;
  return readText(data.status || data.state);
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

type WorkspaceSelectionResult = {
  ok?: boolean;
  canceled?: boolean;
  path?: string;
  filePath?: string;
  filePaths?: string[];
  message?: string;
};

function getElectronBridge() {
  return typeof window === 'undefined' ? undefined : window.bagoElectron;
}

function readSelectedWorkspace(result: WorkspaceSelectionResult | null | undefined): string {
  if (!result || result.canceled === true) return '';
  return String(result.path || result.filePath || (Array.isArray(result.filePaths) ? result.filePaths[0] : '') || '').trim();
}

function quoteSlashArg(value: string): string {
  const clean = String(value || '').trim();
  if (!clean) return '""';
  return `"${clean.replace(/"/g, '\\"')}"`;
}

function normalizeActions(snapshot: UiBootstrapSnapshot | null): UiAction[] {
  const actions: UiAction[] = [];
  if (!snapshot) return actions;
  const enabled = snapshot.permissions.canChat;
  actions.push({
    id: 'open-chat',
    label: 'Open chat',
    kind: 'navigate',
    enabled,
    visible: true,
    reasonDisabled: enabled ? undefined : 'Backend is not ready for chat',
    payload: { section: 'chat' }
  });
  actions.push({
    id: 'inspect-system',
    label: 'Inspect system',
    kind: 'inspect',
    enabled: true,
    visible: true,
    payload: { command: '/status' }
  });
  if (snapshot.permissions.canInspectContext) {
    actions.push({
      id: 'inspect-context',
      label: 'Inspect context',
      kind: 'inspect',
      enabled: true,
      visible: true,
      payload: { command: '/context inspect' }
    });
  }
  if (snapshot.permissions.canViewEvidence) {
    actions.push({
      id: 'view-evidence',
      label: 'Review evidence',
      kind: 'navigate',
      enabled: true,
      visible: true,
      payload: { section: 'evidence' }
    });
  }
  if (snapshot.workspace.manifestState === 'missing') {
    actions.push({
      id: 'workspace-init',
      label: 'Initialize workspace',
      kind: 'mutation',
      enabled: snapshot.permissions.canInitializeWorkspace,
      visible: true,
      reasonDisabled: snapshot.permissions.canInitializeWorkspace ? undefined : 'Not allowed by backend',
      payload: { command: '/project init' }
    });
  }
  if (snapshot.permissions.canLinkWorkspace && snapshot.workspace.root) {
    actions.push({
      id: 'workspace-link',
      label: 'Link workspace',
      kind: 'mutation',
      enabled: true,
      visible: true,
      payload: { command: '/project link' }
    });
  }
  if (snapshot.workspace.manifestState === 'invalid') {
    actions.push({
      id: 'workspace-repair',
      label: 'Repair workspace',
      kind: 'danger',
      enabled: snapshot.permissions.canRepairWorkspace,
      visible: true,
      reasonDisabled: snapshot.permissions.canRepairWorkspace ? undefined : 'Repair disabled',
      payload: { command: '/project status' }
    });
  }
  return actions;
}

function commandKey(command: string): string {
  return command.trim().replace(/^\/+/, '').replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '') || 'command';
}

function buildSnapshot(raw: any): UiBootstrapSnapshot | null {
  if (!raw) return null;
  const status = raw.status || {};
  const session = raw.session || {};
  const binding = session.binding || {};
  const projectRoot = String(status.project_root || status.repo_root || binding.project_root || '');
  const workspaceRoot = String(status.workspace_state_root || session.binding?.workspace_state_root || '');
  const scopeRoot = String(status.workspace_scope_root || binding.workspace_scope_root || projectRoot || '');
  const mirrorRoot = String(status.workspace_mirror_root || binding.workspace_mirror_root || '');
  const contextRoot = String(status.workspace_context_root || binding.workspace_context_root || '');
  const authorizedRoot = String(status.authorized_root || binding.authorized_root || scopeRoot || '');
  const repoRoot = String(status.repo_root || binding.repo_root || projectRoot || '');
  const repoBranch = String(status.repo_branch || binding.repo_branch || '');
  const activeBridges = toStringList(status.active_bridges || session.active_bridges);
  const bindingConfirmed = Boolean(
    status.workspace_state?.binding_confirmed
    || session.workspace_state?.binding_confirmed
    || binding.binding_confirmed
    || status.binding_confirmed
  );
  const bindingReason = String(
    status.workspace_state?.binding_reason
    || session.workspace_state?.binding_reason
    || binding.binding_reason
    || status.binding_reason
    || ''
  );
  const workspaceState = String(status.workspace_state || session.workspace_state?.workspace_state || '');
  const manifestState: UiBootstrapSnapshot['workspace']['manifestState'] = workspaceState.includes('legacy')
    ? 'legacy'
    : workspaceState.includes('invalid')
      ? 'invalid'
      : workspaceState.includes('missing')
        ? 'missing'
        : bindingConfirmed
          ? 'valid'
          : workspaceRoot
            ? 'unknown'
            : 'missing';
  const health = status.health || {};
  const healthDetail = readText(health.detail);
  const healthLatencyMs = toNumber(health.latency_ms);
  const objective = String(status.objective || binding.objective || '');
  const activeAgent = String(status.active_agent || session.active_agent || '');
  const lastEnvelope = readRecord(raw.last_envelope);
  const lastEnvelopeMeta = readRecord(lastEnvelope.metadata);
  const lastReceipt = readRecord(raw.last_receipt);
  const lastReceiptMeta = readRecord(lastReceipt.metadata);
  const codeTaskClassification = readRecord(status.code_task || lastEnvelopeMeta.code_task || lastReceiptMeta.code_task);
  const codeTaskContract = readRecord(status.code_task_contract || lastEnvelopeMeta.code_task_contract || lastReceiptMeta.code_task_contract);
  const codeTaskContext = readRecord(lastEnvelopeMeta.code_context || lastReceiptMeta.code_context);
  const lastReceiptId = readReceiptId(status.last_receipt);
  const certificationStatus = readCertificationStatus(status.context_certification);
  const systemState: UiBootstrapSnapshot['system']['state'] = health.ok === false
    ? 'error'
    : bindingConfirmed ? 'confirmed'
      : bindingReason ? 'degraded'
        : !raw.status
          ? 'loading'
          : 'unknown';
  const contextRevision = status.context_revision ?? session.status?.context_revision;
  const contextState: UiBootstrapSnapshot['context']['state'] = certificationStatus === 'CERTIFIED'
    ? 'confirmed'
    : contextRevision && lastReceiptId
      ? 'partial'
      : contextRevision
        ? 'stale'
        : bindingConfirmed
          ? 'unknown'
          : 'blocked';
  const explicitModelState = String(status.model_state || '').toLowerCase();
  const modelState: UiBootstrapSnapshot['model']['state'] = explicitModelState === 'error'
    ? 'error'
    : explicitModelState === 'degraded'
      ? 'degraded'
      : status.provider && status.model
        ? 'confirmed'
        : 'unknown';
  const sessionState: UiBootstrapSnapshot['session']['state'] = session.session_id
    ? (bindingConfirmed ? 'valid' : /mismatch|branch|scope|binding/i.test(bindingReason) ? 'blocked' : 'recoverable')
    : 'missing';
  const codeTask = Object.keys(codeTaskClassification).length || Object.keys(codeTaskContract).length || Object.keys(codeTaskContext).length
    ? ({
      classification: Object.keys(codeTaskClassification).length ? codeTaskClassification : undefined,
      contract: Object.keys(codeTaskContract).length ? codeTaskContract : undefined,
      context: Object.keys(codeTaskContext).length ? codeTaskContext : undefined
    } as UiBootstrapSnapshot['codeTask'])
    : undefined;

  const snapshot: UiBootstrapSnapshot = {
    system: {
      state: systemState,
      backendAvailable: true,
      version: String(status.framework_version || status.version || ''),
      apiVersion: String(status.api_version || ''),
      contractVersion: String(status.contract_version || ''),
      schemaVersion: String(status.schema_version || ''),
      healthDetail: healthDetail || undefined,
      healthLatencyMs,
      bindingReason: bindingReason || undefined,
      objective: objective || undefined,
      activeAgent: activeAgent || undefined,
      activeBridges: activeBridges.length ? activeBridges : undefined,
      errorCode: readText(status.error_code || status.health?.error_code || '')
    },
    framework: {
      root: String(status.framework_root || ''),
      version: String(status.framework_version || status.version || ''),
      confirmed: Boolean(status.framework_root),
    },
    project: {
      root: projectRoot || undefined,
      state: projectRoot ? 'confirmed' : 'not_detected'
    },
    workspace: {
      id: String(status.workspace_id || session.binding?.workspace_id || ''),
      root: workspaceRoot || undefined,
      scopeRoot: scopeRoot || undefined,
      mirrorRoot: mirrorRoot || undefined,
      contextRoot: contextRoot || undefined,
      authorizedRoot: authorizedRoot || undefined,
      repoRoot: repoRoot || undefined,
      repoBranch: repoBranch || undefined,
      bindingReason: bindingReason || undefined,
      mirrorReady: Boolean(status.workspace_mirror_ready),
      manifestState,
      linkedToSession: bindingConfirmed
    },
    session: {
      id: String(status.session_id || session.session_id || ''),
      state: sessionState,
      activeAgent: activeAgent || undefined
    },
    model: {
      provider: String(status.provider || session.provider || ''),
      adapter: String(status.adapter || ''),
      runtime: String(status.runtime || status.model_runtime || ''),
      configuredModel: String(status.model || session.model || ''),
      effectiveModel: String(status.effective_model || status.model || session.model || ''),
      state: modelState
    },
    context: {
      state: contextState,
      revision: contextRevision || undefined,
      occupied: typeof status.context_occupied === 'number' ? status.context_occupied : undefined,
      available: typeof status.context_available === 'number' ? status.context_available : undefined,
      limit: typeof status.context_limit === 'number' ? status.context_limit : undefined,
      reserve: typeof status.context_reserve === 'number' ? status.context_reserve : undefined,
      limitingFactor: String(status.context_limiting_factor || ''),
      receiptId: lastReceiptId || undefined,
      certificationStatus: certificationStatus || undefined
    },
    permissions: {
      canChat: bindingConfirmed && Boolean(status.provider) && Boolean(status.model),
      canInitializeWorkspace: !workspaceRoot,
      canLinkWorkspace: Boolean(workspaceRoot) && !bindingConfirmed,
      canRepairWorkspace: Boolean(workspaceRoot) && !bindingConfirmed,
      canRunTools: bindingConfirmed && activeBridges.length > 0,
      canInspectContext: bindingConfirmed && Boolean(contextRevision || lastReceiptId),
      canViewEvidence: Boolean(lastReceiptId || (Array.isArray(raw.history?.messages) && raw.history.messages.length)),
      canStopPipeline: Boolean(objective || contextRevision),
      canRetryPipeline: Boolean(objective || lastReceiptId || contextRevision)
    },
    capabilities: (status.capabilities as UiBootstrapSnapshot['capabilities']) || undefined,
    error: raw.error && typeof raw.error === 'object' ? raw.error : undefined,
    evidence: extractRecordArray(raw.evidence, ['items', 'receipts', 'claims', 'latest']),
    jobs: extractRecordArray(raw.jobs, ['jobs', 'items']),
    codeTask,
    recommendedActions: []
  };
  snapshot.recommendedActions = normalizeActions(snapshot);
  return snapshot;
}

function historyToTurns(history: BackendHistory | undefined): ChatTurn[] {
  if (!Array.isArray(history?.messages)) return [];
  return history.messages.slice(-30).map((message, index) => {
    const roleValue = String(message.role || 'assistant');
    const role: ChatTurn['role'] = roleValue === 'user' || roleValue === 'system' || roleValue === 'command' ? roleValue : 'assistant';
    return {
      id: String(message.id || `history-${index}`),
      role,
      text: String(message.content || message.text || message.message || ''),
      status: 'done',
      receipt: (message.receipt || message.context_receipt || null) as Record<string, unknown> | null,
      raw: message,
      timestamp: String(message.timestamp || message.created_at || nowStamp())
    };
  });
}

export function ControlPlane() {
  const [uiState, setUiState] = useState<UiState>(() => {
    const loaded = loadUiState();
    return {
      ...createDefaultUiState(),
      ...loaded,
      apiBase: loaded.apiBase || readStoredApiBase(),
      apiToken: loaded.apiToken || readStoredApiToken()
    };
  });
  const [booting, setBooting] = useState(true);
  const [entered, setEntered] = useState(false);
  const [snapshot, setSnapshot] = useState<UiBootstrapSnapshot | null>(null);
  const [menu, setMenu] = useState<BackendMenu | null>(null);
  const [routes, setRoutes] = useState<BackendRoutes | null>(null);
  const [providers, setProviders] = useState<BackendProviders | null>(null);
  const [history, setHistory] = useState<BackendHistory | null>(null);
  const [files, setFiles] = useState<Record<string, unknown> | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [selection, setSelection] = useState<SelectionRecord | null>(null);
  const [lastMessage, setLastMessage] = useState('iniciando');
  const [commandResults, setCommandResults] = useState<Record<string, BackendCommandResult | null>>({});
  const [opening, setOpening] = useState(() => resolveOpeningState(null));
  const [workspacePickerOpen, setWorkspacePickerOpen] = useState(false);
  const [workspacePickerValue, setWorkspacePickerValue] = useState('');
  const clientRef = useRef(createBagoClient(uiState.apiBase || readStoredApiBase(), uiState.apiToken || readStoredApiToken()));
  const workspaceBridgeAvailable = Boolean(
    getElectronBridge()?.chooseProjectRoot || getElectronBridge()?.chooseWorkspaceRoot
  );

  const setAndPersistUiState = (patch: Partial<UiState>) => {
    setUiState((current) => {
      const next = patchUiState(current, patch);
      persistUiState(next);
      persistApiConfig(next.apiBase || readStoredApiBase(), next.apiToken || '');
      clientRef.current.setConfig(next.apiBase || readStoredApiBase(), next.apiToken || '');
      return next;
    });
  };

  const applyBootData = (data: Awaited<ReturnType<typeof clientRef.current.bootstrap>>) => {
    const nextSnapshot = buildSnapshot(data);
    const nextOpening = resolveOpeningState(nextSnapshot);
    setSnapshot(nextSnapshot);
    setOpening(nextOpening);
    setMenu((data.menu || null) as BackendMenu | null);
    setRoutes((data.routes || null) as BackendRoutes | null);
    setProviders((data.providers || null) as BackendProviders | null);
    setHistory((data.history || null) as BackendHistory | null);
    setFiles((data.files || null) as Record<string, unknown> | null);
    setTurns((current) => current.length ? current : historyToTurns(data.history));
    if (nextOpening.id === 'enter_directly') {
      setEntered(true);
      setUiState((current) => current.activeSection === 'home' ? patchUiState(current, { activeSection: 'chat' }) : current);
    }
    return nextSnapshot;
  };

  const bootstrap = async () => {
    setBooting(true);
    setLastMessage('consultando backend');
    try {
      const data = await clientRef.current.bootstrap();
      const nextSnapshot = applyBootData(data);
      setLastMessage(nextSnapshot?.workspace.linkedToSession ? 'backend confirmado' : 'snapshot recuperado');
    } catch (error) {
      const errorSnapshot: UiBootstrapSnapshot = {
        system: { state: 'error', backendAvailable: false },
        framework: { confirmed: false },
        project: { state: 'unknown' },
        workspace: { manifestState: 'unknown', linkedToSession: false },
        session: { state: 'unknown' },
        model: { state: 'unknown' },
        context: { state: 'blocked' },
        permissions: {
          canChat: false,
          canInitializeWorkspace: false,
          canLinkWorkspace: false,
          canRepairWorkspace: false,
          canRunTools: false,
          canInspectContext: false,
          canViewEvidence: false,
          canStopPipeline: false,
          canRetryPipeline: false
        },
        recommendedActions: []
      };
      setSnapshot(errorSnapshot);
      setOpening(resolveOpeningState(errorSnapshot));
      setFiles(null);
      setLastMessage(error instanceof Error ? error.message : 'fallo de conexión');
    } finally {
      setBooting(false);
    }
  };

  const chooseWorkspaceExplorer = async (): Promise<string | null> => {
    const bridge = getElectronBridge();
    const chooseRoot = bridge?.chooseProjectRoot || bridge?.chooseWorkspaceRoot;
    if (chooseRoot) {
      const selection = (await chooseRoot()) as WorkspaceSelectionResult | null;
      const selectedRoot = readSelectedWorkspace(selection);
      if (!selectedRoot) {
        setLastMessage('selección de workspace cancelada');
        return null;
      }
      setAndPersistUiState({ workspaceHint: selectedRoot });
      setWorkspacePickerOpen(false);
      const command = `/project link ${quoteSlashArg(selectedRoot)}`;
      const result = await runCommand(command);
      if (result && result.ok === false) {
        setLastMessage(String(result.message || 'no se pudo activar el workspace'));
        return null;
      }
      setLastMessage(`workspace activado: ${selectedRoot}`);
      openShell('workspace');
      return selectedRoot;
    }
    setLastMessage('el explorador nativo solo está disponible en Electron');
    return null;
  };

  const openWorkspacePicker = (): void => {
    setWorkspacePickerValue(uiState.workspaceHint || snapshot?.workspace.root || '');
    setWorkspacePickerOpen(true);
  };

  const confirmWorkspacePicker = async () => {
    const selectedRoot = workspacePickerValue.trim();
    if (!selectedRoot) {
      setLastMessage('selección de workspace cancelada');
      setWorkspacePickerOpen(false);
      return;
    }
    setWorkspacePickerOpen(false);
    setAndPersistUiState({ workspaceHint: selectedRoot });
    const result = await runCommand(`/project link ${quoteSlashArg(selectedRoot)}`);
    if (result && result.ok === false) {
      setLastMessage(String(result.message || 'no se pudo activar el workspace'));
      return;
    }
    setLastMessage(`workspace activado en navegador: ${selectedRoot}`);
    openShell('workspace');
  };

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setUiState((current) => ({ ...current, commandPaletteOpen: !current.commandPaletteOpen }));
        return;
      }
      if (event.key === 'Escape' && entered) {
        setUiState((current) => ({ ...current, commandPaletteOpen: false }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [entered]);

  useEffect(() => {
    persistUiState(uiState);
  }, [uiState]);

  const combinedActions = useMemo(() => snapshot?.recommendedActions || [], [snapshot]);

  const refreshAfterMutation = async () => {
    const next = await clientRef.current.bootstrap();
    applyBootData(next);
  };

  const runCommand = async (command: string): Promise<BackendCommandResult | null> => {
    const clean = command.trim();
    if (!clean) return null;
    const turnId = `command-${Date.now()}`;
    setTurns((current) => [...current, {
      id: turnId,
      role: 'command',
      text: clean,
      status: 'running',
      timestamp: nowStamp()
    }]);
    setLastMessage(`ejecutando ${clean}`);
    try {
      const result = await clientRef.current.runCommand(clean);
      const key = commandKey(clean);
      setCommandResults((current) => ({ ...current, [key]: result }));
      setTurns((current) => current.map((turn) => turn.id === turnId ? {
        ...turn,
        status: result.ok === false ? 'failed' : 'done',
        receipt: (asCommandReceipt(result) || null),
        raw: result
      } : turn));

      if (clean === '/roadmap') setCommandResults((current) => ({ ...current, roadmap: result }));
      if (clean.startsWith('/plan ')) setCommandResults((current) => ({ ...current, plan: result }));
      if (clean === '/context inspect') setCommandResults((current) => ({ ...current, contextInspect: result }));
      if (clean === '/context attach') setCommandResults((current) => ({ ...current, contextAttach: result }));
      if (clean === '/context measure') setCommandResults((current) => ({ ...current, contextMeasure: result }));
      if (clean === '/context certify') setCommandResults((current) => ({ ...current, contextCertify: result }));

      if (clean === '/status' || clean === '/session' || clean.startsWith('/context') || clean.startsWith('/project') || clean.startsWith('/workspace')) {
        await refreshAfterMutation();
      }
      setLastMessage(result.message || clean);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : `falló ${clean}`;
      setTurns((current) => current.map((turn) => turn.id === turnId ? { ...turn, status: 'failed', text: `${clean}\n${message}` } : turn));
      setLastMessage(message);
      return null;
    }
  };

  const runContextCommand = async (command: string) => {
    const result = await runCommand(command);
    if (result?.data && (command.includes('inspect') || command.includes('attach'))) {
      onInspect({
        id: command.includes('attach') ? 'context-attach' : 'context-inspect',
        kind: 'context',
        title: command.includes('attach') ? 'Contexto adjuntado' : 'Inspección de contexto',
        summary: result.message || (command.includes('attach') ? 'Contexto adjuntado' : 'Contexto inspeccionado'),
        detail: ['source: backend command', `command: ${command}`],
        raw: safeJson(result.data)
      }, 'detail');
    }
  };

  const sendChat = async (message: string) => {
    const text = message.trim();
    if (!text) return;
    if (!snapshot?.permissions.canChat) {
      setLastMessage('chat bloqueado por el estado del backend');
      return;
    }

    const stamp = Date.now();
    const userTurn: ChatTurn = {
      id: `user-${stamp}`,
      role: 'user',
      text,
      status: 'done',
      timestamp: nowStamp()
    };
    const assistantBuffer: ChatTurn = {
      id: `assistant-${stamp}`,
      role: 'assistant',
      text: '',
      status: 'running',
      timestamp: nowStamp()
    };
    setTurns((current) => [...current, userTurn, assistantBuffer]);
    setUiState((current) => patchUiState(current, { drafts: { ...current.drafts, chat: '' } }));

    try {
      const payload = uiState.chatMode === 'trace'
        ? await clientRef.current.streamChat(text, (chunk) => {
          setTurns((current) => current.map((turn) => turn.id === assistantBuffer.id ? { ...turn, text: turn.text + chunk } : turn));
        })
        : await clientRef.current.sendChat(text);
      const receipt = (payload.receipt || payload.context_receipt || null) as Record<string, unknown> | null;
      setTurns((current) => current.map((turn) => {
        if (turn.id !== assistantBuffer.id) return turn;
        const responseText = String(payload.response || payload.message || turn.text || '');
        return {
          ...turn,
          text: responseText,
          status: payload.ok === false ? 'failed' : receipt ? 'done' : 'validating',
          receipt,
          raw: payload
        };
      }));
      if (payload.ok !== false) {
        onInspect({
          id: String(payload.session_id || assistantBuffer.id),
          kind: 'chat-response',
          title: 'Respuesta de BAGO',
          summary: String(payload.response || payload.message || 'Respuesta recibida'),
          detail: [
            `provider: ${String(payload.provider || snapshot.model.provider || 'unknown')}`,
            `model: ${String(payload.model || snapshot.model.effectiveModel || 'unknown')}`,
            `receipt: ${receipt ? 'available' : 'pending'}`
          ],
          raw: safeJson(payload)
        });
      }
      setLastMessage(String(payload.response || payload.message || 'respuesta recibida'));
      await refreshAfterMutation();
      if (receipt) {
        setTurns((current) => current.map((turn) => turn.id === assistantBuffer.id ? { ...turn, status: 'done' } : turn));
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'falló el chat';
      setTurns((current) => current.map((turn) => turn.id === assistantBuffer.id ? { ...turn, status: 'failed', text: turn.text || messageText } : turn));
      setLastMessage(messageText);
    }
  };

  function onInspect(nextSelection: SelectionRecord, level: InspectorLevel = 'summary') {
    setSelection(nextSelection);
    setAndPersistUiState({ inspectorLevel: level });
  }

  const useSelectionInChat = (nextSelection: SelectionRecord) => {
    const text = [
      `Revisa esto: ${nextSelection.title}`,
      `kind: ${nextSelection.kind}`,
      `id: ${nextSelection.id}`,
      '',
      nextSelection.summary,
      ...nextSelection.detail.map((line) => `- ${line}`)
    ].join('\n');
    setDraft('chat', text);
    navigate('chat');
    setLastMessage(`selección enviada al chat: ${nextSelection.title}`);
  };

  const setDraft = (key: string, text: string) => {
    setUiState((current) => patchUiState(current, { drafts: { ...current.drafts, [key]: text } }));
  };

  const navigate = (section: ActiveSection) => setAndPersistUiState({ activeSection: section });

  const runAction = async (action: UiAction) => {
    if (!action.enabled) return;
    if (action.confirmation?.required && !window.confirm(action.confirmation.description || action.label)) return;
    if (action.kind === 'navigate' && action.payload?.section) {
      navigate(String(action.payload.section) as ActiveSection);
      return;
    }
    if (action.payload?.command) await runCommand(String(action.payload.command));
  };

  const paletteActions = useMemo(() => {
    const base: Array<{ id: string; label: string; action: () => void }> = [
      { id: 'nav-home', label: 'Ir a Inicio', action: () => navigate('home') },
      { id: 'nav-chat', label: 'Ir a Chat', action: () => navigate('chat') },
      { id: 'nav-workspace', label: 'Ir a Workspace', action: () => navigate('workspace') },
      { id: 'nav-graph', label: 'Ir a Nodos', action: () => navigate('graph') },
      { id: 'nav-pipeline', label: 'Ir a Pipeline', action: () => navigate('pipeline') },
      { id: 'nav-evidence', label: 'Ir a Evidencia', action: () => navigate('evidence') },
      { id: 'nav-context', label: 'Ir a Contexto', action: () => navigate('context') },
      { id: 'nav-system', label: 'Ir a Sistema', action: () => navigate('system') },
      { id: 'cmd-status', label: 'Ejecutar /status', action: () => void runCommand('/status') },
      { id: 'cmd-session', label: 'Ejecutar /session', action: () => void runCommand('/session') },
      { id: 'ctx-attach', label: 'Adjuntar contexto', action: () => void runContextCommand('/context attach') },
      { id: 'ctx-measure', label: 'Medir contexto', action: () => void runContextCommand('/context measure') },
      { id: 'focus', label: uiState.globalMode === 'focus' ? 'Salir de Focus' : 'Entrar en Focus', action: () => setAndPersistUiState({ globalMode: uiState.globalMode === 'focus' ? 'normal' : 'focus' }) },
      { id: 'review', label: uiState.globalMode === 'review' ? 'Salir de Revisión' : 'Entrar en Revisión', action: () => setAndPersistUiState({ globalMode: uiState.globalMode === 'review' ? 'normal' : 'review' }) }
    ];
    for (const action of combinedActions.filter((item) => item.visible && item.enabled)) {
      base.push({ id: `backend-${action.id}`, label: action.label, action: () => void runAction(action) });
    }
    return base;
  }, [combinedActions, uiState.globalMode]);

  const runPlanTask = async (task: string) => {
    const clean = task.trim();
    if (!clean) return;
    setUiState((current) => patchUiState(current, { drafts: { ...current.drafts, pipeline: clean } }));
    await runCommand(`/plan ${clean}`);
  };

  const openShell = (section: ActiveSection, mode: UiState['globalMode'] = 'normal') => {
    setEntered(true);
    setAndPersistUiState({ activeSection: section, globalMode: mode });
  };

  const openingLayer = !entered ? (
    <OpeningScreen
      snapshot={snapshot}
      opening={opening}
      booting={booting}
      workspaceHint={uiState.workspaceHint}
      apiBase={uiState.apiBase}
      apiToken={uiState.apiToken}
          onApiConfigChange={(patch) => setAndPersistUiState(patch)}
          onPrimary={() => openShell(opening.targetSection === 'home' && snapshot?.permissions.canChat ? 'chat' : opening.targetSection)}
          onContinue={() => { void runCommand('/session').then(() => openShell(snapshot?.permissions.canChat ? 'chat' : 'home')); }}
          onChooseWorkspace={openWorkspacePicker}
          onOpenPalette={() => setAndPersistUiState({ commandPaletteOpen: true })}
          onRefresh={bootstrap}
        />
  ) : null;

  return (
    <>
      {openingLayer || (
        <div className={`app-root mode-${uiState.globalMode} ${uiState.sidebarCollapsed ? 'sidebar-collapsed' : ''} ${selection ? 'has-inspector' : ''}`}>
          <GlobalHeader
            snapshot={snapshot}
            workspaceHint={uiState.workspaceHint}
            apiBase={uiState.apiBase}
            apiToken={uiState.apiToken}
            activeSection={uiState.activeSection}
            onApiConfigChange={(patch) => setAndPersistUiState(patch)}
            onOpenPalette={() => setAndPersistUiState({ commandPaletteOpen: true })}
            onToggleSidebar={() => setAndPersistUiState({ sidebarCollapsed: !uiState.sidebarCollapsed })}
            onRefresh={bootstrap}
            onSetMode={(mode) => setAndPersistUiState({ globalMode: mode })}
            onRunCommand={(command) => void runCommand(command)}
            onChooseWorkspace={openWorkspacePicker}
            globalMode={uiState.globalMode}
            sidebarCollapsed={uiState.sidebarCollapsed}
          />

          <div className="app-body">
            {uiState.globalMode === 'normal' && (
              <MainSidebar
                activeSection={uiState.activeSection}
                snapshot={snapshot}
                opening={opening}
                actions={combinedActions}
                workspaceHint={uiState.workspaceHint}
                collapsed={uiState.sidebarCollapsed}
                onNavigate={navigate}
                onRunAction={runAction}
              />
            )}

            <WorkspaceShell
              activeSection={uiState.activeSection}
              snapshot={snapshot}
              mode={uiState.globalMode}
            >
              <ControlSections
                section={uiState.activeSection}
                snapshot={snapshot}
                menu={menu}
                routes={routes}
                providers={providers}
                history={history}
                files={files}
                commandResults={commandResults}
                turns={turns}
                drafts={uiState.drafts}
                chatMode={uiState.chatMode}
                globalMode={uiState.globalMode}
                onDraftChange={setDraft}
                onSendChat={sendChat}
                onInspect={onInspect}
                onRunCommand={runCommand}
                onRunContextCommand={runContextCommand}
                onRunAction={runAction}
                onRunPlanTask={runPlanTask}
                onSetSection={navigate}
                onSetChatMode={(mode) => setAndPersistUiState({ chatMode: mode })}
                onSetGlobalMode={(mode) => setAndPersistUiState({ globalMode: mode })}
                onChooseWorkspace={openWorkspacePicker}
                onReadFile={(path) => clientRef.current.readFile(path).catch(() => null)}
              />
            </WorkspaceShell>

            {selection && uiState.globalMode === 'normal' && (
              <SelectionInspector
                selection={selection}
                inspectorLevel={uiState.inspectorLevel}
                onLevelChange={(level) => setAndPersistUiState({ inspectorLevel: level })}
                onUseInChat={useSelectionInChat}
                onClose={() => setSelection(null)}
              />
            )}
          </div>

          {uiState.globalMode === 'normal' && (
            <StatusBar snapshot={snapshot} booting={booting} lastMessage={lastMessage} openingLabel={opening.label} />
          )}
        </div>
      )}

      {uiState.commandPaletteOpen && (
        <CommandPalette actions={paletteActions} onClose={() => setAndPersistUiState({ commandPaletteOpen: false })} />
      )}
      {workspacePickerOpen && (
        <WorkspacePickerDialog
          value={workspacePickerValue}
          onChange={setWorkspacePickerValue}
          onClose={() => setWorkspacePickerOpen(false)}
          onChooseExplorer={() => { void chooseWorkspaceExplorer(); }}
          onConfirm={() => { void confirmWorkspacePicker(); }}
        />
      )}
    </>
  );
}

function asCommandReceipt(result: BackendCommandResult): Record<string, unknown> | undefined {
  if (!result || typeof result !== 'object') return undefined;
  const data = result as Record<string, unknown>;
  const receipt = data.receipt || data.context_receipt;
  return receipt && typeof receipt === 'object' && !Array.isArray(receipt) ? receipt as Record<string, unknown> : undefined;
}

interface PaletteProps {
  actions: Array<{ id: string; label: string; action: () => void }>;
  onClose: () => void;
}

function CommandPalette({ actions, onClose }: PaletteProps) {
  const [query, setQuery] = useState('');
  const filtered = actions.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="command-palette-backdrop" role="dialog" aria-modal="true" aria-label="Comandos rápidos">
      <div className="command-palette">
        <div className="command-palette-search">
          <span>/</span>
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar módulo, acción o comando" />
          <kbd>Esc</kbd>
        </div>
        <div className="command-palette-list">
          {filtered.length ? filtered.map((item) => (
            <button key={item.id} type="button" onClick={() => { item.action(); onClose(); }}>
              <span>{item.label}</span>
              <span>↵</span>
            </button>
          )) : <div className="palette-empty">No hay acciones que coincidan.</div>}
        </div>
      </div>
    </div>
  );
}

interface WorkspacePickerDialogProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onChooseExplorer: () => void;
  onConfirm: () => void;
}

function WorkspacePickerDialog({ value, onChange, onClose, onChooseExplorer, onConfirm }: WorkspacePickerDialogProps) {
  const bridge = getElectronBridge();
  const bridgeAvailable = Boolean((bridge?.chooseProjectRoot || bridge?.chooseWorkspaceRoot) && bridge?.linkProjectRoot);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) onConfirm();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, onConfirm]);

  return (
    <div className="command-palette-backdrop workspace-picker-backdrop" role="dialog" aria-modal="true" aria-label="Elegir workspace">
      <div className="command-palette workspace-picker">
        <div className="command-palette-search workspace-picker-search">
          <span>⌂</span>
          <input autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder="Ruta completa del workspace" />
          <kbd>Ctrl+Enter</kbd>
        </div>
        <div className="workspace-picker-body">
          <p>Elige el workspace con el explorador nativo o pega la ruta completa manualmente.</p>
          <div className="workspace-picker-example">
            <span>Ejemplo</span>
            <code>C:\Users\AMTEC_Terminal_1º\BAG4.8</code>
          </div>
        </div>
        <div className="workspace-picker-actions">
          <button type="button" className="secondary-button compact" onClick={onChooseExplorer} disabled={!bridgeAvailable}>Abrir Explorer</button>
          <button type="button" className="secondary-button compact" onClick={onClose}>Cancelar</button>
          <button type="button" className="primary-button compact" onClick={onConfirm}>Vincular workspace</button>
        </div>
      </div>
    </div>
  );
}
