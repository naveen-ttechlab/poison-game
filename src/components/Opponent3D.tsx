import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createFabricTexture } from '../utils/proceduralTextures';
import { Hand } from './Hand';

const ROBE_COLOR = '#2e2438';
const HOOD_COLOR = '#1c1622';
const TRIM_COLOR = '#8a6a2a';
const SKIN_COLOR = '#7a5c42';

export interface Opponent3DProps {
  isThinking: boolean;
  isSpeaking: boolean;
  isDrinking: boolean;
}

/** A low-poly hooded figure seated across the table — human-shaped (shoulders,
 * neck, head, arms with hands) rather than a faceless cone, but still deliberately
 * shadowed with only the eyes standing out. Reacts when it drinks (head tips back)
 * and occasionally snaps its head with a quick, unnatural twitch — cheap animation,
 * disproportionately creepy. ~11 primitives total. */
export function Opponent3D({ isThinking, isSpeaking, isDrinking }: Opponent3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);
  const robeFabric = useMemo(() => createFabricTexture(ROBE_COLOR), []);
  const hoodFabric = useMemo(() => createFabricTexture(HOOD_COLOR), []);
  const twitch = useRef({ timer: 2 + Math.random() * 3, rotY: 0 });

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      const breathe = 1 + Math.sin(t * 1.1) * 0.012;
      groupRef.current.scale.set(1, breathe, 1);
    }

    // Head: tips back when drinking, and every few seconds snaps into an
    // unnatural sideways twitch that holds a moment before easing off.
    if (headGroupRef.current) {
      twitch.current.timer -= delta;
      if (twitch.current.timer <= 0) {
        twitch.current.rotY = (Math.random() - 0.5) * 0.32;
        twitch.current.timer = 3.5 + Math.random() * 4;
      }
      const targetRotX = isDrinking ? -0.45 : 0;
      headGroupRef.current.rotation.x += (targetRotX - headGroupRef.current.rotation.x) * 0.14;
      headGroupRef.current.rotation.y += (twitch.current.rotY - headGroupRef.current.rotation.y) * 0.25;
    }

    const pulseSpeed = isThinking ? 6 : 1.6;
    const base = isThinking ? 0.85 : 0.35;
    const swing = isThinking ? 0.35 : 0.15;
    const glow = base + Math.sin(t * pulseSpeed) * swing + (isSpeaking ? 0.5 : 0);
    for (const ref of [eyeLRef, eyeRRef]) {
      const mat = ref.current?.material as THREE.MeshStandardMaterial | undefined;
      if (mat) mat.emissiveIntensity = Math.max(0.15, glow);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -1.9]}>
      {/* Robe: seated lower body */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <coneGeometry args={[0.56, 0.9, 12]} />
        <meshStandardMaterial map={robeFabric} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.06, 0]} castShadow>
        <torusGeometry args={[0.5, 0.03, 8, 32]} />
        <meshStandardMaterial color={TRIM_COLOR} roughness={0.3} metalness={0.65} />
      </mesh>

      {/* Torso/shoulders — gives the silhouette an actual human upper body instead
          of the robe just tapering straight to a head. Bottom cap blends the hard
          cylinder edge into the robe instead of reading as a mechanical, flat-edged
          chassis; the top is left bare (no collar ring) so the head sits directly
          on the shoulders. */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.3, 0.5, 16]} />
        <meshStandardMaterial map={robeFabric} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.82, 0]} scale={[1, 0.4, 1]} castShadow>
        <sphereGeometry args={[0.35, 16, 12]} />
        <meshStandardMaterial map={robeFabric} roughness={0.65} />
      </mesh>

      {/* Arms resting toward the table edge, with hands at the ends. */}
      <mesh position={[-0.42, 0.62, 0.5]} rotation={[0.85, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.075, 0.065, 0.8, 12]} />
        <meshStandardMaterial map={robeFabric} roughness={0.65} />
      </mesh>
      <group position={[-0.56, 0.32, 0.9]} rotation={[0.5, 0, 0.3]}>
        <Hand mirror={-1} skinColor={SKIN_COLOR} />
      </group>
      <mesh position={[0.42, 0.62, 0.5]} rotation={[0.85, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.075, 0.065, 0.8, 12]} />
        <meshStandardMaterial map={robeFabric} roughness={0.65} />
      </mesh>
      <group position={[0.56, 0.32, 0.9]} rotation={[0.5, 0, -0.3]}>
        <Hand mirror={1} skinColor={SKIN_COLOR} />
      </group>

      {/* Neck — a normal, slender column between the shoulders and head instead of
          the head sitting flush on the torso. */}
      <mesh position={[0, 1.37, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 0.14, 12]} />
        <meshStandardMaterial map={robeFabric} roughness={0.65} />
      </mesh>

      {/* Head group — pivots independently for the drink-tilt and twitch. */}
      <group ref={headGroupRef} position={[0, 1.55, 0]}>
        <mesh position={[0, 0.1, 0]} scale={[1, 1.05, 0.94]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial map={hoodFabric} roughness={0.8} />
        </mesh>
        {/* Hood overhang — dark shadow across the upper face, keeping it faceless. */}
        <mesh position={[0, 0.22, -0.05]} castShadow>
          <sphereGeometry args={[0.27, 16, 16]} />
          <meshStandardMaterial map={hoodFabric} roughness={0.85} />
        </mesh>
        <mesh ref={eyeLRef} position={[-0.075, 0.11, 0.17]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color="#b8264a" emissive="#b8264a" emissiveIntensity={0.4} />
        </mesh>
        <mesh ref={eyeRRef} position={[0.075, 0.11, 0.17]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color="#b8264a" emissive="#b8264a" emissiveIntensity={0.4} />
        </mesh>
        {/* Creepy grin — a thin pale arc low on the face, just wide enough to read
            as an unnatural, too-wide smile rather than a neutral mouth line. */}
        <mesh position={[0, 0.01, 0.175]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.085, 0.011, 8, 16, Math.PI * 0.85]} />
          <meshStandardMaterial color="#e8ded0" emissive="#e8ded0" emissiveIntensity={0.12} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}
