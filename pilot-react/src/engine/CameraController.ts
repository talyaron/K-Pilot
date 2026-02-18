import { Vector3, Group, PerspectiveCamera } from 'three';
import { CAMERA_OFFSET } from '../constants/gameConstants';

export class CameraController {
  private offset = new Vector3(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);

  update(camera: PerspectiveCamera, airplane: Group): void {
    const worldOffset = this.offset
      .clone()
      .applyQuaternion(airplane.quaternion)
      .add(airplane.position);

    camera.position.copy(worldOffset);
    camera.lookAt(airplane.position);
  }
}
