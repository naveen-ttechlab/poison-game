import type { HidingSpotDef } from '../../constants/hidingSpots';
import { hidingSpotY } from '../../constants/hidingSpots';

export function HidingSpot({ spot }: { spot: HidingSpotDef }) {
  const y = hidingSpotY(spot.floor);
  return (
    <mesh position={[spot.x, y + 0.9, spot.z]} castShadow receiveShadow>
      <boxGeometry args={[1, 1.8, 0.6]} />
      <meshStandardMaterial color="#1c160f" roughness={0.85} />
    </mesh>
  );
}
