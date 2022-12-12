/*
 * StartWalkForward.ts
 * author: evan kirkiles
 * created on Sun Jun 26 2022
 * 2022 the player space,
 */

import { Player } from '../Player';
import { StartWalkBase } from './StartWalkBase';

export class StartWalkForward extends StartWalkBase {
  constructor(player: Player) {
    super(player);
    this.animationLength = player.setAnimation('start_forward', 0.1);
  }
}
