import React, { useRef } from 'react';
import { useGameEngine } from '../../hooks/useGameEngine';
import { ThreeCanvas } from '../ThreeCanvas/ThreeCanvas';
import { HUD } from '../HUD/HUD';
import { Radar } from '../Radar/Radar';
import { DeathScreen } from '../DeathScreen/DeathScreen';
import './Game.css';

export const Game: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { gameState, setRadarCanvas } = useGameEngine(containerRef);

  return (
    <div id="game-root">
      <ThreeCanvas containerRef={containerRef} />
      <HUD gameState={gameState} />
      <Radar onCanvasReady={setRadarCanvas} />
      <DeathScreen visible={gameState.isDead} />
    </div>
  );
};
