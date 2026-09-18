import { useEffect, useState } from 'react';
import { useAppState } from '../systems/GameState';
import { inputManager } from '../systems/InputManager';
import { ITEMS } from '../constants/items';
import { DAY_MODE } from '../constants/gameConfig';
import { GameStage } from '../types/game';

export function HUD() {
  const stage = useAppState((s) => s.stage);
  const objective = useAppState((s) => s.objective);
  const inventory = useAppState((s) => s.inventory);
  const hud = useAppState((s) => s.hud);
  const [locked, setLocked] = useState(inputManager.pointerLocked);

  useEffect(() => {
    const id = window.setInterval(() => setLocked(inputManager.pointerLocked), 150);
    return () => window.clearInterval(id);
  }, []);

  const danger = Math.max(0, hud.monsterProximity - 0.15);

  return (
    <div className="hud-layer">
      {!DAY_MODE && <div className="vignette" />}
      <div className="vignette-danger" style={{ opacity: danger }} />
      <div className="crosshair" />

      <div className="hud-top">
        <div className="objective-box">
          <div className="objective-label">Objective</div>
          {objective}
        </div>
        <div className="inventory-row">
          {ITEMS.map((item) => {
            const has = inventory.includes(item.id);
            return (
              <div key={item.id} className={`inventory-slot${has ? ' filled' : ''}`} title={item.name}>
                {has && <div className="inventory-dot" style={{ background: item.color }} />}
              </div>
            );
          })}
        </div>
      </div>

      {stage === GameStage.RITUAL && (
        <div className="ritual-overlay">
          <div className="ritual-text">The ritual binds them...</div>
        </div>
      )}

      <div className="hud-bottom">
        {hud.interactPrompt && <div className="interact-prompt">[E] {hud.interactPrompt}</div>}
        <div className="stamina-bar-wrap">
          <div className="stamina-bar-fill" style={{ width: `${hud.stamina * 100}%` }} />
        </div>
      </div>

      {!locked && stage !== GameStage.RITUAL && (
        <div className="click-prompt" style={{ pointerEvents: 'auto' }} onClick={() => inputManager.requestLock()}>
          Click to look around
        </div>
      )}
    </div>
  );
}
