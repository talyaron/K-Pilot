import * as THREE from 'three';
import './style.css';
import { scene, renderer, camera } from './scene.js';
import { createAirplane } from './airplane.js';
import { keys } from './controls.js';
import { initMultiplayer, updatePlayerPosition } from './firebase.js';

// Player's airplane
const playerAirplane = createAirplane();
playerAirplane.position.y = 1;
scene.add(playerAirplane);

// Initialize multiplayer
initMultiplayer(playerAirplane);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const speed = 0.1;
    const rotationSpeed = 0.05;

    if (keys['KeyW']) {
        playerAirplane.translateZ(-speed);
    }
    if (keys['KeyS']) {
        playerAirplane.translateZ(speed);
    }
    if (keys['KeyA']) {
        playerAirplane.rotateY(rotationSpeed);
    }
    if (keys['KeyD']) {
        playerAirplane.rotateY(-rotationSpeed);
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