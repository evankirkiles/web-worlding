/*
 * Idle.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */

import { Player } from '../Player';
import { JumpIdle } from './JumpIdle';
import { PlayerStateBase } from './PlayerStateBase';
import { Walk } from './Walk';

export class Idle extends PlayerStateBase {
  /**
   * Add an Idle state to the Player, which immediately plays it.
   * @param player
   */
  constructor(player: Player) {
    super(player);
    // set simulator options
    this.player.velocitySimulator.damping = 0.6;
    this.player.velocitySimulator.mass = 10;
    this.player.setArcadeVelocityTarget(0);
    this.playAnimation('idle', 0.1);
  }

  /**
   * Updates the animation and checks if the player should be falling
   * @param timeStep The timestep to use in calculations
   */
  public update(timeStep: number): void {
    super.update(timeStep);
    this.checkFallInAir();
  }

  /**
   * When an input event happens, listen for new state transitions.
   */
  public onInputChange(): void {
    super.onInputChange();
    if (this.player.inputManager.buttons.up.justPressed) {
      this.player.setState(new JumpIdle(this.player));
    }
    if (this.anyDirection()) {
      if (this.player.velocity.length() > 0.5) {
        this.player.setState(new Walk(this.player));
      } else {
        this.player.setState(new Walk(this.player));
        // this.setAppropriateStartWalkState();
      }
    }
  }
}
