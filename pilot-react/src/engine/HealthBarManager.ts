import * as THREE from 'three';

export class HealthBarManager {
  private healthBarGroup: THREE.Group;
  private healthBar: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.healthBarGroup = new THREE.Group();

    const bgGeo = new THREE.PlaneGeometry(3, 0.3);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.healthBarGroup.add(new THREE.Mesh(bgGeo, bgMat));

    const healthGeo = new THREE.PlaneGeometry(3, 0.3);
    const healthMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.healthBar = new THREE.Mesh(healthGeo, healthMat);
    this.healthBar.position.z = 0.01;
    this.healthBarGroup.add(this.healthBar);

    scene.add(this.healthBarGroup);
  }

  update(
    airplanePosition: THREE.Vector3,
    cameraPosition: THREE.Vector3,
    health: number,
    maxHealth: number,
  ): void {
    this.healthBarGroup.position.copy(airplanePosition);
    this.healthBarGroup.position.y += 4;
    this.healthBarGroup.lookAt(cameraPosition);

    const percent = health / maxHealth;
    this.healthBar.scale.x = percent;
    this.healthBar.position.x = -(3 * (1 - percent)) / 2;

    const material = this.healthBar.material as THREE.MeshBasicMaterial;
    if (percent > 0.6) {
      material.color.setHex(0x00ff00);
    } else if (percent > 0.3) {
      material.color.setHex(0xffff00);
    } else {
      material.color.setHex(0xff6600);
    }
  }
}
