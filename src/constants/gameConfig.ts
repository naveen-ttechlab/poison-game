// Central tunable constants for the whole game. Keep every "magic number" here.

export const PLAYER = {
  WALK_SPEED: 3, // units/sec
  SPRINT_SPEED: 5, // units/sec
  ACCEL: 30, // how fast velocity approaches target speed
  EYE_HEIGHT: 1.7,
  RADIUS: 0.35, // collision capsule radius
  SPRINT_STAMINA_MAX: 6, // seconds of sprint
  STAMINA_REGEN_RATE: 1.4, // stamina units/sec regen while not sprinting
  STAMINA_REGEN_DELAY: 1.2, // seconds after releasing sprint before regen starts
  INTERACT_DISTANCE: 2.5,
  MOUSE_SENSITIVITY: 0.0022,
  NOISE_RADIUS_WALK: 0, // walking is silent enough to ignore
  NOISE_RADIUS_SPRINT: 9,
  NOISE_RADIUS_DOOR: 12,
  NOISE_RADIUS_PICKUP: 7,
  ATTACK_DISTANCE: 2.2,
};

export const MONSTER = {
  PATROL_SPEED: 2.5,
  SEARCH_SPEED: 3,
  CHASE_SPEED_BASE: 4.0,
  CHASE_SPEED_MAX: 4.3, // reached at max difficulty/aggression
  SEARCH_DURATION_MIN: 5,
  SEARCH_DURATION_MAX: 8,
  SIGHT_RANGE_BASE: 11,
  SIGHT_FOV_DEG: 100,
  HEARING_RANGE_BASE: 10,
  CLOSE_DETECT_RANGE: 2.2, // can always sense the player at this range regardless of LOS/FOV
  WAYPOINT_ARRIVE_DIST: 0.6,
  LOSE_INTEREST_CHASE_TIME: 14, // safety cap so chase can't run forever without progress
  BODY_RADIUS: 0.45,
};

// Difficulty scales 0..4 based on number of cursed objects collected (0 = none, 4 = all 5 collected)
export const DIFFICULTY_CURVE = [
  { patrolBias: 1.0, searchChance: 0.25, speedMul: 1.0, noiseSensitivity: 1.0, sightMul: 1.0 },
  { patrolBias: 0.85, searchChance: 0.45, speedMul: 1.0, noiseSensitivity: 1.1, sightMul: 1.05 },
  { patrolBias: 0.7, searchChance: 0.6, speedMul: 1.08, noiseSensitivity: 1.25, sightMul: 1.1 },
  { patrolBias: 0.55, searchChance: 0.75, speedMul: 1.12, noiseSensitivity: 1.5, sightMul: 1.2 },
  { patrolBias: 0.35, searchChance: 0.9, speedMul: 1.18, noiseSensitivity: 1.8, sightMul: 1.35 },
];

export const FLOORS = {
  FLOOR1_Y: 0,
  FLOOR2_Y: 3.3,
  WALL_HEIGHT: 3,
  SLAB_THICKNESS: 0.2,
};

// TEMP: bright "daytime" placeholder values for gameplay iteration — the dark
// horror atmosphere (fog-in, low ambient, flashlight-only visibility) will come
// back once the core loop is playtested. See DAY_MODE below for the toggle.
export const DAY_MODE = true;

export const ATMOSPHERE = {
  FOG_COLOR: DAY_MODE ? 0xcfd8e3 : 0x0a0a12,
  FOG_NEAR: DAY_MODE ? 40 : 5,
  FOG_FAR: DAY_MODE ? 90 : 28,
  FLASHLIGHT_DISTANCE: 14,
  FLASHLIGHT_ANGLE: Math.PI / 6.2,
  FLASHLIGHT_INTENSITY: DAY_MODE ? 0.6 : 2.0,
  HEARTBEAT_TRIGGER_DIST: 8,
  FLICKER_CHANCE_PER_SEC: DAY_MODE ? 0 : 0.05,
};
