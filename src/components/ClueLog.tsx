import { useGame } from '../context/GameContext';

/** The public Events log (right side panel) — what happened, visible to both
 * players. Your own deduced clues live separately in the `YourClues` panel under
 * your tools, not mixed in here. */
export function ClueLog() {
  const { state, myRole } = useGame();
  const events = [...state.history]
    .filter((e) => e.type === 'tool_use' || e.type === 'reveal' || e.type === 'round_start' || e.type === 'round_end')
    // Silent actions (Detector/Spoon) aren't physically observable — only the
    // player who did it should ever see that it happened.
    .filter((e) => !e.silent || e.actor === myRole)
    .reverse()
    .slice(0, 8);

  return (
    <div className="clue-log">
      {state.aiDialogue && <div className="ai-dialogue">"{state.aiDialogue}"</div>}
      <div className="clue-log-section clue-log-section-events">
        <div className="clue-log-title">Events</div>
        <ul className="clue-log-list">
          {events.length === 0 && <li className="clue-log-empty">Nothing yet.</li>}
          {events.map((evt) => {
            // The stored text is deliberately subject-less for tool_use/reveal —
            // "you" depends on which side of a multiplayer match is reading it,
            // so that word is added here rather than baked into shared state.
            const hasSubject = evt.type === 'tool_use' || evt.type === 'reveal';
            const subject = evt.actor === myRole ? 'You' : 'Opponent';
            return (
              <li key={evt.id} className="clue-log-item">
                {hasSubject ? `${subject} ${evt.text}` : evt.text}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
