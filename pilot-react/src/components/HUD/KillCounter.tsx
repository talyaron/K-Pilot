import React from 'react';

interface KillCounterProps {
  kills: number;
}

export const KillCounter: React.FC<KillCounterProps> = React.memo(({ kills }) => (
  <div id="kill-count">
    KILLS: <span id="kills">{kills}</span>
  </div>
));

KillCounter.displayName = 'KillCounter';
