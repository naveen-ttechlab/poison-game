import { useCallback, useEffect, useRef, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { GameScene } from './components/GameScene';
import { GameHeader } from './components/GameHeader';
import { Inventory } from './components/Inventory';
import { YourClues } from './components/YourClues';
import { TurnBadge } from './components/TurnBadge';
import { ClueLog } from './components/ClueLog';
import { ActionPanel } from './components/ActionPanel';
import { DrinkDialog } from './components/DrinkDialog';
import { GameOver } from './components/GameOver';
import { RoundTransition } from './components/RoundTransition';
import { audioManager } from './audio/audioManager';
import './App.css';

function GameRoot() {
  const { state, dispatch } = useGame();
  const [poisonFlash, setPoisonFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [announcement, setAnnouncement] = useState<{ text: string; variant: 'poison' | 'saved' | 'safe' } | null>(null);
  const announcementTimer = useRef<number | null>(null);
  const aiTimer = useRef<number | null>(null);

  // Fires at the reveal moment (cup tips back, color shows) for BOTH players —
  // the screen shake/vignette below only fires when the player's own cup was
  // poison, so without this callout an opponent drinking poison (or surviving it
  // on an antidote) was easy to miss, with nothing but a sound and a line buried
  // in the scrolling event log.
  const handleRevealMoment = useCallback(
    (info: { wasPoison: boolean; hitsPlayer: boolean; survivedByAntidote: boolean; drinker: 'player' | 'ai' | null }) => {
      if (info.hitsPlayer) {
        setPoisonFlash(true);
        setShake(true);
        window.setTimeout(() => setPoisonFlash(false), 500);
        window.setTimeout(() => setShake(false), 400);
      }

      const who = info.drinker === 'player' ? 'You' : 'Opponent';
      const variant: 'poison' | 'saved' | 'safe' = !info.wasPoison
        ? 'safe'
        : info.survivedByAntidote
          ? 'saved'
          : 'poison';
      const text =
        variant === 'poison'
          ? `${who} drank POISON!`
          : variant === 'saved'
            ? `${who} drank poison — saved by antidote!`
            : `${who} drank safely.`;
      setAnnouncement({ text, variant });
      if (announcementTimer.current) window.clearTimeout(announcementTimer.current);
      announcementTimer.current = window.setTimeout(() => setAnnouncement(null), 2200);
    },
    [],
  );

  useEffect(() => {
    if (state.currentPlayer === 'ai' && state.phase === 'awaiting_action') {
      aiTimer.current = window.setTimeout(() => dispatch({ kind: 'ai_turn' }), 900);
      return () => {
        if (aiTimer.current) window.clearTimeout(aiTimer.current);
      };
    }
  }, [state.currentPlayer, state.phase, state.turnCount, dispatch]);

  const enableAudio = () => {
    if (!audioReady) {
      audioManager.unlock();
      setAudioReady(true);
    }
  };

  return (
    <div className={`app-root${shake ? ' app-shake' : ''}`} onClick={enableAudio} onPointerDown={enableAudio}>
      <div className={`poison-vignette${poisonFlash ? ' poison-vignette-active' : ''}`} />
      {announcement && (
        <div className={`reveal-announcement reveal-announcement-${announcement.variant}`}>{announcement.text}</div>
      )}
      <GameHeader />

      <div className="scene-wrap">
        <GameScene onRevealMoment={handleRevealMoment} />
        <TurnBadge />
        <div className="corner-stack">
          <ActionPanel />
          <Inventory />
          <YourClues />
        </div>
        <ClueLog />
      </div>

      <DrinkDialog />

      {state.phase === 'round_end' && <RoundTransition />}
      {state.phase === 'match_end' && <GameOver />}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameRoot />
    </GameProvider>
  );
}
