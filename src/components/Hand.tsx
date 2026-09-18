/** A flattened palm plus a few thin finger cylinders fanned out — cheap, but reads
 * as an actual hand instead of a bare sphere/box. Shared by the player's own hands
 * and the opponent's. */
export function Hand({ mirror, skinColor }: { mirror: 1 | -1; skinColor: string }) {
  const fingerAngles = [-0.22, 0, 0.22];
  return (
    <group>
      <mesh castShadow scale={[1, 0.6, 1.1]}>
        <sphereGeometry args={[0.11, 12, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      {fingerAngles.map((angle, i) => (
        <mesh
          key={i}
          castShadow
          position={[Math.sin(angle) * 0.09 * mirror, -0.02, 0.13 + Math.cos(angle) * 0.03]}
          rotation={[1.35, 0, angle * mirror]}
        >
          <cylinderGeometry args={[0.02, 0.017, 0.16, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>
      ))}
      {/* Thumb */}
      <mesh castShadow position={[0.1 * mirror, -0.01, -0.02]} rotation={[1.1, 0, 0.9 * mirror]}>
        <cylinderGeometry args={[0.022, 0.02, 0.13, 6]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
    </group>
  );
}
