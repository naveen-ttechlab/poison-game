import { WAYPOINTS, getWaypoint } from '../../constants/aiGraph';
import type { FloorId } from '../../types/game';

/** Unweighted BFS over the hand-authored waypoint graph — small enough that this is instant. */
export function findPath(fromId: string, toId: string): string[] {
  if (fromId === toId) return [toId];
  const visited = new Set<string>([fromId]);
  const queue: string[][] = [[fromId]];
  while (queue.length > 0) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    if (last === toId) return path.slice(1);
    const wp = getWaypoint(last);
    for (const n of wp.neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push([...path, n]);
      }
    }
  }
  return [];
}

export function nearestWaypointId(x: number, z: number, floor?: FloorId): string {
  let best = WAYPOINTS[0];
  let bestDist = Infinity;
  for (const wp of WAYPOINTS) {
    if (floor && wp.floor !== floor) continue;
    const d = Math.hypot(wp.x - x, wp.z - z);
    if (d < bestDist) {
      bestDist = d;
      best = wp;
    }
  }
  return best.id;
}
