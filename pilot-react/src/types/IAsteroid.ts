import type { Mesh } from 'three';

export interface IVelocity3D {
  x: number;
  y: number;
  z: number;
}

export interface IAsteroidMesh extends Mesh {
  velocity: IVelocity3D;
  rotationSpeed: IVelocity3D;
}
