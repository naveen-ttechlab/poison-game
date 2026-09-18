import type { FloorId } from '../types/game';
import { FLOORS } from './gameConfig';

export interface HidingSpotDef {
  id: string;
  x: number;
  z: number;
  floor: FloorId;
  label: string;
}

export const HIDING_SPOTS: HidingSpotDef[] = [
  { id: 'closet_bedroom1', x: 11, z: 10, floor: 1, label: 'Wardrobe' },
  { id: 'closet_bedroom2', x: 17, z: 10, floor: 1, label: 'Wardrobe' },
  { id: 'closet_bedroom4', x: 39, z: 5, floor: 2, label: 'Wardrobe' },
  { id: 'closet_storage', x: 31, z: 10, floor: 2, label: 'Cabinet' },
];

export function hidingSpotY(floor: FloorId): number {
  return floor === 1 ? FLOORS.FLOOR1_Y : FLOORS.FLOOR2_Y;
}
