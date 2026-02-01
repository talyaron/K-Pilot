import * as THREE from 'three';

const particleMaterial = new THREE.PointsMaterial({
    color: 0xffa500,
    size: 0.2,
    blending: THREE.AdditiveBlending,
    transparent: true,
    sizeAttenuation: true,
});

const particlesPerExplosion = 20;

export function createExplosion(position: THREE.Vector3, scene: THREE.Scene) {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = [];
    const particleVelocities = [];

    for (let i = 0; i < particlesPerExplosion; i++) {
        particlePositions.push(position.x, position.y, position.z);
        particleVelocities.push(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
    }

    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    
    const explosion = new THREE.Points(particlesGeometry, particleMaterial);
    
    scene.add(explosion);

    return {
        mesh: explosion,
        velocities: particleVelocities,
        lifetime: 60, // 60 frames
    };
}
