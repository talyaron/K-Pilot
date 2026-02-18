import type { Mesh, Vector3 } from 'three';

export interface IBullet {
  mesh: Mesh;
  velocity: Vector3;
  lifetime: number;
  shooterId: string;
}
