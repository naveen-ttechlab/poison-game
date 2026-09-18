import { MonsterState } from '../../types/game';
import type { FloorId } from '../../types/game';
import { MONSTER, DIFFICULTY_CURVE } from '../../constants/gameConfig';
import { PATROL_ROUTE, getWaypoint } from '../../constants/aiGraph';
import { findPath, nearestWaypointId } from './Pathfinding';
import { resolveWallCollision, getFloorHeightAt, getFloorAt, hasLineOfSight } from '../../systems/CollisionSystem';
import { noiseSystem } from '../../systems/NoiseSystem';

export interface MonsterPerceptionInput {
  playerX: number;
  playerZ: number;
  playerFloor: FloorId;
  playerHidden: boolean;
  now: number;
  dt: number;
}

export class MonsterAI {
  x: number;
  z: number;
  y = 0;
  yaw = 0;
  floor: FloorId = 1;
  state: MonsterState = MonsterState.PATROL;
  difficultyLevel = 0;
  permanentAggro = false;

  private patrolIndex = 0;
  private path: string[] = [];
  private searchTimer = 0;
  private searchCenter: { x: number; z: number } | null = null;
  private searchWanderTimer = 0;
  private lastNoiseHandledAt = -1;

  constructor(startWaypointId = 'ritualRoom') {
    const wp = getWaypoint(startWaypointId);
    this.x = wp.x;
    this.z = wp.z;
    this.y = wp.y;
    this.floor = wp.floor;
  }

  private difficulty() {
    return DIFFICULTY_CURVE[Math.min(this.difficultyLevel, DIFFICULTY_CURVE.length - 1)];
  }

  private setState(state: MonsterState) {
    this.state = state;
  }

  perceive(input: MonsterPerceptionInput): { sawPlayer: boolean; caughtPlayer: boolean } {
    const { playerX, playerZ, playerFloor, playerHidden, now, dt } = input;
    const diff = this.difficulty();
    const dist = Math.hypot(playerX - this.x, playerZ - this.z);
    const sameFloor = playerFloor === this.floor || this.floor === getFloorAt(playerX, playerZ);

    let sawPlayer = false;
    if (sameFloor && !playerHidden) {
      const sightRange = MONSTER.SIGHT_RANGE_BASE * diff.sightMul;
      if (dist <= MONSTER.CLOSE_DETECT_RANGE) {
        sawPlayer = true;
      } else if (dist <= sightRange) {
        const toPlayerAngle = Math.atan2(playerX - this.x, playerZ - this.z);
        let angleDiff = toPlayerAngle - this.yaw;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        const withinFov = Math.abs(angleDiff) <= (MONSTER.SIGHT_FOV_DEG * Math.PI) / 360;
        if (withinFov && hasLineOfSight(this.x, this.z, playerX, playerZ)) {
          sawPlayer = true;
        }
      }
    }

    if (sawPlayer) {
      this.setState(MonsterState.CHASE);
      this.searchCenter = { x: playerX, z: playerZ };
      this.path = [];
    } else if (this.state === MonsterState.CHASE) {
      // Just lost sight — begin searching the last known position.
      this.setState(MonsterState.SEARCH);
      this.searchTimer =
        MONSTER.SEARCH_DURATION_MIN + Math.random() * (MONSTER.SEARCH_DURATION_MAX - MONSTER.SEARCH_DURATION_MIN);
      this.path = [];
    } else {
      const noise = noiseSystem.latestNear(this.x, this.z, this.floor, now);
      const hearingRange = MONSTER.HEARING_RANGE_BASE * diff.noiseSensitivity;
      if (
        noise &&
        noise.time !== this.lastNoiseHandledAt &&
        Math.hypot(noise.x - this.x, noise.z - this.z) <= hearingRange &&
        this.state !== MonsterState.SEARCH
      ) {
        this.lastNoiseHandledAt = noise.time;
        if (Math.random() < diff.searchChance) {
          this.setState(MonsterState.SEARCH);
          this.searchCenter = { x: noise.x, z: noise.z };
          this.searchTimer =
            MONSTER.SEARCH_DURATION_MIN + Math.random() * (MONSTER.SEARCH_DURATION_MAX - MONSTER.SEARCH_DURATION_MIN);
          this.path = [];
        }
      }
    }

    if (this.state === MonsterState.SEARCH) {
      this.searchTimer -= dt;
      if (this.searchTimer <= 0) {
        this.setState(MonsterState.PATROL);
        this.path = [];
      }
    }

    const caughtPlayer = sawPlayer && dist <= MONSTER.CLOSE_DETECT_RANGE * 0.85;
    return { sawPlayer, caughtPlayer };
  }

  private speed(): number {
    const diff = this.difficulty();
    let base = MONSTER.PATROL_SPEED;
    if (this.state === MonsterState.SEARCH) base = MONSTER.SEARCH_SPEED;
    if (this.state === MonsterState.CHASE) {
      base = this.permanentAggro ? MONSTER.CHASE_SPEED_MAX : MONSTER.CHASE_SPEED_BASE;
    }
    return base * diff.speedMul;
  }

  private moveToward(tx: number, tz: number, dt: number) {
    const dx = tx - this.x;
    const dz = tz - this.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.01) return;
    this.yaw = Math.atan2(dx, dz);
    const step = Math.min(dist, this.speed() * dt);
    const nx = this.x + (dx / dist) * step;
    const nz = this.z + (dz / dist) * step;
    const resolved = resolveWallCollision(nx, nz, MONSTER.BODY_RADIUS);
    this.x = resolved.x;
    this.z = resolved.z;
    this.y = getFloorHeightAt(this.x, this.z);
    this.floor = getFloorAt(this.x, this.z);
  }

  private followPath(dt: number, destX: number, destZ: number) {
    if (this.path.length === 0) {
      const from = nearestWaypointId(this.x, this.z);
      const to = nearestWaypointId(destX, destZ);
      this.path = findPath(from, to);
    }
    if (this.path.length > 0) {
      const wp = getWaypoint(this.path[0]);
      this.moveToward(wp.x, wp.z, dt);
      if (Math.hypot(wp.x - this.x, wp.z - this.z) < MONSTER.WAYPOINT_ARRIVE_DIST) {
        this.path.shift();
      }
    } else {
      this.moveToward(destX, destZ, dt);
    }
  }

  update(input: MonsterPerceptionInput): { sawPlayer: boolean; caughtPlayer: boolean } {
    const result = this.perceive(input);
    const { playerX, playerZ, dt } = input;

    if (this.state === MonsterState.CHASE) {
      this.moveToward(playerX, playerZ, dt);
    } else if (this.state === MonsterState.SEARCH) {
      const center = this.searchCenter ?? { x: this.x, z: this.z };
      const distToCenter = Math.hypot(center.x - this.x, center.z - this.z);
      if (distToCenter > MONSTER.WAYPOINT_ARRIVE_DIST * 1.5) {
        this.followPath(dt, center.x, center.z);
      } else {
        this.searchWanderTimer -= dt;
        if (this.searchWanderTimer <= 0) {
          this.searchWanderTimer = 1.2 + Math.random() * 1.2;
          const angle = Math.random() * Math.PI * 2;
          const wanderTarget = { x: center.x + Math.cos(angle) * 2.5, z: center.z + Math.sin(angle) * 2.5 };
          this.moveToward(wanderTarget.x, wanderTarget.z, dt);
        }
      }
    } else {
      // PATROL
      if (this.path.length === 0) {
        const targetId = PATROL_ROUTE[this.patrolIndex];
        const from = nearestWaypointId(this.x, this.z);
        this.path = findPath(from, targetId);
        if (this.path.length === 0) this.path = [targetId];
      }
      const targetWp = getWaypoint(this.path[0]);
      this.moveToward(targetWp.x, targetWp.z, dt);
      if (Math.hypot(targetWp.x - this.x, targetWp.z - this.z) < MONSTER.WAYPOINT_ARRIVE_DIST) {
        this.path.shift();
        if (this.path.length === 0) {
          this.patrolIndex = (this.patrolIndex + 1) % PATROL_ROUTE.length;
        }
      }
    }

    return result;
  }
}
