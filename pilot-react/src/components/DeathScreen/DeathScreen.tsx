import React from 'react';
import './DeathScreen.css';

interface DeathScreenProps {
  visible: boolean;
}

export const DeathScreen: React.FC<DeathScreenProps> = React.memo(({ visible }) => (
  <div id="death-screen" className={visible ? 'show' : ''}>
    <h1>YOU DIED</h1>
    <p>Respawning...</p>
  </div>
));

DeathScreen.displayName = 'DeathScreen';
