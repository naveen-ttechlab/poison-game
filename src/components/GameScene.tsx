import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';
import { Table3D } from './Table3D';
import { Cup3D, type DrinkStage } from './Cup3D';
import { Opponent3D } from './Opponent3D';
import { HangingLamp } from './HangingLamp';
import { audioManager } from '../audio/audioManager';

/** Cups sit in a tight cluster toward the player's side of the table (not spread to
 * the rim) — two packed rows of three, leaving most of the polished tabletop bare
 * and reflective, the way a small handful of cups actually sits on a real table. */
function cupPosition(positionIndex: number): [number, number] {
  const row = Math.floor(positionIndex / 3); // 0 = back row (toward opponent), 1 = front row (toward player)
  const col = positionIndex % 3;
  const x = (col - 1) * 0.4;
  const z = row === 0 ? -0.16 : 0.42;
  return [x, z];
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 1.7, 3.3);
const DEFAULT_LOOK_TARGET = new THREE.Vector3(0, 0.55, -0.9);

function CameraRig({ drinkTarget }: { drinkTarget: [number, number] | null }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.copy(DEFAULT_CAMERA_POS);
    camera.lookAt(DEFAULT_LOOK_TARGET);
  }, [camera]);

  useFrame(() => {
    const target = drinkTarget
      ? new THREE.Vector3(drinkTarget[0] * 0.6, 1.15, drinkTarget[1] * 0.6 + 2.1)
      : DEFAULT_CAMERA_POS;
    camera.position.lerp(target, 0.04);
    const look = drinkTarget ? new THREE.Vector3(drinkTarget[0] * 0.5, 0.25, drinkTarget[1] * 0.5) : DEFAULT_LOOK_TARGET;
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    const desiredDir = look.clone().sub(camera.position).normalize();
    const newDir = currentLook.lerp(desiredDir, 0.06);
    camera.lookAt(camera.position.clone().add(newDir));
  });

  return null;
}

interface RevealMomentInfo {
  wasPoison: boolean;
  hitsPlayer: boolean;
  survivedByAntidote: boolean;
  drinker: 'player' | 'ai' | null;
}

interface SceneContentProps {
  onRevealMoment: (info: RevealMomentInfo) => void;
}

function SceneContent({ onRevealMoment }: SceneContentProps) {
  const { state, dispatch } = useGame();
  const [hoveredCupId, setHoveredCupId] = useState<string | null>(null);
  const [drinkStage, setDrinkStage] = useState<DrinkStage>('idle');
  const timers = useRef<number[]>([]);

  const isDrinking = state.phase === 'drinking';
  const drinkingCupId = state.lastDrinkResult?.cupId ?? null;
  const wasPoison = state.lastDrinkResult?.wasPoison ?? false;
  const drinker = state.lastDrinkResult?.drinker ?? null;

  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (!isDrinking) {
      setDrinkStage('idle');
      return;
    }

    setDrinkStage('shaking');
    audioManager.suspense();
    timers.current.push(
      window.setTimeout(() => setDrinkStage('tilting'), 700),
      window.setTimeout(() => {
        setDrinkStage('revealed');
        // Screen shake/vignette are the player's own physical reaction — only
        // fire them when the player is the one who actually drank the poison
        // (and it wasn't blocked by an antidote), not whenever poison shows up
        // anywhere in the game.
        const survivedByAntidote = state.lastDrinkResult?.survivedByAntidote ?? false;
        const hitsPlayer = wasPoison && drinker === 'player' && !survivedByAntidote;
        onRevealMoment({ wasPoison, hitsPlayer, survivedByAntidote, drinker });
        if (wasPoison) audioManager.poison();
        else audioManager.safe();
      }, 1400),
      window.setTimeout(() => {
        dispatch({ kind: 'drink_animation_done' });
      }, 2500),
    );

    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrinking]);

  const targetableCupIds = new Set<string>();
  if (state.phase === 'awaiting_action') {
    for (const cup of state.cups) if (!cup.isRevealed) targetableCupIds.add(cup.id);
  } else if (state.phase === 'awaiting_targets') {
    for (const cup of state.cups) {
      if (!cup.isRevealed && !state.pendingTargets.includes(cup.id)) targetableCupIds.add(cup.id);
    }
  }
  const canInteract = state.currentPlayer === 'player' && (state.phase === 'awaiting_action' || state.phase === 'awaiting_targets');

  const handleClick = (cupId: string) => {
    if (!canInteract) return;
    audioManager.cupSelect();
    if (state.phase === 'awaiting_action') {
      dispatch({ kind: 'select_drink_cup', player: 'player', cupId });
    } else {
      dispatch({ kind: 'target_cup', player: 'player', cupId });
    }
  };

  const drinkTarget: [number, number] | null = drinkingCupId
    ? cupPosition(state.cups.find((c) => c.id === drinkingCupId)?.positionIndex ?? 0)
    : null;

  return (
    <>
      <CameraRig drinkTarget={drinkTarget} />
      {/* The hanging bulb is the primary light — everything else is a faint fill so
          the room reads as "one lamp over a small table", not evenly lit. */}
      <ambientLight intensity={0.22} />
      <directionalLight position={[3, 6, 4]} intensity={0.22} />
      <HangingLamp position={[0, 1.9, 0.2]} />
      {/* Dedicated fill light on the opponent so it reads as a figure, not a
          silhouette lost in the fog. */}
      <pointLight position={[0, 2.0, -0.95]} intensity={1.3} color="#e8d9b8" distance={6.5} decay={2} />
      <pointLight position={[0.5, 1.1, -1.75]} intensity={0.5} color="#6a3a6a" distance={3.5} />
      {/* Fill light on the player's own hands — otherwise the nearest thing to the
          camera sits right at the edge of the lamp's falloff and reads as a flat
          dark silhouette instead of an actual lit shape. */}
      <pointLight position={[0, 1.3, 1.8]} intensity={0.7} color="#c9a878" distance={3.5} decay={2} />

      {/* Cheap, fully procedural environment (baked once, no HDRI download) — gives
          the metal/plastic/brass bits believable soft reflections instead of the
          flat look plain point lights alone produce. */}
      <Environment resolution={32} frames={1}>
        <Lightformer intensity={3} color="#ffcf8a" position={[0, 3, 0.3]} scale={[2.2, 2.2, 1]} form="ring" />
        <Lightformer intensity={0.5} color="#4a3560" position={[-3, 1.2, 2]} scale={[3, 4, 1]} />
        <Lightformer intensity={0.35} color="#181420" position={[3, 1, -2]} scale={[3, 4, 1]} />
      </Environment>

      <Table3D />
      <Opponent3D
        isThinking={state.currentPlayer === 'ai' && state.phase !== 'drinking'}
        isSpeaking={Boolean(state.aiDialogue)}
        isDrinking={drinker === 'ai' && (drinkStage === 'tilting' || drinkStage === 'revealed')}
      />
      {state.cups.map((cup) => {
        const [x, z] = cupPosition(cup.positionIndex);
        return (
          <Cup3D
            key={cup.id}
            cup={cup}
            x={x}
            z={z}
            hovered={hoveredCupId === cup.id}
            selected={state.pendingTargets.includes(cup.id) || state.pendingDrinkCupId === cup.id}
            targetable={canInteract && targetableCupIds.has(cup.id)}
            toolTargeting={state.phase === 'awaiting_targets'}
            isDrinkingCup={cup.id === drinkingCupId}
            drinkStage={cup.id === drinkingCupId ? drinkStage : 'idle'}
            drinker={drinker}
            wasPoison={wasPoison}
            onHoverChange={setHoveredCupId}
            onClick={handleClick}
          />
        );
      })}
    </>
  );
}

export function GameScene({ onRevealMoment }: SceneContentProps) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.5]}
      camera={{ fov: 45, near: 0.1, far: 30 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
    >
      <color attach="background" args={['#0c0a10']} />
      <fog attach="fog" args={['#0c0a10', 6, 13]} />
      <SceneContent onRevealMoment={onRevealMoment} />
    </Canvas>
  );
}
