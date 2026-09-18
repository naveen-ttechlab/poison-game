import type { Cup } from '../types/cup';
import type { GameState } from '../types/game';
import type { AiPersonality, ToolType } from '../types/player';
import { computeProbabilities, riskiestCup, safestCup } from './probabilityEngine';
import { hasToolOfType } from './itemEngine';
import { unrevealedCups } from './cupManager';
import type { SeededRandom } from '../utils/random';

export type AiDecision =
  | { action: 'use_tool'; toolType: ToolType; toolInstanceId: string; targets: string[] }
  | { action: 'drink'; cupId: string; useAntidote: boolean };

function personalityFor(hp: number): AiPersonality {
  if (hp <= 1) return 'desperate';
  if (hp >= 3) return 'aggressive';
  return 'cautious';
}

/** Most "interesting" (closest to 50/50) unrevealed cup — the one worth investigating. */
function mostUncertainCup(cups: Cup[], probabilities: Record<string, number>): Cup | null {
  const unrevealed = unrevealedCups(cups);
  if (unrevealed.length === 0) return null;
  return unrevealed.reduce((best, cup) => {
    const d = Math.abs((probabilities[cup.id] ?? 0.5) - 0.5);
    const bestD = Math.abs((probabilities[best.id] ?? 0.5) - 0.5);
    return d < bestD ? cup : best;
  });
}

export function decideAiAction(state: GameState, rng: SeededRandom): AiDecision {
  const ai = state.players.ai;
  const knowledge = state.playerKnowledge.ai;
  const probabilities = computeProbabilities(state.cups, knowledge);
  const unrevealed = unrevealedCups(state.cups);
  const personality = personalityFor(ai.hp);

  const safest = safestCup(state.cups, probabilities);
  const riskiest = riskiestCup(state.cups, probabilities);
  const uncertain = mostUncertainCup(state.cups, probabilities);

  // Turns are limited per round — stop investigating once time is short, or once
  // there's nothing genuinely uncertain left to learn.
  const turnsLeftInRound = 14 - state.turnCount;
  const uncertainty = uncertain ? Math.abs((probabilities[uncertain.id] ?? 0.5) - 0.5) : 0.5;
  const worthInvestigating = uncertain !== null && uncertainty < 0.3 && turnsLeftInRound > 3;

  if (worthInvestigating) {
    const detector = hasToolOfType(ai.inventory, 'detector');
    const spoon = hasToolOfType(ai.inventory, 'spoon');
    if (detector && (personality !== 'desperate' || rng.next() < 0.5)) {
      return { action: 'use_tool', toolType: 'detector', toolInstanceId: detector.instanceId, targets: [uncertain!.id] };
    }
    if (spoon && unrevealed.length >= 2) {
      const other = rng.pick(unrevealed.filter((c) => c.id !== uncertain!.id));
      if (other) {
        return { action: 'use_tool', toolType: 'spoon', toolInstanceId: spoon.instanceId, targets: [uncertain!.id, other.id] };
      }
    }
  }

  // Must drink. Default: the cup the AI believes is safest.
  const antidote = hasToolOfType(ai.inventory, 'antidote');
  if (!safest) {
    // Shouldn't happen (round would already be over), but never crash.
    const fallback = unrevealed[0];
    return { action: 'drink', cupId: fallback.id, useAntidote: Boolean(antidote) };
  }

  // If the safest cup still looks genuinely risky and there's no antidote to fall
  // back on, sometimes skip instead of drinking — not desperate to force progress,
  // not too passive to skip every time either.
  const skipTool = hasToolOfType(ai.inventory, 'skip');
  const safestProbForSkip = probabilities[safest.id] ?? 0;
  if (skipTool && personality !== 'desperate' && !antidote && safestProbForSkip > 0.35 && turnsLeftInRound > 2 && rng.next() < 0.45) {
    return { action: 'use_tool', toolType: 'skip', toolInstanceId: skipTool.instanceId, targets: [] };
  }

  if (personality === 'desperate' && antidote && riskiest && (probabilities[riskiest.id] ?? 0) >= 0.5) {
    // Protected gamble: deliberately drink the cup it suspects is poison, using the
    // antidote as a safety net, to make progress clearing the round instead of
    // stalling on the safe pick forever.
    return { action: 'drink', cupId: riskiest.id, useAntidote: true };
  }

  const safestProb = probabilities[safest.id] ?? 0;
  const useAntidoteOnSafest = Boolean(antidote) && safestProb > 0.4 && ai.hp <= 1;
  return { action: 'drink', cupId: safest.id, useAntidote: useAntidoteOnSafest };
}

const DIALOGUE_BY_BELIEF = {
  warnRisky: [
    (n: number) => `I wouldn't choose Cup ${n} if I were you.`,
    (n: number) => `Cup ${n} makes me nervous. Your call.`,
  ],
  reassureSafe: [
    (_n: number) => `That cup is probably safe. Probably.`,
    (n: number) => `Cup ${n} looks fine to me.`,
  ],
  bluffRisky: [
    (n: number) => `You really trust Cup ${n}?`,
    (n: number) => `Interesting choice, if you go for Cup ${n}...`,
  ],
  neutral: [(_n: number) => 'Your move.', (_n: number) => 'Take your time.', (_n: number) => "Let's see what you decide."],
};

/**
 * Short flavor line shown to the player at the start of their turn. Never states a
 * certainty the AI doesn't have — it's phrased from the AI's own (possibly wrong,
 * possibly bluffing) belief, using only its own knowledge/probabilities.
 */
export function generateAiDialogue(state: GameState, rng: SeededRandom): string | null {
  const knowledge = state.playerKnowledge.ai;
  const probabilities = computeProbabilities(state.cups, knowledge);
  const unrevealed = unrevealedCups(state.cups);
  if (unrevealed.length === 0) return null;
  if (rng.next() < 0.35) return null; // stay quiet sometimes

  const personality = personalityFor(state.players.ai.hp);
  const risky = riskiestCup(state.cups, probabilities);
  const safe = safestCup(state.cups, probabilities);
  const isBluffing = personality === 'aggressive' && rng.next() < 0.5;

  if (isBluffing && safe) {
    // Deliberately mislead: talk up the cup it privately thinks is safest as if it were risky.
    return rng.pick(DIALOGUE_BY_BELIEF.bluffRisky)(safe.displayNumber);
  }
  if (risky && (probabilities[risky.id] ?? 0) >= 0.5) {
    return rng.pick(DIALOGUE_BY_BELIEF.warnRisky)(risky.displayNumber);
  }
  if (safe && (probabilities[safe.id] ?? 1) <= 0.2) {
    return rng.pick(DIALOGUE_BY_BELIEF.reassureSafe)(safe.displayNumber);
  }
  return rng.pick(DIALOGUE_BY_BELIEF.neutral)(0);
}
