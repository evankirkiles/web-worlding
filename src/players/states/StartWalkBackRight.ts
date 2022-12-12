/*
 * StartWalkBackRight.ts
 * author: evan kirkiles
 * created on Sun Jun 26 2022
 * 2022 the player space,
 */

import { Player } from '../Player';
import { StartWalkBase } from './StartWalkBase';

export class StartWalkBackRight extends StartWalkBase {
  constructor(player: Player) {
    super(player);
    this.animationLength = player.setAnimation('start_back_right', 0.1);
  }
}
