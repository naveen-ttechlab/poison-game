export function DefeatScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="overlay-screen">
      <div className="overlay-title defeat">It Found You</div>
      <p className="overlay-subtitle">The house keeps its secrets. Your search ends here.</p>
      <button className="menu-btn" onClick={onRestart}>
        Try Again
      </button>
    </div>
  );
}
