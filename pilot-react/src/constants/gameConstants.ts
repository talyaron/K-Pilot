import type { IFlightConfig } from '../types';

export const FLIGHT_CONFIG: IFlightConfig = {
  baseSpeed: 0.1,
  boostedSpeed: 0.35,
  rotationAcceleration: 0.0008,
  maxRotationSpeed: 0.025,
  pitchAcceleration: 0.0003,
  maxPitchSpeed: 0.015,
  damping: 0.92,
  speedLerpFactor: 0.1,
};

export const PLAYER_MAX_HEALTH = 100;
export const HIT_DAMAGE = 20;
export const RESPAWN_FRAMES = 180; // 3 seconds at 60fps
export const FIRE_COOLDOWN_FRAMES = 30;

export const BULLET_SPEED = 0.5;
export const BULLET_LIFETIME = 200;
export const BULLET_HIT_RADIUS = 5;
export const BULLET_GRACE_FRAMES = 6; // 0.1 seconds at 60fps

export const COLLISION_RADIUS = 3;
export const ROLL_SPEED = 0.15;

export const ENGINE_PARTICLE_SPAWN_CHANCE = 0.3;
export const ENGINE_PARTICLE_LIFETIME = 30;
export const ENGINE_SOUND_CHANCE = 0.02;

export const RADAR_RADIUS = 100;
export const RADAR_RANGE = 300;

export const CAMERA_OFFSET = { x: 0, y: 8, z: 20 };

export const AUTO_BALANCE_DELAY_MS = 2000;
export const STABILIZATION_SPEED = 0.05;
export const AUTO_BALANCE_SPEED = 0.03;
