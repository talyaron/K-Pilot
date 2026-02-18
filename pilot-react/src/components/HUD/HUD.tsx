import React from 'react';
import { KillCounter } from './KillCounter';
import { HealthBar } from './HealthBar';
import type { IGameState } from '../../types';
import './HUD.css';

interface HUDProps {
  gameState: IGameState;
}

export const HUD: React.FC<HUDProps> = React.memo(({ gameState }) => (
  <div id="hud">
    <KillCounter kills={gameState.kills} />
    <HealthBar health={gameState.health} maxHealth={gameState.maxHealth} />
  </div>
));

HUD.displayName = 'HUD';
