/** Small seeded PRNG (mulberry32) so a match can be reproduced from its seed. */
export class SeededRandom {
  private state: number;

  constructor(seed: string) {
    this.state = SeededRandom.hashSeed(seed);
  }

  private static hashSeed(seed: string): number {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Random integer in [0, max). */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.nextInt(items.length)];
  }

  shuffle<T>(items: readonly T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/** Derives an independent, reproducible PRNG stream for one reducer step — keeps the
 * reducer pure (no hidden mutable RNG instance) while staying deterministic given
 * (seed, rngCursor). */
export function deriveRng(seed: string, cursor: number): SeededRandom {
  return new SeededRandom(`${seed}:${cursor}`);
}

export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}
