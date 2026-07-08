import React from 'react';
import type { OpeningDecision } from '@/contracts/backend';

interface OpeningScreenProps {
  opening: OpeningDecision;
  booting?: boolean;
  onPrimary?: () => void;
  onChooseWorkspace?: () => void;
  onOpenPalette?: () => void;
}

export function OpeningScreen({
  opening,
  booting = false,
  onPrimary,
  onChooseWorkspace,
  onOpenPalette,
}: OpeningScreenProps) {
  const showWorkspacePicker =
    opening.id === 'show_workspace_init' || opening.id === 'show_workspace_link';

  return (
    <div className="opening-screen" role="main" aria-label={opening.label}>
      <div className="opening-screen__body">
        <div className="opening-screen__state">
          <h2 className="opening-screen__title">{opening.label}</h2>
          <p className="opening-screen__reason">{opening.reason}</p>
        </div>

        <div className="opening-screen__actions">
          {showWorkspacePicker && (
            <button
              className="opening-screen__btn opening-screen__btn--secondary"
              onClick={onChooseWorkspace}
              disabled={booting}
              type="button"
            >
              Elegir carpeta de proyecto
            </button>
          )}
          <button
            className="opening-screen__btn opening-screen__btn--primary"
            onClick={onPrimary}
            disabled={booting}
            type="button"
          >
            {booting ? 'Cargando…' : opening.actionLabel}
          </button>
        </div>

        <div className="opening-screen__hints">
          <kbd className="opening-screen__kbd" title="Abrir paleta de comandos" onClick={onOpenPalette}>
            Ctrl+K
          </kbd>
          <span className="opening-screen__hint-label">Comandos rápidos disponibles</span>
        </div>
      </div>
    </div>
  );
}

export default OpeningScreen;
