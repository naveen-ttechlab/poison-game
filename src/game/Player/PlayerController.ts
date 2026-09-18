import { PLAYER } from '../../constants/gameConfig';
import { resolveWallCollision, getFloorHeightAt, getFloorAt } from '../../systems/CollisionSystem';
import { noiseSystem } from '../../systems/NoiseSystem';
import { InputManager } from '../../systems/InputManager';
import type { FloorId } from '../../types/game';

export class PlayerController {
  x = 2;
  z = 8;
  y = 0;
  yaw = -Math.PI / 2; // facing +X, down the hallway from the entrance
  pitch = 0;
  velX = 0;
  velZ = 0;
  stamina = PLAYER.SPRINT_STAMINA_MAX;
  isSprinting = false;
  timeSinceSprintReleased = 999;
  floor: FloorId = 1;
  hiding = false;

  update(dt: number, input: InputManager, now: number) {
    const [dx, dy] = input.consumeMouseDelta();
    this.yaw -= dx * PLAYER.MOUSE_SENSITIVITY;
    this.pitch -= dy * PLAYER.MOUSE_SENSITIVITY;
    const maxPitch = Math.PI / 2 - 0.05;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    if (this.hiding) {
      // Frozen in place — still able to look around and peek, but silent and immobile.
      this.velX = 0;
      this.velZ = 0;
      this.isSprinting = false;
      return;
    }

    const fwdInput = input.forward;
    const rightInput = input.right;
    const moving = fwdInput !== 0 || rightInput !== 0;
    const wantsSprint = input.sprint && moving && this.stamina > 0;

    if (wantsSprint) {
      this.isSprinting = true;
      this.stamina = Math.max(0, this.stamina - dt);
      this.timeSinceSprintReleased = 0;
    } else {
      this.isSprinting = false;
      this.timeSinceSprintReleased += dt;
      if (this.timeSinceSprintReleased > PLAYER.STAMINA_REGEN_DELAY) {
        this.stamina = Math.min(PLAYER.SPRINT_STAMINA_MAX, this.stamina + dt * PLAYER.STAMINA_REGEN_RATE);
      }
    }

    const speed = this.isSprinting ? PLAYER.SPRINT_SPEED : PLAYER.WALK_SPEED;

    // Movement relative to yaw (camera-forward on XZ plane).
    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);
    const forwardX = -sinY;
    const forwardZ = -cosY;
    const rightX = cosY;
    const rightZ = -sinY;

    let moveX = forwardX * fwdInput + rightX * rightInput;
    let moveZ = forwardZ * fwdInput + rightZ * rightInput;
    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    const targetVelX = moveX * speed;
    const targetVelZ = moveZ * speed;
    const accel = PLAYER.ACCEL * dt;
    this.velX += (targetVelX - this.velX) * Math.min(1, accel);
    this.velZ += (targetVelZ - this.velZ) * Math.min(1, accel);

    const nextX = this.x + this.velX * dt;
    const nextZ = this.z + this.velZ * dt;
    const resolved = resolveWallCollision(nextX, nextZ, PLAYER.RADIUS);
    const stepDist = Math.hypot(resolved.x - this.x, resolved.z - this.z);
    this.x = resolved.x;
    this.z = resolved.z;
    this.y = getFloorHeightAt(this.x, this.z);
    this.floor = getFloorAt(this.x, this.z);

    if (this.isSprinting && stepDist > 0.001) {
      noiseSystem.emit(this.x, this.z, this.floor, PLAYER.NOISE_RADIUS_SPRINT, 1, now);
    }
  }

  get eyeY() {
    return this.y + PLAYER.EYE_HEIGHT;
  }

  get staminaFraction() {
    return this.stamina / PLAYER.SPRINT_STAMINA_MAX;
  }
}
