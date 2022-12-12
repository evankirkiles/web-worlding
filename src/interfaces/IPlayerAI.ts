/*
 * IPlayerAI.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */
import { Player } from '../players/Player';

export interface IPlayerAI {
  player: Player;
  update(timeStep: number): void;
}
