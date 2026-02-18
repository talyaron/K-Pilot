import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import type { IGameState } from '../types';
import { PLAYER_MAX_HEALTH } from '../constants/gameConstants';

const INITIAL_STATE: IGameState = {
  health: PLAYER_MAX_HEALTH,
  maxHealth: PLAYER_MAX_HEALTH,
  kills: 0,
  isDead: false,
};

export function useGameEngine(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [gameState, setGameState] = useState<IGameState>(INITIAL_STATE);
  const engineRef = useRef<GameEngine | null>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const setRadarCanvas = useCallback((canvas: HTMLCanvasElement) => {
    radarCanvasRef.current = canvas;
    engineRef.current?.setRadarCanvas(canvas);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = new GameEngine(container, {
      onStateChange: setGameState,
    });
    engineRef.current = engine;

    if (radarCanvasRef.current) {
      engine.setRadarCanvas(radarCanvasRef.current);
    }

    engine.init();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [containerRef]);

  return { gameState, setRadarCanvas };
}
