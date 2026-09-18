import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Cup } from '../types/cup';
import type { PlayerId } from '../types/player';
import { createRoughnessNoiseTexture, createNumberTexture } from '../utils/proceduralTextures';

export type DrinkStage = 'idle' | 'shaking' | 'tilting' | 'revealed';

export interface Cup3DProps {
  cup: Cup;
  x: number;
  z: number;
  hovered: boolean;
  selected: boolean;
  targetable: boolean;
  toolTargeting: boolean;
  isDrinkingCup: boolean;
  drinkStage: DrinkStage;
  drinker: PlayerId | null;
  myRole: PlayerId;
  wasPoison: boolean;
  onHoverChange: (id: string | null) => void;
  onClick: (id: string) => void;
}

const CUP_COLOR = '#d8536e'; // lighter red, same hue family as the HP hearts
const CUP_COLOR_USED = '#5a2030';
const DEFAULT_LIQUID_COLOR = '#4fae52';
const SAFE_COLOR = '#7ad4e8';
const POISON_COLOR = '#7a1f3a';

export function Cup3D({
  cup,
  x,
  z,
  hovered,
  selected,
  targetable,
  toolTargeting,
  isDrinkingCup,
  drinkStage,
  drinker,
  myRole,
  wasPoison,
  onHoverChange,
  onClick,
}: Cup3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const shakeSeed = useRef(Math.random() * 100);
  const zOffsetRef = useRef(0);
  const roughnessNoise = useMemo(() => createRoughnessNoiseTexture(), []);
  const numberTexture = useMemo(() => createNumberTexture(cup.displayNumber), [cup.displayNumber]);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;

    let targetY = 0;
    let targetRotX = 0;
    let targetZOffset = 0;
    let jitterX = 0;
    let jitterZ = 0;
    // Once a cup has been revealed (poison or safe), it drops away and shrinks out of
    // existence — the animation that gets it there (shake/tilt/reveal) runs first,
    // while cup.isRevealed is still false, so the two never fight over the transform.
    let targetScale = hovered && targetable && !cup.isRevealed ? 1.08 : 1;

    if (isDrinkingCup && (drinkStage === 'shaking' || drinkStage === 'tilting' || drinkStage === 'revealed')) {
      if (drinkStage === 'shaking') {
        const t = state.clock.elapsedTime * 40 + shakeSeed.current;
        jitterX = Math.sin(t) * 0.035;
        jitterZ = Math.cos(t * 1.3) * 0.035;
      } else {
        // Lift the cup and tilt its rim toward whoever is actually drinking — toward
        // the camera (+Z) for whoever is viewing this screen, toward the opponent's
        // seat (-Z) for the other player — instead of always animating toward the
        // viewer regardless of drinker.
        const towardDrinker = drinker !== null && drinker !== myRole ? -1 : 1;
        targetRotX = 0.65 * towardDrinker;
        targetY = 0.32;
        targetZOffset = 0.3 * towardDrinker;
      }
    } else if (cup.isRevealed) {
      targetY = -0.4;
      targetScale = 0;
    } else if (hovered && targetable) {
      targetY = 0.1;
    }

    g.position.y += (targetY - g.position.y) * 0.2;
    g.position.x = x + jitterX;
    zOffsetRef.current += (targetZOffset - zOffsetRef.current) * 0.2;
    g.position.z = z + jitterZ + zOffsetRef.current;
    g.rotation.x += (targetRotX - g.rotation.x) * 0.15;
    g.scale.x += (targetScale - g.scale.x) * 0.2;
    g.scale.y += (targetScale - g.scale.y) * 0.2;
    g.scale.z += (targetScale - g.scale.z) * 0.2;

    if (liquidRef.current) {
      const mat = liquidRef.current.material as THREE.MeshStandardMaterial;
      const revealing = isDrinkingCup && drinkStage === 'revealed';
      mat.color.set(revealing ? (wasPoison ? POISON_COLOR : SAFE_COLOR) : DEFAULT_LIQUID_COLOR);
      mat.emissiveIntensity = revealing ? (wasPoison ? 1.1 : 0.9) : 0.12;
    }
  });

  // Hovering is communicated purely by the cup rising (see useFrame) — no color
  // change needed. While actively targeting with a tool, every eligible cup gets a
  // soft ambient glow so it's obvious which are valid picks, and the one actually
  // chosen as a pending target glows brighter still.
  const clickable = targetable && !cup.isRevealed;
  const emissiveStrength = selected ? 0.6 : toolTargeting && clickable ? 0.2 : 0;
  const cupColor = cup.isRevealed && !isDrinkingCup ? CUP_COLOR_USED : CUP_COLOR;

  return (
    <group
      ref={groupRef}
      position={[x, 0, z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (targetable && !cup.isRevealed) onHoverChange(cup.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHoverChange(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (targetable && !cup.isRevealed) onClick(cup.id);
      }}
    >
      {/* A single tapered cylinder reads as an actual disposable party cup — plastic,
          slightly translucent-looking rim, no stem/handle. */}
      <mesh position={[0, 0.21, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.165, 0.115, 0.42, 24, 1, true]} />
        <meshStandardMaterial
          color={cupColor}
          roughnessMap={roughnessNoise}
          roughness={0.32}
          metalness={0.02}
          emissive={emissiveStrength > 0 ? CUP_COLOR : '#000000'}
          emissiveIntensity={emissiveStrength}
        />
      </mesh>
      <mesh ref={liquidRef} position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 20]} />
        <meshStandardMaterial color={DEFAULT_LIQUID_COLOR} emissive={DEFAULT_LIQUID_COLOR} emissiveIntensity={0.12} roughness={0.25} />
      </mesh>
      {!cup.isRevealed && (
        <mesh position={[0, 0.21, 0.145]}>
          <planeGeometry args={[0.09, 0.09]} />
          <meshStandardMaterial map={numberTexture} transparent depthWrite={false} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}
