export type SystemState = 'confirmed' | 'loading' | 'degraded' | 'error' | 'unknown' | 'blocked';
export type GlobalMode = 'normal' | 'focus' | 'review';
export type ChatMode = 'live' | 'trace';
export type InspectorLevel = 'summary' | 'detail' | 'raw';
export type ActiveSection = 'home' | 'chat' | 'workspace' | 'graph' | 'pipeline' | 'evidence' | 'context' | 'system';

export interface BackendHealth {
  ok?: boolean;
  detail?: string;
  latency_ms?: number;
  [key: string]: unknown;
}

export interface BackendReceipt {
  envelope_id?: string;
  [key: string]: unknown;
}

export interface BackendContextCertification {
  status?: string;
  [key: string]: unknown;
}

export interface UiAction {
  id: string;
  label: string;
  kind: 'navigate' | 'command' | 'mutation' | 'inspect' | 'danger';
  enabled: boolean;
  visible: boolean;
  reasonDisabled?: string;
  confirmation?: {
    required: boolean;
    title?: string;
    description?: string;
  };
  payload?: Record<string, unknown>;
}

export interface UiBootstrapSnapshot {
  system: {
    state: SystemState;
    backendAvailable: boolean;
    version?: string;
    healthDetail?: string;
    healthLatencyMs?: number;
    bindingReason?: string;
    objective?: string;
    activeAgent?: string;
    activeBridges?: string[];
  };
  framework: {
    root?: string;
    version?: string;
    confirmed: boolean;
  };
  project: {
    root?: string;
    state: 'confirmed' | 'not_detected' | 'invalid' | 'legacy_detected' | 'unknown';
  };
  workspace: {
    id?: string;
    root?: string;
    scopeRoot?: string;
    authorizedRoot?: string;
    repoRoot?: string;
    repoBranch?: string;
    bindingReason?: string;
    manifestState: 'valid' | 'invalid' | 'missing' | 'legacy' | 'unknown';
    linkedToSession: boolean;
  };
  session: {
    id?: string;
    state: 'valid' | 'recoverable' | 'missing' | 'blocked' | 'unknown';
    activeAgent?: string;
  };
  model: {
    provider?: string;
    adapter?: string;
    runtime?: string;
    configuredModel?: string;
    effectiveModel?: string;
    state: 'confirmed' | 'degraded' | 'unknown' | 'error';
  };
  context: {
    state: 'confirmed' | 'partial' | 'stale' | 'blocked' | 'unknown';
    revision?: number | string;
    occupied?: number;
    available?: number;
    limit?: number;
    reserve?: number;
    limitingFactor?: string;
    receiptId?: string;
    certificationStatus?: string;
  };
  permissions: {
    canChat: boolean;
    canInitializeWorkspace: boolean;
    canLinkWorkspace: boolean;
    canRepairWorkspace: boolean;
    canRunTools: boolean;
    canInspectContext: boolean;
    canViewEvidence: boolean;
    canStopPipeline: boolean;
    canRetryPipeline: boolean;
  };
  recommendedActions: UiAction[];
}

export interface BackendStatus {
  [key: string]: unknown;
  session_id?: string;
  provider?: string;
  model?: string;
  project_root?: string;
  workspace_state_root?: string;
  workspace_scope_root?: string;
  workspace_id?: string;
  framework_root?: string;
  framework_version?: string;
  binding_confirmed?: boolean;
  binding_reason?: string;
  repo_root?: string;
  repo_branch?: string;
  authorized_root?: string;
  objective?: string;
  context_revision?: number | string;
  health?: BackendHealth;
  last_receipt?: BackendReceipt | null;
  context_certification?: BackendContextCertification | null;
  context_measure?: Record<string, unknown> | null;
  context_benchmark?: Record<string, unknown> | null;
  active_agent?: string;
  active_bridges?: string[];
  model_catalog_mode?: string;
  model_state?: string;
  context_state?: string;
}

export interface BackendSession {
  [key: string]: unknown;
  session_id?: string;
  provider?: string;
  model?: string;
  status?: BackendStatus;
  workspace_state?: Record<string, unknown>;
  welcome_state?: Record<string, unknown>;
  menu_state?: Record<string, unknown>;
  binding?: Record<string, unknown>;
  active_agent?: string;
  tool_calling?: boolean;
  model_catalog_mode?: string;
}

export interface BackendProviders {
  providers?: Array<Record<string, unknown>>;
  mode?: string;
}

export interface BackendMenu {
  [key: string]: unknown;
  sections?: Array<Record<string, unknown>>;
  visible_sections?: string[];
}

export interface BackendRoutes {
  ok?: boolean;
  routes?: Array<Record<string, unknown>>;
  count?: number;
  api_prefixes?: string[];
  auth?: string;
}

export interface BackendHistory {
  session_id?: string;
  messages?: Array<Record<string, unknown>>;
  count?: number;
}

export interface BackendCommandResult {
  ok?: boolean;
  message?: string;
  action?: string;
  session_id?: string;
  provider?: string;
  model?: string;
  data?: unknown;
  plan?: unknown;
}

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'command';
  text: string;
  status?: 'sending' | 'running' | 'validating' | 'done' | 'failed' | 'blocked';
  receipt?: Record<string, unknown> | null;
  raw?: unknown;
  timestamp: string;
}

export interface SelectionRecord {
  id: string;
  kind: string;
  title: string;
  summary: string;
  detail: string[];
  raw: unknown;
}

export interface OpeningDecision {
  id:
    | 'enter_directly'
    | 'show_recovery'
    | 'show_workspace_link'
    | 'show_workspace_repair'
    | 'show_workspace_init'
    | 'show_legacy_migration'
    | 'show_blocked_state';
  label: string;
  reason: string;
  actionLabel: string;
  targetSection: ActiveSection;
}

export interface UiBootData {
  status?: BackendStatus;
  session?: BackendSession;
  providers?: BackendProviders;
  menu?: BackendMenu;
  routes?: BackendRoutes;
  history?: BackendHistory;
  files?: Record<string, unknown>;
}
