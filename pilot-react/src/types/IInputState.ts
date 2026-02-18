import type { RollDirection } from './IRollState';

export interface IInputState {
  keys: Record<string, boolean>;
  rollDirection: RollDirection | null;
}
