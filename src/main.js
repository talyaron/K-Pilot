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

import { planets } from './scene.js';

// Meteors
const meteors = [];
function createMeteor() {
    const geometry = new THREE.TetrahedronGeometry(Math.random() * 0.5 + 0.2, 0);
    const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const meteor = new THREE.Mesh(geometry, material);

    // Position randomly far away
    meteor.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        -150 - Math.random() * 50
    );

    // Random velocity
    meteor.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        0.5 + Math.random() * 0.5
    );

    scene.add(meteor);
    meteors.push(meteor);
}

// Initial meteors
for (let i = 0; i < 20; i++) createMeteor();

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

    // Update meteors
    meteors.forEach((meteor, index) => {
        meteor.position.add(meteor.userData.velocity);
        meteor.rotation.x += 0.01;
        meteor.rotation.y += 0.01;

        // Reset meteor if it goes too far
        if (meteor.position.z > 50) {
            meteor.position.z = -150;
            meteor.position.x = (Math.random() - 0.5) * 100;
            meteor.position.y = (Math.random() - 0.5) * 100;
        }
    });

    // Suble planet rotation
    planets.forEach(planet => {
        planet.rotation.y += 0.002;
    });

    // Update firebase with new position
    updatePlayerPosition(playerAirplane);

    // Update camera to follow player
    const a = (new THREE.Vector3(0, 2, 5)).applyQuaternion(playerAirplane.quaternion).add(playerAirplane.position)
    camera.position.copy(a);
    camera.lookAt(playerAirplane.position);


    renderer.render(scene, camera);
}

animate();