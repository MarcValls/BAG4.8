import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bagoBackend } from '../backend';

const INITIAL_STATE = Object.freeze({
  phase: 'idle',
  snapshot: null,
  error: null,
  eventConnected: false,
  commandResult: null,
  commandPending: false,
  lastEvent: null,
});

export function useBagoBackend() {
  const [state, setState] = useState(INITIAL_STATE);
  const mounted = useRef(true);
  const refreshTimer = useRef(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setState((current) => ({ ...current, phase: 'loading', error: null }));
    }

    try {
      const snapshot = await bagoBackend.getBootstrap();
      if (!mounted.current) return null;
      setState((current) => ({
        ...current,
        phase: 'ready',
        snapshot,
        error: null,
      }));
      return snapshot;
    } catch (error) {
      if (!mounted.current) return null;
      setState((current) => ({
        ...current,
        phase: current.snapshot ? 'ready' : 'error',
        error,
      }));
      return null;
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => refresh({ silent: true }), 80);
  }, [refresh]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
      window.clearTimeout(refreshTimer.current);
    };
  }, [refresh]);

  const sessionId = state.snapshot?.authorities?.session_id;

  useEffect(() => {
    if (!sessionId) {
      return () => {};
    }
    const unsubscribe = bagoBackend.subscribe({
      sessionId,
      onOpen: () => mounted.current && setState((current) => ({ ...current, eventConnected: true })),
      onEvent: (data, type) => {
        if (!mounted.current) return;
        setState((current) => ({ ...current, lastEvent: { type, data, received_at: new Date().toISOString() } }));
        if (type === 'state.snapshot' && data?.contract_version) {
          setState((current) => ({ ...current, snapshot: data, phase: 'ready', error: null }));
        } else {
          scheduleRefresh();
        }
      },
      onError: () => mounted.current && setState((current) => ({ ...current, eventConnected: false })),
    });
    return unsubscribe;
  }, [scheduleRefresh, sessionId]);

  const execute = useCallback(async (commandId, argumentsValue = {}, options = {}) => {
    const authorities = state.snapshot?.authorities || {};
    setState((current) => ({ ...current, commandPending: true, commandResult: null }));

    try {
      const result = await bagoBackend.execute(commandId, argumentsValue, {
        session_id: authorities.session_id,
        workspace_id: authorities.workspace_id,
        expected_state_revision: options.expected_state_revision ?? state.snapshot?.state_revision,
        approval_id: options.approval_id,
        idempotency_key: options.idempotency_key,
      });
      if (!mounted.current) return result;
      setState((current) => ({ ...current, commandPending: false, commandResult: result }));
      await refresh({ silent: true });
      return result;
    } catch (error) {
      if (mounted.current) {
        setState((current) => ({ ...current, commandPending: false, error }));
      }
      throw error;
    }
  }, [refresh, state.snapshot]);

  const interpretQuestion = useCallback((question) => bagoBackend.interpretQuestion(question), []);
  const getInterpretHistory = useCallback((limit) => bagoBackend.getInterpretHistory(limit), []);
  const getInterpretRules = useCallback(() => bagoBackend.getInterpretRules(), []);

  return useMemo(() => ({
    ...state,
    refresh,
    execute,
    interpretQuestion,
    getInterpretHistory,
    getInterpretRules,
  }), [state, refresh, execute, interpretQuestion, getInterpretHistory, getInterpretRules]);
}
