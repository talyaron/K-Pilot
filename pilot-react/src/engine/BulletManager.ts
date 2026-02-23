import * as THREE from 'three';
import { createBulletMesh, createRocketMesh } from './BulletFactory';
import type { IBullet, IParticle } from '../types';
import {
  BULLET_SPEED,
  BULLET_LIFETIME,
  BULLET_HIT_RADIUS,
  ROCKET_SPEED,
  ROCKET_LIFETIME,
  ROCKET_SPAWN_OFFSET,
  ROCKET_TRAIL_SPAWN_CHANCE,
  ROCKET_TRAIL_LIFETIME,
} from '../constants/gameConstants';

export class BulletManager {
  private bullets: IBullet[] = [];
  private rocketTrails: IParticle[] = [];

  constructor(private scene: THREE.Scene) {}

  spawnBullet(
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    shooterId: string,
    isRocket: boolean = false,
  ): void {
    const mesh = isRocket ? createRocketMesh() : createBulletMesh();

    if (isRocket) {
      const forward = new THREE.Vector3(0, 0, -ROCKET_SPAWN_OFFSET).applyQuaternion(quaternion);
      mesh.position.copy(position).add(forward);
      mesh.quaternion.copy(quaternion);
    } else {
      mesh.position.copy(position);
    }

    const speed = isRocket ? ROCKET_SPEED : BULLET_SPEED;
    const lifetime = isRocket ? ROCKET_LIFETIME : BULLET_LIFETIME;
    const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion).multiplyScalar(speed);

    this.bullets.push({ mesh, velocity, lifetime, shooterId, isRocket });
    this.scene.add(mesh);
  }

  update(otherPlayers: Record<string, THREE.Group>, localPlayerId: string): string | null {
    let hitPlayerId: string | null = null;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.mesh.position.add(bullet.velocity);
      bullet.lifetime--;

      // Rocket exhaust trail
      if (bullet.isRocket && Math.random() < ROCKET_TRAIL_SPAWN_CHANCE) {
        this.spawnRocketTrail(bullet);
      }

      let hitDetected = false;
      for (const [playerId, otherPlayer] of Object.entries(otherPlayers)) {
        if (playerId === bullet.shooterId) continue;
        const distance = bullet.mesh.position.distanceTo(otherPlayer.position);
        if (distance < BULLET_HIT_RADIUS) {
          hitDetected = true;
          // Only the shooter reports the hit to avoid duplicate damage
          if (bullet.shooterId === localPlayerId) {
            hitPlayerId = playerId;
          }
          break;
        }
      }

      if (hitDetected || bullet.lifetime <= 0) {
        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
      }
    }

    // Update rocket trails
    for (let i = this.rocketTrails.length - 1; i >= 0; i--) {
      const trail = this.rocketTrails[i];
      trail.mesh.position.add(trail.velocity);
      trail.lifetime--;
      const mat = trail.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (trail.lifetime / ROCKET_TRAIL_LIFETIME) * 0.95;
      if (trail.lifetime <= 0) {
        this.scene.remove(trail.mesh);
        this.rocketTrails.splice(i, 1);
      }
    }

    return hitPlayerId;
  }

  private spawnRocketTrail(bullet: IBullet): void {
    const trailGeo = new THREE.SphereGeometry(0.28 + Math.random() * 0.18, 6, 6);
    const trailColor = Math.random() < 0.6 ? 0xff6600 : 0xffcc00;
    const trailMat = new THREE.MeshBasicMaterial({
      color: trailColor,
      transparent: true,
      opacity: 0.95,
    });
    const trailMesh = new THREE.Mesh(trailGeo, trailMat);

    const tailOffset = bullet.velocity.clone().normalize().multiplyScalar(-0.7);
    trailMesh.position.copy(bullet.mesh.position).add(tailOffset);
    trailMesh.position.x += (Math.random() - 0.5) * 0.12;
    trailMesh.position.y += (Math.random() - 0.5) * 0.12;

    const trailVel = tailOffset
      .clone()
      .multiplyScalar(0.04)
      .add(new THREE.Vector3((Math.random() - 0.5) * 0.025, (Math.random() - 0.5) * 0.025, 0));

    this.rocketTrails.push({
      mesh: trailMesh,
      velocity: trailVel,
      lifetime: ROCKET_TRAIL_LIFETIME,
    });
    this.scene.add(trailMesh);
  }

  destroy(): void {
    for (const bullet of this.bullets) {
      this.scene.remove(bullet.mesh);
    }
    this.bullets.length = 0;
    for (const trail of this.rocketTrails) {
      this.scene.remove(trail.mesh);
    }
    this.rocketTrails.length = 0;
  }
}
