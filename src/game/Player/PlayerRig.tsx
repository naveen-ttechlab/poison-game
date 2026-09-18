import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlayerController } from './PlayerController';
import { ATMOSPHERE } from '../../constants/gameConfig';

export function PlayerRig({
  player,
  flashlightOnRef,
  shakeRef,
}: {
  player: PlayerController;
  flashlightOnRef: MutableRefObject<boolean>;
  shakeRef: MutableRefObject<{ magnitude: number }>;
}) {
  const { camera } = useThree();
  const flashlightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  const flickerGain = useRef(1);
  const flickerTimer = useRef(0);
  const dirVec = useRef(new THREE.Vector3());

  useEffect(() => {
    if (flashlightRef.current && targetRef.current) {
      flashlightRef.current.target = targetRef.current;
    }
  }, []);

  useFrame((_state, dt) => {
    const shake = shakeRef.current.magnitude;
    const shakeX = shake > 0.02 ? (Math.random() - 0.5) * 0.06 * shake : 0;
    const shakeY = shake > 0.02 ? (Math.random() - 0.5) * 0.04 * shake : 0;
    camera.position.set(player.x + shakeX, player.eyeY + shakeY, player.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw + (shake > 0.02 ? (Math.random() - 0.5) * 0.02 * shake : 0);
    camera.rotation.x = player.pitch;

    if (flashlightRef.current && targetRef.current) {
      dirVec.current.set(0, 0, -1).applyEuler(camera.rotation);
      targetRef.current.position.set(
        camera.position.x + dirVec.current.x,
        camera.position.y + dirVec.current.y,
        camera.position.z + dirVec.current.z,
      );
      flashlightRef.current.position.copy(camera.position);
      flashlightRef.current.visible = flashlightOnRef.current ?? true;

      flickerTimer.current -= dt;
      if (flickerTimer.current <= 0 && Math.random() < ATMOSPHERE.FLICKER_CHANCE_PER_SEC) {
        flickerGain.current = 0.25 + Math.random() * 0.3;
        flickerTimer.current = 0.05 + Math.random() * 0.12;
      } else if (flickerTimer.current <= 0) {
        flickerGain.current = 1;
      }
      flashlightRef.current.intensity = ATMOSPHERE.FLASHLIGHT_INTENSITY * flickerGain.current;
    }
  });

  return (
    <>
      <spotLight
        ref={flashlightRef}
        color="#fff4d6"
        angle={ATMOSPHERE.FLASHLIGHT_ANGLE}
        penumbra={0.5}
        distance={ATMOSPHERE.FLASHLIGHT_DISTANCE}
        intensity={ATMOSPHERE.FLASHLIGHT_INTENSITY}
        castShadow
      />
      <object3D ref={targetRef} />
    </>
  );
}
