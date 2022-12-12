/*
 * StartWalkBackLeft.ts
 * author: evan kirkiles
 * created on Sun Jun 26 2022
 * 2022 the player space,
 */

import { Player } from '../Player';
import { StartWalkBase } from './StartWalkBase';

export class StartWalkBackLeft extends StartWalkBase {
  constructor(player: Player) {
    super(player);
    this.animationLength = player.setAnimation('start_back_left', 0.1);
  }
}
