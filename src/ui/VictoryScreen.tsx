export function VictoryScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="overlay-screen">
      <div className="overlay-title victory">You Escaped</div>
      <p className="overlay-subtitle">
        The weapon born of five cursed things has done its work. The house falls silent behind you as the door
        swings shut for the last time.
      </p>
      <button className="menu-btn" onClick={onRestart}>
        Play Again
      </button>
    </div>
  );
}
