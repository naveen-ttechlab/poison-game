import { WALLS, ROOMS, RAMP } from '../constants/houseLayout';
import { FLOORS } from '../constants/gameConfig';
import type { FloorId } from '../types/game';
import { doorSystem } from './DoorSystem';

const WALL_THICKNESS = 0.25;

/** Closest point on segment (x1,z1)-(x2,z2) to point (px,pz). */
function closestPointOnSegment(px: number, pz: number, x1: number, z1: number, x2: number, z2: number) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  let t = lenSq > 0 ? ((px - x1) * dx + (pz - z1) * dz) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  return { x: x1 + t * dx, z: z1 + t * dz };
}

/**
 * Push (x, z) out of any wall it overlaps, given a circular collider of `radius`.
 * Because each floor's rooms occupy a disjoint XZ footprint (see houseLayout.ts),
 * walls never need floor filtering — a point can only ever be near the walls of
 * the floor it's physically standing on.
 */
export function resolveWallCollision(x: number, z: number, radius: number): { x: number; z: number } {
  let px = x;
  let pz = z;
  const blockers: { x1: number; z1: number; x2: number; z2: number }[] = [...WALLS, ...doorSystem.closedDoorSegments()];
  for (let iter = 0; iter < 3; iter++) {
    let pushed = false;
    for (const wall of blockers) {
      const cp = closestPointOnSegment(px, pz, wall.x1, wall.z1, wall.x2, wall.z2);
      const dx = px - cp.x;
      const dz = pz - cp.z;
      const dist = Math.hypot(dx, dz);
      const minDist = radius + WALL_THICKNESS / 2;
      if (dist < minDist && dist > 1e-6) {
        const push = minDist - dist;
        px += (dx / dist) * push;
        pz += (dz / dist) * push;
        pushed = true;
      } else if (dist <= 1e-6) {
        // Degenerate (standing exactly on the wall line) — push along segment normal.
        const ndx = wall.z2 - wall.z1;
        const ndz = -(wall.x2 - wall.x1);
        const nlen = Math.hypot(ndx, ndz) || 1;
        px += (ndx / nlen) * minDist;
        pz += (ndz / nlen) * minDist;
        pushed = true;
      }
    }
    if (!pushed) break;
  }
  return { x: px, z: pz };
}

function pointInRoom(x: number, z: number, room: (typeof ROOMS)[number]): boolean {
  return x >= room.x1 && x <= room.x2 && z >= room.z1 && z <= room.z2;
}

/** Returns the walkable floor height at (x, z): flat per-room, or interpolated on the ramp. */
export function getFloorHeightAt(x: number, z: number): number {
  if (x >= RAMP.x1 && x <= RAMP.x2 && z >= RAMP.z1 && z <= RAMP.z2) {
    const t = (x - RAMP.x1) / (RAMP.x2 - RAMP.x1);
    return RAMP.yBottom + (RAMP.yTop - RAMP.yBottom) * Math.max(0, Math.min(1, t));
  }
  const room = ROOMS.find((r) => pointInRoom(x, z, r));
  if (room) return room.floor === 1 ? FLOORS.FLOOR1_Y : FLOORS.FLOOR2_Y;
  return FLOORS.FLOOR1_Y;
}

/** Derives the logical floor (1 or 2) from an XZ position — used for AI/noise bookkeeping. */
export function getFloorAt(x: number, z: number): FloorId {
  if (x >= RAMP.x1 && x <= RAMP.x2 && z >= RAMP.z1 && z <= RAMP.z2) {
    const t = (x - RAMP.x1) / (RAMP.x2 - RAMP.x1);
    return t > 0.5 ? 2 : 1;
  }
  const room = ROOMS.find((r) => pointInRoom(x, z, r));
  return room ? room.floor : 1;
}

/** Simple line-of-sight test: does the segment from a to b cross any wall? */
export function hasLineOfSight(ax: number, az: number, bx: number, bz: number): boolean {
  for (const wall of WALLS) {
    if (segmentsIntersect(ax, az, bx, bz, wall.x1, wall.z1, wall.x2, wall.z2)) return false;
  }
  for (const door of doorSystem.closedDoorSegments()) {
    if (segmentsIntersect(ax, az, bx, bz, door.x1, door.z1, door.x2, door.z2)) return false;
  }
  return true;
}

function segmentsIntersect(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): boolean {
  const d1 = cross(cx, cy, dx, dy, ax, ay);
  const d2 = cross(cx, cy, dx, dy, bx, by);
  const d3 = cross(ax, ay, bx, by, cx, cy);
  const d4 = cross(ax, ay, bx, by, dx, dy);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  return false;
}

function cross(ox: number, oy: number, ax: number, ay: number, bx: number, by: number): number {
  return (ax - ox) * (by - oy) - (ay - oy) * (bx - ox);
}
