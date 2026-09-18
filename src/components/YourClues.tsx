import { useGame } from '../context/GameContext';

const SOURCE_ICON: Record<string, string> = {
  ambient_clue: '📜',
  detector: '🔍',
  spoon: '🥄',
};

/** The player's own deduced facts — shown as its own panel under "Your Tools" in
 * the corner, separate from the public Events log on the other side. */
export function YourClues() {
  const { state, myRole } = useGame();
  const facts = [...state.playerKnowledge[myRole].facts].reverse();

  return (
    <div className="clue-log-section clue-log-section-clues corner-clues">
      <div className="clue-log-title">Your Clues</div>
      <ul className="clue-log-list">
        {facts.length === 0 && <li className="clue-log-empty">No clues yet — use a tool to learn something.</li>}
        {facts.map((fact) => (
          <li key={fact.id} className="clue-log-item">
            <span className="clue-icon">{SOURCE_ICON[fact.source] ?? '•'}</span>
            {fact.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
