import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { MonsterAI } from '../AI/MonsterAI';
import { MonsterState } from '../../types/game';

export function Monster({ ai }: { ai: MonsterAI }) {
  const groupRef = useRef<THREE.Group>(null);
  const eyeLightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(ai.x, ai.y, ai.z);
    groupRef.current.rotation.y = ai.yaw;
    if (eyeLightRef.current) {
      eyeLightRef.current.color.set(ai.state === MonsterState.CHASE ? '#ff2222' : '#992222');
      eyeLightRef.current.intensity = ai.state === MonsterState.CHASE ? 3.5 : 1.2;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.4, 1.3, 4, 8]} />
        <meshStandardMaterial color="#0c0a0a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#0a0808" roughness={0.9} />
      </mesh>
      <pointLight ref={eyeLightRef} position={[0, 1.8, 0.25]} distance={4} intensity={1.2} color="#992222" />
    </group>
  );
}
