import type { Object3D, Vector3 } from 'three';

export interface IBullet {
  mesh: Object3D;
  velocity: Vector3;
  lifetime: number;
<<<<<<< HEAD
  shooterId: string;
=======
  isRocket: boolean;
>>>>>>> rocket
}
