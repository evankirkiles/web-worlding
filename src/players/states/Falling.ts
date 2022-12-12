/*
 * Falling.ts
 * author: evan kirkiles
 * created on Mon Jun 27 2022
 * 2022 the player space,
 */

import { Player } from '../Player';
import { PlayerStateBase } from './PlayerStateBase';

export class Falling extends PlayerStateBase {
  /**
   * Add a falling state to the player
   * @param player
   */
  constructor(player: Player) {
    super(player);
    this.player.velocitySimulator.mass = 100;
    this.player.rotationSimulator.damping = 0.3;
    this.player.arcadeVelocityIsAdditive = true;
    this.player.setArcadeVelocityTarget(0.05, 0, 0.05);
    this.playAnimation('falling', 0.3);
  }

  /**
   * Update listeners for changing state on ground hit
   * @param timestep
   */
  public update(timestep: number): void {
    super.update(timestep);
    this.player.setCameraRelativeOrientationTarget();
    this.player.setArcadeVelocityTarget(this.anyDirection() ? 0.8 : 0);
    if (this.player.rayHasHit) {
      this.setAppropriateDropState();
    }
  }
}
