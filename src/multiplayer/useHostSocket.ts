import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import type { GameAction, GameState } from '../types/game';
import type { ConnectionStatus, NetMessage } from './types';

/** Host side of the local multiplayer relay: connects to this machine's own dev
 * server, waits for a guest to join the same room, forwards whatever actions the
 * guest sends into the real (local) game reducer via `dispatch`, and exposes
 * `sendState` so the caller can broadcast the resulting state back out after
 * every change. The host's reducer is the sole source of truth — the guest never
 * runs game logic of its own. */
export function useHostSocket(roomCode: string, dispatch: Dispatch<GameAction>) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [guestConnected, setGuestConnected] = useState(false);

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/mp-ws?room=${roomCode}&role=host`);
    wsRef.current = ws;

    ws.onopen = () => setStatus('waiting');
    ws.onclose = () => {
      setStatus('closed');
      setGuestConnected(false);
    };
    ws.onerror = () => setStatus('error');
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data as string) as NetMessage;
      if (msg.type === 'guest_joined') setGuestConnected(true);
      else if (msg.type === 'guest_left') setGuestConnected(false);
      else if (msg.type === 'action') dispatch(msg.action);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // dispatch identity from useReducer is stable; roomCode is the only real input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  const sendState = useCallback((state: GameState) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'state', state } satisfies NetMessage));
  }, []);

  return { status, guestConnected, sendState };
}
