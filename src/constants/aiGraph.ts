import type { WaypointDef } from '../types/game';
import { FLOORS } from './gameConfig';

const Y1 = FLOORS.FLOOR1_Y;
const Y2 = FLOORS.FLOOR2_Y;

// Hand-authored waypoint graph. Straight lines between neighbors pass through the
// matching door gaps in houseLayout.ts, so simple point-to-point steering + wall
// collision is enough — no runtime pathfinding needed.
export const WAYPOINTS: WaypointDef[] = [
  { id: 'entrance', x: 2, z: 8, y: Y1, floor: 1, room: 'entrance', neighbors: ['hallway1_w'] },
  { id: 'hallway1_w', x: 6, z: 7.5, y: Y1, floor: 1, room: 'hallway1', neighbors: ['entrance', 'hallway1_c'] },
  {
    id: 'hallway1_c',
    x: 11,
    z: 7.5,
    y: Y1,
    floor: 1,
    room: 'hallway1',
    neighbors: ['hallway1_w', 'hallway1_e', 'livingRoom', 'bedroom1'],
  },
  {
    id: 'hallway1_e',
    x: 17,
    z: 7.5,
    y: Y1,
    floor: 1,
    room: 'hallway1',
    neighbors: ['hallway1_c', 'stairFoot', 'kitchen', 'bedroom2'],
  },
  { id: 'livingRoom', x: 9, z: 3, y: Y1, floor: 1, room: 'livingRoom', neighbors: ['hallway1_c'] },
  { id: 'kitchen', x: 15, z: 3, y: Y1, floor: 1, room: 'kitchen', neighbors: ['hallway1_e'] },
  { id: 'bedroom1', x: 9, z: 12, y: Y1, floor: 1, room: 'bedroom1', neighbors: ['hallway1_c'] },
  { id: 'bedroom2', x: 15, z: 12, y: Y1, floor: 1, room: 'bedroom2', neighbors: ['hallway1_e'] },
  { id: 'stairFoot', x: 20, z: 7.5, y: Y1, floor: 1, room: 'stairFoot', neighbors: ['hallway1_e', 'stairTop'] },
  { id: 'stairTop', x: 27, z: 7.5, y: Y2, floor: 2, room: 'hallway2', neighbors: ['stairFoot', 'hallway2_w'] },
  {
    id: 'hallway2_w',
    x: 29,
    z: 7.5,
    y: Y2,
    floor: 2,
    room: 'hallway2',
    neighbors: ['stairTop', 'hallway2_c', 'bedroom3', 'storageRoom'],
  },
  {
    id: 'hallway2_c',
    x: 33,
    z: 7.5,
    y: Y2,
    floor: 2,
    room: 'hallway2',
    neighbors: ['hallway2_w', 'hallway2_e'],
  },
  {
    id: 'hallway2_e',
    x: 38,
    z: 7.5,
    y: Y2,
    floor: 2,
    room: 'hallway2',
    neighbors: ['hallway2_c', 'bedroom4', 'ritualRoom'],
  },
  { id: 'bedroom3', x: 31, z: 3, y: Y2, floor: 2, room: 'bedroom3', neighbors: ['hallway2_w'] },
  { id: 'bedroom4', x: 37, z: 3, y: Y2, floor: 2, room: 'bedroom4', neighbors: ['hallway2_e'] },
  { id: 'storageRoom', x: 30, z: 11, y: Y2, floor: 2, room: 'storageRoom', neighbors: ['hallway2_w'] },
  { id: 'ritualRoom', x: 36, z: 12, y: Y2, floor: 2, room: 'ritualRoom', neighbors: ['hallway2_e'] },
];

export function getWaypoint(id: string): WaypointDef {
  const wp = WAYPOINTS.find((w) => w.id === id);
  if (!wp) throw new Error(`Unknown waypoint ${id}`);
  return wp;
}

// The monster's default patrol loop: a big circuit through both floors.
export const PATROL_ROUTE: string[] = [
  'hallway1_w',
  'livingRoom',
  'hallway1_c',
  'kitchen',
  'hallway1_e',
  'bedroom2',
  'hallway1_c',
  'bedroom1',
  'hallway1_e',
  'stairFoot',
  'stairTop',
  'hallway2_w',
  'bedroom3',
  'hallway2_w',
  'storageRoom',
  'hallway2_e',
  'bedroom4',
  'hallway2_e',
  'ritualRoom',
  'hallway2_c',
  'hallway2_w',
  'stairTop',
  'stairFoot',
];
