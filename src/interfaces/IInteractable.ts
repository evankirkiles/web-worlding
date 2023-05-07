/*
 * IInteractable.ts
 * author: evan kirkiles
 * created on Sun Jul 24 2022
 * 2022 the nobot space,
 */
import { Player } from "../players/Player";

export interface IInteractable extends THREE.Object3D {
  onInteraction(player: Player): void;
}
