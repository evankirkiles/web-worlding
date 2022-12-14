/*
 * IControllable.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */
import * as THREE from 'three';
import { EntityType } from '../enums/EntityType';
import { Player } from '../players/Player';
import { IInputReceiver } from './IInputReceiver';

export interface IControllable extends IInputReceiver {
  entityType: EntityType;
  position: THREE.Vector3;
  controllingPlayer: Player;

  triggerAction(actionName: string, value: boolean): void;
  resetControls(): void;
  allowSleep(value: boolean): void;
  onInputChange(): void;
  noDirectionPressed(): boolean;
}
