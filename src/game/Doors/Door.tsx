import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { DoorDef } from '../../types/game';
import { doorSystem } from '../../systems/DoorSystem';
import { FLOORS } from '../../constants/gameConfig';

export function Door({ door }: { door: DoorDef }) {
  const pivotRef = useRef<THREE.Group>(null);
  const baseY = door.floor === 1 ? FLOORS.FLOOR1_Y : FLOORS.FLOOR2_Y;
  const half = door.width / 2;

  useFrame(() => {
    if (!pivotRef.current) return;
    const state = doorSystem.get(door.id);
    pivotRef.current.rotation.y = door.axis === 'x' ? -state.angle : state.angle;
  });

  // Pivot at the hinge (one edge of the opening); the slab extends outward from it.
  const hingeX = door.axis === 'x' ? door.x - half : door.x;
  const hingeZ = door.axis === 'x' ? door.z : door.z - half;

  return (
    <group ref={pivotRef} position={[hingeX, baseY, hingeZ]}>
      <mesh
        position={door.axis === 'x' ? [half, FLOORS.WALL_HEIGHT / 2, 0] : [0, FLOORS.WALL_HEIGHT / 2, half]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={door.axis === 'x' ? [door.width, FLOORS.WALL_HEIGHT * 0.92, 0.12] : [0.12, FLOORS.WALL_HEIGHT * 0.92, door.width]} />
        <meshStandardMaterial color="#4a3a28" roughness={0.8} />
      </mesh>
    </group>
  );
}
