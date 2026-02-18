import { Vector3, type Group, type DodecahedronGeometry } from 'three';
import type { IWorldObjects } from '../types';
import { COLLISION_RADIUS } from '../constants/gameConstants';

export class CollisionDetector {
  constructor(private worldObjects: IWorldObjects) {}

  check(airplane: Group, currentHealth: number): boolean {
    const pos = airplane.position;

    if (pos.y < 2) return true;
    if (currentHealth <= 0) return true;

    return (
      this.checkAsteroids(pos) ||
      this.checkTowers(pos) ||
      this.checkPlatforms(pos) ||
      this.checkSun(pos) ||
      this.checkPlanet(pos)
    );
  }

  private checkAsteroids(pos: Vector3): boolean {
    for (const asteroid of this.worldObjects.asteroids) {
      const distance = asteroid.position.distanceTo(pos);
      const radius =
        (asteroid.geometry as DodecahedronGeometry).parameters.radius || 5;
      if (distance < COLLISION_RADIUS + radius) return true;
    }
    return false;
  }

  private checkTowers(pos: Vector3): boolean {
    for (const tower of this.worldObjects.towers) {
      const distance = tower.position.distanceTo(pos);
      if (distance < COLLISION_RADIUS + 5 && pos.y < 50) {
        return true;
      }
    }
    return false;
  }

  private checkPlatforms(pos: Vector3): boolean {
    for (const platform of this.worldObjects.platforms) {
      const dx = pos.x - platform.position.x;
      const dy = pos.y - platform.position.y;
      const dz = pos.z - platform.position.z;
      const horizontal = Math.sqrt(dx * dx + dz * dz);
      if (horizontal < 10 && Math.abs(dy) < 2) return true;
    }
    return false;
  }

  private checkSun(pos: Vector3): boolean {
    const distance = this.worldObjects.sun.position.distanceTo(pos);
    return distance < COLLISION_RADIUS + 12;
  }

  private checkPlanet(pos: Vector3): boolean {
    const distance = this.worldObjects.planet.position.distanceTo(pos);
    return distance < COLLISION_RADIUS + 35;
  }
}
