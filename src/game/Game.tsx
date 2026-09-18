import { useRef } from 'react';
import { PlayerController } from './Player/PlayerController';
import { PlayerRig } from './Player/PlayerRig';
import { MonsterAI } from './AI/MonsterAI';
import { Monster } from './Monster/Monster';
import { House } from './House/House';
import { Props } from './House/Props';
import { Door } from './Doors/Door';
import { Item } from './Items/Item';
import { HidingSpot } from './House/HidingSpot';
import { GameLoop } from './GameLoop';
import { DOORS } from '../constants/houseLayout';
import { ITEMS } from '../constants/items';
import { HIDING_SPOTS } from '../constants/hidingSpots';
import { ATMOSPHERE, DAY_MODE } from '../constants/gameConfig';
import { useAppState } from '../systems/GameState';
import { GameStage } from '../types/game';

export function Game() {
  const playerRef = useRef<PlayerController>();
  if (!playerRef.current) playerRef.current = new PlayerController();
  const monsterRef = useRef<MonsterAI>();
  if (!monsterRef.current) monsterRef.current = new MonsterAI();
  const flashlightOnRef = useRef(true);
  const shakeRef = useRef({ magnitude: 0 });

  const monsterDead = useAppState((s) => s.monsterDead);
  const stage = useAppState((s) => s.stage);

  return (
    <>
      <color attach="background" args={[ATMOSPHERE.FOG_COLOR]} />
      <fog attach="fog" args={[ATMOSPHERE.FOG_COLOR, ATMOSPHERE.FOG_NEAR, ATMOSPHERE.FOG_FAR]} />
      {DAY_MODE ? (
        <>
          <ambientLight intensity={0.9} />
          <hemisphereLight args={['#ffffff', '#b8b0a0', 0.9]} />
          <directionalLight position={[20, 30, 10]} intensity={1.4} />
        </>
      ) : (
        <>
          <ambientLight intensity={0.38} />
          <hemisphereLight args={['#3a3a4a', '#141210', 0.5]} />
        </>
      )}

      <House />
      <Props />
      {DOORS.map((d) => (
        <Door key={d.id} door={d} />
      ))}
      {ITEMS.map((item) => (
        <Item key={item.id} item={item} />
      ))}
      {HIDING_SPOTS.map((spot) => (
        <HidingSpot key={spot.id} spot={spot} />
      ))}
      {!monsterDead && stage !== GameStage.VICTORY && <Monster ai={monsterRef.current} />}

      <PlayerRig player={playerRef.current} flashlightOnRef={flashlightOnRef} shakeRef={shakeRef} />
      <GameLoop
        player={playerRef.current}
        monster={monsterRef.current}
        flashlightOnRef={flashlightOnRef}
        shakeRef={shakeRef}
      />
    </>
  );
}
