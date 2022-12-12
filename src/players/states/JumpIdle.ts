/*
 * JumpIdle.ts
 * author: evan kirkiles
 * created on Mon Jun 27 2022
 * 2022 the player space,
 */

import { Player } from '../Player';
import { Falling } from './Falling';
import { PlayerStateBase } from './PlayerStateBase';

export class JumpIdle extends PlayerStateBase {
  private alreadyJumped: boolean;

  /**
   * Begins a jump from idle player
   * @param player
   */
  constructor(player: Player) {
    super(player);
    this.player.velocitySimulator.mass = 30;
    this.player.setArcadeVelocityTarget(0);
    this.playAnimation('jump', 0.1);
    this.alreadyJumped = false;
  }

  /**
   * Updates the player's Y position while in a jump
   * @param timestep
   */
  public update(timestep: number) {
    super.update(timestep);
    // move in air
    if (this.alreadyJumped) {
      this.player.setCameraRelativeOrientationTarget();
      this.player.setArcadeVelocityTarget(this.anyDirection() ? 0.8 : 0);
    }
    // physicall jump
    if (this.timer > 0.2 && !this.alreadyJumped) {
      this.player.jump();
      this.alreadyJumped = true;
      this.player.velocitySimulator.mass = 100;
      this.player.rotationSimulator.damping = 0.3;
      if (this.player.rayResult.body && this.player.rayResult.body.velocity.length() > 0) {
        this.player.setArcadeVelocityInfluence(0, 0, 0);
      } else {
        this.player.setArcadeVelocityInfluence(0.3, 0, 0.3);
      }
    } else if (this.timer > 0.3 && this.player.rayHasHit) {
      this.setAppropriateDropState();
    } else if (this.animationEnded(timestep)) {
      this.player.setState(new Falling(this.player));
    }
  }
}
