import * as THREE from 'three';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, set } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDl1OK1RAnBwbdWxEwlgZv869agSQn-mlQ",
    authDomain: "project-keco.firebaseapp.com",
    databaseURL: "https://project-keco-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "project-keco",
    storageBucket: "project-keco.firebasestorage.app",
    messagingSenderId: "859756799800",
    appId: "1:859756799800:web:1e500da3e8a8cbcd4f83cd",
    measurementId: "G-ZR83Y597DN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(2, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x336633 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Function to create a simple airplane
function createAirplane() {
    const airplane = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    airplane.add(body);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(3, 0.1, 0.8);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.castShadow = true;
    wing.receiveShadow = true;
    wing.position.y = 0.1;
    airplane.add(wing);

    // Tail
    const tailGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.castShadow = true;
    tail.receiveShadow = true;
    tail.position.set(0, 0.5, -0.75);
    airplane.add(tail);


    return airplane;
}

// Player's airplane
const playerAirplane = createAirplane();
playerAirplane.position.y = 1;
playerAirplane.name = "player";
scene.add(playerAirplane);

// Multiplayer
const players = {};
const playersRef = ref(database, 'players');
const playerId = Math.random().toString(36).substring(7);
const playerRef = ref(database, 'players/' + playerId);

onDisconnect(playerRef).remove();

set(playerRef, {
    position: playerAirplane.position.toArray(),
    rotation: playerAirplane.rotation.toArray(),
});

onChildAdded(playersRef, (snapshot) => {
    if (snapshot.key === playerId) return;
    const data = snapshot.val();
    const newPlayer = createAirplane();
    newPlayer.position.fromArray(data.position);
    newPlayer.rotation.fromArray(data.rotation);
    players[snapshot.key] = newPlayer;
    scene.add(newPlayer);
});

onChildChanged(playersRef, (snapshot) => {
    if (snapshot.key === playerId) return;
    const data = snapshot.val();
    const player = players[snapshot.key];
    if (player) {
        player.position.fromArray(data.position);
        player.rotation.fromArray(data.rotation);
    }
});

onChildRemoved(playersRef, (snapshot) => {
    if (snapshot.key === playerId) return;
    const player = players[snapshot.key];
    if (player) {
        scene.remove(player);
        delete players[snapshot.key];
    }
});


// Animation loop
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

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

    // update firebase
    set(playerRef, {
        position: playerAirplane.position.toArray(),
        rotation: playerAirplane.rotation.toArray(),
    });

    // update camera to follow player
    const a = (new THREE.Vector3(0, 2, 5)).applyQuaternion(playerAirplane.quaternion).add(playerAirplane.position)
    camera.position.copy(a);
    camera.lookAt(playerAirplane.position);


    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
