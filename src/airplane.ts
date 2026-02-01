import * as THREE from 'three';

export function createAirplane(): THREE.Group {
    const airplane = new THREE.Group();
    airplane.scale.set(2.5, 2.5, 2.5); // Make airplane 2.5x bigger

    // Body
    const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    airplane.add(body);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(3, 0.1, 0.8);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.castShadow = true;
    wing.receiveShadow = true;
    wing.position.y = 0.1;
    airplane.add(wing);

    // Tail
    const tailGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.castShadow = true;
    tail.receiveShadow = true;
    tail.position.set(0, 0.5, -0.75);
    airplane.add(tail);

    return airplane;
}