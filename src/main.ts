import * as THREE from 'three';
import './style.css';
import { scene, renderer, camera } from './scene.ts';
import { createAirplane } from './airplane.ts';
import { keys, getRollDirection, resetRollDirection } from './controls.ts';
import { initMultiplayer, updatePlayerPosition, fireBullet, onBulletFired } from './firebase.ts';
import { createBullet } from './bullet.ts';

interface Bullet {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    lifetime: number;
}

const bullets: Bullet[] = [];
let fireCooldown = 0;

// Roll state
let isRolling = false;
let rollProgress = 0;
let rollTargetDirection: 'left' | 'right' | null = null;
let isStabilizing = false;

// Speed boost
let speedBoostActive = false;
let lastZKeyState = false;

// Auto-balance
let lastTurnTime = Date.now();
let autoBalanceActive = false;

// Smooth movement
let currentSpeed = 0.1;
let targetSpeed = 0.1;
let currentRotationVelocity = 0;
let currentPitchVelocity = 0;

// Death and respawn
let isDead = false;
let respawnTimer = 0;
const deathScreen = document.getElementById('death-screen') as HTMLElement;

// Player's airplane
const playerAirplane: THREE.Group = createAirplane();
playerAirplane.position.y = 20; // Start higher to avoid immediate collision
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

// Reset player to spawn position
function respawnPlayer() {
    playerAirplane.position.set(0, 20, 0);
    playerAirplane.rotation.set(0, 0, 0);
    playerAirplane.quaternion.set(0, 0, 0, 1);

    // Reset all movement states
    currentSpeed = 0.1;
    targetSpeed = 0.1;
    currentRotationVelocity = 0;
    currentPitchVelocity = 0;
    speedBoostActive = false;
    isRolling = false;
    isStabilizing = false;
    autoBalanceActive = false;
    lastTurnTime = Date.now();

    isDead = false;
    deathScreen.classList.remove('show');
}

// Check if player crashed
function checkCollision(): boolean {
    // Check if plane is too close to ground (y < 0.5) or any structure
    if (playerAirplane.position.y < 0.5) {
        return true;
    }
    return false;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Handle death and respawn
    if (isDead) {
        respawnTimer--;
        if (respawnTimer <= 0) {
            respawnPlayer();
        }
        // Update camera even when dead
        const a = (new THREE.Vector3(0, 2, 5)).applyQuaternion(playerAirplane.quaternion).add(playerAirplane.position);
        camera.position.copy(a);
        camera.lookAt(playerAirplane.position);
        renderer.render(scene, camera);
        return; // Skip rest of update loop
    }

    // Check for collision
    if (checkCollision()) {
        isDead = true;
        respawnTimer = 180; // 3 seconds at 60fps
        deathScreen.classList.add('show');
        return;
    }

    const baseSpeed = 0.1;
    const boostedSpeed = 0.2;
    const rotationAcceleration = 0.003;
    const maxRotationSpeed = 0.08;
    const pitchAcceleration = 0.001;
    const maxPitchSpeed = 0.04;
    const damping = 0.95;

    // Handle Z key toggle for speed boost
    if (keys['KeyZ'] && !lastZKeyState) {
        speedBoostActive = !speedBoostActive;
    }
    lastZKeyState = keys['KeyZ'];

    // Smooth speed transition
    targetSpeed = speedBoostActive ? boostedSpeed : baseSpeed;
    currentSpeed += (targetSpeed - currentSpeed) * 0.1;

    // Always move forward with smooth speed
    playerAirplane.translateZ(-currentSpeed);

    // Smooth rotation
    let rotationInput = 0;
    if (keys['KeyA']) {
        rotationInput = 1;
        lastTurnTime = Date.now();
    }
    if (keys['KeyD']) {
        rotationInput = -1;
        lastTurnTime = Date.now();
    }

    // Apply rotation acceleration
    currentRotationVelocity += rotationInput * rotationAcceleration;
    currentRotationVelocity *= damping; // Damping for smooth deceleration
    currentRotationVelocity = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, currentRotationVelocity));

    if (Math.abs(currentRotationVelocity) > 0.001) {
        playerAirplane.rotateY(currentRotationVelocity);
    }
    // Handle roll maneuver
    const currentRollDirection = getRollDirection();
    if (currentRollDirection !== null && !isRolling && !isStabilizing) {
        isRolling = true;
        rollTargetDirection = currentRollDirection;
        rollProgress = 0;
        resetRollDirection(); // Reset after starting roll
    }

    if (isRolling) {
        const fastRollSpeed = 0.15; // Fast roll speed
        const rollAmount = rollTargetDirection === 'left' ? fastRollSpeed : -fastRollSpeed;
        playerAirplane.rotateZ(rollAmount);
        rollProgress += fastRollSpeed;

        // Complete roll after 360 degrees (2 * PI)
        if (rollProgress >= Math.PI * 2) {
            isRolling = false;
            isStabilizing = true;
        }
    } else if (isStabilizing) {
        // Stabilize: align the plane so ground is below
        // Get the current up vector of the plane
        const currentUp = new THREE.Vector3(0, 1, 0).applyQuaternion(playerAirplane.quaternion);
        const targetUp = new THREE.Vector3(0, 1, 0);

        // Calculate the rotation needed to align up vectors
        const rotationAxis = new THREE.Vector3().crossVectors(currentUp, targetUp).normalize();
        const angle = Math.acos(currentUp.dot(targetUp));

        if (angle > 0.01) {
            // Apply a portion of the needed rotation for smooth stabilization
            const stabilizationSpeed = 0.05;
            const quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle * stabilizationSpeed);
            playerAirplane.quaternion.multiplyQuaternions(quaternion, playerAirplane.quaternion);
        } else {
            // Stabilization complete
            isStabilizing = false;
        }
    } else {
        // Check if we should start auto-balancing
        const timeSinceLastTurn = Date.now() - lastTurnTime;
        if (timeSinceLastTurn > 2000 && !autoBalanceActive && (Math.abs(currentRotationVelocity) < 0.001)) {
            autoBalanceActive = true;
        }

        // Auto-balance if active
        if (autoBalanceActive) {
            const currentUp = new THREE.Vector3(0, 1, 0).applyQuaternion(playerAirplane.quaternion);
            const targetUp = new THREE.Vector3(0, 1, 0);

            const rotationAxis = new THREE.Vector3().crossVectors(currentUp, targetUp).normalize();
            const angle = Math.acos(Math.max(-1, Math.min(1, currentUp.dot(targetUp))));

            if (angle > 0.01) {
                const stabilizationSpeed = 0.03;
                const quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle * stabilizationSpeed);
                playerAirplane.quaternion.multiplyQuaternions(quaternion, playerAirplane.quaternion);
            } else {
                autoBalanceActive = false;
            }
        }

        // Normal controls (only when not rolling or stabilizing)
        let pitchInput = 0;
        if (keys['KeyW']) {
            pitchInput = 1;
            lastTurnTime = Date.now();
            autoBalanceActive = false;
        }
        if (keys['KeyS']) {
            pitchInput = -1;
            lastTurnTime = Date.now();
            autoBalanceActive = false;
        }

        // Apply pitch acceleration
        currentPitchVelocity += pitchInput * pitchAcceleration;
        currentPitchVelocity *= damping;
        currentPitchVelocity = Math.max(-maxPitchSpeed, Math.min(maxPitchSpeed, currentPitchVelocity));

        if (Math.abs(currentPitchVelocity) > 0.0005) {
            playerAirplane.rotateX(currentPitchVelocity);
        }
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