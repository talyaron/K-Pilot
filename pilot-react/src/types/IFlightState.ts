export interface IFlightState {
  currentSpeed: number;
  targetSpeed: number;
  currentRotationVelocity: number;
  currentPitchVelocity: number;
  speedBoostActive: boolean;
  lastZKeyState: boolean;
  lastTurnTime: number;
  autoBalanceActive: boolean;
}
