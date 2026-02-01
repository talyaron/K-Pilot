import * as THREE from 'three';

const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xfff000 });

export function createBullet(): THREE.Mesh {
    return new THREE.Mesh(bulletGeometry, bulletMaterial);
}
