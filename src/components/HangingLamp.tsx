import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** A single wide pendant shade hanging low over the table — the room's main (and
 * moodiest) light source: everything else is dark, this is the pool of light the
 * cups sit in. */
export function HangingLamp({ position = [0, 1.9, 0.2] }: { position?: [number, number, number] }) {
  const bulbRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mat = bulbRef.current?.material as THREE.MeshStandardMaterial | undefined;
    if (mat) {
      // Faint, slow flicker — a lamp that's seen better days.
      mat.emissiveIntensity = 1.7 + Math.sin(state.clock.elapsedTime * 3.1) * 0.08;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 3.2, 6]} />
        <meshStandardMaterial color="#0a0806" roughness={0.9} />
      </mesh>
      {/* Wide shallow shade — metal, slightly worn. Default cone orientation already
          puts the narrow point up (toward the cord) and the wide mouth down (open,
          facing the bulb and the table) — no extra rotation needed. */}
      <mesh position={[0, 0.02, 0]}>
        <coneGeometry args={[0.52, 0.16, 28, 1, true]} />
        <meshStandardMaterial color="#2a241a" roughness={0.5} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.08, 16]} />
        <meshStandardMaterial color="#1c1712" roughness={0.6} />
      </mesh>
      <mesh ref={bulbRef} position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color="#fff2c8" emissive="#ffcf7a" emissiveIntensity={1.7} roughness={0.4} />
      </mesh>
      <pointLight
        position={[0, -0.1, 0]}
        intensity={8}
        color="#ffcf8a"
        distance={9}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0015}
        shadow-radius={4}
      />
    </group>
  );
}
