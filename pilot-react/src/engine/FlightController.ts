import * as THREE from 'three';
import type { IFlightConfig, IFlightState, IRollState } from '../types';
import type { InputManager } from './InputManager';
import {
  ROLL_SPEED,
  AUTO_BALANCE_DELAY_MS,
  STABILIZATION_SPEED,
  AUTO_BALANCE_SPEED,
} from '../constants/gameConstants';

export class FlightController {
  private flightState: IFlightState;
  private rollState: IRollState;

  constructor(private config: IFlightConfig) {
    this.flightState = {
      currentSpeed: config.baseSpeed,
      targetSpeed: config.baseSpeed,
      currentRotationVelocity: 0,
      currentPitchVelocity: 0,
      speedBoostActive: false,
      lastZKeyState: false,
      lastTurnTime: Date.now(),
      autoBalanceActive: false,
    };

    this.rollState = {
      isRolling: false,
      rollProgress: 0,
      rollTargetDirection: null,
      isStabilizing: false,
    };
  }

  get isSpeedBoosted(): boolean {
    return this.flightState.speedBoostActive;
  }

  update(airplane: THREE.Group, input: InputManager): void {
    this.handleSpeedBoost(input);
    this.updateSpeed();
    airplane.translateZ(-this.flightState.currentSpeed);
    this.handleYaw(airplane, input);
    this.handleRoll(airplane, input);
  }

  reset(): void {
    this.flightState = {
      currentSpeed: this.config.baseSpeed,
      targetSpeed: this.config.baseSpeed,
      currentRotationVelocity: 0,
      currentPitchVelocity: 0,
      speedBoostActive: false,
      lastZKeyState: false,
      lastTurnTime: Date.now(),
      autoBalanceActive: false,
    };
    this.rollState = {
      isRolling: false,
      rollProgress: 0,
      rollTargetDirection: null,
      isStabilizing: false,
    };
  }

  private handleSpeedBoost(input: InputManager): void {
    if (input.keys['KeyZ'] && !this.flightState.lastZKeyState) {
      this.flightState.speedBoostActive = !this.flightState.speedBoostActive;
    }
    this.flightState.lastZKeyState = !!input.keys['KeyZ'];
  }

  private updateSpeed(): void {
    this.flightState.targetSpeed = this.flightState.speedBoostActive
      ? this.config.boostedSpeed
      : this.config.baseSpeed;
    this.flightState.currentSpeed +=
      (this.flightState.targetSpeed - this.flightState.currentSpeed) * this.config.speedLerpFactor;
  }

  private handleYaw(airplane: THREE.Group, input: InputManager): void {
    let rotationInput = 0;
    if (input.keys['KeyA']) {
      rotationInput = 1;
      this.flightState.lastTurnTime = Date.now();
    }
    if (input.keys['KeyD']) {
      rotationInput = -1;
      this.flightState.lastTurnTime = Date.now();
    }

    this.flightState.currentRotationVelocity += rotationInput * this.config.rotationAcceleration;
    this.flightState.currentRotationVelocity *= this.config.damping;
    this.flightState.currentRotationVelocity = Math.max(
      -this.config.maxRotationSpeed,
      Math.min(this.config.maxRotationSpeed, this.flightState.currentRotationVelocity),
    );

    if (Math.abs(this.flightState.currentRotationVelocity) > 0.001) {
      airplane.rotateY(this.flightState.currentRotationVelocity);
    }
  }

  private handleRoll(airplane: THREE.Group, input: InputManager): void {
    const rollDir = input.consumeRollDirection();
    if (rollDir !== null && !this.rollState.isRolling && !this.rollState.isStabilizing) {
      this.rollState.isRolling = true;
      this.rollState.rollTargetDirection = rollDir;
      this.rollState.rollProgress = 0;
      return; // Signal to play roll sound is handled by caller checking state
    }

    if (this.rollState.isRolling) {
      this.performRoll(airplane);
    } else if (this.rollState.isStabilizing) {
      this.stabilize(airplane, STABILIZATION_SPEED);
    } else {
      this.handleAutoBalance(airplane);
      this.handlePitch(airplane, input);
    }
  }

  /** Returns true when a new roll is starting (for audio trigger). */
  checkAndStartRoll(input: InputManager): boolean {
    const rollDir = input.rollDirection;
    if (rollDir !== null && !this.rollState.isRolling && !this.rollState.isStabilizing) {
      this.rollState.isRolling = true;
      this.rollState.rollTargetDirection = rollDir;
      this.rollState.rollProgress = 0;
      input.rollDirection = null;
      return true;
    }
    return false;
  }

  updateMovement(airplane: THREE.Group, input: InputManager): boolean {
    this.handleSpeedBoost(input);
    this.updateSpeed();
    airplane.translateZ(-this.flightState.currentSpeed);
    this.handleYaw(airplane, input);

    // Roll handling
    if (this.rollState.isRolling) {
      this.performRoll(airplane);
    } else if (this.rollState.isStabilizing) {
      this.stabilize(airplane, STABILIZATION_SPEED);
    } else {
      this.handleAutoBalance(airplane);
      this.handlePitch(airplane, input);
    }

    return this.flightState.speedBoostActive;
  }

  private performRoll(airplane: THREE.Group): void {
    const rollAmount = this.rollState.rollTargetDirection === 'left' ? ROLL_SPEED : -ROLL_SPEED;
    airplane.rotateZ(rollAmount);
    this.rollState.rollProgress += ROLL_SPEED;

    if (this.rollState.rollProgress >= Math.PI * 2) {
      this.rollState.isRolling = false;
      this.rollState.isStabilizing = true;
    }
  }

  private stabilize(airplane: THREE.Group, speed: number): void {
    const currentUp = new THREE.Vector3(0, 1, 0).applyQuaternion(airplane.quaternion);
    const targetUp = new THREE.Vector3(0, 1, 0);
    const rotationAxis = new THREE.Vector3().crossVectors(currentUp, targetUp).normalize();
    const angle = Math.acos(Math.max(-1, Math.min(1, currentUp.dot(targetUp))));

    if (angle > 0.01) {
      const quat = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle * speed);
      airplane.quaternion.multiplyQuaternions(quat, airplane.quaternion);
    } else {
      this.rollState.isStabilizing = false;
      this.flightState.autoBalanceActive = false;
    }
  }

  private handleAutoBalance(airplane: THREE.Group): void {
    const timeSinceLastTurn = Date.now() - this.flightState.lastTurnTime;
    if (
      timeSinceLastTurn > AUTO_BALANCE_DELAY_MS &&
      !this.flightState.autoBalanceActive &&
      Math.abs(this.flightState.currentRotationVelocity) < 0.001
    ) {
      this.flightState.autoBalanceActive = true;
    }

    if (this.flightState.autoBalanceActive) {
      this.stabilize(airplane, AUTO_BALANCE_SPEED);
    }
  }

  private handlePitch(airplane: THREE.Group, input: InputManager): void {
    let pitchInput = 0;
    if (input.keys['KeyW']) {
      pitchInput = 1;
      this.flightState.lastTurnTime = Date.now();
      this.flightState.autoBalanceActive = false;
    }
    if (input.keys['KeyS']) {
      pitchInput = -1;
      this.flightState.lastTurnTime = Date.now();
      this.flightState.autoBalanceActive = false;
    }

    this.flightState.currentPitchVelocity += pitchInput * this.config.pitchAcceleration;
    this.flightState.currentPitchVelocity *= this.config.damping;
    this.flightState.currentPitchVelocity = Math.max(
      -this.config.maxPitchSpeed,
      Math.min(this.config.maxPitchSpeed, this.flightState.currentPitchVelocity),
    );

    if (Math.abs(this.flightState.currentPitchVelocity) > 0.0005) {
      airplane.rotateX(this.flightState.currentPitchVelocity);
    }
  }
}
