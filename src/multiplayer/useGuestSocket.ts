import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameAction, GameState } from '../types/game';
import type { ConnectionStatus, NetMessage } from './types';

/** Guest side of the local multiplayer relay: connects to the host's dev server
 * (reached via the link the host shared), and mirrors whatever state the host
 * broadcasts. The guest never runs the game engine itself — `sendAction` ships
 * the player's intent to the host, who is the only one that actually applies it. */
export function useGuestSocket(roomCode: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [remoteState, setRemoteState] = useState<GameState | null>(null);

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/mp-ws?room=${roomCode}&role=guest`);
    wsRef.current = ws;

    ws.onopen = () => setStatus('connected');
    ws.onclose = () => setStatus('closed');
    ws.onerror = () => setStatus('error');
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data as string) as NetMessage;
      if (msg.type === 'state') setRemoteState(msg.state);
      else if (msg.type === 'host_left') setStatus('closed');
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomCode]);

  const sendAction = useCallback((action: GameAction) => {
    // The drink-reveal animation is driven by a local timer on BOTH ends (see
    // GameScene) purely for visuals — only the host's own timer should actually
    // advance authoritative state when it finishes, or the turn would advance
    // twice. Swallow this one action locally instead of forwarding it.
    if (action.kind === 'drink_animation_done') return;
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'action', action } satisfies NetMessage));
  }, []);

  return { status, remoteState, sendAction };
}
