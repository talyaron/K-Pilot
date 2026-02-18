import React, { useMemo } from 'react';

interface HealthBarProps {
  health: number;
  maxHealth: number;
}

function getHealthGradient(percent: number): string {
  if (percent > 60) return 'linear-gradient(90deg, #00ff00, #00ff00)';
  if (percent > 30) return 'linear-gradient(90deg, #ffff00, #ffaa00)';
  return 'linear-gradient(90deg, #ff6600, #ff0000)';
}

export const HealthBar: React.FC<HealthBarProps> = React.memo(({ health, maxHealth }) => {
  const percent = (health / maxHealth) * 100;

  const fillStyle = useMemo(
    () => ({
      width: `${percent}%`,
      background: getHealthGradient(percent),
    }),
    [percent],
  );

  return (
    <div id="health-display">
      <div id="health-bar-container">
        <div id="health-bar-fill" style={fillStyle} />
      </div>
      <span id="health-text">{Math.ceil(health)}</span>
    </div>
  );
});

HealthBar.displayName = 'HealthBar';
