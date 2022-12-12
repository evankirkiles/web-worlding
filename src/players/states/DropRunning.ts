/*
 * DropRunning.ts
 * author: evan kirkiles
 * created on Tue Jun 28 2022
 * 2022 the player space,
 */

import { Player } from '../Player';
import { EndWalk } from './EndWalk';
import { JumpRunning } from './JumpRunning';
import { PlayerStateBase } from './PlayerStateBase';
import { Walk } from './Walk';

export class DropRunning extends PlayerStateBase {
  constructor(player: Player) {
    super(player);
    this.player.setArcadeVelocityTarget(0.8);
    this.playAnimation('drop_running', 0.1);
  }
  public update(timeStep: number): void {
    super.update(timeStep);
    this.player.setCameraRelativeOrientationTarget();
    if (this.animationEnded(timeStep)) {
      this.player.setState(new Walk(this.player));
    }
  }
  public onInputChange(): void {
    super.onInputChange();
    if (!this.anyDirection()) {
      this.player.setState(new EndWalk(this.player));
    }
    if (this.player.inputManager.buttons.up.justPressed) {
      this.player.setState(new JumpRunning(this.player));
    }
  }
}
