export function StartMenu({ onStart }: { onStart: () => void }) {
  return (
    <div className="start-screen">
      <h1 className="start-title">Don't Look Behind You</h1>
      <p className="start-subtitle">
        You wake up inside an abandoned house. Somewhere within its walls are five cursed objects — find them,
        combine them into a weapon in the ritual room, and destroy the thing that hunts these halls before it finds
        you first.
      </p>
      <button className="menu-btn" onClick={onStart}>
        Enter the House
      </button>
      <div className="controls-hint">
        WASD move &nbsp;·&nbsp; Mouse look &nbsp;·&nbsp; Shift sprint &nbsp;·&nbsp; E interact &nbsp;·&nbsp; F
        flashlight
      </div>
    </div>
  );
}
