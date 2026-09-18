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
import { ModeSelect } from './components/ModeSelect';
import { HostLobby, GuestLobby } from './components/MultiplayerLobby';
import { generateRoomCode } from './multiplayer/roomCode';
import { useHostSocket } from './multiplayer/useHostSocket';
import { useGuestSocket } from './multiplayer/useGuestSocket';
import { audioManager } from './audio/audioManager';
import './App.css';

function GameRoot({ disableBot = false }: { disableBot?: boolean }) {
  const { state, dispatch, myRole } = useGame();
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

      const who = info.drinker === myRole ? 'You' : 'Opponent';
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
    [myRole],
  );

  // The bot only ever plays the seat the local human isn't sitting in — and only
  // exists at all in single-player. In multiplayer that seat is a real person on
  // the other end of the network connection, so this must stay off entirely.
  useEffect(() => {
    if (disableBot) return;
    const botRole = myRole === 'player' ? 'ai' : 'player';
    if (state.currentPlayer === botRole && state.phase === 'awaiting_action') {
      aiTimer.current = window.setTimeout(() => dispatch({ kind: 'ai_turn' }), 900);
      return () => {
        if (aiTimer.current) window.clearTimeout(aiTimer.current);
      };
    }
  }, [disableBot, myRole, state.currentPlayer, state.phase, state.turnCount, dispatch]);

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

/** Lives inside the host's own GameProvider so it can read the live state and
 * dispatch — broadcasts state to the guest after every change, and applies
 * whatever actions arrive from the guest through the real (local) reducer. */
function HostBridge({ roomCode, onExit }: { roomCode: string; onExit: () => void }) {
  const { state, dispatch } = useGame();
  const { status, guestConnected, sendState } = useHostSocket(roomCode, dispatch);

  useEffect(() => {
    if (guestConnected) sendState(state);
  }, [state, guestConnected, sendState]);

  if (!guestConnected) return <HostLobby roomCode={roomCode} status={status} onCancel={onExit} />;
  return <GameRoot disableBot />;
}

function HostGame({ roomCode, onExit }: { roomCode: string; onExit: () => void }) {
  return (
    <GameProvider myRole="player">
      <HostBridge roomCode={roomCode} onExit={onExit} />
    </GameProvider>
  );
}

/** The guest never runs the game engine — it only mirrors whatever state the
 * host broadcasts and ships its own actions back for the host to apply. */
function GuestGame({ roomCode, onExit }: { roomCode: string; onExit: () => void }) {
  const { status, remoteState, sendAction } = useGuestSocket(roomCode);

  if (!remoteState) return <GuestLobby status={status} onCancel={onExit} />;
  return (
    <GameProvider myRole="ai" state={remoteState} dispatch={sendAction}>
      <GameRoot disableBot />
    </GameProvider>
  );
}

type Mode = 'select' | 'single' | 'host' | 'guest';

// A shared link looks like "...?join=ABCDE" — landing on one skips straight to
// the guest flow instead of the mode-select screen.
function joinCodeFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('join');
}

export default function App() {
  const [mode, setMode] = useState<Mode>(() => (joinCodeFromUrl() ? 'guest' : 'select'));
  const [roomCode, setRoomCode] = useState(() => joinCodeFromUrl()?.toUpperCase() ?? '');

  const startMultiplayer = () => {
    setRoomCode(generateRoomCode());
    setMode('host');
  };

  const exitToSelect = () => {
    setMode('select');
    window.history.replaceState({}, '', window.location.pathname);
  };

  if (mode === 'select') return <ModeSelect onSinglePlayer={() => setMode('single')} onMultiplayer={startMultiplayer} />;
  if (mode === 'host') return <HostGame roomCode={roomCode} onExit={exitToSelect} />;
  if (mode === 'guest') return <GuestGame roomCode={roomCode} onExit={exitToSelect} />;

  return (
    <GameProvider>
      <GameRoot />
    </GameProvider>
  );
}
