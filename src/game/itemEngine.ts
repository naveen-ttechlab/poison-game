import type { Cup } from '../types/cup';
import type { Clue } from '../types/clue';
import type { ToolInstance, ToolType } from '../types/player';
import { MAX_INVENTORY } from '../types/player';
import type { SeededRandom } from '../utils/random';
import { nextId } from '../utils/random';
import { getCupById } from './cupManager';

const ALL_TOOL_TYPES: ToolType[] = ['detector', 'spoon', 'skip', 'antidote'];

/**
 * Grants up to `count` random tools, capped so inventory never exceeds MAX_INVENTORY.
 * A player never holds two of the same tool type at once — grants are drawn only from
 * types they don't currently have (a used-up type becomes grantable again later).
 */
export function grantRandomTools(inventory: ToolInstance[], count: number, rng: SeededRandom): ToolInstance[] {
  const room = Math.max(0, MAX_INVENTORY - inventory.length);
  const toGrant = Math.min(count, room);
  const heldTypes = new Set(inventory.map((t) => t.type));
  const availableTypes = rng.shuffle(ALL_TOOL_TYPES.filter((t) => !heldTypes.has(t)));

  const granted: ToolInstance[] = [];
  for (let i = 0; i < toGrant && i < availableTypes.length; i++) {
    granted.push({ instanceId: nextId('tool'), type: availableTypes[i] });
  }
  return [...inventory, ...granted];
}

export function removeTool(inventory: ToolInstance[], instanceId: string): ToolInstance[] {
  return inventory.filter((t) => t.instanceId !== instanceId);
}

export function findToolInstance(inventory: ToolInstance[], instanceId: string): ToolInstance | null {
  return inventory.find((t) => t.instanceId === instanceId) ?? null;
}

export function hasToolOfType(inventory: ToolInstance[], type: ToolType): ToolInstance | null {
  return inventory.find((t) => t.type === type) ?? null;
}

/** Detector result, expressed as the same predicate shape a clue would use. */
export function resolveDetector(cups: Cup[], cupId: string, round: number): Clue {
  const cup = getCupById(cups, cupId);
  return {
    id: nextId('fact'),
    type: cup.isPoison ? 'direct_poison' : 'direct_safe',
    cupIds: [cupId],
    text: `Detector: Cup ${cup.displayNumber} is ${cup.isPoison ? 'POISON' : 'SAFE'}.`,
    round,
    revealedTo: [],
    source: 'detector',
  };
}

/** Spoon result. With only two states (safe/poison), "different liquid" for two cups
 * is exactly the xor_pair predicate, and "same liquid" is exactly same_state. */
export function resolveSpoon(cups: Cup[], cupIdA: string, cupIdB: string, round: number): Clue {
  const a = getCupById(cups, cupIdA);
  const b = getCupById(cups, cupIdB);
  const same = a.isPoison === b.isPoison;
  return {
    id: nextId('fact'),
    type: same ? 'same_state' : 'xor_pair',
    cupIds: [cupIdA, cupIdB],
    text: `Spoon: Cup ${a.displayNumber} and Cup ${b.displayNumber} are ${same ? 'the SAME liquid' : 'DIFFERENT liquids'}.`,
    round,
    revealedTo: [],
    source: 'spoon',
  };
}
