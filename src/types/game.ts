import type { Cup } from './cup';
import type { Player, PlayerId, ToolType } from './player';
import type { Clue, KnowledgeState } from './clue';

export type GamePhase =
  | 'awaiting_action' // current player choosing: use a tool, or select a cup to drink
  | 'awaiting_targets' // a tool is selected, needs 1-2 cup targets
  | 'confirm_drink' // a cup has been chosen to drink, deciding on antidote
  | 'drinking' // reveal animation playing, input locked
  | 'round_end'
  | 'match_end';

export const TOTAL_CUPS = 6;
export const POISON_CUPS = 2;
export const STARTING_HP = 3;
export const TURN_LIMIT_PER_ROUND = 14;

/**
 * Tools granted at the start of a round: 2 in round 1, then 1 per round after —
 * with 4 distinct tool types and a 4-slot inventory cap (see MAX_INVENTORY),
 * that's exactly enough to hold one of everything by round 3 (2+1+1), assuming
 * none were used yet. Grants only ever fill in missing types (see
 * `grantRandomTools`), so this never hands out a duplicate.
 */
export function toolsGrantedForRound(round: number): number {
  return round <= 1 ? 2 : 1;
}

export interface GameEvent {
  id: string;
  round: number;
  type: 'reveal' | 'tool_use' | 'clue_generated' | 'round_start' | 'round_end' | 'match_end';
  actor: PlayerId;
  text: string;
  /** True for actions nobody else could actually observe (using a Detector or
   * Spoon happens silently — unlike drinking, swapping, or skipping, which are
   * physically visible at the table). The UI hides these from whoever isn't the
   * actor, so the opponent's private investigation never shows up as a "clue" in
   * the shared event log. */
  silent?: boolean;
}

export interface GameState {
  seed: string;
  rngCursor: number;
  round: number;
  turnCount: number;
  cups: Cup[];
  players: Record<PlayerId, Player>;
  currentPlayer: PlayerId;
  phase: GamePhase;
  pendingToolType: ToolType | null;
  pendingTargets: string[];
  pendingDrinkCupId: string | null;
  pendingUseAntidote: boolean;
  playerKnowledge: Record<PlayerId, KnowledgeState>;
  clues: Clue[];
  history: GameEvent[];
  winner: PlayerId | null;
  aiDialogue: string | null;
  lastDrinkResult: { cupId: string; wasPoison: boolean; survivedByAntidote: boolean; drinker: PlayerId } | null;
}

export type ActionType = 'select_tool' | 'target_cup' | 'select_drink_cup' | 'toggle_antidote' | 'confirm_drink' | 'cancel';

export type GameAction =
  | { kind: 'select_tool'; player: PlayerId; toolInstanceId: string }
  | { kind: 'target_cup'; player: PlayerId; cupId: string }
  | { kind: 'select_drink_cup'; player: PlayerId; cupId: string }
  | { kind: 'toggle_antidote'; player: PlayerId }
  | { kind: 'confirm_drink'; player: PlayerId }
  | { kind: 'cancel'; player: PlayerId }
  | { kind: 'drink_animation_done' }
  | { kind: 'ai_turn' }
  | { kind: 'advance_round' }
  | { kind: 'new_match'; seed?: string };
