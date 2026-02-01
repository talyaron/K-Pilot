import * as THREE from 'three';

// Scene
export const scene: THREE.Scene = new THREE.Scene();

// Camera
export const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Renderer
export const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(2, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Space background
scene.background = new THREE.Color(0x000510); // Deep space blue-black

// Add stars
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 5000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = Math.random() * 1000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 1.5 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Distant planet/moon
const planetGeometry = new THREE.SphereGeometry(30, 32, 32);
const planetMaterial = new THREE.MeshStandardMaterial({
    color: 0x6B8E99,
    emissive: 0x1a2a3a,
    emissiveIntensity: 0.3
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(-200, 100, -400);
scene.add(planet);

// Bright star/sun
const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(150, 120, -300);
scene.add(sun);

// Add glow to sun
const glowGeometry = new THREE.SphereGeometry(12, 32, 32);
const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFDD88,
    transparent: true,
    opacity: 0.3
});
const glow = new THREE.Mesh(glowGeometry, glowMaterial);
glow.position.copy(sun.position);
scene.add(glow);

// Sun light
const sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
sunLight.position.copy(sun.position);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 1000;
scene.add(sunLight);

// Space platform ground - larger and more futuristic
const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    metalness: 0.8,
    roughness: 0.3,
    emissive: 0x0a0a1a,
    emissiveIntensity: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Glowing grid on ground
const gridHelper = new THREE.GridHelper(2000, 100, 0x00ffff, 0x004466);
gridHelper.position.y = 0.15;
gridHelper.material.opacity = 0.6;
gridHelper.material.transparent = true;
scene.add(gridHelper);

// Add energy lines that glow
for (let i = 0; i < 20; i++) {
    const lineGeometry = new THREE.BoxGeometry(0.2, 0.3, Math.random() * 50 + 20);
    const lineMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8
    });
    const line = new THREE.Mesh(lineGeometry, lineMaterial);

    line.position.x = (Math.random() - 0.5) * 1800;
    line.position.y = 0.3;
    line.position.z = (Math.random() - 0.5) * 1800;
    line.rotation.y = Math.random() * Math.PI;

    scene.add(line);
}

// Space station structures - towers
for (let i = 0; i < 15; i++) {
    const towerGroup = new THREE.Group();

    // Main tower
    const towerHeight = Math.random() * 20 + 15;
    const towerGeometry = new THREE.CylinderGeometry(2, 2.5, towerHeight, 6);
    const towerMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a4a,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x1a1a3a,
        emissiveIntensity: 0.2
    });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = towerHeight / 2;
    tower.castShadow = true;
    towerGroup.add(tower);

    // Glowing top
    const topGeometry = new THREE.CylinderGeometry(1.5, 2, 2, 6);
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.5
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = towerHeight + 1;
    towerGroup.add(top);

    towerGroup.position.x = (Math.random() - 0.5) * 1600;
    towerGroup.position.z = (Math.random() - 0.5) * 1600;

    scene.add(towerGroup);
}

// Floating platforms
for (let i = 0; i < 10; i++) {
    const platformSize = Math.random() * 8 + 5;
    const platformGeometry = new THREE.BoxGeometry(platformSize, 0.5, platformSize);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a5a,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x0066ff,
        emissiveIntensity: 0.3
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);

    platform.position.x = (Math.random() - 0.5) * 1500;
    platform.position.y = Math.random() * 15 + 5;
    platform.position.z = (Math.random() - 0.5) * 1500;
    platform.castShadow = true;
    platform.receiveShadow = true;

    scene.add(platform);

    // Add glow underneath platforms
    const glowGeometry = new THREE.BoxGeometry(platformSize + 1, 0.1, platformSize + 1);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x0066ff,
        transparent: true,
        opacity: 0.4
    });
    const platformGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    platformGlow.position.copy(platform.position);
    platformGlow.position.y -= 0.5;
    scene.add(platformGlow);
}

// Add fog for atmospheric depth
scene.fog = new THREE.Fog(0x000510, 100, 800);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});