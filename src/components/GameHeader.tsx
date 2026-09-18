import { useGame } from '../context/GameContext';
import { STARTING_HP } from '../types/game';

function HeartRow({ hp }: { hp: number }) {
  return (
    <div className="heart-row">
      {Array.from({ length: STARTING_HP }, (_, i) => (
        <span key={i} className={`heart${i < hp ? ' heart-full' : ' heart-empty'}`}>
          ♥
        </span>
      ))}
    </div>
  );
}

export function GameHeader() {
  const { state } = useGame();
  return (
    <header className="game-header">
      <div className="header-side">
        <div className="player-name">The Opponent</div>
        <HeartRow hp={state.players.ai.hp} />
      </div>
      <div className="header-center">
        <div className="round-label">ROUND {state.round}</div>
      </div>
      <div className="header-side header-side-right">
        <div className="player-name">You</div>
        <HeartRow hp={state.players.player.hp} />
      </div>
    </header>
  );
}
