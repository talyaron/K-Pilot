import * as THREE from 'three';
// @ts-expect-error - GLTFLoader types may not resolve for this three.js version
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const MODEL_PATH = '/planes/b2-bomber/plane1/plane1.glb';
const MODEL_SCALE = 0.5;

const loader = new GLTFLoader();

export function loadAirplane(): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    loader.load(
      MODEL_PATH,
      (gltf: { scene: THREE.Group }) => {
        const model = gltf.scene;
        model.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
        model.rotation.y = Math.PI / 2;

        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Wrap in a parent group so the model rotation stays local
        // and doesn't interfere with flight controller transforms
        const wrapper = new THREE.Group();
        wrapper.add(model);
        resolve(wrapper);
      },
      undefined,
      (error: Error) => {
        console.error('Error loading airplane model:', error);
        reject(error);
      },
    );
  });
}
