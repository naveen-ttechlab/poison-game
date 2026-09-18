import { useSyncExternalStore } from 'react';
import { GameStage, MonsterState, type CursedItemId } from '../types/game';
import { ITEMS } from '../constants/items';

export interface HudState {
  stamina: number; // 0..1
  sprinting: boolean;
  monsterProximity: number; // 0..1, 1 = right next to you
  monsterState: MonsterState;
  interactPrompt: string | null;
  flashlightOn: boolean;
}

export interface AppState {
  stage: GameStage;
  inventory: CursedItemId[];
  objective: string;
  difficultyLevel: number; // 0..4, derived from inventory length
  hud: HudState;
  lastMessage: string | null;
  monsterDead: boolean;
}

function initialState(): AppState {
  return {
    stage: GameStage.MENU,
    inventory: [],
    objective: 'Find the 5 cursed objects hidden in the house.',
    difficultyLevel: 0,
    hud: {
      stamina: 1,
      sprinting: false,
      monsterProximity: 0,
      monsterState: MonsterState.PATROL,
      interactPrompt: null,
      flashlightOn: true,
    },
    lastMessage: null,
    monsterDead: false,
  };
}

type Listener = () => void;

class Store {
  private state: AppState = initialState();
  private listeners = new Set<Listener>();

  getState = (): AppState => this.state;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    for (const l of this.listeners) l();
  }

  set(patch: Partial<AppState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  setHud(patch: Partial<HudState>) {
    const prev = this.state.hud;
    let changed = false;
    for (const k in patch) {
      const key = k as keyof HudState;
      if (prev[key] !== patch[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    this.state = { ...this.state, hud: { ...prev, ...patch } };
    this.emit();
  }

  reset() {
    this.state = initialState();
    this.emit();
  }

  collectItem(id: CursedItemId, itemName: string) {
    if (this.state.inventory.includes(id)) return;
    const inventory = [...this.state.inventory, id];
    const remaining = ITEMS.length - inventory.length;
    this.state = {
      ...this.state,
      inventory,
      difficultyLevel: inventory.length,
      objective:
        remaining > 0
          ? `Collected the ${itemName}. Find ${remaining} more cursed object${remaining === 1 ? '' : 's'}.`
          : 'All 5 cursed objects collected. Return to the Ritual Room upstairs.',
      lastMessage: `Picked up: ${itemName}`,
    };
    this.emit();
  }

  setStage(stage: GameStage) {
    this.set({ stage });
  }
}

export const gameStore = new Store();

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(gameStore.subscribe, () => selector(gameStore.getState()));
}
