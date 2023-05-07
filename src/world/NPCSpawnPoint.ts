/*
 * NPCSpawnPoint.ts
 * author: evan kirkiles
 * created on Sun May 07 2023
 * 2023 the nobot space, 
 */
import * as THREE from 'three';
import { ISpawnPoint } from "../interfaces/ISpawnPoint";
import { Conversant } from "../npc/Conversant";
import { World } from "./World";
import * as Utils from '../core/FunctionLibrary';


export class NPCSpawnPoint implements ISpawnPoint {
  private object: THREE.Object3D;
  public model: string;

  /**
   * Instantiate the spawn point from a GLTF scene / scenario
   * @param object The object whose userData has nobot.spawn
   * @param model  The URL to download the GLTF player model from
   */
  constructor(object: THREE.Object3D, model: string) {
    this.object = object;
    this.model = model;
  }

  /**
   * Spawns an AI agent at this point in the scene
   * @param world The world in which the spawn point exists
   */
  public async spawn(world: World) {
    const playerGLTF = await world.loadingManager.loadGLTF(this.model);
    const conversant = new Conversant(playerGLTF, world.inputManager);
    const worldPos = new THREE.Vector3();
    this.object.getWorldPosition(worldPos);
    conversant.setPosition(worldPos.x, worldPos.y, worldPos.z);
    const forward = Utils.getForward(this.object);
    conversant.setOrientation(forward, true);
    world.add(conversant);
  }
}
