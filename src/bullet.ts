import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ── Regular bullet (Space key) ──────────────────────────────────────────────
const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xfff000 });

export function createBullet(): THREE.Mesh {
    return new THREE.Mesh(bulletGeometry, bulletMaterial);
}

// ── Rocket (G key) ─────────────────────────────────────────────────────────
const loader = new GLTFLoader();
let rocketTemplate: THREE.Group | null = null;

loader.load(
    '/rocket.glb',
    (gltf: { scene: THREE.Group }) => {
        rocketTemplate = gltf.scene;
        rocketTemplate.scale.set(2, 2, 2);
        // Override Blender PBR materials with flat-shaded colors so the
        // rocket is always visible regardless of scene lighting.
        rocketTemplate.traverse((child: THREE.Object3D) => {
            if (!(child as THREE.Mesh).isMesh) return;
            const mesh = child as THREE.Mesh;
            const oldMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            const color = (oldMat as any).color ?? new THREE.Color(0xcccccc);
            mesh.material = new THREE.MeshBasicMaterial({ color });
        });
        console.log('rocket.glb loaded');
    },
    undefined,
    (err: unknown) => console.warn('rocket.glb failed, using fallback:', err)
);

// Procedural fallback — used until the GLB finishes loading
function buildFallbackRocket(): THREE.Group {
    const rocket = new THREE.Group();

    // Body — silver cylinder along Z axis
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 2.2, 8),
        new THREE.MeshBasicMaterial({ color: 0xdddddd })
    );
    body.rotation.x = Math.PI / 2;
    rocket.add(body);

    // Nose — orange-red cone, tip toward -Z
    const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.7, 8),
        new THREE.MeshBasicMaterial({ color: 0xff3300 })
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -1.45;
    rocket.add(nose);

    // Fins (+ cross at tail)
    const finMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const hFin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.55), finMat);
    hFin.position.z = 0.9;
    rocket.add(hFin);
    const vFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.55), finMat);
    vFin.position.z = 0.9;
    rocket.add(vFin);

    return rocket;
}

export function createRocket(): THREE.Group {
    if (rocketTemplate) {
        return rocketTemplate.clone(true);
    }
    return buildFallbackRocket();
}
