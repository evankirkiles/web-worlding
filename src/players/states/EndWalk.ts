/*
 * EndWalk.ts
 * author: evan kirkiles
 * created on Sun Jun 26 2022
 * 2022 the player space,
 */
import { Player } from '../Player';
import { Idle } from './Idle';
import { PlayerStateBase } from './PlayerStateBase';

export class EndWalk extends PlayerStateBase {
  /**
   * Stops the player from walking.
   * @param player
   */
  constructor(player: Player) {
    super(player);
    this.player.setArcadeVelocityTarget(0);
    this.animationLength = player.setAnimation('stop', 0.1);
  }

  /**
   * Check for animation finish and fall begins
   * @param timeStep
   */
  public update(timeStep: number): void {
    super.update(timeStep);
    if (this.animationEnded(timeStep)) {
      this.player.setState(new Idle(this.player));
    }
    this.checkFallInAir();
  }
}
