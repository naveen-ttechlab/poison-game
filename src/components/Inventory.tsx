import { useGame } from '../context/GameContext';
import { TOOL_DEFINITIONS } from '../types/item';
import { audioManager } from '../audio/audioManager';

/** The player's own tool inventory, shown as a compact corner overlay on the 3D
 * scene. The opponent's tools are never shown here — only their count matters,
 * which the header can surface separately, and even that isn't exposed today:
 * this game is about extracting information through play, not reading it off a
 * HUD panel that isn't yours. */
export function Inventory() {
  const { state, dispatch } = useGame();
  const player = state.players.player;
  const isPlayerTurn = state.currentPlayer === 'player';
  const canAct = isPlayerTurn && state.phase === 'awaiting_action';
  // Antidote isn't a targeted action like the others — it's armed/disarmed here,
  // and stays toggleable even once the drink dialog is open (no control for it
  // lives there anymore).
  const canToggleAntidote = isPlayerTurn && (state.phase === 'awaiting_action' || state.phase === 'confirm_drink');
  const unrevealedCount = state.cups.filter((c) => !c.isRevealed).length;

  return (
    <div className="inventory-corner">
      <span className="inventory-label">Your Tools</span>
      <div className="inventory-slots">
        {player.inventory.length === 0 && <span className="inventory-empty">empty</span>}
        {player.inventory.map((tool) => {
          const def = TOOL_DEFINITIONS[tool.type];

          if (tool.type === 'antidote') {
            const armed = state.pendingUseAntidote;
            return (
              <button
                key={tool.instanceId}
                type="button"
                className={`tool-chip${armed ? ' tool-chip-armed' : ''}${!canToggleAntidote ? ' tool-chip-disabled' : ''}`}
                title={armed ? 'Antidote armed — will protect your next drink.' : def.description}
                disabled={!canToggleAntidote}
                onClick={() => {
                  if (!canToggleAntidote) return;
                  audioManager.click();
                  dispatch({ kind: 'toggle_antidote', player: 'player' });
                }}
              >
                <span className="tool-icon">{def.icon}</span>
                <span className="tool-name">{armed ? 'Antidote Ready' : def.name}</span>
              </button>
            );
          }

          const selected = state.pendingToolType === tool.type;
          const enoughCups = unrevealedCount >= def.targetsRequired;
          const usable = canAct && enoughCups;
          const title = enoughCups ? def.description : `${def.description} (not enough cups left)`;
          return (
            <button
              key={tool.instanceId}
              type="button"
              className={`tool-chip${selected ? ' tool-chip-selected' : ''}${!usable ? ' tool-chip-disabled' : ''}`}
              title={title}
              disabled={!usable}
              onClick={() => {
                if (!usable) return;
                audioManager.click();
                dispatch({ kind: 'select_tool', player: 'player', toolInstanceId: tool.instanceId });
              }}
            >
              <span className="tool-icon">{def.icon}</span>
              <span className="tool-name">{def.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
