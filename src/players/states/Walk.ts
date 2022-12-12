/*
 * Walk.ts
 * author: evan kirkiles
 * created on Sun Jun 26 2022
 * 2022 the player space,
 */

import { Player } from '../Player';
import { EndWalk } from './EndWalk';
import { PlayerStateBase } from './PlayerStateBase';
// eslint-disable-next-line
import { Idle, JumpRunning } from './_stateLibrary';

export class Walk extends PlayerStateBase {
  /**
   * Represents the walking animation for the player.
   * @param player
   */
  constructor(player: Player) {
    super(player);
    this.canEnterInteraction = true;
    this.player.setArcadeVelocityTarget(0.8);
    this.playAnimation('walk', 0.2);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 UPDATE LOOP                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Updates the camera and checks if falling
   * @param timeStep
   */
  public update(timeStep: number): void {
    super.update(timeStep);
    this.player.setCameraRelativeOrientationTarget();
    this.checkFallInAir();
  }

  /**
   * When a button input changes
   */
  public onInputChange(): void {
    super.onInputChange();
    if (!this.anyDirection()) this.player.setState(new EndWalk(this.player));
    if (this.player.inputManager.buttons.up.justPressed) this.player.setState(new JumpRunning(this.player));
    if (!this.anyDirection()) {
      if (this.player.velocity.length() > 1) {
        // this.player.setState(new EndWalk(this.player));
        this.player.setState(new Idle(this.player));
      } else {
        this.player.setState(new Idle(this.player));
      }
    }
  }
}
