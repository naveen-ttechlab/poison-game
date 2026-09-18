import { audioManager } from '../audio/audioManager';

interface ModeSelectProps {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
}

export function ModeSelect({ onSinglePlayer, onMultiplayer }: ModeSelectProps) {
  return (
    <div className="overlay-screen">
      <div className="overlay-title overlay-round">The Poison Cup</div>
      <p className="overlay-subtitle">Two of the cups on the table are poison. Drink wrong, and it's your last round.</p>
      <div className="mode-select-actions">
        <button
          type="button"
          className="action-btn action-btn-drink"
          onClick={() => {
            audioManager.click();
            onSinglePlayer();
          }}
        >
          Single Player
        </button>
        <button
          type="button"
          className="action-btn action-btn-secondary"
          onClick={() => {
            audioManager.click();
            onMultiplayer();
          }}
        >
          Multiplayer
        </button>
      </div>
      <p className="overlay-subtitle mode-select-hint">Single Player faces an AI opponent. Multiplayer plays over your wifi against another person.</p>
    </div>
  );
}
