export type FloorId = 1 | 2;

export interface Vec2 {
  x: number;
  z: number;
}

export interface WallSegment {
  id: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  floor: FloorId;
  height: number;
  baseY: number;
  thickness?: number;
}

export interface RoomDef {
  id: string;
  name: string;
  floor: FloorId;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  color: string;
}

export interface DoorDef {
  id: string;
  x: number;
  z: number;
  width: number;
  floor: FloorId;
  /** rotation of the door hinge axis in radians (0 = door spans along X, PI/2 = spans along Z) */
  axis: 'x' | 'z';
  roomA: string;
  roomB: string;
}

export interface RampDef {
  id: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  yBottom: number;
  yTop: number;
  floorFrom: FloorId;
  floorTo: FloorId;
}

export interface WaypointDef {
  id: string;
  x: number;
  z: number;
  y: number;
  floor: FloorId;
  room: string;
  neighbors: string[];
}

export type CursedItemId = 'doll' | 'knife' | 'mirror' | 'candle' | 'book';

export interface ItemDef {
  id: CursedItemId;
  name: string;
  description: string;
  x: number;
  z: number;
  y: number;
  floor: FloorId;
  room: string;
  color: string;
}

export const MonsterState = {
  PATROL: 'PATROL',
  SEARCH: 'SEARCH',
  CHASE: 'CHASE',
} as const;
export type MonsterState = (typeof MonsterState)[keyof typeof MonsterState];

export const GameStage = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  RITUAL: 'RITUAL',
  FINAL_CHASE: 'FINAL_CHASE',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
} as const;
export type GameStage = (typeof GameStage)[keyof typeof GameStage];

export interface NoiseEvent {
  x: number;
  z: number;
  floor: FloorId;
  radius: number;
  strength: number;
  time: number;
}
