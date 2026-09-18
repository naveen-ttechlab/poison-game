import type { PlayerId } from './player';

export type ClueType =
  | 'direct_safe'
  | 'direct_poison'
  | 'xor_pair'
  | 'group_exactly_one'
  | 'group_at_least_one'
  | 'same_state'
  | 'adjacent_poison';

/** Where a known fact came from — affects how it's displayed, not how it's used for inference. */
export type FactSource = 'ambient_clue' | 'detector' | 'spoon';

export interface Clue {
  id: string;
  type: ClueType;
  text: string;
  cupIds: string[];
  round: number;
  revealedTo: PlayerId[];
  source: FactSource;
}

/**
 * Everything a single player currently knows, as a flat list of true facts. Tool
 * results (Detector/Spoon) are logically the same predicates as ambient clues
 * (SAFE/POISON = direct_safe/direct_poison, SAME/DIFFERENT liquid = same_state/
 * xor_pair for a 2-state world), so they're stored the same way and both feed the
 * probability engine's world-consistency check uniformly.
 */
export interface KnowledgeState {
  facts: Clue[];
}

export function createEmptyKnowledge(): KnowledgeState {
  return { facts: [] };
}
