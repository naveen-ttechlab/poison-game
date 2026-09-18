import type { Cup } from '../types/cup';
import { POISON_CUPS, TOTAL_CUPS } from '../types/game';

export class InvariantError extends Error {}

/**
 * Checks the core cup invariants (unique ids, unique positions, exactly
 * POISON_CUPS poison). In dev this throws immediately so a bug is caught at its
 * source instead of silently corrupting state; in production it logs and
 * continues, so a missed edge case degrades gracefully instead of crashing a live
 * demo.
 */
export function assertValidCups(cups: Cup[]): void {
  const problem = findCupProblem(cups);
  if (!problem) return;
  // import.meta.env only exists under Vite; guard so this also runs safely from a
  // plain Node/tsx script (e.g. the offline stress test), where it should throw too.
  const isDev = typeof import.meta === 'undefined' || (import.meta as { env?: { DEV?: boolean } }).env?.DEV !== false;
  if (isDev) throw new InvariantError(problem);
  console.error(`[InvariantViolation] ${problem}`);
}

function findCupProblem(cups: Cup[]): string | null {
  if (cups.length !== TOTAL_CUPS) return `Expected ${TOTAL_CUPS} cups, got ${cups.length}`;

  const ids = new Set<string>();
  const positions = new Set<number>();
  for (const cup of cups) {
    if (ids.has(cup.id)) return `Duplicate cup id ${cup.id}`;
    ids.add(cup.id);
    if (positions.has(cup.positionIndex)) return `Duplicate position ${cup.positionIndex} (cup ${cup.id})`;
    positions.add(cup.positionIndex);
  }

  const poisonCount = cups.filter((c) => c.isPoison).length;
  if (poisonCount !== POISON_CUPS) return `Expected exactly ${POISON_CUPS} poison cups, found ${poisonCount}`;

  return null;
}
