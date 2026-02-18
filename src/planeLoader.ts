import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();

export function loadAirplane(): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        loader.load(
            '/planes/b2 bomber/plane 1/plane1.glb',
            (gltf) => {
                // Structure: wrapper > bankPivot > model
                // wrapper: game controls rotation (heading + pitch)
                // bankPivot: visual banking tilt only
                // model: GLTF model with orientation fix
                const wrapper = new THREE.Group();
                const bankPivot = new THREE.Group();
                bankPivot.name = 'bankPivot';

                const model = gltf.scene;
                model.scale.set(0.5, 0.5, 0.5);
                model.rotation.y = -Math.PI / 2; // Face forward (-Z)

                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                bankPivot.add(model);
                wrapper.add(bankPivot);
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
