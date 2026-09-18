import type { ItemDef } from '../types/game';
import { FLOORS } from './gameConfig';

export const ITEMS: ItemDef[] = [
  {
    id: 'doll',
    name: 'Cursed Doll',
    description: 'Its stitched eyes seem to follow you.',
    x: 8,
    z: 2,
    y: FLOORS.FLOOR1_Y + 0.5,
    floor: 1,
    room: 'livingRoom',
    color: '#8a1f1f',
  },
  {
    id: 'knife',
    name: 'Cursed Knife',
    description: 'The blade is stained with something that never dries.',
    x: 16,
    z: 1.5,
    y: FLOORS.FLOOR1_Y + 0.5,
    floor: 1,
    room: 'kitchen',
    color: '#9a9a9a',
  },
  {
    id: 'mirror',
    name: 'Cursed Mirror',
    description: 'Your reflection moves half a second too late.',
    x: 10.5,
    z: 13.5,
    y: FLOORS.FLOOR1_Y + 0.6,
    floor: 1,
    room: 'bedroom1',
    color: '#3a4a5a',
  },
  {
    id: 'candle',
    name: 'Cursed Candle',
    description: 'It burns with a flame that gives no warmth.',
    x: 32.5,
    z: 1.5,
    y: FLOORS.FLOOR2_Y + 0.5,
    floor: 2,
    room: 'bedroom3',
    color: '#4a3a1f',
  },
  {
    id: 'book',
    name: 'Cursed Book',
    description: 'The pages are written in something that isn\'t quite ink.',
    x: 30,
    z: 11.5,
    y: FLOORS.FLOOR2_Y + 0.5,
    floor: 2,
    room: 'storageRoom',
    color: '#2f1f3a',
  },
];

export const RITUAL_ALTAR = { x: 36, z: 13, y: FLOORS.FLOOR2_Y, room: 'ritualRoom' };
export const EXIT_POINT = { x: 0.5, z: 8, floor: 1 as const };
