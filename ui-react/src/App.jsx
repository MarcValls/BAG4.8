import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { useBagoBackend } from './hooks/useBagoBackend';
import { useManagerOrchestrator } from './hooks/useManagerOrchestrator';
import { MANAGER_MODULES } from './managerConfig';
import { TURN_COMMAND_ID } from './managerConfig';
import ModuleRail from './components/ModuleRail';
import ManagerTopBar from './components/ManagerTopBar';
import ChatCore from './components/ChatCore';
import ManagerPanel from './components/ManagerPanel';
import ManagerStatusStrip from './components/ManagerStatusStrip';
import CommandPalette from './components/CommandPalette';
import { useToast } from './components/Toast';

export default function App() {
  const backend = useBagoBackend();
  const orchestrator = useManagerOrchestrator();
  const { push } = useToast();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const reviewRailCollapsedRef = useRef(false);
  const snapshot = backend.snapshot;
  const surface = orchestrator.surface || 'chat';

  const paletteActions = useMemo(() => [
    {
      id: 'focus-chat',
      label: 'Ir a Chat',
      hint: 'Mostrar la conversación como superficie principal',
      category: 'Modo',
      keywords: ['chat', 'focus', 'conversación'],
      description: 'Cambia la vista a chat.',
      run: () => orchestrator.focusChat(),
    },
    {
      id: 'focus-manager',
      label: 'Ir a Manager',
      hint: 'Abrir el módulo activo en el panel',
      category: 'Modo',
      keywords: ['manager', 'panel', 'módulo'],
      description: 'Cambia la vista a manager.',
      run: () => orchestrator.focusManager(orchestrator.activeModule),
    },
    {
      id: 'focus-review',
      label: 'Modo Review',
      hint: 'Reduce ruido: chat principal y rail colapsado',
      category: 'Modo',
      keywords: ['review', 'zen', 'focus', 'low-noise'],
      description: 'Activa la vista de revisión.',
      run: () => {
        reviewRailCollapsedRef.current = orchestrator.railCollapsed;
        setReviewMode(true);
        orchestrator.focusChat();
        orchestrator.setRailCollapsed(true);
      },
    },
    {
      id: 'toggle-rail',
      label: orchestrator.railCollapsed ? 'Expandir rail' : 'Contraer rail',
      hint: 'Mostrar u ocultar el rail lateral',
      category: 'Layout',
      keywords: ['rail', 'sidebar', 'layout'],
      description: 'Alterna el rail lateral.',
      run: () => orchestrator.setRailCollapsed(!orchestrator.railCollapsed),
    },
    {
      id: 'refresh',
      label: 'Actualizar snapshot',
      hint: 'Pedir un estado nuevo al backend',
      category: 'Sistema',
      keywords: ['refresh', 'reload', 'snapshot'],
      description: 'Recarga el backend.',
      run: () => backend.refresh(),
    },
    ...MANAGER_MODULES.map((module) => ({
      id: `module-${module.id}`,
      label: `Abrir ${module.label}`,
      hint: module.description,
      category: 'Módulos',
      keywords: [module.id, module.label, module.group, 'module'],
      description: `Abre el módulo ${module.label}.`,
      run: () => orchestrator.openModule(module.id),
    })),
  ], [backend, orchestrator]);

  useEffect(() => {
    function handleKeyDown(event) {
      const modifier = event.ctrlKey || event.metaKey;
      if (reviewMode && event.key === 'Escape') {
        event.preventDefault();
        setReviewMode(false);
        orchestrator.setRailCollapsed(reviewRailCollapsedRef.current);
        return;
      }
      if (paletteOpen && event.key === 'Escape') {
        event.preventDefault();
        setPaletteOpen(false);
        return;
      }
      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((value) => !value);
        return;
      }
      if (!modifier) return;
      if (event.key.toLowerCase() === 'j') {
        event.preventDefault();
        orchestrator.focusChat();
      } else if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        orchestrator.focusManager(orchestrator.activeModule);
      } else if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        orchestrator.setRailCollapsed(!orchestrator.railCollapsed);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orchestrator, paletteOpen, reviewMode]);

  async function submitTurn(text) {
    try {
      const result = await backend.execute(TURN_COMMAND_ID, {
        text,
        manager_context: orchestrator.context,
      });
      orchestrator.applyDirectives(result);
      return result;
    } catch (error) {
      push(error.message || 'No se pudo completar el turno.', 'error');
      return null;
    }
  }

  async function runAction(action) {
    if (!action?.command_id) return null;
    try {
      const result = await backend.execute(action.command_id, action.arguments || {}, {
        approval_id: action.approval_id,
      });
      orchestrator.applyDirectives(result);
      return result;
    } catch (error) {
      push(error.message || `No se pudo ejecutar ${action.command_id}.`, 'error');
      return null;
    }
  }

  const workspaceClass = [
    'workspace',
    `workspace--${surface}`,
    (reviewMode || orchestrator.railCollapsed) ? 'rail-collapsed' : '',
    reviewMode ? 'workspace--review' : '',
  ].filter(Boolean).join(' ');

  return (
    <main className="unified-app">
      {reviewMode ? null : (
        <ModuleRail
          orchestrator={orchestrator}
          snapshot={snapshot}
          onRefresh={() => backend.refresh()}
          refreshing={backend.phase === 'loading'}
        />
      )}

      <section className="unified-shell">
        <ManagerTopBar
          snapshot={snapshot}
          orchestrator={orchestrator}
          onRefresh={() => backend.refresh()}
          onOpenPalette={() => setPaletteOpen(true)}
          onEnterReview={() => {
            if (reviewMode) {
              setReviewMode(false);
              orchestrator.setRailCollapsed(reviewRailCollapsedRef.current);
              return;
            }
            reviewRailCollapsedRef.current = orchestrator.railCollapsed;
            setReviewMode(true);
            orchestrator.focusChat();
            orchestrator.setRailCollapsed(true);
          }}
          reviewMode={reviewMode}
          refreshing={backend.phase === 'loading'}
          eventConnected={backend.eventConnected}
        />

        {backend.phase === 'error' && !snapshot ? (
          <div className="backend-blocked ui-surface ui-surface--subtle">
            <div className="backend-blocked-mark">!</div>
            <h2>Backend no conectado</h2>
            <p>{backend.error?.message || 'No se ha recibido el snapshot canonico.'}</p>
            <code>src/backend/config.js</code>
            <button type="button" className="ui-button ui-button--primary" onClick={() => backend.refresh()}>
              Reintentar
            </button>
          </div>
        ) : (
          <div className={workspaceClass}>
            {surface !== 'manager' ? (
              <section className="workspace-pane workspace-pane--chat">
                <ChatCore
                  snapshot={snapshot}
                  pending={backend.commandPending}
                  commandResult={backend.commandResult}
                  error={backend.error}
                  onSubmit={submitTurn}
                  onAction={runAction}
                  orchestrator={orchestrator}
                />
              </section>
            ) : null}

            {surface !== 'chat' ? (
              <section className="workspace-pane workspace-pane--manager">
                <ManagerPanel
                  snapshot={snapshot}
                  orchestrator={orchestrator}
                  pending={backend.commandPending}
                  commandResult={backend.commandResult}
                  lastEvent={backend.lastEvent}
                  eventConnected={backend.eventConnected}
                  onAction={runAction}
                  onInterpret={backend.interpretQuestion}
                  onInterpretHistory={backend.getInterpretHistory}
                  onInterpretRules={backend.getInterpretRules}
                />
              </section>
            ) : null}
          </div>
        )}

        <ManagerStatusStrip snapshot={snapshot} orchestrator={orchestrator} pending={backend.commandPending} />
      </section>

      <CommandPalette
        open={paletteOpen}
        actions={paletteActions}
        onClose={() => setPaletteOpen(false)}
        onPick={(action) => {
          action.run();
          push(action.description || action.label);
        }}
      />
    </main>
  );
}
