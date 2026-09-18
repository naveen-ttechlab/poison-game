import { useGame } from '../context/GameContext';
import { audioManager } from '../audio/audioManager';

/** Centered dialog that appears the moment you click a cup — replaces the old
 * bottom-bar confirmation so the decision reads as a deliberate, focused choice.
 * Antidote isn't chosen here — it's armed from the Your Tools panel beforehand;
 * this dialog just shows whether it's currently armed. */
export function DrinkDialog() {
  const { state, dispatch } = useGame();
  const isPlayerTurn = state.currentPlayer === 'player';

  if (!isPlayerTurn || state.phase !== 'confirm_drink' || !state.pendingDrinkCupId) return null;

  const cup = state.cups.find((c) => c.id === state.pendingDrinkCupId);

  return (
    <div className="drink-dialog-backdrop">
      <div className="drink-dialog">
        <div className="drink-dialog-title">Drink Cup {cup?.displayNumber}?</div>
        <p className="drink-dialog-subtitle">
          {state.pendingUseAntidote
            ? '🧪 Antidote is armed — it will save you if this is poison.'
            : "There's no telling what's in it until you do."}
        </p>
        <div className="drink-dialog-actions">
          <button
            type="button"
            className="action-btn action-btn-drink"
            onClick={() => {
              audioManager.click();
              dispatch({ kind: 'confirm_drink', player: 'player' });
            }}
          >
            Drink
          </button>
          <button
            type="button"
            className="action-btn action-btn-secondary"
            onClick={() => {
              audioManager.click();
              dispatch({ kind: 'cancel', player: 'player' });
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
