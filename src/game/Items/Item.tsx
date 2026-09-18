import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { ItemDef } from '../../types/game';
import { useAppState } from '../../systems/GameState';

export function Item({ item }: { item: ItemDef }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const collected = useAppState((s) => s.inventory.includes(item.id));

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.9;
    meshRef.current.position.y = item.y + Math.sin(state.clock.elapsedTime * 1.6) * 0.08;
  });

  if (collected) return null;

  return (
    <group>
      <pointLight position={[item.x, item.y + 0.4, item.z]} color={item.color} intensity={2.5} distance={3.5} />
      <mesh ref={meshRef} position={[item.x, item.y, item.z]} castShadow>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}
