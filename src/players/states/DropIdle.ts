/*
 * DropIdle.ts
 * author: evan kirkiles
 * created on Tue Jun 28 2022
 * 2022 the player space,
 */

import { Player } from '../Player';
import { Idle } from './Idle';
import { JumpIdle } from './JumpIdle';
import { PlayerStateBase } from './PlayerStateBase';
import { StartWalkForward } from './StartWalkForward';
import { Walk } from './Walk';

export class DropIdle extends PlayerStateBase {
  /**
   * Drop state, when the Player is not moving too fast.
   * @param player
   */
  constructor(player: Player) {
    super(player);
    this.player.velocitySimulator.damping = 0.5;
    this.player.velocitySimulator.mass = 7;
    this.player.setArcadeVelocityTarget(0);
    this.playAnimation('drop_idle', 0.1);
    if (this.anyDirection()) {
      this.player.setState(new StartWalkForward(player));
    }
  }

  public update(timestep: number): void {
    super.update(timestep);
    this.player.setCameraRelativeOrientationTarget();
    if (this.animationEnded(timestep)) {
      this.player.setState(new Idle(this.player));
    }
    this.checkFallInAir();
  }

  public onInputChange(): void {
    super.onInputChange();
    if (this.player.inputManager.buttons.up.justPressed) {
      this.player.setState(new JumpIdle(this.player));
    }
    if (this.anyDirection()) {
      this.player.setState(new Walk(this.player));
    }
  }
}
