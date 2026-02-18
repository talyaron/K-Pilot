import type { IGameState } from './IGameState';

export interface IGameCallbacks {
  onStateChange: (state: IGameState) => void;
}
