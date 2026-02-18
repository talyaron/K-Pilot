import * as THREE from 'three';
import type { IParticle } from '../types';
import {
  ENGINE_PARTICLE_SPAWN_CHANCE,
  ENGINE_PARTICLE_LIFETIME,
} from '../constants/gameConstants';

export class ParticleManager {
  private particles: IParticle[] = [];

  constructor(private scene: THREE.Scene) {}

  trySpawn(airplane: THREE.Group): void {
    if (Math.random() >= ENGINE_PARTICLE_SPAWN_CHANCE) return;

    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const offset = new THREE.Vector3(0, 0, 2).applyQuaternion(airplane.quaternion);
    mesh.position.copy(airplane.position).add(offset);

    const velocity = new THREE.Vector3(0, 0, 0.05).applyQuaternion(airplane.quaternion);

    this.particles.push({ mesh, velocity, lifetime: ENGINE_PARTICLE_LIFETIME });
    this.scene.add(mesh);
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.mesh.position.add(particle.velocity);
      particle.lifetime--;

      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = particle.lifetime / ENGINE_PARTICLE_LIFETIME;

      if (particle.lifetime <= 0) {
        this.scene.remove(particle.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  destroy(): void {
    for (const particle of this.particles) {
      this.scene.remove(particle.mesh);
    }
    this.particles.length = 0;
  }
}
