import * as THREE from 'three';
import './style.css';
import { scene, renderer, camera, asteroids, towers, platforms, sun, planet } from './scene.ts';
import { loadAirplane } from './planeLoader.ts';
import { keys, getRollDirection, resetRollDirection } from './controls.ts';
import { initMultiplayer, updatePlayerPosition, fireBullet, onBulletFired, reportHit, onPlayerHit, getPlayerId, players, onKillReported, reportKill } from './firebase.ts';
import { createBullet } from './bullet.ts';

interface Bullet {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    lifetime: number;
    isLocal: boolean; // true = fired by this player, false = from another player
}

const bullets: Bullet[] = [];
let fireCooldown = 0;

// Roll state
let isRolling = false;
let rollProgress = 0;
let rollTargetDirection: 'left' | 'right' | null = null;
let isStabilizing = false;

// Vertical flip state (Q key)
let isFlipping = false;
let flipProgress = 0;
let lastQKeyState = false;

// Banking state (tilt on A/D turns)
let currentBankAngle = 0;
const maxBankAngle = 0.4; // ~23 degrees max bank
const bankSpeed = 0.02;

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

// Health system
let playerHealth = 100;
const maxHealth = 100;
let killCount = 0;

// HUD Elements
const killsElement = document.getElementById('kills') as HTMLElement;
const healthBarFill = document.getElementById('health-bar-fill') as HTMLElement;
const healthText = document.getElementById('health-text') as HTMLElement;

// Radar
const radarCanvas = document.getElementById('radar') as HTMLCanvasElement;
const radarCtx = radarCanvas.getContext('2d')!;
const radarRadius = 100;
const radarRange = 300; // Units in game world
let lastRadarUpdate = 0;

// Sound System
const audioContext = new AudioContext();

function playEngineSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 80 + (speedBoostActive ? 40 : 0);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playShootSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
}

function playExplosionSound() {
    // Explosion base
    const noise = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.5, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);

    // Low rumble
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + 0.5);
    oscillator.type = 'sine';

    const oscGain = audioContext.createGain();
    oscGain.gain.setValueAtTime(0.3, audioContext.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.connect(oscGain);
    oscGain.connect(audioContext.destination);

    noise.start(audioContext.currentTime);
    oscillator.start(audioContext.currentTime);
    noise.stop(audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function playRollSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(600, audioContext.currentTime + 0.3);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Particle systems
interface Particle {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    lifetime: number;
}
const engineParticles: Particle[] = [];

// Player's airplane (will be loaded asynchronously)
let playerAirplane: THREE.Group;

// Create health bar for player
function createHealthBar(): THREE.Group {
    const healthBarGroup = new THREE.Group();

    // Background bar (red)
    const bgGeometry = new THREE.PlaneGeometry(3, 0.3);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bgBar = new THREE.Mesh(bgGeometry, bgMaterial);
    healthBarGroup.add(bgBar);

    // Health bar (green)
    const healthGeometry = new THREE.PlaneGeometry(3, 0.3);
    const healthMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
    healthBar.position.z = 0.01;
    healthBarGroup.add(healthBar);

    (healthBarGroup as any).healthBar = healthBar;
    return healthBarGroup;
}

const playerHealthBar = createHealthBar();
scene.add(playerHealthBar);

// Update health bar
function updateHealthBar(healthBarGroup: THREE.Group, health: number, maxHealth: number) {
    const healthBar = (healthBarGroup as any).healthBar as THREE.Mesh;
    const healthPercent = health / maxHealth;
    healthBar.scale.x = healthPercent;
    healthBar.position.x = -(3 * (1 - healthPercent)) / 2;

    // Change color based on health
    const material = healthBar.material as THREE.MeshBasicMaterial;
    if (healthPercent > 0.6) {
        material.color.setHex(0x00ff00);
    } else if (healthPercent > 0.3) {
        material.color.setHex(0xffff00);
    } else {
        material.color.setHex(0xff6600);
    }
}

// Update HUD
function updateHUD() {
    // Update kill count
    killsElement.textContent = killCount.toString();

    // Update health bar
    const healthPercent = (playerHealth / maxHealth) * 100;
    healthBarFill.style.width = healthPercent + '%';
    healthText.textContent = Math.ceil(playerHealth).toString();

    // Change health bar color
    if (healthPercent > 60) {
        healthBarFill.style.background = 'linear-gradient(90deg, #00ff00, #00ff00)';
    } else if (healthPercent > 30) {
        healthBarFill.style.background = 'linear-gradient(90deg, #ffff00, #ffaa00)';
    } else {
        healthBarFill.style.background = 'linear-gradient(90deg, #ff6600, #ff0000)';
    }
}

// Draw radar
function updateRadar(otherPlayers: Map<string, THREE.Group>) {
    const currentTime = Date.now();

    // Clear canvas
    radarCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);

    // Draw center dot (player)
    radarCtx.fillStyle = '#00ffff';
    radarCtx.beginPath();
    radarCtx.arc(radarRadius, radarRadius, 4, 0, Math.PI * 2);
    radarCtx.fill();

    // Draw range circles
    radarCtx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    radarCtx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        radarCtx.beginPath();
        radarCtx.arc(radarRadius, radarRadius, (radarRadius / 3) * i, 0, Math.PI * 2);
        radarCtx.stroke();
    }

    // Update every 3 seconds (radar sweep)
    if (currentTime - lastRadarUpdate > 3000) {
        lastRadarUpdate = currentTime;
    }

    // Draw other players within range
    otherPlayers.forEach((otherPlayer) => {
        const dx = otherPlayer.position.x - playerAirplane.position.x;
        const dz = otherPlayer.position.z - playerAirplane.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < radarRange) {
            // Calculate position on radar
            const scale = radarRadius / radarRange;
            const radarX = radarRadius + dx * scale;
            const radarY = radarRadius + dz * scale;

            // Draw enemy blip
            radarCtx.fillStyle = '#ff0000';
            radarCtx.beginPath();
            radarCtx.arc(radarX, radarY, 3, 0, Math.PI * 2);
            radarCtx.fill();

            // Add pulsing effect
            if ((currentTime % 1000) < 500) {
                radarCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                radarCtx.lineWidth = 2;
                radarCtx.beginPath();
                radarCtx.arc(radarX, radarY, 5, 0, Math.PI * 2);
                radarCtx.stroke();
            }
        }
    });
}

// Spawn engine trail particle
function spawnEngineParticle() {
    const particleGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ccff,
        transparent: true,
        opacity: 0.8
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    // Position behind the airplane
    const engineOffset = new THREE.Vector3(0, 0, 2);
    engineOffset.applyQuaternion(playerAirplane.quaternion);
    particle.position.copy(playerAirplane.position).add(engineOffset);

    // Velocity opposite to movement direction
    const velocity = new THREE.Vector3(0, 0, 0.05);
    velocity.applyQuaternion(playerAirplane.quaternion);

    engineParticles.push({
        mesh: particle,
        velocity: velocity,
        lifetime: 30
    });

    scene.add(particle);
}

// Handle player hits from other players
function handlePlayerHit(victimId: string, attackerId: string, damage: number) {
    if (victimId === getPlayerId()) {
        // We got hit!
        playerHealth -= damage;
        if (playerHealth <= 0) {
            playerHealth = 0;
            // Report our death to give the attacker a kill
            reportKill(attackerId);
        }
    }
}

// Handle kill confirmations
function handleKillConfirmed(killerId: string) {
    if (killerId === getPlayerId()) {
        killCount++;
    }
}

function spawnBullet(initialPosition: THREE.Vector3, initialQuaternion: THREE.Quaternion, isLocal: boolean) {
    const bulletMesh = createBullet();
    bulletMesh.position.copy(initialPosition);
    const bulletVelocity = new THREE.Vector3(0, 0, -1).applyQuaternion(initialQuaternion).multiplyScalar(1.5);

    bullets.push({ mesh: bulletMesh, velocity: bulletVelocity, lifetime: 600, isLocal });
    scene.add(bulletMesh);
}

onBulletFired((data) => {
    const position = new THREE.Vector3().fromArray(data.position);
    const quaternion = new THREE.Quaternion().fromArray(data.quaternion);
    spawnBullet(position, quaternion, false); // Remote bullet
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
    isFlipping = false;
    isStabilizing = false;
    autoBalanceActive = false;
    currentBankAngle = 0;
    lastTurnTime = Date.now();

    // Reset health
    playerHealth = maxHealth;

    isDead = false;
    deathScreen.classList.remove('show');
}

// Check if player crashed
function checkCollision(): boolean {
    if (!playerAirplane) return false;

    // Check if plane is too close to ground (y < 2)
    if (playerAirplane.position.y < 2) {
        return true;
    }
    // Check if health depleted
    if (playerHealth <= 0) {
        return true;
    }

    const playerPos = playerAirplane.position;
    const collisionRadius = 3; // Airplane collision radius

    // Check collision with asteroids
    for (const asteroid of asteroids) {
        const distance = playerPos.distanceTo(asteroid.position);
        const asteroidRadius = (asteroid.geometry as THREE.DodecahedronGeometry).parameters.radius || 5;
        if (distance < collisionRadius + asteroidRadius) {
            return true;
        }
    }

    // Check collision with towers
    for (const tower of towers) {
        const distance = playerPos.distanceTo(tower.position);
        // Towers are tall cylinders, check if within radius and below max height
        if (distance < collisionRadius + 5 && playerPos.y < 50) {
            return true;
        }
    }

    // Check collision with platforms
    for (const platform of platforms) {
        const dx = playerPos.x - platform.position.x;
        const dy = playerPos.y - platform.position.y;
        const dz = playerPos.z - platform.position.z;
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

        // Check if within platform bounds
        if (horizontalDistance < 10 && Math.abs(dy) < 2) {
            return true;
        }
    }

    // Check collision with sun
    const sunDistance = playerPos.distanceTo(sun.position);
    if (sunDistance < collisionRadius + 12) {
        return true;
    }

    // Check collision with planet
    const planetDistance = playerPos.distanceTo(planet.position);
    if (planetDistance < collisionRadius + 35) {
        return true;
    }

    return false;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Wait for airplane to load
    if (!playerAirplane) {
        renderer.render(scene, camera);
        return;
    }

    // Handle death and respawn
    if (isDead) {
        respawnTimer--;
        if (respawnTimer <= 0) {
            respawnPlayer();
        }
        // Update camera even when dead
        const cameraOffset = new THREE.Vector3(0, 8, 20);
        const a = cameraOffset.applyQuaternion(playerAirplane.quaternion).add(playerAirplane.position);
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
        playExplosionSound();
        return;
    }

    const baseSpeed = 0.1;
    const boostedSpeed = 0.35;
    const rotationAcceleration = 0.0006;
    const maxRotationSpeed = 0.02;
    const pitchAcceleration = 0.0003;
    const maxPitchSpeed = 0.012;
    const damping = 0.96; // Higher damping = smoother, slower deceleration

    // Handle Z key toggle for speed boost
    if (keys['KeyZ'] && !lastZKeyState) {
        speedBoostActive = !speedBoostActive;
    }
    lastZKeyState = keys['KeyZ'];

    // Smooth speed transition
    targetSpeed = speedBoostActive ? boostedSpeed : baseSpeed;
    currentSpeed += (targetSpeed - currentSpeed) * 0.04; // Smoother speed transition

    // Always move forward with smooth speed
    playerAirplane.translateZ(-currentSpeed);

    // Play engine sound periodically
    if (Math.random() < 0.02) { // 2% chance per frame for continuous engine hum
        playEngineSound();
    }

    // Handle Q key for vertical flip (180 degree pitch loop)
    if (keys['KeyQ'] && !lastQKeyState && !isFlipping && !isRolling && !isStabilizing) {
        isFlipping = true;
        flipProgress = 0;
        playRollSound();
    }
    lastQKeyState = !!keys['KeyQ'];

    // Handle mouse roll maneuver
    const currentRollDirection = getRollDirection();
    if (currentRollDirection !== null && !isRolling && !isFlipping && !isStabilizing) {
        isRolling = true;
        rollTargetDirection = currentRollDirection;
        rollProgress = 0;
        resetRollDirection();
        playRollSound();
    }

    // Smooth rotation (A/D turning)
    let rotationInput = 0;
    if (!isRolling && !isFlipping) {
        if (keys['KeyA']) {
            rotationInput = 1;
            lastTurnTime = Date.now();
        }
        if (keys['KeyD']) {
            rotationInput = -1;
            lastTurnTime = Date.now();
        }
    }

    // Apply rotation acceleration
    currentRotationVelocity += rotationInput * rotationAcceleration;
    currentRotationVelocity *= damping;
    currentRotationVelocity = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, currentRotationVelocity));

    if (Math.abs(currentRotationVelocity) > 0.0005) {
        playerAirplane.rotateY(currentRotationVelocity);
    }

    // Banking: apply as absolute angle on the INNER model (not the airplane group)
    // This prevents accumulation - it's purely visual tilt
    const innerModel = playerAirplane.children[0];
    if (innerModel) {
        const targetBank = rotationInput * maxBankAngle; // Positive = tilt into turn
        currentBankAngle += (targetBank - currentBankAngle) * 0.05; // Smooth lerp
        if (Math.abs(currentBankAngle) < 0.001) currentBankAngle = 0;
        innerModel.rotation.z = currentBankAngle; // Absolute, not incremental
    }

    // Execute vertical flip (Q key) - elegant slow loop
    if (isFlipping) {
        const flipSpeed = 0.035;
        playerAirplane.rotateX(flipSpeed);
        flipProgress += flipSpeed;

        if (flipProgress >= Math.PI) {
            isFlipping = false;
            isStabilizing = true;
        }
    }
    // Execute barrel roll (mouse click) - slower and elegant
    else if (isRolling) {
        const rollSpeed = 0.045;
        const rollAmount = rollTargetDirection === 'left' ? rollSpeed : -rollSpeed;
        playerAirplane.rotateZ(rollAmount);
        rollProgress += rollSpeed;

        if (rollProgress >= Math.PI * 2) {
            isRolling = false;
            isStabilizing = true;
        }
    }
    // Stabilize after flip or roll
    else if (isStabilizing) {
        const currentUp = new THREE.Vector3(0, 1, 0).applyQuaternion(playerAirplane.quaternion);
        const targetUp = new THREE.Vector3(0, 1, 0);

        const rotationAxis = new THREE.Vector3().crossVectors(currentUp, targetUp).normalize();
        const angle = Math.acos(Math.max(-1, Math.min(1, currentUp.dot(targetUp))));

        if (angle > 0.01) {
            const stabilizationSpeed = 0.04;
            const quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle * stabilizationSpeed);
            playerAirplane.quaternion.multiplyQuaternions(quaternion, playerAirplane.quaternion);
        } else {
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

        // Normal pitch controls (W/S)
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
        spawnBullet(playerAirplane.position, playerAirplane.quaternion, true); // Local bullet
        fireBullet(playerAirplane.position, playerAirplane.quaternion);
        playShootSound();
    }

    if (fireCooldown > 0) {
        fireCooldown--;
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.mesh.position.add(bullet.velocity);
        bullet.lifetime--;

        let hitDetected = false;

        if (bullet.isLocal) {
            // Local bullets check collision with OTHER players
            for (const [id, otherPlayer] of Object.entries(players)) {
                const distance = bullet.mesh.position.distanceTo(otherPlayer.position);
                if (distance < 8) {
                    reportHit(id, getPlayerId());
                    hitDetected = true;
                    playExplosionSound();
                    break;
                }
            }
        } else {
            // Remote bullets check collision with LOCAL player
            const distance = bullet.mesh.position.distanceTo(playerAirplane.position);
            if (distance < 8) {
                hitDetected = true;
                // Damage is handled via Firebase onPlayerHit
            }
        }

        if (hitDetected || bullet.lifetime <= 0) {
            scene.remove(bullet.mesh);
            bullets.splice(i, 1);
        }
    }

    // Spawn engine particles
    if (Math.random() < 0.3) {
        spawnEngineParticle();
    }

    // Update engine particles
    for (let i = engineParticles.length - 1; i >= 0; i--) {
        const particle = engineParticles[i];
        particle.mesh.position.add(particle.velocity);
        particle.lifetime--;

        // Fade out
        const material = particle.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = particle.lifetime / 30;

        if (particle.lifetime <= 0) {
            scene.remove(particle.mesh);
            engineParticles.splice(i, 1);
        }
    }

    // Animate asteroids
    asteroids.forEach(asteroid => {
        const vel = (asteroid as any).velocity;
        const rotSpeed = (asteroid as any).rotationSpeed;

        asteroid.position.x += vel.x;
        asteroid.position.y += vel.y;
        asteroid.position.z += vel.z;

        asteroid.rotation.x += rotSpeed.x;
        asteroid.rotation.y += rotSpeed.y;
        asteroid.rotation.z += rotSpeed.z;

        // Wrap around if out of bounds
        if (Math.abs(asteroid.position.x) > 1200) asteroid.position.x *= -0.9;
        if (asteroid.position.y < 20 || asteroid.position.y > 300) vel.y *= -1;
        if (Math.abs(asteroid.position.z) > 1200) asteroid.position.z *= -0.9;
    });

    // Update firebase with new position and health
    updatePlayerPosition(playerAirplane, playerHealth);

    // Update camera to follow player - smooth third-person view
    const cameraOffset = new THREE.Vector3(0, 8, 20);
    const targetCamPos = cameraOffset.applyQuaternion(playerAirplane.quaternion).add(playerAirplane.position);
    camera.position.lerp(targetCamPos, 0.08); // Smooth camera follow
    camera.lookAt(playerAirplane.position);

    // Update health bar position and appearance
    playerHealthBar.position.copy(playerAirplane.position);
    playerHealthBar.position.y += 4;
    playerHealthBar.lookAt(camera.position);
    updateHealthBar(playerHealthBar, playerHealth, maxHealth);

    // Update HUD and Radar
    updateHUD();
    // Convert players object to Map for radar
    const playersMap = new Map<string, THREE.Group>();
    Object.entries(players).forEach(([id, player]) => {
        playersMap.set(id, player);
    });
    updateRadar(playersMap);

    renderer.render(scene, camera);
}

// Initialize game
async function initGame() {
    // Load airplane model
    playerAirplane = await loadAirplane();
    playerAirplane.position.y = 20; // Start higher to avoid immediate collision
    scene.add(playerAirplane);

    // Initialize multiplayer
    initMultiplayer(playerAirplane);

    // Listen for hits and kills
    onPlayerHit(handlePlayerHit);
    onKillReported(handleKillConfirmed);

    // Start game loop
    animate();
}

initGame();