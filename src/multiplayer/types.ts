import type { GameAction, GameState } from '../types/game';

export type NetMessage =
  | { type: 'state'; state: GameState }
  | { type: 'action'; action: GameAction }
  | { type: 'guest_joined' }
  | { type: 'guest_left' }
  | { type: 'host_joined' }
  | { type: 'host_left' };

export type ConnectionStatus = 'connecting' | 'waiting' | 'connected' | 'closed' | 'error';
