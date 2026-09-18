import type { NoiseEvent, FloorId } from '../types/game';

const MAX_AGE = 6; // seconds a noise event stays relevant

// Sound carries up/down the open stairwell shaft, so noise near it is audible from
// either floor even though the two floors otherwise occupy disjoint XZ footprints.
const STAIRWELL_X_MIN = 15;
const STAIRWELL_X_MAX = 29;
function nearStairwell(x: number): boolean {
  return x >= STAIRWELL_X_MIN && x <= STAIRWELL_X_MAX;
}

class NoiseSystem {
  private events: NoiseEvent[] = [];

  emit(x: number, z: number, floor: FloorId, radius: number, strength: number, time: number) {
    this.events.push({ x, z, floor, radius, strength, time });
    if (this.events.length > 30) this.events.shift();
  }

  /** Most recent noise event within range of (x,z) on the same floor, newer than MAX_AGE. */
  latestNear(x: number, z: number, floor: FloorId, now: number): NoiseEvent | null {
    let best: NoiseEvent | null = null;
    for (const ev of this.events) {
      if (now - ev.time > MAX_AGE) continue;
      if (ev.floor !== floor && !(nearStairwell(ev.x) && nearStairwell(x))) continue;
      const dist = Math.hypot(ev.x - x, ev.z - z);
      if (dist > ev.radius) continue;
      if (!best || ev.time > best.time) best = ev;
    }
    return best;
  }

  clear() {
    this.events = [];
  }
}

export const noiseSystem = new NoiseSystem();
