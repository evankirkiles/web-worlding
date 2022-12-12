/*
 * StartWalkBase.ts
 * author: evan kirkiles
 * created on Sun Jun 26 2022
 * 2022 the player space,
 */
import { Player } from '../Player';
import { PlayerStateBase } from './PlayerStateBase';
import { Walk } from './Walk';

export class StartWalkBase extends PlayerStateBase {
  /**
   * Inherited constructor for a player state for beginning to walk.
   * @param player
   */
  constructor(player: Player) {
    super(player);
    this.canEnterInteraction = true;
    this.player.rotationSimulator.mass = 20;
    this.player.rotationSimulator.damping = 0.7;
    this.player.setArcadeVelocityTarget(0.8);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 UPDATE LOOP                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Runs the start walk animation until it finishes, and then begins the real
   * walk animation.
   * @param timestep
   */
  public update(timestep: number): void {
    super.update(timestep);
    if (this.animationEnded(timestep)) {
      this.player.setState(new Walk(this.player));
    }
    this.player.setCameraRelativeOrientationTarget();
    this.checkFallInAir();
  }

  /**
   * When the input to the player from user changes
   */
  public onInputChange(): void {
    super.onInputChange();
  }
}
