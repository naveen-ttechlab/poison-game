import { DOORS } from '../constants/houseLayout';
import type { DoorDef } from '../types/game';

export interface DoorRuntimeState {
  open: boolean;
  angle: number; // current visual swing angle, radians
}

type Listener = () => void;

class DoorSystemImpl {
  private states = new Map<string, DoorRuntimeState>();
  private listeners = new Set<Listener>();

  constructor() {
    for (const d of DOORS) this.states.set(d.id, { open: false, angle: 0 });
  }

  get(id: string): DoorRuntimeState {
    return this.states.get(id) ?? { open: false, angle: 0 };
  }

  isOpen(id: string): boolean {
    return this.states.get(id)?.open ?? false;
  }

  toggle(id: string) {
    const s = this.states.get(id);
    if (!s) return;
    s.open = !s.open;
    this.emit();
  }

  /** Advances swing animation toward target angle; call once per frame. */
  tick(dt: number) {
    for (const [, s] of this.states) {
      const target = s.open ? Math.PI / 2 : 0;
      const diff = target - s.angle;
      if (Math.abs(diff) > 0.001) {
        s.angle += Math.sign(diff) * Math.min(Math.abs(diff), dt * 3.5);
      }
    }
  }

  resetAll() {
    for (const d of DOORS) this.states.set(d.id, { open: false, angle: 0 });
    this.emit();
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    for (const l of this.listeners) l();
  }

  /** Closed doors block movement; returns their blocking line segments. */
  closedDoorSegments(): { x1: number; z1: number; x2: number; z2: number }[] {
    const segs: { x1: number; z1: number; x2: number; z2: number }[] = [];
    for (const d of DOORS as DoorDef[]) {
      if (this.isOpen(d.id)) continue;
      const half = d.width / 2;
      if (d.axis === 'x') {
        segs.push({ x1: d.x - half, z1: d.z, x2: d.x + half, z2: d.z });
      } else {
        segs.push({ x1: d.x, z1: d.z - half, x2: d.x, z2: d.z + half });
      }
    }
    return segs;
  }
}

export const doorSystem = new DoorSystemImpl();
