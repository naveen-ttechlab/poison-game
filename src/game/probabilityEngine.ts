import type { Cup } from '../types/cup';
import type { KnowledgeState } from '../types/clue';
import { POISON_CUPS } from '../types/game';
import { validateClue } from './clueEngine';

export type ProbabilityMap = Record<string, number>;

/**
 * Deterministic rule-based inference: with only 6 cups and 2 poisons there are at
 * most C(6,2) = 15 possible poison-pair "worlds" among the unrevealed cups. We
 * enumerate every world, keep the ones consistent with every fact this player
 * currently knows (clues + tool results, uniformly — see KnowledgeState), and
 * report each cup's poison probability as the fraction of consistent worlds where
 * it's poison. Exact, no heuristics/ML, and cheap at this scale.
 */
export function computeProbabilities(cups: Cup[], knowledge: KnowledgeState): ProbabilityMap {
  const probabilities: ProbabilityMap = {};
  for (const cup of cups) {
    if (cup.isRevealed) probabilities[cup.id] = cup.isPoison ? 1 : 0;
  }

  const unrevealed = cups.filter((c) => !c.isRevealed);
  const revealedPoisonCount = cups.filter((c) => c.isRevealed && c.isPoison).length;
  const poisonsRemaining = POISON_CUPS - revealedPoisonCount;

  if (poisonsRemaining <= 0 || unrevealed.length === 0) {
    for (const cup of unrevealed) probabilities[cup.id] = 0;
    return probabilities;
  }

  const worlds = combinations(unrevealed, poisonsRemaining).filter((world) => isConsistent(world, cups, knowledge));

  if (worlds.length === 0) {
    // Should not happen with correctly-validated facts, but never divide by zero.
    const fallback = poisonsRemaining / unrevealed.length;
    for (const cup of unrevealed) probabilities[cup.id] = fallback;
    return probabilities;
  }

  for (const cup of unrevealed) {
    const countIn = worlds.filter((world) => world.has(cup.id)).length;
    probabilities[cup.id] = countIn / worlds.length;
  }
  return probabilities;
}

function isConsistent(world: Set<string>, cups: Cup[], knowledge: KnowledgeState): boolean {
  if (knowledge.facts.length === 0) return true;
  const hypothetical = cups.map((c) => (c.isRevealed ? c : { ...c, isPoison: world.has(c.id) }));
  return knowledge.facts.every((fact) => validateClue(fact, hypothetical));
}

function combinations(cups: Cup[], k: number): Set<string>[] {
  const results: Set<string>[] = [];
  const ids = cups.map((c) => c.id);

  function recurse(start: number, chosen: string[]) {
    if (chosen.length === k) {
      results.push(new Set(chosen));
      return;
    }
    for (let i = start; i < ids.length; i++) recurse(i + 1, [...chosen, ids[i]]);
  }

  recurse(0, []);
  return results;
}

export function safestCup(cups: Cup[], probabilities: ProbabilityMap): Cup | null {
  const unrevealed = cups.filter((c) => !c.isRevealed);
  if (unrevealed.length === 0) return null;
  return unrevealed.reduce((best, cup) => ((probabilities[cup.id] ?? 0) < (probabilities[best.id] ?? 0) ? cup : best));
}

export function riskiestCup(cups: Cup[], probabilities: ProbabilityMap): Cup | null {
  const unrevealed = cups.filter((c) => !c.isRevealed);
  if (unrevealed.length === 0) return null;
  return unrevealed.reduce((best, cup) => ((probabilities[cup.id] ?? 0) > (probabilities[best.id] ?? 0) ? cup : best));
}
