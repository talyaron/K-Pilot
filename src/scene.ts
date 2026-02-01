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

// Space platform ground - sleek hexagonal design
const groundGeometry = new THREE.PlaneGeometry(3000, 3000, 150, 150);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a15,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0x0505AA,
    emissiveIntensity: 0.15
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Sophisticated grid pattern
const mainGridHelper = new THREE.GridHelper(3000, 60, 0x0066ff, 0x002244);
mainGridHelper.position.y = 0.1;
mainGridHelper.material.opacity = 0.4;
mainGridHelper.material.transparent = true;
scene.add(mainGridHelper);

// Secondary finer grid
const fineGridHelper = new THREE.GridHelper(3000, 300, 0x0033aa, 0x001133);
fineGridHelper.position.y = 0.12;
fineGridHelper.material.opacity = 0.2;
fineGridHelper.material.transparent = true;
scene.add(fineGridHelper);

// Add runway-style energy strips
for (let i = 0; i < 8; i++) {
    const stripGeometry = new THREE.BoxGeometry(10, 0.2, 200);
    const stripMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.7
    });
    const strip = new THREE.Mesh(stripGeometry, stripMaterial);

    strip.position.x = (i - 3.5) * 100;
    strip.position.y = 0.2;
    strip.position.z = 0;

    scene.add(strip);
}

// Space station structures - sleek towers
for (let i = 0; i < 20; i++) {
    const towerGroup = new THREE.Group();

    // Main tower - sleeker design
    const towerHeight = Math.random() * 30 + 20;
    const towerGeometry = new THREE.CylinderGeometry(1.5, 2, towerHeight, 8);
    const towerMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a3a,
        metalness: 1,
        roughness: 0.1,
        emissive: 0x0a0a2a,
        emissiveIntensity: 0.3
    });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = towerHeight / 2;
    tower.castShadow = true;
    towerGroup.add(tower);

    // Glowing rings on tower
    for (let j = 0; j < 3; j++) {
        const ringGeometry = new THREE.TorusGeometry(2.2, 0.15, 8, 16);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 2
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = towerHeight * (0.3 + j * 0.3);
        ring.rotation.x = Math.PI / 2;
        towerGroup.add(ring);
    }

    // Glowing top beacon
    const topGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 2.5
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = towerHeight + 1;
    towerGroup.add(top);

    towerGroup.position.x = (Math.random() - 0.5) * 2000;
    towerGroup.position.z = (Math.random() - 0.5) * 2000;

    scene.add(towerGroup);
}

// Floating platforms - more variety
for (let i = 0; i < 15; i++) {
    const platformSize = Math.random() * 10 + 6;
    const platformGeometry = new THREE.BoxGeometry(platformSize, 0.8, platformSize);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a4a,
        metalness: 1,
        roughness: 0.1,
        emissive: 0x0066ff,
        emissiveIntensity: 0.4
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);

    platform.position.x = (Math.random() - 0.5) * 2000;
    platform.position.y = Math.random() * 20 + 8;
    platform.position.z = (Math.random() - 0.5) * 2000;
    platform.castShadow = true;
    platform.receiveShadow = true;

    scene.add(platform);

    // Add bright underglow
    const glowGeometry = new THREE.BoxGeometry(platformSize + 2, 0.1, platformSize + 2);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x0099ff,
        transparent: true,
        opacity: 0.6
    });
    const platformGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    platformGlow.position.copy(platform.position);
    platformGlow.position.y -= 0.6;
    scene.add(platformGlow);
}

// Moving Asteroids
export const asteroids: THREE.Mesh[] = [];
for (let i = 0; i < 30; i++) {
    const size = Math.random() * 8 + 3;
    const asteroidGeometry = new THREE.DodecahedronGeometry(size, 0);
    const asteroidMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.9,
        metalness: 0.1
    });
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

    asteroid.position.x = (Math.random() - 0.5) * 2000;
    asteroid.position.y = Math.random() * 200 + 50;
    asteroid.position.z = (Math.random() - 0.5) * 2000;

    asteroid.castShadow = true;

    // Store velocity for animation
    (asteroid as any).velocity = {
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.1,
        z: (Math.random() - 0.5) * 0.2
    };
    (asteroid as any).rotationSpeed = {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02
    };

    asteroids.push(asteroid);
    scene.add(asteroid);
}

// Add more stars in different layers for depth
const distantStarGeometry = new THREE.BufferGeometry();
const distantStarVertices = [];
for (let i = 0; i < 3000; i++) {
    const x = (Math.random() - 0.5) * 4000;
    const y = Math.random() * 2000 + 500;
    const z = (Math.random() - 0.5) * 4000;
    distantStarVertices.push(x, y, z);
}
distantStarGeometry.setAttribute('position', new THREE.Float32BufferAttribute(distantStarVertices, 3));
const distantStarMaterial = new THREE.PointsMaterial({ color: 0xaaaaff, size: 2, transparent: true, opacity: 0.6 });
const distantStars = new THREE.Points(distantStarGeometry, distantStarMaterial);
scene.add(distantStars);

// Add fog for atmospheric depth
scene.fog = new THREE.Fog(0x000510, 200, 1200);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});