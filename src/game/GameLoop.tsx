import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PlayerController } from './Player/PlayerController';
import type { MonsterAI } from './AI/MonsterAI';
import { inputManager } from '../systems/InputManager';
import { doorSystem } from '../systems/DoorSystem';
import { noiseSystem } from '../systems/NoiseSystem';
import { gameStore } from '../systems/GameState';
import { audioManager } from './Audio/AudioManager';
import { DOORS } from '../constants/houseLayout';
import { ITEMS, RITUAL_ALTAR } from '../constants/items';
import { HIDING_SPOTS } from '../constants/hidingSpots';
import { PLAYER, ATMOSPHERE } from '../constants/gameConfig';
import { GameStage, MonsterState } from '../types/game';
import type { FloorId } from '../types/game';

interface Interactable {
  kind: 'door' | 'item' | 'altar' | 'monster' | 'hide';
  id: string;
  x: number;
  z: number;
  label: string;
  range: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function GameLoop({
  player,
  monster,
  flashlightOnRef,
  shakeRef,
}: {
  player: PlayerController;
  monster: MonsterAI;
  flashlightOnRef: MutableRefObject<boolean>;
  shakeRef: MutableRefObject<{ magnitude: number }>;
}) {
  const timeRef = useRef(0);
  const ritualTimer = useRef(0);
  const nearestRef = useRef<Interactable | null>(null);
  const growlTimer = useRef(0);

  useEffect(() => {
    const handleInteract = () => {
      const target = nearestRef.current;
      const state = gameStore.getState();
      if (!target) return;
      const now = timeRef.current;

      if (target.kind === 'door') {
        doorSystem.toggle(target.id);
        audioManager.playDoorCreak();
        const doorDef = DOORS.find((d) => d.id === target.id)!;
        noiseSystem.emit(doorDef.x, doorDef.z, doorDef.floor, PLAYER.NOISE_RADIUS_DOOR, 1, now);
        if (target.id === 'frontDoor' && doorSystem.isOpen('frontDoor') && state.monsterDead && state.stage === GameStage.FINAL_CHASE) {
          gameStore.set({ stage: GameStage.VICTORY });
          audioManager.playVictory();
        }
        return;
      }

      if (target.kind === 'item') {
        const item = ITEMS.find((i) => i.id === target.id)!;
        gameStore.collectItem(item.id, item.name);
        audioManager.playPickup();
        noiseSystem.emit(item.x, item.z, item.floor, PLAYER.NOISE_RADIUS_PICKUP, 1, now);
        return;
      }

      if (target.kind === 'altar') {
        if (state.inventory.length === ITEMS.length && state.stage === GameStage.PLAYING) {
          gameStore.set({ stage: GameStage.RITUAL, objective: 'The ritual is underway...' });
          ritualTimer.current = 3.2;
          audioManager.playRitual();
        }
        return;
      }

      if (target.kind === 'monster') {
        if (state.stage === GameStage.FINAL_CHASE && !state.monsterDead) {
          gameStore.set({ monsterDead: true, objective: 'The monster is dead. Escape through the front door!' });
          audioManager.playStinger();
        }
        return;
      }

      if (target.kind === 'hide') {
        player.hiding = !player.hiding;
      }
    };

    inputManager.onInteract = handleInteract;
    inputManager.onToggleFlashlight = () => {
      flashlightOnRef.current = !flashlightOnRef.current;
      gameStore.setHud({ flashlightOn: flashlightOnRef.current });
    };
    return () => {
      inputManager.onInteract = null;
      inputManager.onToggleFlashlight = null;
    };
  }, [flashlightOnRef]);

  useFrame((_state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const stage = gameStore.getState().stage;
    const simulating =
      stage === GameStage.PLAYING || stage === GameStage.RITUAL || stage === GameStage.FINAL_CHASE;
    if (!simulating) return;
    timeRef.current += dt;
    const now = timeRef.current;

    doorSystem.tick(dt);

    if (stage === GameStage.RITUAL) {
      ritualTimer.current -= dt;
      if (ritualTimer.current <= 0) {
        monster.permanentAggro = true;
        gameStore.set({
          stage: GameStage.FINAL_CHASE,
          objective: 'The monster hunts you now. Find it and strike with your weapon!',
        });
      }
      gameStore.setHud({ interactPrompt: null });
      return;
    }

    player.update(dt, inputManager, now);

    const moving = Math.hypot(player.velX, player.velZ) > 0.4;
    if (moving) audioManager.playFootstep(player.isSprinting, now);

    // Gather nearby interactables and pick the closest.
    const state = gameStore.getState();
    const candidates: Interactable[] = [];
    if (player.hiding) {
      for (const spot of HIDING_SPOTS) {
        candidates.push({ kind: 'hide', id: spot.id, x: spot.x, z: spot.z, label: `Come out of the ${spot.label}`, range: 100 });
      }
    } else {
      for (const d of DOORS) {
        candidates.push({ kind: 'door', id: d.id, x: d.x, z: d.z, label: `Open/Close ${doorLabel(d.id)}`, range: PLAYER.INTERACT_DISTANCE });
      }
      for (const spot of HIDING_SPOTS) {
        candidates.push({ kind: 'hide', id: spot.id, x: spot.x, z: spot.z, label: `Hide in the ${spot.label}`, range: PLAYER.INTERACT_DISTANCE });
      }
      if (stage === GameStage.PLAYING) {
        for (const item of ITEMS) {
          if (state.inventory.includes(item.id)) continue;
          candidates.push({ kind: 'item', id: item.id, x: item.x, z: item.z, label: `Pick up ${item.name}`, range: PLAYER.INTERACT_DISTANCE });
        }
        if (state.inventory.length === ITEMS.length) {
          candidates.push({ kind: 'altar', id: 'altar', x: RITUAL_ALTAR.x, z: RITUAL_ALTAR.z, label: 'Perform the ritual', range: PLAYER.INTERACT_DISTANCE });
        }
      }
      if (stage === GameStage.FINAL_CHASE && !state.monsterDead) {
        candidates.push({ kind: 'monster', id: 'monster', x: monster.x, z: monster.z, label: 'Attack the monster', range: PLAYER.ATTACK_DISTANCE });
      }
    }

    let nearest: Interactable | null = null;
    let nearestDist = Infinity;
    for (const c of candidates) {
      const d = Math.hypot(c.x - player.x, c.z - player.z);
      if (d <= c.range && d < nearestDist) {
        nearest = c;
        nearestDist = d;
      }
    }
    nearestRef.current = nearest;

    // Monster simulation
    monster.difficultyLevel = state.inventory.length;
    if (stage === GameStage.FINAL_CHASE) monster.permanentAggro = true;
    if (!state.monsterDead) {
      const { caughtPlayer } = monster.update({
        playerX: player.x,
        playerZ: player.z,
        playerFloor: player.floor as FloorId,
        playerHidden: player.hiding,
        now,
        dt,
      });
      if (caughtPlayer && state.stage !== GameStage.DEFEAT) {
        gameStore.set({ stage: GameStage.DEFEAT });
        audioManager.playStinger();
      }
    }

    const dist = Math.hypot(monster.x - player.x, monster.z - player.z);
    let proximity = Math.max(0, 1 - dist / ATMOSPHERE.HEARTBEAT_TRIGGER_DIST);
    if (monster.state === MonsterState.CHASE) proximity = Math.min(1, proximity + 0.3);
    audioManager.setHeartbeat(proximity);
    shakeRef.current.magnitude = monster.state === MonsterState.CHASE ? proximity : 0;

    if (monster.state === MonsterState.CHASE || monster.state === MonsterState.SEARCH) {
      growlTimer.current -= dt;
      if (growlTimer.current <= 0) {
        audioManager.playGrowl(monster.state === MonsterState.CHASE ? 0.8 + proximity * 0.2 : 0.35);
        growlTimer.current = monster.state === MonsterState.CHASE ? 2 + Math.random() * 1.5 : 4 + Math.random() * 3;
      }
    } else {
      growlTimer.current = Math.max(growlTimer.current, 3);
    }

    gameStore.setHud({
      stamina: round2(player.staminaFraction),
      sprinting: player.isSprinting,
      monsterProximity: round2(proximity),
      monsterState: monster.state,
      interactPrompt: nearest?.label ?? null,
    });
  });

  return null;
}

function doorLabel(id: string): string {
  if (id === 'frontDoor') return 'Front Door';
  return 'Door';
}
