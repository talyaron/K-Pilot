import type { IAsteroidMesh } from '../types';
import { ASTEROID_BOUNDS } from '../constants/sceneConstants';

export class AsteroidAnimator {
  constructor(private asteroids: IAsteroidMesh[]) {}

  update(): void {
    for (const asteroid of this.asteroids) {
      const vel = asteroid.velocity;
      const rot = asteroid.rotationSpeed;

      asteroid.position.x += vel.x;
      asteroid.position.y += vel.y;
      asteroid.position.z += vel.z;

      asteroid.rotation.x += rot.x;
      asteroid.rotation.y += rot.y;
      asteroid.rotation.z += rot.z;

      if (Math.abs(asteroid.position.x) > ASTEROID_BOUNDS) {
        asteroid.position.x *= -0.9;
      }
      if (asteroid.position.y < 20 || asteroid.position.y > 300) {
        vel.y *= -1;
      }
      if (Math.abs(asteroid.position.z) > ASTEROID_BOUNDS) {
        asteroid.position.z *= -0.9;
      }
    }
  }
}
