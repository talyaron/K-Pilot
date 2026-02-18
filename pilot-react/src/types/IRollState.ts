export type RollDirection = 'left' | 'right';

export interface IRollState {
  isRolling: boolean;
  rollProgress: number;
  rollTargetDirection: RollDirection | null;
  isStabilizing: boolean;
}
