import React from 'react';
import { Game } from './components/Game/Game';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';

export const App: React.FC = () => (
  <ErrorBoundary>
    <Game />
  </ErrorBoundary>
);
