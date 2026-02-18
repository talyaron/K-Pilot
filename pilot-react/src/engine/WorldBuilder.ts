import * as THREE from 'three';
import type { IWorldObjects } from '../types';
import type { IAsteroidMesh } from '../types';
import {
  GROUND_SIZE,
  STAR_COUNT,
  STAR_SPREAD,
  DISTANT_STAR_COUNT,
  DISTANT_STAR_SPREAD,
  TOWER_COUNT,
  PLATFORM_COUNT,
  ASTEROID_COUNT,
  RUNWAY_STRIP_COUNT,
  PLANET_POSITION,
  SUN_POSITION,
  WORLD_SPREAD,
  CLOUD_COUNT,
  CLOUD_SPREAD,
} from '../constants/sceneConstants';

export class WorldBuilder {
  build(scene: THREE.Scene): IWorldObjects {
    const sun = this.createSun(scene);
    const planet = this.createPlanet(scene);
    this.createStars(scene);
    this.createDistantStars(scene);
    this.createClouds(scene);
    this.createGround(scene);
    this.createGrids(scene);
    this.createRunwayStrips(scene);
    const towers = this.createTowers(scene);
    const platforms = this.createPlatforms(scene);
    const asteroids = this.createAsteroids(scene);

    return { asteroids, towers, platforms, sun, planet };
  }

  private createStars(scene: THREE.Scene): void {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      vertices.push(
        (Math.random() - 0.5) * STAR_SPREAD,
        Math.random() * 1000,
        (Math.random() - 0.5) * STAR_SPREAD,
      );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 });
    scene.add(new THREE.Points(geometry, material));
  }

  private createDistantStars(scene: THREE.Scene): void {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    for (let i = 0; i < DISTANT_STAR_COUNT; i++) {
      vertices.push(
        (Math.random() - 0.5) * DISTANT_STAR_SPREAD,
        Math.random() * 2000 + 500,
        (Math.random() - 0.5) * DISTANT_STAR_SPREAD,
      );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({
      color: 0xaaaaff,
      size: 2,
      transparent: true,
      opacity: 0.6,
    });
    scene.add(new THREE.Points(geometry, material));
  }

  private createPlanet(scene: THREE.Scene): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(30, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x6b8e99,
      emissive: 0x1a2a3a,
      emissiveIntensity: 0.3,
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(PLANET_POSITION.x, PLANET_POSITION.y, PLANET_POSITION.z);
    scene.add(planet);
    return planet;
  }

  private createSun(scene: THREE.Scene): THREE.Mesh {
    const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z);
    scene.add(sun);

    // Glow shell
    const glowGeometry = new THREE.SphereGeometry(12, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(sun.position);
    scene.add(glow);

    // Sun directional light
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.copy(sun.position);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 1000;
    scene.add(sunLight);

    return sun;
  }

  private createGround(scene: THREE.Scene): void {
    const geometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, 150, 150);
    const material = new THREE.MeshStandardMaterial({
      color: 0x0a0a15,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x0505aa,
      emissiveIntensity: 0.15,
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  private createGrids(scene: THREE.Scene): void {
    const mainGrid = new THREE.GridHelper(GROUND_SIZE, 60, 0x0066ff, 0x002244);
    mainGrid.position.y = 0.1;
    (mainGrid.material as THREE.Material).opacity = 0.4;
    (mainGrid.material as THREE.Material).transparent = true;
    scene.add(mainGrid);

    const fineGrid = new THREE.GridHelper(GROUND_SIZE, 300, 0x0033aa, 0x001133);
    fineGrid.position.y = 0.12;
    (fineGrid.material as THREE.Material).opacity = 0.2;
    (fineGrid.material as THREE.Material).transparent = true;
    scene.add(fineGrid);
  }

  private createRunwayStrips(scene: THREE.Scene): void {
    for (let i = 0; i < RUNWAY_STRIP_COUNT; i++) {
      const geometry = new THREE.BoxGeometry(10, 0.2, 200);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.7,
      });
      const strip = new THREE.Mesh(geometry, material);
      strip.position.set((i - 3.5) * 100, 0.2, 0);
      scene.add(strip);
    }
  }

  private createTowers(scene: THREE.Scene): THREE.Group[] {
    const towers: THREE.Group[] = [];

    for (let i = 0; i < TOWER_COUNT; i++) {
      const towerGroup = new THREE.Group();
      const towerHeight = Math.random() * 30 + 20;

      // Main cylinder
      const towerGeo = new THREE.CylinderGeometry(1.5, 2, towerHeight, 8);
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a3a,
        metalness: 1,
        roughness: 0.1,
        emissive: 0x0a0a2a,
        emissiveIntensity: 0.3,
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.y = towerHeight / 2;
      tower.castShadow = true;
      towerGroup.add(tower);

      // Glowing rings
      for (let j = 0; j < 3; j++) {
        const ringGeo = new THREE.TorusGeometry(2.2, 0.15, 8, 16);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 2,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = towerHeight * (0.3 + j * 0.3);
        ring.rotation.x = Math.PI / 2;
        towerGroup.add(ring);
      }

      // Top beacon
      const topGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const topMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 2.5,
      });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = towerHeight + 1;
      towerGroup.add(top);

      towerGroup.position.x = (Math.random() - 0.5) * WORLD_SPREAD;
      towerGroup.position.z = (Math.random() - 0.5) * WORLD_SPREAD;

      towers.push(towerGroup);
      scene.add(towerGroup);
    }

    return towers;
  }

  private createPlatforms(scene: THREE.Scene): THREE.Mesh[] {
    const platforms: THREE.Mesh[] = [];

    for (let i = 0; i < PLATFORM_COUNT; i++) {
      const size = Math.random() * 10 + 6;
      const geometry = new THREE.BoxGeometry(size, 0.8, size);
      const material = new THREE.MeshStandardMaterial({
        color: 0x2a2a4a,
        metalness: 1,
        roughness: 0.1,
        emissive: 0x0066ff,
        emissiveIntensity: 0.4,
      });
      const platform = new THREE.Mesh(geometry, material);
      platform.position.set(
        (Math.random() - 0.5) * WORLD_SPREAD,
        Math.random() * 20 + 8,
        (Math.random() - 0.5) * WORLD_SPREAD,
      );
      platform.castShadow = true;
      platform.receiveShadow = true;
      platforms.push(platform);
      scene.add(platform);

      // Underglow
      const glowGeo = new THREE.BoxGeometry(size + 2, 0.1, size + 2);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x0099ff,
        transparent: true,
        opacity: 0.6,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(platform.position);
      glow.position.y -= 0.6;
      scene.add(glow);
    }

    return platforms;
  }

  private createAsteroids(scene: THREE.Scene): IAsteroidMesh[] {
    const asteroids: IAsteroidMesh[] = [];

    for (let i = 0; i < ASTEROID_COUNT; i++) {
      const size = Math.random() * 8 + 3;
      const geometry = new THREE.DodecahedronGeometry(size, 0);
      const material = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.9,
        metalness: 0.1,
      });
      const asteroid = new THREE.Mesh(geometry, material) as unknown as IAsteroidMesh;
      asteroid.position.set(
        (Math.random() - 0.5) * WORLD_SPREAD,
        Math.random() * 200 + 50,
        (Math.random() - 0.5) * WORLD_SPREAD,
      );
      asteroid.castShadow = true;

      asteroid.velocity = {
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.1,
        z: (Math.random() - 0.5) * 0.2,
      };
      asteroid.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02,
      };

      asteroids.push(asteroid);
      scene.add(asteroid);
    }

    return asteroids;
  }

  private createClouds(scene: THREE.Scene): void {
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const cloudGroup = new THREE.Group();
      const puffCount = Math.floor(Math.random() * 5) + 4;

      for (let j = 0; j < puffCount; j++) {
        const radius = Math.random() * 14 + 6;
        const geo = new THREE.SphereGeometry(radius, 7, 7);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xaaddff,
          emissive: 0x2255aa,
          emissiveIntensity: 0.15,
          transparent: true,
          opacity: Math.random() * 0.12 + 0.08,
        });
        const puff = new THREE.Mesh(geo, mat);
        puff.position.set(
          (Math.random() - 0.5) * 35,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 35,
        );
        cloudGroup.add(puff);
      }

      cloudGroup.position.set(
        (Math.random() - 0.5) * CLOUD_SPREAD,
        Math.random() * 90 + 20,
        (Math.random() - 0.5) * CLOUD_SPREAD,
      );

      scene.add(cloudGroup);
    }
  }
}
