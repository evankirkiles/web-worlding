/*
 * JumpRunning.ts
 * author: evan kirkiles
 * created on Tue Jun 28 2022
 * 2022 the player space,
 */
import { Player } from '../Player';
import { Falling } from './Falling';
import { PlayerStateBase } from './PlayerStateBase';

export class JumpRunning extends PlayerStateBase {
  private alreadyJumped: boolean;

  /**
   * The player jump state when running
   * @param player
   */
  constructor(player: Player) {
    super(player);
    this.player.velocitySimulator.mass = 100;
    this.playAnimation('jump', 0.03);
    this.alreadyJumped = false;
  }

  /**
   * Recalculate the jump
   * @param timeStep
   */
  public update(timeStep: number): void {
    super.update(timeStep);
    this.player.setCameraRelativeOrientationTarget();
    // move in the air
    if (this.alreadyJumped) {
      this.player.setArcadeVelocityTarget(this.anyDirection() ? 0.8 : 0);
    }
    // physically jump
    if (this.timer > 0.13 && !this.alreadyJumped) {
      this.player.jump(4);
      this.alreadyJumped = true;
      this.player.rotationSimulator.damping = 0.3;
      this.player.arcadeVelocityIsAdditive = true;
      this.player.setArcadeVelocityInfluence(0.05, 0, 0.05);
    } else if (this.timer > 0.24 && this.player.rayHasHit) {
      this.setAppropriateDropState();
    } else if (this.animationEnded(timeStep)) {
      this.player.setState(new Falling(this.player));
    }
  }
}
