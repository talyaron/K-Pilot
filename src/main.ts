import * as THREE from 'three';
import './style.css';
import { scene, renderer, camera } from './scene.ts';
import { createAirplane } from './airplane.ts';
import { keys } from './controls.ts';
import { initMultiplayer, updatePlayerPosition, fireBullet, onBulletFired } from './firebase.ts';
import { createBullet } from './bullet.ts';

interface Bullet {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    lifetime: number;
}

const bullets: Bullet[] = [];
let fireCooldown = 0;

// Player's airplane
const playerAirplane: THREE.Group = createAirplane();
playerAirplane.position.y = 1;
scene.add(playerAirplane);

// Initialize multiplayer
initMultiplayer(playerAirplane);

function spawnBullet(initialPosition: THREE.Vector3, initialQuaternion: THREE.Quaternion) {
    const bulletMesh = createBullet();
    bulletMesh.position.copy(initialPosition);
    const bulletVelocity = new THREE.Vector3(0, 0, -1).applyQuaternion(initialQuaternion).multiplyScalar(0.5);
    
    bullets.push({ mesh: bulletMesh, velocity: bulletVelocity, lifetime: 200 });
    scene.add(bulletMesh);
}

onBulletFired((data) => {
    const position = new THREE.Vector3().fromArray(data.position);
    const quaternion = new THREE.Quaternion().fromArray(data.quaternion);
    spawnBullet(position, quaternion);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const speed = 0.1;
    const rotationSpeed = 0.05;
    const pitchSpeed = 0.02;

    // Always move forward
    playerAirplane.translateZ(-speed);

    if (keys['KeyA']) {
        playerAirplane.rotateY(rotationSpeed);
    }
    if (keys['KeyD']) {
        playerAirplane.rotateY(-rotationSpeed);
    }
    if (keys['KeyQ']) {
        playerAirplane.rotateX(pitchSpeed);
    }
    if (keys['KeyZ']) {
        playerAirplane.rotateX(-pitchSpeed);
    }

    if (keys['Space'] && fireCooldown <= 0) {
        fireCooldown = 30; // 30 frames cooldown
        spawnBullet(playerAirplane.position, playerAirplane.quaternion);
        fireBullet(playerAirplane.position, playerAirplane.quaternion);
    }

    if (fireCooldown > 0) {
        fireCooldown--;
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.mesh.position.add(bullet.velocity);
        bullet.lifetime--;

        if (bullet.lifetime <= 0) {
            scene.remove(bullet.mesh);
            bullets.splice(i, 1);
        }
    }

    // Update firebase with new position
    updatePlayerPosition(playerAirplane);

    // Update camera to follow player
    const a = (new THREE.Vector3(0, 2, 5)).applyQuaternion(playerAirplane.quaternion).add(playerAirplane.position)
    camera.position.copy(a);
    camera.lookAt(playerAirplane.position);


    renderer.render(scene, camera);
}

animate();