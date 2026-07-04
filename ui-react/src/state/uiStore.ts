import type { ActiveSection, ChatMode, GlobalMode, InspectorLevel } from '@/contracts/backend';

const KEY = 'bago.ui.state';

export interface UiState {
  sidebarCollapsed: boolean;
  activeSection: ActiveSection;
  globalMode: GlobalMode;
  chatMode: ChatMode;
  inspectorLevel: InspectorLevel;
  commandPaletteOpen: boolean;
  apiBase: string;
  apiToken: string;
  workspaceHint: string;
  drafts: Record<string, string>;
}

export interface UiStatePatch {
  sidebarCollapsed?: boolean;
  activeSection?: ActiveSection;
  globalMode?: GlobalMode;
  chatMode?: ChatMode;
  inspectorLevel?: InspectorLevel;
  commandPaletteOpen?: boolean;
  apiBase?: string;
  apiToken?: string;
  workspaceHint?: string;
  drafts?: Record<string, string>;
}

export function createDefaultUiState(): UiState {
  return {
    sidebarCollapsed: false,
    activeSection: 'home',
    globalMode: 'normal',
    chatMode: 'live',
    inspectorLevel: 'summary',
    commandPaletteOpen: false,
    apiBase: '',
    apiToken: '',
    workspaceHint: '',
    drafts: {}
  };
}

export function loadUiState(): UiState {
  if (typeof window === 'undefined') {
    return createDefaultUiState();
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createDefaultUiState();
    const parsed = JSON.parse(raw) as Partial<UiState>;
    return {
      ...createDefaultUiState(),
      ...parsed,
      drafts: parsed.drafts || {}
    };
  } catch {
    return createDefaultUiState();
  }
}

export function persistUiState(state: UiState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function patchUiState(state: UiState, patch: UiStatePatch): UiState {
  return {
    ...state,
    ...patch,
    drafts: patch.drafts ? { ...state.drafts, ...patch.drafts } : state.drafts
  };
}
