import * as THREE from 'three';

// Scene
export const scene = new THREE.Scene();

// Camera
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Renderer
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Dimmer ambient light for space
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 1000); // Bright point light from the "Sun"
sunLight.position.set(50, 50, -100);
scene.add(sunLight);

// Stars
function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.8
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 1000;
        const y = (Math.random() - 0.5) * 1000;
        const z = (Math.random() - 0.5) * 1000;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}
createStars();

// Sun
const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc33 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(50, 50, -100);
scene.add(sun);

// Planets
function createPlanet(radius, color, position) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.2
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.copy(position);
    scene.add(planet);
    return planet;
}

export const planets = [
    createPlanet(5, 0x2244ff, new THREE.Vector3(-30, 10, -80)), // Blue planet
    createPlanet(8, 0xff5522, new THREE.Vector3(40, -20, -120)), // Red planet
    createPlanet(4, 0x66ff66, new THREE.Vector3(-60, -15, -150)) // Green planet
];

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});