import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { audioManager } from '../audio/audioManager';

export function GameOver() {
  const { state, dispatch, myRole } = useGame();
  const won = state.winner === myRole;

  useEffect(() => {
    if (won) audioManager.victory();
    else audioManager.defeat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="overlay-screen">
      <div className={`overlay-title ${won ? 'overlay-victory' : 'overlay-defeat'}`}>{won ? 'You Survived' : 'You Have Fallen'}</div>
      <p className="overlay-subtitle">
        {won ? 'The opponent has no cups left to hide behind.' : 'The table claims another guest.'}
      </p>
      <button
        type="button"
        className="action-btn action-btn-drink"
        onClick={() => {
          audioManager.click();
          dispatch({ kind: 'new_match' });
        }}
      >
        Play Again
      </button>
    </div>
  );
}
