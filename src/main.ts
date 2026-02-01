import * as THREE from 'three';
import './style.css';
import { scene, renderer, camera } from './scene.ts';
import { createAirplane } from './airplane.ts';
import { keys } from './controls.ts';
import { initMultiplayer, updatePlayerPosition, fireBullet, onBulletFired, players, reportHit, onPlayerHit, getPlayerId } from './firebase.ts';
import { createBullet } from './bullet.ts';
import { createExplosion } from './effects.ts';

interface Bullet {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    lifetime: number;
    boundingBox: THREE.Box3;
}

interface Explosion {
    mesh: THREE.Points;
    velocities: number[];
    lifetime: number;
}

const bullets: Bullet[] = [];
const explosions: Explosion[] = [];
let fireCooldown = 0;
let isDead = false;

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
    
    const boundingBox = new THREE.Box3().setFromObject(bulletMesh);
    bullets.push({ mesh: bulletMesh, velocity: bulletVelocity, lifetime: 200, boundingBox });
    scene.add(bulletMesh);
}

onBulletFired((data) => {
    const position = new THREE.Vector3().fromArray(data.position);
    const quaternion = new THREE.Quaternion().fromArray(data.quaternion);
    spawnBullet(position, quaternion);
});

onPlayerHit((victimId) => {
    if (victimId === getPlayerId()) {
        // I was hit
        isDead = true;
        scene.remove(playerAirplane);
        explosions.push(createExplosion(playerAirplane.position, scene));
        setTimeout(() => {
            playerAirplane.position.set(Math.random() * 20 - 10, 5, Math.random() * 20 - 10);
            playerAirplane.rotation.set(0, 0, 0);
            scene.add(playerAirplane);
            isDead = false;
        }, 3000); // 3-second respawn
    } else {
        // Another player was hit
        const hitPlayer = players[victimId];
        if (hitPlayer) {
            explosions.push(createExplosion(hitPlayer.position, scene));
            scene.remove(hitPlayer);
        }
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (!isDead) {
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

        // Update firebase with new position
        updatePlayerPosition(playerAirplane);

        // Update camera to follow player
        const a = (new THREE.Vector3(0, 2, 5)).applyQuaternion(playerAirplane.quaternion).add(playerAirplane.position)
        camera.position.copy(a);
        camera.lookAt(playerAirplane.position);
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.mesh.position.add(bullet.velocity);
        bullet.boundingBox.setFromObject(bullet.mesh);
        bullet.lifetime--;

        // Collision detection
        for (const playerId in players) {
            const player = players[playerId];
            const playerBox = new THREE.Box3().setFromObject(player);
            if (bullet.boundingBox.intersectsBox(playerBox)) {
                reportHit(playerId);
                scene.remove(bullet.mesh);
                bullets.splice(i, 1);
                break; // a bullet can only hit one player
            }
        }

        if (bullet.lifetime <= 0) {
            scene.remove(bullet.mesh);
            if (bullets[i] === bullet) { // check if it hasn't been removed by collision
                 bullets.splice(i, 1);
            }
        }
    }

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        explosion.lifetime--;
        const positions = explosion.mesh.geometry.getAttribute('position');
        for (let j = 0; j < positions.count; j++) {
            positions.setX(j, positions.getX(j) + explosion.velocities[j * 3]);
            positions.setY(j, positions.getY(j) + explosion.velocities[j * 3 + 1]);
            positions.setZ(j, positions.getZ(j) + explosion.velocities[j * 3 + 2]);
        }
        positions.needsUpdate = true;

        if (explosion.lifetime <= 0) {
            scene.remove(explosion.mesh);
            explosions.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

animate();