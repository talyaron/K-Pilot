import type { Mesh, Vector3 } from 'three';

export interface IParticle {
  mesh: Mesh;
  velocity: Vector3;
  lifetime: number;
}
