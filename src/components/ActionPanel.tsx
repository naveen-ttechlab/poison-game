import { useGame } from '../context/GameContext';
import { TOOL_DEFINITIONS } from '../types/item';
import { audioManager } from '../audio/audioManager';

/** Tool-targeting hint — a floating corner card (next to Your Tools), not a bottom
 * bar, so it doesn't get lost off in a part of the screen nobody's looking at. */
export function ActionPanel() {
  const { state, dispatch, myRole } = useGame();
  const isPlayerTurn = state.currentPlayer === myRole;

  // Nothing to prompt while it's the opponent's turn, while it's the player's turn
  // but nothing is pending yet (clicking a cup opens the drink dialog directly),
  // or while confirming a drink (that's its own centered dialog).
  if (!isPlayerTurn || state.phase !== 'awaiting_targets' || !state.pendingToolType) {
    return null;
  }

  const def = TOOL_DEFINITIONS[state.pendingToolType];
  const chosen = state.pendingTargets.length;
  const remaining = def.targetsRequired - chosen;
  const instruction =
    def.targetsRequired === 1
      ? 'Click 1 cup on the table to use it on.'
      : chosen === 0
        ? `Click ${def.targetsRequired} cups on the table to use it on.`
        : `Click ${remaining} more cup${remaining === 1 ? '' : 's'} (${chosen} of ${def.targetsRequired} selected).`;

  return (
    <div className="targeting-hint">
      <div className="targeting-hint-tool">
        {def.icon} {def.name}
      </div>
      <p className="targeting-hint-text">{instruction}</p>
      <button
        type="button"
        className="action-btn action-btn-secondary targeting-hint-cancel"
        onClick={() => {
          audioManager.click();
          dispatch({ kind: 'cancel', player: myRole });
        }}
      >
        Cancel
      </button>
    </div>
  );
}
