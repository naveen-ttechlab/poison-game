import { useGame } from '../context/GameContext';

/** A prominent turn indicator floating near the hanging lamp — the small text under
 * "ROUND" in the header was too easy to miss, so whose turn it is now shows right
 * where the eye already goes (the one lit thing in the room). */
export function TurnBadge() {
  const { state, myRole } = useGame();
  const isPlayerTurn = state.currentPlayer === myRole;

  return (
    <div className={`turn-badge${isPlayerTurn ? ' turn-badge-player' : ' turn-badge-opponent'}`}>
      {isPlayerTurn ? 'Your Turn' : "Opponent's Turn"}
    </div>
  );
}
