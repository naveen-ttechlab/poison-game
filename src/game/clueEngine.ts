import type { Cup } from '../types/cup';
import type { Clue, ClueType } from '../types/clue';
import type { PlayerId } from '../types/player';
import { SeededRandom, nextId } from '../utils/random';
import { isAdjacent } from './cupManager';

const label = (cup: Cup) => `Cup ${cup.displayNumber}`;

function byId(cups: Cup[], id: string): Cup {
  const cup = cups.find((c) => c.id === id);
  if (!cup) throw new Error(`clueEngine: unknown cup id ${id}`);
  return cup;
}

/** Ground-truth predicate for a clue — the single source of truth used both to
 * generate candidates and to validate any clue before it's shown to a player. */
export function validateClue(clue: Pick<Clue, 'type' | 'cupIds'>, cups: Cup[]): boolean {
  const get = (id: string) => byId(cups, id);
  switch (clue.type) {
    case 'direct_safe':
      return !get(clue.cupIds[0]).isPoison;
    case 'direct_poison':
      return get(clue.cupIds[0]).isPoison;
    case 'xor_pair': {
      const [a, b] = clue.cupIds.map(get);
      return a.isPoison !== b.isPoison;
    }
    case 'same_state': {
      const [a, b] = clue.cupIds.map(get);
      return a.isPoison === b.isPoison;
    }
    case 'group_exactly_one':
      return clue.cupIds.filter((id) => get(id).isPoison).length === 1;
    case 'group_at_least_one':
      return clue.cupIds.filter((id) => get(id).isPoison).length >= 1;
    case 'adjacent_poison': {
      const target = get(clue.cupIds[0]);
      return cups.some((c) => c.isPoison && !c.isRevealed && c.id !== target.id && isAdjacent(c, target));
    }
    default:
      return false;
  }
}

interface Candidate {
  type: ClueType;
  cupIds: string[];
}

function tryDirectSafe(cups: Cup[], rng: SeededRandom): Candidate | null {
  const pool = cups.filter((c) => !c.isPoison && !c.isRevealed);
  if (pool.length === 0) return null;
  return { type: 'direct_safe', cupIds: [rng.pick(pool).id] };
}

function tryDirectPoison(cups: Cup[], rng: SeededRandom): Candidate | null {
  const pool = cups.filter((c) => c.isPoison && !c.isRevealed);
  if (pool.length === 0) return null;
  return { type: 'direct_poison', cupIds: [rng.pick(pool).id] };
}

function tryXorPair(cups: Cup[], rng: SeededRandom): Candidate | null {
  const poison = cups.filter((c) => c.isPoison && !c.isRevealed);
  const safe = cups.filter((c) => !c.isPoison && !c.isRevealed);
  if (poison.length === 0 || safe.length === 0) return null;
  const pair = rng.shuffle([rng.pick(poison).id, rng.pick(safe).id]);
  return { type: 'xor_pair', cupIds: pair };
}

function trySameState(cups: Cup[], rng: SeededRandom): Candidate | null {
  const unrevealed = cups.filter((c) => !c.isRevealed);
  const safe = unrevealed.filter((c) => !c.isPoison);
  const poison = unrevealed.filter((c) => c.isPoison);
  const group = safe.length >= 2 ? safe : poison.length >= 2 ? poison : null;
  if (!group) return null;
  const [a, b] = rng.shuffle(group).slice(0, 2);
  return { type: 'same_state', cupIds: [a.id, b.id] };
}

function tryGroupExactlyOne(cups: Cup[], rng: SeededRandom): Candidate | null {
  const unrevealed = cups.filter((c) => !c.isRevealed);
  const poison = unrevealed.filter((c) => c.isPoison);
  const safe = unrevealed.filter((c) => !c.isPoison);
  if (poison.length === 0 || safe.length < 2) return null;
  const chosenPoison = rng.pick(poison);
  const chosenSafe = rng.shuffle(safe).slice(0, 2);
  const cupIds = rng.shuffle([chosenPoison.id, ...chosenSafe.map((c) => c.id)]);
  return { type: 'group_exactly_one', cupIds };
}

function tryGroupAtLeastOne(cups: Cup[], rng: SeededRandom): Candidate | null {
  const unrevealed = cups.filter((c) => !c.isRevealed);
  const poison = unrevealed.filter((c) => c.isPoison);
  const others = unrevealed.filter((c) => !c.isPoison);
  if (poison.length === 0 || others.length < 1) return null;
  const chosenPoison = rng.pick(poison);
  const extra = rng.shuffle(others).slice(0, Math.min(2, others.length));
  const cupIds = rng.shuffle([chosenPoison.id, ...extra.map((c) => c.id)]);
  return { type: 'group_at_least_one', cupIds };
}

function tryAdjacentPoison(cups: Cup[], rng: SeededRandom): Candidate | null {
  const unrevealed = cups.filter((c) => !c.isRevealed);
  const candidates = unrevealed.filter((target) =>
    unrevealed.some((c) => c.isPoison && c.id !== target.id && isAdjacent(c, target)),
  );
  if (candidates.length === 0) return null;
  return { type: 'adjacent_poison', cupIds: [rng.pick(candidates).id] };
}

const GENERATORS: { type: ClueType; weight: number; fn: (cups: Cup[], rng: SeededRandom) => Candidate | null }[] = [
  { type: 'direct_safe', weight: 1, fn: tryDirectSafe },
  { type: 'direct_poison', weight: 1, fn: tryDirectPoison },
  { type: 'xor_pair', weight: 3, fn: tryXorPair },
  { type: 'same_state', weight: 3, fn: trySameState },
  { type: 'group_exactly_one', weight: 2, fn: tryGroupExactlyOne },
  { type: 'group_at_least_one', weight: 2, fn: tryGroupAtLeastOne },
  { type: 'adjacent_poison', weight: 2, fn: tryAdjacentPoison },
];

function renderText(type: ClueType, cupIds: string[], cups: Cup[]): string {
  const c = cupIds.map((id) => byId(cups, id));
  switch (type) {
    case 'direct_safe':
      return `${label(c[0])} is safe.`;
    case 'direct_poison':
      return `${label(c[0])} contains poison.`;
    case 'xor_pair':
      return `Exactly one of ${label(c[0])} and ${label(c[1])} contains poison.`;
    case 'same_state':
      return `${label(c[0])} and ${label(c[1])} contain the same liquid.`;
    case 'group_exactly_one':
      return `Exactly one of ${c.map(label).join(', ')} contains poison.`;
    case 'group_at_least_one':
      return `At least one of ${c.map(label).join(', ')} is poison.`;
    case 'adjacent_poison':
      return `A poison cup is adjacent to ${label(c[0])}.`;
  }
}

/**
 * Picks a random constructible clue type and generates one instance of it that is
 * guaranteed true of the current hidden state. Returns null only if literally no
 * clue type can be constructed (e.g. round almost over, too little unrevealed info).
 */
export function generateClue(
  cups: Cup[],
  round: number,
  rng: SeededRandom,
  revealedTo: PlayerId[],
): Clue | null {
  const order = weightedShuffle(GENERATORS, rng);
  for (const gen of order) {
    const candidate = gen.fn(cups, rng);
    if (!candidate) continue;
    if (!validateClue(candidate, cups)) continue; // belt-and-suspenders; generators should already be correct
    return {
      id: nextId('clue'),
      type: candidate.type,
      cupIds: candidate.cupIds,
      text: renderText(candidate.type, candidate.cupIds, cups),
      round,
      revealedTo,
      source: 'ambient_clue',
    };
  }
  return null;
}

function weightedShuffle<T extends { weight: number }>(items: T[], rng: SeededRandom): T[] {
  // Simple weighted ordering: duplicate entries by weight, shuffle, dedupe by first occurrence.
  const expanded: T[] = [];
  for (const item of items) for (let i = 0; i < item.weight; i++) expanded.push(item);
  const shuffled = rng.shuffle(expanded);
  const seen = new Set<T>();
  const result: T[] = [];
  for (const item of shuffled) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}
