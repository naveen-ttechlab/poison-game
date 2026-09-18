import type { DoorDef, RampDef, RoomDef, WallSegment } from '../types/game';
import { FLOORS } from './gameConfig';

const { FLOOR1_Y, FLOOR2_Y, WALL_HEIGHT } = FLOORS;

export const ROOMS: RoomDef[] = [
  { id: 'entrance', name: 'Entrance', floor: 1, x1: 0, z1: 5, x2: 4, z2: 11, color: '#2b2620' },
  { id: 'hallway1', name: 'Hallway', floor: 1, x1: 4, z1: 6, x2: 18, z2: 9, color: '#221f1c' },
  { id: 'livingRoom', name: 'Living Room', floor: 1, x1: 6, z1: 0, x2: 12, z2: 6, color: '#2a2018' },
  { id: 'kitchen', name: 'Kitchen', floor: 1, x1: 12, z1: 0, x2: 18, z2: 6, color: '#1f2420' },
  { id: 'bedroom1', name: 'Bedroom 1', floor: 1, x1: 6, z1: 9, x2: 12, z2: 15, color: '#241f26' },
  { id: 'bedroom2', name: 'Bedroom 2', floor: 1, x1: 12, z1: 9, x2: 18, z2: 15, color: '#231e22' },
  { id: 'stairFoot', name: 'Staircase', floor: 1, x1: 18, z1: 6, x2: 26, z2: 9, color: '#181614' },
  { id: 'hallway2', name: 'Upstairs Hallway', floor: 2, x1: 26, z1: 6, x2: 40, z2: 9, color: '#221f1c' },
  { id: 'bedroom3', name: 'Bedroom 3', floor: 2, x1: 28, z1: 0, x2: 34, z2: 6, color: '#241f26' },
  { id: 'bedroom4', name: 'Bedroom 4', floor: 2, x1: 34, z1: 0, x2: 40, z2: 6, color: '#231e22' },
  { id: 'storageRoom', name: 'Storage Room', floor: 2, x1: 28, z1: 9, x2: 32, z2: 13, color: '#1c1a17' },
  { id: 'ritualRoom', name: 'Ritual Room', floor: 2, x1: 32, z1: 9, x2: 40, z2: 15, color: '#2c1414' },
];

export function getRoom(id: string): RoomDef {
  const room = ROOMS.find((r) => r.id === id);
  if (!room) throw new Error(`Unknown room ${id}`);
  return room;
}

type Gap = [number, number];

let segCounter = 0;
function buildSide(
  orientation: 'x' | 'z',
  fixed: number,
  start: number,
  end: number,
  gaps: Gap[],
  floor: 1 | 2,
  baseY: number,
  height: number,
): WallSegment[] {
  const segments: WallSegment[] = [];
  const sorted = [...gaps].sort((a, b) => a[0] - b[0]);
  let cursor = start;
  const push = (a: number, b: number) => {
    if (b - a <= 0.001) return;
    segCounter += 1;
    const coords =
      orientation === 'x' ? { x1: a, z1: fixed, x2: b, z2: fixed } : { x1: fixed, z1: a, x2: fixed, z2: b };
    segments.push({ id: `wall-${segCounter}`, ...coords, floor, height, baseY });
  };
  for (const [gs, ge] of sorted) {
    if (gs > cursor) push(cursor, gs);
    cursor = Math.max(cursor, ge);
  }
  if (cursor < end) push(cursor, end);
  return segments;
}

// Hand-authored wall ownership: each shared wall is drawn exactly once by one room,
// so adjoining rooms simply omit the side that's already covered by their neighbor.
export const WALLS: WallSegment[] = [
  // Entrance
  ...buildSide('z', 0, 5, 11, [[7, 9]], 1, FLOOR1_Y, WALL_HEIGHT), // west (front door)
  ...buildSide('x', 5, 0, 4, [], 1, FLOOR1_Y, WALL_HEIGHT), // north
  ...buildSide('x', 11, 0, 4, [], 1, FLOOR1_Y, WALL_HEIGHT), // south
  ...buildSide('z', 4, 5, 11, [[7, 9]], 1, FLOOR1_Y, WALL_HEIGHT), // east -> hallway1

  // Hallway1 spine
  ...buildSide('x', 6, 4, 18, [[8, 10], [14, 16]], 1, FLOOR1_Y, WALL_HEIGHT), // north -> livingRoom/kitchen
  ...buildSide('x', 9, 4, 18, [[8, 10], [14, 16]], 1, FLOOR1_Y, WALL_HEIGHT), // south -> bedroom1/bedroom2

  // Living room
  ...buildSide('x', 0, 6, 12, [], 1, FLOOR1_Y, WALL_HEIGHT), // north exterior
  ...buildSide('z', 6, 0, 6, [], 1, FLOOR1_Y, WALL_HEIGHT), // west exterior
  ...buildSide('z', 12, 0, 6, [], 1, FLOOR1_Y, WALL_HEIGHT), // east (shared w/ kitchen)

  // Kitchen
  ...buildSide('x', 0, 12, 18, [], 1, FLOOR1_Y, WALL_HEIGHT), // north exterior
  ...buildSide('z', 18, 0, 6, [], 1, FLOOR1_Y, WALL_HEIGHT), // east exterior

  // Bedroom 1
  ...buildSide('x', 15, 6, 12, [], 1, FLOOR1_Y, WALL_HEIGHT), // south exterior
  ...buildSide('z', 6, 9, 15, [], 1, FLOOR1_Y, WALL_HEIGHT), // west exterior
  ...buildSide('z', 12, 9, 15, [], 1, FLOOR1_Y, WALL_HEIGHT), // east (shared w/ bedroom2)

  // Bedroom 2
  ...buildSide('x', 15, 12, 18, [], 1, FLOOR1_Y, WALL_HEIGHT), // south exterior
  ...buildSide('z', 18, 9, 15, [], 1, FLOOR1_Y, WALL_HEIGHT), // east exterior

  // Staircase shaft (tall, spans both floors), open ends at x=18 and x=26
  ...buildSide('x', 6, 18, 26, [], 1, FLOOR1_Y, WALL_HEIGHT * 2 + FLOORS.SLAB_THICKNESS), // north
  ...buildSide('x', 9, 18, 26, [], 1, FLOOR1_Y, WALL_HEIGHT * 2 + FLOORS.SLAB_THICKNESS), // south

  // Hallway2 spine
  ...buildSide('x', 6, 26, 40, [[30, 32], [36, 38]], 2, FLOOR2_Y, WALL_HEIGHT), // north -> bedroom3/4
  ...buildSide('x', 9, 26, 40, [[29, 31], [35, 37]], 2, FLOOR2_Y, WALL_HEIGHT), // south -> storage/ritual
  ...buildSide('z', 40, 6, 9, [], 2, FLOOR2_Y, WALL_HEIGHT), // east dead-end cap

  // Bedroom 3
  ...buildSide('x', 0, 28, 34, [], 2, FLOOR2_Y, WALL_HEIGHT),
  ...buildSide('z', 28, 0, 6, [], 2, FLOOR2_Y, WALL_HEIGHT),
  ...buildSide('z', 34, 0, 6, [], 2, FLOOR2_Y, WALL_HEIGHT), // shared w/ bedroom4

  // Bedroom 4
  ...buildSide('x', 0, 34, 40, [], 2, FLOOR2_Y, WALL_HEIGHT),
  ...buildSide('z', 40, 0, 6, [], 2, FLOOR2_Y, WALL_HEIGHT),

  // Storage room
  ...buildSide('x', 13, 28, 32, [], 2, FLOOR2_Y, WALL_HEIGHT),
  ...buildSide('z', 28, 9, 13, [], 2, FLOOR2_Y, WALL_HEIGHT),
  ...buildSide('z', 32, 9, 13, [], 2, FLOOR2_Y, WALL_HEIGHT), // shared w/ ritual room (z 9-13 portion)

  // Ritual room
  ...buildSide('x', 15, 32, 40, [], 2, FLOOR2_Y, WALL_HEIGHT),
  ...buildSide('z', 40, 9, 15, [], 2, FLOOR2_Y, WALL_HEIGHT),
  ...buildSide('z', 32, 13, 15, [], 2, FLOOR2_Y, WALL_HEIGHT), // remaining sliver not covered by storage room
];

export const RAMP: RampDef = {
  id: 'mainRamp',
  x1: 22,
  z1: 6,
  x2: 26,
  z2: 9,
  yBottom: FLOOR1_Y,
  yTop: FLOOR2_Y,
  floorFrom: 1,
  floorTo: 2,
};

export const DOORS: DoorDef[] = [
  { id: 'frontDoor', x: 0, z: 8, width: 2, floor: 1, axis: 'z', roomA: 'entrance', roomB: 'outside' },
  { id: 'entranceHallway', x: 4, z: 8, width: 2, floor: 1, axis: 'z', roomA: 'entrance', roomB: 'hallway1' },
  { id: 'livingRoomDoor', x: 9, z: 6, width: 2, floor: 1, axis: 'x', roomA: 'hallway1', roomB: 'livingRoom' },
  { id: 'kitchenDoor', x: 15, z: 6, width: 2, floor: 1, axis: 'x', roomA: 'hallway1', roomB: 'kitchen' },
  { id: 'bedroom1Door', x: 9, z: 9, width: 2, floor: 1, axis: 'x', roomA: 'hallway1', roomB: 'bedroom1' },
  { id: 'bedroom2Door', x: 15, z: 9, width: 2, floor: 1, axis: 'x', roomA: 'hallway1', roomB: 'bedroom2' },
  { id: 'bedroom3Door', x: 31, z: 6, width: 2, floor: 2, axis: 'x', roomA: 'hallway2', roomB: 'bedroom3' },
  { id: 'bedroom4Door', x: 37, z: 6, width: 2, floor: 2, axis: 'x', roomA: 'hallway2', roomB: 'bedroom4' },
  { id: 'storageDoor', x: 30, z: 9, width: 2, floor: 2, axis: 'x', roomA: 'hallway2', roomB: 'storageRoom' },
  { id: 'ritualDoor', x: 36, z: 9, width: 2, floor: 2, axis: 'x', roomA: 'hallway2', roomB: 'ritualRoom' },
];

export const HOUSE_BOUNDS = { minX: -1, maxX: 41, minZ: -1, maxZ: 16 };
