import { useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import { Game } from './game/Game';
import { HUD } from './ui/HUD';
import { StartMenu } from './ui/StartMenu';
import { VictoryScreen } from './ui/VictoryScreen';
import { DefeatScreen } from './ui/DefeatScreen';
import { gameStore, useAppState } from './systems/GameState';
import { doorSystem } from './systems/DoorSystem';
import { noiseSystem } from './systems/NoiseSystem';
import { inputManager } from './systems/InputManager';
import { audioManager } from './game/Audio/AudioManager';
import { GameStage } from './types/game';
import './ui/ui.css';

export default function App() {
  const stage = useAppState((s) => s.stage);
  const [runId, setRunId] = useState(0);

  const handleStart = useCallback(() => {
    audioManager.unlock();
    gameStore.setStage(GameStage.PLAYING);
  }, []);

  const handleRestart = useCallback(() => {
    doorSystem.resetAll();
    noiseSystem.clear();
    gameStore.reset();
    setRunId((id) => id + 1);
  }, []);

  const showWorld = stage !== GameStage.MENU;

  return (
    <div className="app-root">
      {showWorld && (
        <div className="canvas-wrap">
          <Canvas
            key={runId}
            shadows
            camera={{ fov: 75, near: 0.1, far: 60 }}
            gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
            onCreated={({ gl }) => {
              inputManager.detach();
              inputManager.attach(gl.domElement);
            }}
          >
            <Game />
          </Canvas>
        </div>
      )}

      {stage === GameStage.MENU && <StartMenu onStart={handleStart} />}
      {showWorld && <HUD />}
      {stage === GameStage.VICTORY && <VictoryScreen onRestart={handleRestart} />}
      {stage === GameStage.DEFEAT && <DefeatScreen onRestart={handleRestart} />}
    </div>
  );
}
