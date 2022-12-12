/*
 * InteractionEntryInstance.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */
import * as THREE from 'three';
import { Player } from './Player';

export class InteractionEntryInstance {
  public player: Player;
  public entryPoint?: THREE.Object3D;

  /**
   * Create an interaction entry instance, which manages how a character enters
   * into an interaction (i.e. sitting down, walking in, etc.).
   * @param player
   */
  constructor(player: Player) {
    this.player = player;
  }

  /**
   * Updates the interaction every timestep
   * @param timeStep The timestep to use in calculations
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(timeStep: number): void {
    const entryPointWorldPos = new THREE.Vector3();
    this.entryPoint?.getWorldPosition(entryPointWorldPos);
    const viewVector = new THREE.Vector3().subVectors(entryPointWorldPos, this.player.position);
    this.player.setOrientation(viewVector);
  }
}
