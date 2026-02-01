import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();

export function loadAirplane(): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        loader.load(
            '/planes/b2 bomber/plane 1/plane1.glb',
            (gltf) => {
                const airplane = gltf.scene;
                airplane.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed

                // Enable shadows for all meshes in the model
                airplane.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                resolve(airplane);
            },
            undefined,
            (error) => {
                console.error('Error loading airplane model:', error);
                reject(error);
            }
        );
    });
}
