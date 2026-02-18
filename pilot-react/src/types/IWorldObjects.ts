import type { Group, Mesh } from 'three';
import type { IAsteroidMesh } from './IAsteroid';

export interface IWorldObjects {
  asteroids: IAsteroidMesh[];
  towers: Group[];
  platforms: Mesh[];
  sun: Mesh;
  planet: Mesh;
}
