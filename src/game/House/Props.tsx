import { FLOORS } from '../../constants/gameConfig';

interface Prop {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  rotY?: number;
}

const Y1 = FLOORS.FLOOR1_Y;
const Y2 = FLOORS.FLOOR2_Y;

// Simple box furniture for atmosphere — not interactive, not collidable (small enough
// to not matter for a hackathon scope; the player can clip through, which is fine).
const PROPS: Prop[] = [
  // Living room: couch + table
  { pos: [10.5, Y1 + 0.4, 4.5], size: [2.4, 0.8, 0.9], color: '#3a2a2a' },
  { pos: [9, Y1 + 0.25, 3.5], size: [1, 0.5, 1], color: '#22201c' },
  // Kitchen: counter + table
  { pos: [17, Y1 + 0.5, 3], size: [1.6, 1, 5.5], color: '#25302a' },
  { pos: [14, Y1 + 0.35, 4.5], size: [1.4, 0.7, 1.4], color: '#2a241c' },
  // Bedroom 1: bed
  { pos: [8, Y1 + 0.3, 12.5], size: [2, 0.6, 3], color: '#2a2233' },
  // Bedroom 2: bed
  { pos: [16, Y1 + 0.3, 12.5], size: [2, 0.6, 3], color: '#332222' },
  // Entrance: small table
  { pos: [2, Y1 + 0.35, 6], size: [1, 0.7, 0.6], color: '#221f1c' },
  // Bedroom 3: bed
  { pos: [30, Y2 + 0.3, 2.5], size: [2, 0.6, 3], color: '#2a2233' },
  // Bedroom 4: bed
  { pos: [38, Y2 + 0.3, 2.5], size: [2, 0.6, 3], color: '#332222' },
  // Storage room: shelves
  { pos: [29, Y2 + 0.7, 10], size: [0.5, 1.8, 3], color: '#1c1a15' },
  { pos: [31, Y2 + 0.7, 12], size: [2, 1.8, 0.5], color: '#1c1a15' },
  // Ritual room: altar
  { pos: [36, Y2 + 0.45, 13], size: [2, 0.9, 1.2], color: '#3a1414' },
];

export function Props() {
  return (
    <group>
      {PROPS.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[0, p.rotY ?? 0, 0]} castShadow receiveShadow>
          <boxGeometry args={p.size} />
          <meshStandardMaterial color={p.color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
