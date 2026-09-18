import { useMemo } from 'react';
import { ROOMS, WALLS, RAMP } from '../../constants/houseLayout';
import { FLOORS, DAY_MODE } from '../../constants/gameConfig';

const WALL_COLOR = DAY_MODE ? '#d8cfba' : '#4d473c';
const FLOOR_COLOR = DAY_MODE ? '#a9967a' : '#231f1a';
const CEIL_COLOR = DAY_MODE ? '#efe9dd' : '#1a1815';

function Wall({ wall }: { wall: (typeof WALLS)[number] }) {
  const length = Math.hypot(wall.x2 - wall.x1, wall.z2 - wall.z1);
  const cx = (wall.x1 + wall.x2) / 2;
  const cz = (wall.z1 + wall.z2) / 2;
  const angle = Math.atan2(wall.z2 - wall.z1, wall.x2 - wall.x1);
  return (
    <mesh position={[cx, wall.baseY + wall.height / 2, cz]} rotation={[0, -angle, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, wall.height, 0.25]} />
      <meshStandardMaterial color={WALL_COLOR} roughness={0.95} />
    </mesh>
  );
}

function RoomFloorAndCeiling({ room }: { room: (typeof ROOMS)[number] }) {
  const w = room.x2 - room.x1;
  const d = room.z2 - room.z1;
  const cx = (room.x1 + room.x2) / 2;
  const cz = (room.z1 + room.z2) / 2;
  const baseY = room.floor === 1 ? FLOORS.FLOOR1_Y : FLOORS.FLOOR2_Y;
  const skipCeiling = room.id === 'stairFoot';
  return (
    <group>
      <mesh position={[cx, baseY - FLOORS.SLAB_THICKNESS / 2, cz]} receiveShadow>
        <boxGeometry args={[w, FLOORS.SLAB_THICKNESS, d]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={1} />
      </mesh>
      {!skipCeiling && (
        <mesh position={[cx, baseY + FLOORS.WALL_HEIGHT + FLOORS.SLAB_THICKNESS / 2, cz]} receiveShadow>
          <boxGeometry args={[w, FLOORS.SLAB_THICKNESS, d]} />
          <meshStandardMaterial color={CEIL_COLOR} roughness={1} />
        </mesh>
      )}
    </group>
  );
}

function Ramp() {
  const steps = 14;
  const meshes = useMemo(() => {
    const arr: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const x = RAMP.x1 + (RAMP.x2 - RAMP.x1) * t;
      const y = RAMP.yBottom + (RAMP.yTop - RAMP.yBottom) * t;
      arr.push({ x, y, z: (RAMP.z1 + RAMP.z2) / 2 });
    }
    return arr;
  }, []);
  const stepDepth = (RAMP.x2 - RAMP.x1) / steps;
  const stepRise = (RAMP.yTop - RAMP.yBottom) / steps;
  return (
    <group>
      {meshes.map((m, i) => (
        <mesh key={i} position={[m.x, m.y - stepRise / 2, m.z]} receiveShadow castShadow>
          <boxGeometry args={[stepDepth + 0.02, stepRise + 0.05, RAMP.z2 - RAMP.z1]} />
          <meshStandardMaterial color="#2a2620" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function House() {
  return (
    <group>
      {ROOMS.map((room) => (
        <RoomFloorAndCeiling key={room.id} room={room} />
      ))}
      {WALLS.map((wall) => (
        <Wall key={wall.id} wall={wall} />
      ))}
      <Ramp />
    </group>
  );
}

