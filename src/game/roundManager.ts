import type { GameState } from '../types/game';
import { TURN_LIMIT_PER_ROUND, toolsGrantedForRound } from '../types/game';
import { createEmptyKnowledge } from '../types/clue';
import { SeededRandom } from '../utils/random';
import { createCups, remainingPoisonCount } from './cupManager';
import { grantRandomTools } from './itemEngine';

export function startRound(state: GameState, rng: SeededRandom): GameState {
  const cups = createCups(rng);
  const grantCount = toolsGrantedForRound(state.round + 1);
  const players = {
    player: { ...state.players.player, inventory: grantRandomTools(state.players.player.inventory, grantCount, rng) },
    ai: { ...state.players.ai, inventory: grantRandomTools(state.players.ai.inventory, grantCount, rng) },
  };

  return {
    ...state,
    cups,
    players,
    round: state.round + 1,
    turnCount: 0,
    currentPlayer: 'player',
    phase: 'awaiting_action',
    pendingToolType: null,
    pendingTargets: [],
    pendingDrinkCupId: null,
    pendingUseAntidote: false,
    playerKnowledge: { player: createEmptyKnowledge(), ai: createEmptyKnowledge() },
    clues: [],
    aiDialogue: null,
    lastDrinkResult: null,
    history: [
      ...state.history,
      { id: `evt_${state.history.length}`, round: state.round + 1, type: 'round_start', actor: 'player', text: `Round ${state.round + 1} begins.` },
    ],
  };
}

/** Both poisons found, or the round has dragged on too long. */
export function isRoundOver(state: GameState): boolean {
  return remainingPoisonCount(state.cups) === 0 || state.turnCount >= TURN_LIMIT_PER_ROUND;
}

export function isMatchOver(state: GameState): boolean {
  return state.players.player.hp <= 0 || state.players.ai.hp <= 0;
}

export function matchWinner(state: GameState): GameState['winner'] {
  if (state.players.player.hp <= 0 && state.players.ai.hp <= 0) return null; // simultaneous — treated as draw, UI shows both defeated
  if (state.players.player.hp <= 0) return 'ai';
  if (state.players.ai.hp <= 0) return 'player';
  return null;
}
