import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ── Regular bullet (Space key) ──────────────────────────────────────────────
const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xfff000 });

export function createBullet(): THREE.Mesh {
    return new THREE.Mesh(bulletGeometry, bulletMaterial);
}

// ── Rocket (G key) — loaded from blendFiles/rocket.blend1 ──────────────────
const loader = new GLTFLoader();
let rocketTemplate: THREE.Group | null = null;

loader.load(
    '/rocket.glb',
    /* onLoad */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gltf: any) => {
        const scene: THREE.Group = gltf.scene;
        scene.scale.set(2, 2, 2);

        // Replace every Blender PBR material with a flat always-visible color.
        // Blender exports MeshStandardMaterial which needs lights; MeshBasicMaterial
        // is always fully lit regardless of scene lighting.
        scene.traverse((child: THREE.Object3D) => {
            if (!(child as THREE.Mesh).isMesh) return;
            const mesh = child as THREE.Mesh;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mesh.material = new THREE.MeshBasicMaterial({
                color: (mats[0] as THREE.MeshStandardMaterial).color ?? new THREE.Color(0xcccccc),
            });
        });

        rocketTemplate = scene;
        console.log('[Rocket] rocket.glb loaded successfully');
    },
    /* onProgress */ undefined,
    /* onError */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err: any) => console.warn('[Rocket] rocket.glb failed, using fallback:', err)
);

// Procedural fallback — visible until the GLB loads, or if it fails
function buildFallbackRocket(): THREE.Group {
    const root = new THREE.Group();

    // Body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 2.2, 8),
        new THREE.MeshBasicMaterial({ color: 0xdddddd })
    );
    body.rotation.x = Math.PI / 2;
    root.add(body);

    // Nose — tip toward -Z (forward)
    const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.7, 8),
        new THREE.MeshBasicMaterial({ color: 0xff3300 })
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -1.45;
    root.add(nose);

    // Fins
    const finMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const hFin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.55), finMat);
    hFin.position.z = 0.9;
    root.add(hFin);
    const vFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.55), finMat);
    vFin.position.z = 0.9;
    root.add(vFin);

    return root;
}

export function createRocket(): THREE.Group {
    const root = new THREE.Group();

    if (rocketTemplate) {
        root.add(rocketTemplate.clone(true));
    } else {
        const fallback = buildFallbackRocket();
        root.add(fallback);
    }

    // Orange point light — makes the rocket glow and illuminate surroundings
    const light = new THREE.PointLight(0xff6600, 8, 40);
    root.add(light);

    return root;
}
