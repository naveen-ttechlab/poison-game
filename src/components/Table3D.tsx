import { useMemo } from 'react';
import { createWoodGrainTexture } from '../utils/proceduralTextures';

export const TABLE_RADIUS = 1.5;

/** Round wooden pedestal table — cylinders only, still cheap, but reads as an actual
 * table instead of a floating slab: a polished top with a procedural wood-grain
 * texture, an apron underneath, a turned central leg, and a round foot. */
export function Table3D() {
  const topGrain = useMemo(() => createWoodGrainTexture('#4a2f1d'), []);
  const apronGrain = useMemo(() => createWoodGrainTexture('#2c1c11'), []);

  return (
    <group>
      {/* Tabletop */}
      <mesh position={[0, -0.02, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[TABLE_RADIUS, TABLE_RADIUS, 0.14, 48]} />
        <meshStandardMaterial map={topGrain} roughness={0.3} metalness={0.08} />
      </mesh>
      {/* Apron (the darker underside skirt of the tabletop) */}
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <cylinderGeometry args={[TABLE_RADIUS - 0.08, TABLE_RADIUS - 0.14, 0.3, 48]} />
        <meshStandardMaterial map={apronGrain} roughness={0.6} />
      </mesh>
      {/* Turned central leg */}
      <mesh position={[0, -0.9, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1.15, 16]} />
        <meshStandardMaterial color="#241609" roughness={0.55} />
      </mesh>
      {/* Round foot */}
      <mesh position={[0, -1.48, 0]} receiveShadow>
        <cylinderGeometry args={[0.85, 0.95, 0.08, 32]} />
        <meshStandardMaterial color="#1c1108" roughness={0.7} />
      </mesh>
    </group>
  );
}
