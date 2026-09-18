import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { GameAction, GameState } from '../types/game';
import type { PlayerId } from '../types/player';
import { gameReducer, createNewMatch } from '../game/gameEngine';

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  /** Which PlayerId this browser is actually controlling. Always 'player' in
   * single-player and for the multiplayer host; 'ai' for the multiplayer guest,
   * who is a real human sitting in the seat the bot used to occupy. Every "is it
   * my turn" / "which HUD is mine" check should compare against this, never the
   * literal 'player' string, so the same components work unmodified for either
   * seat. */
  myRole: PlayerId;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
  myRole?: PlayerId;
  /** Multiplayer guest only: state is mirrored from the host over the network
   * instead of being computed locally, and dispatch ships the action to the host
   * instead of running the reducer here (the host is the sole source of truth). */
  state?: GameState;
  dispatch?: Dispatch<GameAction>;
}

export function GameProvider({ children, myRole = 'player', state: externalState, dispatch: externalDispatch }: GameProviderProps) {
  // Always called (rules of hooks) even for a guest that ends up ignoring it —
  // cheap, and keeps this component branch-free above the hook calls.
  const [localState, localDispatch] = useReducer(gameReducer, undefined, () => createNewMatch());
  const state = externalState ?? localState;
  const dispatch = externalDispatch ?? localDispatch;
  return <GameContext.Provider value={{ state, dispatch, myRole }}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
