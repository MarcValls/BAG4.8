import { useCallback, useEffect, useMemo, useState } from 'react';
import { moduleDefinition } from '../managerConfig';

const STORAGE_KEY = 'bago.unified-manager.layout.v1';

function readStored() {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function collectDirectives(result) {
  const buckets = [
    result?.ui_directives,
    result?.data?.ui_directives,
    result?.data?.ui?.directives,
    result?.ui?.directives,
  ];
  return buckets.flatMap((value) => (Array.isArray(value) ? value : []));
}

export function useManagerOrchestrator() {
  const stored = readStored();
  const [activeModule, setActiveModule] = useState(stored?.activeModule || 'overview');
  const legacySurface = stored?.panelOpen === false && stored?.chatVisible === true
    ? 'chat'
    : stored?.panelOpen === true && stored?.chatVisible === false
      ? 'manager'
    : stored?.panelOpen === true && stored?.chatVisible === true
        ? 'chat'
        : 'chat';
  const initialSurface = typeof stored?.surface === 'string' && stored.surface !== 'split'
    ? stored.surface
    : legacySurface;
  const [surface, setSurface] = useState(initialSurface);
  const [panelWide, setPanelWide] = useState(stored?.panelWide ?? false);
  const [railCollapsed, setRailCollapsed] = useState(stored?.railCollapsed ?? false);
  const [selection, setSelection] = useState(stored?.selection || null);
  const panelOpen = surface !== 'chat';
  const chatVisible = surface !== 'manager';

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        activeModule,
        surface,
        panelOpen,
        panelWide,
        chatVisible,
        railCollapsed,
        selection,
      }));
    } catch {
      // Persistencia visual, no autoridad operacional.
    }
  }, [activeModule, surface, panelOpen, panelWide, chatVisible, railCollapsed, selection]);

  const openModule = useCallback((moduleId, nextSelection = null) => {
    const resolvedModule = moduleDefinition(moduleId).id;
    setActiveModule(resolvedModule);
    setSelection(nextSelection);
    setSurface('manager');
  }, []);

  const closePanel = useCallback(() => setSurface('chat'), []);
  const togglePanel = useCallback(() => setSurface((value) => (value === 'manager' ? 'chat' : 'manager')), []);
  const toggleChat = useCallback(() => setSurface((value) => (value === 'chat' ? 'manager' : 'chat')), []);
  const focusChat = useCallback(() => {
    setSurface('chat');
  }, []);
  const focusManager = useCallback((moduleId = activeModule) => {
    setActiveModule(moduleDefinition(moduleId).id);
    setSurface('manager');
  }, [activeModule]);
  const restoreSplit = useCallback(() => {
    setSurface('chat');
  }, []);

  const applyDirectives = useCallback((result) => {
    for (const directive of collectDirectives(result)) {
      const type = String(directive?.type || directive?.action || '').toLowerCase();
      const moduleId = directive?.module || directive?.center_id || directive?.panel;

      if (['manager.open', 'panel.open', 'center.open'].includes(type) && moduleId) {
        openModule(String(moduleId), directive?.selection || null);
      } else if (['manager.close', 'panel.close'].includes(type)) {
        setSurface('chat');
      } else if (['chat.show', 'chat.open'].includes(type)) {
        setSurface('chat');
      } else if (['chat.hide', 'chat.close'].includes(type)) {
        setSurface('manager');
      } else if (type === 'chat.focus') {
        focusChat();
      } else if (['manager.focus', 'panel.maximize'].includes(type)) {
        focusManager(moduleId ? String(moduleId) : activeModule);
      } else if (type === 'layout.split') {
        focusChat();
      } else if (['entity.select', 'manager.select'].includes(type)) {
        if (moduleId) setActiveModule(moduleDefinition(String(moduleId)).id);
        setSelection(directive?.selection || directive?.entity || null);
        setSurface('manager');
      }
    }
  }, [activeModule, focusChat, focusManager, openModule, restoreSplit]);

  const context = useMemo(() => ({
    surface,
    active_module: activeModule,
    panel_open: panelOpen,
    panel_wide: panelWide,
    chat_visible: chatVisible,
    selected_entity: selection,
  }), [activeModule, surface, panelOpen, panelWide, chatVisible, selection]);

  return useMemo(() => ({
    activeModule,
    activeDefinition: moduleDefinition(activeModule),
    surface,
    panelOpen,
    panelWide,
    chatVisible,
    railCollapsed,
    selection,
    context,
    setPanelWide,
    setRailCollapsed,
    setSelection,
    setSurface,
    openModule,
    closePanel,
    togglePanel,
    toggleChat,
    focusChat,
    focusManager,
    restoreSplit,
    applyDirectives,
  }), [
    activeModule,
    surface,
    panelOpen,
    panelWide,
    chatVisible,
    railCollapsed,
    selection,
    context,
    openModule,
    closePanel,
    togglePanel,
    toggleChat,
    focusChat,
    focusManager,
    restoreSplit,
    applyDirectives,
  ]);
}
