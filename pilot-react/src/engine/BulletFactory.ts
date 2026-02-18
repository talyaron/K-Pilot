import { SphereGeometry, MeshBasicMaterial, Mesh } from 'three';

const bulletGeometry = new SphereGeometry(0.1, 8, 8);
const bulletMaterial = new MeshBasicMaterial({ color: 0xfff000 });

export function createBulletMesh(): Mesh {
  return new Mesh(bulletGeometry, bulletMaterial);
}
