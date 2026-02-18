import * as THREE from 'three';
import { SceneSetup } from './SceneSetup';
import { WorldBuilder } from './WorldBuilder';
import { InputManager } from './InputManager';
import { FlightController } from './FlightController';
import { BulletManager } from './BulletManager';
import { ParticleManager } from './ParticleManager';
import { CollisionDetector } from './CollisionDetector';
import { HealthBarManager } from './HealthBarManager';
import { AsteroidAnimator } from './AsteroidAnimator';
import { CameraController } from './CameraController';
import { AudioService } from '../services/AudioService';
import { MultiplayerService } from '../services/MultiplayerService';
import { loadAirplane } from '../services/PlaneLoaderService';
import { FLIGHT_CONFIG } from '../constants/gameConstants';
import {
  PLAYER_MAX_HEALTH,
  HIT_DAMAGE,
  RESPAWN_FRAMES,
  FIRE_COOLDOWN_FRAMES,
  ROCKET_COOLDOWN_FRAMES,
  ENGINE_SOUND_CHANCE,
} from '../constants/gameConstants';
import type { IGameState, IGameCallbacks, IRadarPlayer } from '../types';

export class GameEngine {
  private sceneSetup: SceneSetup;
  private inputManager: InputManager;
  private flightController: FlightController;
  private bulletManager: BulletManager;
  private particleManager: ParticleManager;
  private collisionDetector!: CollisionDetector;
  private healthBarManager: HealthBarManager;
  private asteroidAnimator!: AsteroidAnimator;
  private cameraController: CameraController;
  private audioService: AudioService;
  private multiplayerService: MultiplayerService;

  private playerAirplane: THREE.Group | null = null;
  private animationFrameId: number = 0;

  // Game state
  private health: number = PLAYER_MAX_HEALTH;
  private kills: number = 0;
  private isDead: boolean = false;
  private respawnTimer: number = 0;
  private fireCooldown: number = 0;
  private rocketCooldown: number = 0;

  // Callbacks
  private callbacks: IGameCallbacks;
  private radarCanvas: HTMLCanvasElement | null = null;
  private radarCtx: CanvasRenderingContext2D | null = null;

  constructor(container: HTMLElement, callbacks: IGameCallbacks) {
    this.callbacks = callbacks;
    this.sceneSetup = new SceneSetup(container);
    this.inputManager = new InputManager();
    this.flightController = new FlightController(FLIGHT_CONFIG);
    this.bulletManager = new BulletManager(this.sceneSetup.scene);
    this.particleManager = new ParticleManager(this.sceneSetup.scene);
    this.healthBarManager = new HealthBarManager(this.sceneSetup.scene);
    this.cameraController = new CameraController();
    this.audioService = new AudioService();
    this.multiplayerService = new MultiplayerService(this.sceneSetup.scene);
  }

  setRadarCanvas(canvas: HTMLCanvasElement): void {
    this.radarCanvas = canvas;
    this.radarCtx = canvas.getContext('2d');
  }

  async init(): Promise<void> {
    const worldBuilder = new WorldBuilder();
    const worldObjects = worldBuilder.build(this.sceneSetup.scene);

    this.collisionDetector = new CollisionDetector(worldObjects);
    this.asteroidAnimator = new AsteroidAnimator(worldObjects.asteroids);

    this.playerAirplane = await loadAirplane();
    this.playerAirplane.position.y = 20;
    this.sceneSetup.scene.add(this.playerAirplane);

    this.multiplayerService.init(this.playerAirplane);

    this.multiplayerService.onBulletFired((data) => {
      const position = new THREE.Vector3().fromArray(data.position);
      const quaternion = new THREE.Quaternion().fromArray(data.quaternion);
      this.bulletManager.spawnBullet(position, quaternion, data.playerId);
    });

    this.multiplayerService.onPlayerHit((victimId) => {
      if (victimId === this.multiplayerService.getPlayerId()) {
        this.health -= HIT_DAMAGE;
        if (this.health < 0) this.health = 0;
        this.emitState();
      }
    });

    this.animate();
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (!this.playerAirplane) {
      this.sceneSetup.render();
      return;
    }

    if (this.isDead) {
      this.handleDeadState();
      return;
    }

    if (this.collisionDetector.check(this.playerAirplane, this.health)) {
      this.die();
      return;
    }

    this.updateFlight();
    this.updateShooting();
    this.updateBullets();
    this.particleManager.trySpawn(this.playerAirplane);
    this.particleManager.update();
    this.asteroidAnimator.update();
    this.multiplayerService.updatePlayerPosition(this.playerAirplane);

    this.cameraController.update(this.sceneSetup.camera, this.playerAirplane);
    this.healthBarManager.update(
      this.playerAirplane.position,
      this.sceneSetup.camera.position,
      this.health,
      PLAYER_MAX_HEALTH,
    );

    this.drawRadar();
    this.sceneSetup.render();
  };

  private updateFlight(): void {
    if (!this.playerAirplane) return;

    const rollStarting = this.flightController.checkAndStartRoll(this.inputManager);
    if (rollStarting) {
      this.audioService.playRollSound();
    }

    this.flightController.updateMovement(this.playerAirplane, this.inputManager);

    if (Math.random() < ENGINE_SOUND_CHANCE) {
      this.audioService.playEngineSound(this.flightController.isSpeedBoosted);
    }
  }

  private updateShooting(): void {
    if (!this.playerAirplane) return;

    // Regular gun — Space
    if (this.inputManager.keys['Space'] && this.fireCooldown <= 0) {
      this.fireCooldown = FIRE_COOLDOWN_FRAMES;
      this.bulletManager.spawnBullet(
        this.playerAirplane.position,
        this.playerAirplane.quaternion,
        this.multiplayerService.getPlayerId(),
      );
      this.multiplayerService.fireBullet(
        this.playerAirplane.position,
        this.playerAirplane.quaternion,
      );
      this.audioService.playShootSound();
    }
    if (this.fireCooldown > 0) this.fireCooldown--;

    // Rocket launcher — G
    if (this.inputManager.keys['KeyG'] && this.rocketCooldown <= 0) {
      this.rocketCooldown = ROCKET_COOLDOWN_FRAMES;
      this.bulletManager.spawnBullet(
        this.playerAirplane.position,
        this.playerAirplane.quaternion,
        this.multiplayerService.getPlayerId(),
        true,
      );
      this.multiplayerService.fireBullet(
        this.playerAirplane.position,
        this.playerAirplane.quaternion,
      );
      this.audioService.playShootSound();
    }
    if (this.rocketCooldown > 0) this.rocketCooldown--;
  }

  private updateBullets(): void {
    const hitPlayerId = this.bulletManager.update(
      this.multiplayerService.otherPlayers,
      this.multiplayerService.getPlayerId(),
    );
    if (hitPlayerId) {
      this.multiplayerService.reportHit(hitPlayerId);
      this.kills++;
      this.emitState();
    }
  }

  private die(): void {
    this.isDead = true;
    this.respawnTimer = RESPAWN_FRAMES;
    this.audioService.playExplosionSound();
    this.emitState();
  }

  private handleDeadState(): void {
    if (!this.playerAirplane) return;

    this.respawnTimer--;
    if (this.respawnTimer <= 0) {
      this.respawn();
    }

    this.cameraController.update(this.sceneSetup.camera, this.playerAirplane);
    this.sceneSetup.render();
  }

  private respawn(): void {
    if (!this.playerAirplane) return;

    this.playerAirplane.position.set(0, 20, 0);
    this.playerAirplane.rotation.set(0, 0, 0);
    this.playerAirplane.quaternion.set(0, 0, 0, 1);

    this.flightController.reset();
    this.health = PLAYER_MAX_HEALTH;
    this.isDead = false;
    this.emitState();
  }

  private emitState(): void {
    const state: IGameState = {
      health: this.health,
      maxHealth: PLAYER_MAX_HEALTH,
      kills: this.kills,
      isDead: this.isDead,
    };
    this.callbacks.onStateChange(state);
  }

  getRadarPlayers(): IRadarPlayer[] {
    if (!this.playerAirplane) return [];
    const result: IRadarPlayer[] = [];
    for (const [id, player] of Object.entries(this.multiplayerService.otherPlayers)) {
      result.push({
        id,
        x: player.position.x - this.playerAirplane.position.x,
        z: player.position.z - this.playerAirplane.position.z,
      });
    }
    return result;
  }

  private drawRadar(): void {
    if (!this.radarCtx || !this.radarCanvas || !this.playerAirplane) return;

    const ctx = this.radarCtx;
    const radius = 100;
    const range = 300;
    const currentTime = Date.now();

    ctx.clearRect(0, 0, this.radarCanvas.width, this.radarCanvas.height);

    // Center dot
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(radius, radius, 4, 0, Math.PI * 2);
    ctx.fill();

    // Range circles
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(radius, radius, (radius / 3) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Get plane's yaw to rotate radar with the plane's facing direction
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerAirplane.quaternion);
    const yaw = Math.atan2(forward.x, forward.z);
    const cosYaw = Math.cos(-yaw);
    const sinYaw = Math.sin(-yaw);

    // Other players
    for (const otherPlayer of Object.values(this.multiplayerService.otherPlayers)) {
      const dx = otherPlayer.position.x - this.playerAirplane.position.x;
      const dz = otherPlayer.position.z - this.playerAirplane.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < range) {
        const scale = radius / range;
        // Transform world-space offset into plane-local space
        const localX = dx * cosYaw - dz * sinYaw;
        const localZ = dx * sinYaw + dz * cosYaw;
        const radarX = radius - localX * scale;
        const radarY = radius - localZ * scale;

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(radarX, radarY, 3, 0, Math.PI * 2);
        ctx.fill();

        if (currentTime % 1000 < 500) {
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(radarX, radarY, 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.inputManager.destroy();
    this.bulletManager.destroy();
    this.particleManager.destroy();
    this.multiplayerService.destroy();
    this.audioService.destroy();
    this.sceneSetup.destroy();
  }
}
