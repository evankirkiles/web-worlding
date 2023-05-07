/*
 * Speaking.ts
 * author: evan kirkiles
 * created on Sun May 07 2023
 * 2023 the nobot space, 
 */
import * as THREE from "three";
import { Player } from "../Player";
import { PlayerStateBase } from "./PlayerStateBase";
import { Idle } from "./_stateLibrary";

export class Speaking extends PlayerStateBase {
  public partner: Player;

  public canFindInteractions = false;
  public canEnterInteraction = false;
  public canLeaveInteraction = false;

  /**
   * Add a speaking state to the player. This will generally only be used
   * by the AI.
   * @param player
   */
  constructor(player: Player, partner: Player) {
    super(player);
    // set simulator options
    this.player.velocitySimulator.damping = 0.6;
    this.player.velocitySimulator.mass = 10;
    this.player.setArcadeVelocityTarget(0);
    this.playAnimation("speak", 0.1);
    this.partner = partner;
  }

  public update(timestep: number): void {
    super.update(timestep);
    const entryPointWorldPos = new THREE.Vector3();
    this.partner.getWorldPosition(entryPointWorldPos);
    // look at the partner
    const viewVector = new THREE.Vector3().subVectors(
      entryPointWorldPos,
      this.player.position
    );
    this.player.setOrientation(viewVector);
    if (this.animationEnded(timestep)) {
      this.player.setState(new Idle(this.player));
    }
  }

  public onInputChange(): void {
    super.onInputChange();
  }
}
