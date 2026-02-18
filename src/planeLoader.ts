import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();

export function loadAirplane(): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        loader.load(
            '/planes/b2 bomber/plane 1/plane1.glb',
            (gltf) => {
                // Wrap in a parent group so we can fix the model's orientation
                // without affecting the game's rotation logic
                const wrapper = new THREE.Group();
                const model = gltf.scene;
                model.scale.set(0.5, 0.5, 0.5);

                // Rotate the inner model so it faces forward (-Z in Three.js)
                // The GLB model faces the wrong direction, so rotate it
                model.rotation.y = Math.PI; // 180 degrees to face -Z

                // Enable shadows for all meshes in the model
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                wrapper.add(model);
                resolve(wrapper);
            },
            undefined,
            (error) => {
                console.error('Error loading airplane model:', error);
                reject(error);
            }
        );
    });
}
