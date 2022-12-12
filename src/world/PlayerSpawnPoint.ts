/*
 * PlayerSpawnPoint.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */
import * as THREE from 'three';
import * as Utils from '../core/FunctionLibrary';
import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { Player } from '../players/Player';
import { World } from './World';

// const PLAYER_MODEL = '/assets/characters/player-anim.glb';
// const PLAYER_MODEL = '/assets/characters/personspace.glb';
// const PLAYER_MODEL = '/models/player.glb';
// const PLAYER_MODEL = '/models/boxman.glb';

export class PlayerSpawnPoint implements ISpawnPoint {
  private object: THREE.Object3D;

  /**
   * Instantiate the spawn point from a GLTF scene / scenario
   * @param object The object whose userData has player.spawn
   */
  constructor(object: THREE.Object3D) {
    this.object = object;
  }

  /**
   * Spawns the player player at this point in the scene
   * @param loadingManager The loading manager for checking download state
   * @param world The world in which the spawn point exists
   */
  public async spawn(world: World) {
    const playerGLTF = await world.loadingManager.loadGLTF(world.playerModelPath);
    const player = new Player(playerGLTF, world.inputManager);
    const worldPos = new THREE.Vector3();
    this.object.getWorldPosition(worldPos);
    player.setPosition(worldPos.x, worldPos.y, worldPos.z);
    const forward = Utils.getForward(this.object);
    player.setOrientation(forward, true);
    world.add(player);
    player.takeControl();
  }
}
