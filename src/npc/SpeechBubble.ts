/*
 * SpeechBubble.ts
 * author: evan kirkiles
 * created on Sun May 07 2023
 * 2023 the nobot space, 
 */
import * as THREE from 'three';
import { EntityType } from '../enums/EntityType';
import { World } from '../world/World';
import { IUpdatable } from '../interfaces/IUpdatable';

export class SpeechBubble extends THREE.Object3D implements IUpdatable {
  updateOrder = 1;
  entityType: EntityType = EntityType.Decoration;

  world: World;

  mesh: THREE.Mesh;

  constructor(world: World) {
    super();
    const texture = new THREE.TextureLoader().load('/examples/assets/speechbubble.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }),
    );
    this.mesh.position.set(0.4, 0, 0);
    this.add(this.mesh);
    this.world = world;
  }

  /**
   *
   * @param timestep
   * @param unscaledTimeStep
   */
  update(): void {
    if (!this.world) return;
    // this.rotation.setFromRotationMatrix(this.world.camera.matrix);
    this.lookAt(this.world.camera.position);
  }
}
