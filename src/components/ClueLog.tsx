import { useGame } from '../context/GameContext';

/** The public Events log (right side panel) — what happened, visible to both
 * players. Your own deduced clues live separately in the `YourClues` panel under
 * your tools, not mixed in here. */
export function ClueLog() {
  const { state } = useGame();
  const events = [...state.history]
    .filter((e) => e.type === 'tool_use' || e.type === 'reveal' || e.type === 'round_start' || e.type === 'round_end')
    // Silent actions (Detector/Spoon) aren't physically observable — only the
    // player who did it should ever see that it happened.
    .filter((e) => !e.silent || e.actor === 'player')
    .reverse()
    .slice(0, 8);

  return (
    <div className="clue-log">
      {state.aiDialogue && <div className="ai-dialogue">"{state.aiDialogue}"</div>}
      <div className="clue-log-section clue-log-section-events">
        <div className="clue-log-title">Events</div>
        <ul className="clue-log-list">
          {events.length === 0 && <li className="clue-log-empty">Nothing yet.</li>}
          {events.map((evt) => (
            <li key={evt.id} className="clue-log-item">
              {evt.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
