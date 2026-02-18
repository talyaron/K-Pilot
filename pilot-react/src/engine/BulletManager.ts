import { Vector3, Quaternion, Scene, Group } from 'three';
import { createBulletMesh } from './BulletFactory';
import type { IBullet } from '../types';
import {
  BULLET_SPEED,
  BULLET_LIFETIME,
  BULLET_HIT_RADIUS,
} from '../constants/gameConstants';

export class BulletManager {
  private bullets: IBullet[] = [];

  constructor(private scene: Scene) {}

  spawnBullet(position: Vector3, quaternion: Quaternion): void {
    const mesh = createBulletMesh();
    mesh.position.copy(position);
    const velocity = new Vector3(0, 0, -1)
      .applyQuaternion(quaternion)
      .multiplyScalar(BULLET_SPEED);

    this.bullets.push({ mesh, velocity, lifetime: BULLET_LIFETIME });
    this.scene.add(mesh);
  }

  update(otherPlayers: Record<string, Group>): string | null {
    let hitPlayerId: string | null = null;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.mesh.position.add(bullet.velocity);
      bullet.lifetime--;

      let hitDetected = false;
      for (const [playerId, otherPlayer] of Object.entries(otherPlayers)) {
        const distance = bullet.mesh.position.distanceTo(otherPlayer.position);
        if (distance < BULLET_HIT_RADIUS) {
          hitPlayerId = playerId;
          hitDetected = true;
          break;
        }
      }

      if (hitDetected || bullet.lifetime <= 0) {
        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
      }
    }

    return hitPlayerId;
  }

  destroy(): void {
    for (const bullet of this.bullets) {
      this.scene.remove(bullet.mesh);
    }
    this.bullets.length = 0;
  }
}
