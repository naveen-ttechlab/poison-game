import { useGame } from '../context/GameContext';
import { audioManager } from '../audio/audioManager';

export function RoundTransition() {
  const { state, dispatch } = useGame();
  return (
    <div className="overlay-screen overlay-screen-light">
      <div className="overlay-title overlay-round">Round {state.round} Complete</div>
      <p className="overlay-subtitle">The cups are cleared. New cups, new poison, new tools.</p>
      <button
        type="button"
        className="action-btn action-btn-drink"
        onClick={() => {
          audioManager.click();
          dispatch({ kind: 'advance_round' });
        }}
      >
        Continue to Round {state.round + 1}
      </button>
    </div>
  );
}
