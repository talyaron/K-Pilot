import * as THREE from 'three';

const bulletGeometry = new THREE.SphereGeometry(0.4, 8, 8);
const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff4400, emissive: 0xff2200 } as any);

export function createBullet(): THREE.Mesh {
    return new THREE.Mesh(bulletGeometry, bulletMaterial);
}
