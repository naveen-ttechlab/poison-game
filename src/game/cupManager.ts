import type { Cup } from '../types/cup';
import { POISON_CUPS, TOTAL_CUPS } from '../types/game';
import type { SeededRandom } from '../utils/random';
import { nextId } from '../utils/random';

/** Creates a fresh set of 6 cups with exactly POISON_CUPS randomly assigned as poison. */
export function createCups(rng: SeededRandom): Cup[] {
  const positions = Array.from({ length: TOTAL_CUPS }, (_, i) => i);
  const poisonPositions = new Set(rng.shuffle(positions).slice(0, POISON_CUPS));

  return positions.map((positionIndex) => ({
    id: nextId('cup'),
    displayNumber: positionIndex + 1,
    positionIndex,
    isPoison: poisonPositions.has(positionIndex),
    isRevealed: false,
  }));
}

export function getCupById(cups: Cup[], cupId: string): Cup {
  const cup = cups.find((c) => c.id === cupId);
  if (!cup) throw new Error(`Unknown cup id ${cupId}`);
  return cup;
}

export function getCupsAtPositions(cups: Cup[]): Cup[] {
  return [...cups].sort((a, b) => a.positionIndex - b.positionIndex);
}

export function revealCup(cups: Cup[], cupId: string): Cup[] {
  return cups.map((cup) => (cup.id === cupId ? { ...cup, isRevealed: true } : cup));
}

export function isAdjacent(a: Cup, b: Cup): boolean {
  // Positions are arranged as a 2x3 grid (0,1,2 / 3,4,5); adjacency = shares an edge.
  const rowA = Math.floor(a.positionIndex / 3);
  const colA = a.positionIndex % 3;
  const rowB = Math.floor(b.positionIndex / 3);
  const colB = b.positionIndex % 3;
  const dr = Math.abs(rowA - rowB);
  const dc = Math.abs(colA - colB);
  return dr + dc === 1;
}

export function unrevealedCups(cups: Cup[]): Cup[] {
  return cups.filter((c) => !c.isRevealed);
}

export function remainingPoisonCount(cups: Cup[]): number {
  return cups.filter((c) => c.isPoison && !c.isRevealed).length;
}
