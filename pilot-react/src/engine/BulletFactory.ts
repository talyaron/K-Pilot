import {
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  Group,
  CylinderGeometry,
  ConeGeometry,
  BoxGeometry,
  Color,
  PointLight,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ── Regular bullet ──────────────────────────────────────────────────────────
const bulletGeometry = new SphereGeometry(0.1, 8, 8);
const bulletMaterial = new MeshBasicMaterial({ color: 0xfff000 });

export function createBulletMesh(): Mesh {
  return new Mesh(bulletGeometry, bulletMaterial);
}

// ── Rocket ──────────────────────────────────────────────────────────────────
const loader = new GLTFLoader();
let rocketTemplate: Group | null = null;

loader.load(
  '/rocket.glb',
  (gltf) => {
    const model = gltf.scene as Group;
    model.scale.set(2, 2, 2);
    // Nose is at +X after Blender export — rotate +90° around Y (left turn)
    // to bring it to -Z (the airplane's forward direction).
    model.rotation.y = Math.PI / 2;
    model.traverse((child) => {
      if (!(child as Mesh).isMesh) return;
      const mesh = child as Mesh;
      const oldMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const color = (oldMat as any).color ?? new Color(0xcccccc);
      mesh.material = new MeshBasicMaterial({ color });
    });
    rocketTemplate = model;
    console.log('rocket.glb loaded from rocket.blend1');
  },
  undefined,
  (err) => console.warn('rocket.glb failed, using fallback:', err),
);

function buildFallbackRocket(): Group {
  const rocket = new Group();

  const body = new Mesh(
    new CylinderGeometry(0.18, 0.22, 2.2, 8),
    new MeshBasicMaterial({ color: 0xdddddd }),
  );
  body.rotation.x = Math.PI / 2;
  rocket.add(body);

  const nose = new Mesh(
    new ConeGeometry(0.18, 0.7, 8),
    new MeshBasicMaterial({ color: 0xff3300 }),
  );
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -1.45;
  rocket.add(nose);

  const finMat = new MeshBasicMaterial({ color: 0x888888 });
  const hFin = new Mesh(new BoxGeometry(1.1, 0.06, 0.55), finMat);
  hFin.position.z = 0.9;
  rocket.add(hFin);
  const vFin = new Mesh(new BoxGeometry(0.06, 1.1, 0.55), finMat);
  vFin.position.z = 0.9;
  rocket.add(vFin);

  return rocket;
}

export function createRocketMesh(): Group {
  const root = new Group();

  // Add the rocket body (GLB or fallback)
  const body = rocketTemplate ? rocketTemplate.clone(true) : buildFallbackRocket();
  root.add(body);

  // Orange glow so the rocket is always visible and lights up surroundings
  const light = new PointLight(0xff6600, 8, 40);
  root.add(light);

  return root;
}
