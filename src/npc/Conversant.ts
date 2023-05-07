/*
 * Conversant.ts
 * author: evan kirkiles
 * created on Sun May 07 2023
 * 2023 the nobot space, 
 */
import { Player } from "../players/Player";
import { IInteractable } from "../interfaces/IInteractable";
import { World } from "../world/World";
import { Conversation } from "./Conversation";

export class Conversant extends Player implements IInteractable {
  public conversation?: Conversation;

  /**
   * When an interaction begins with this player, enter into a conversation
   * @param player
   */
  onInteraction(player: Player): void {
    if (!this.world || this.conversation) return;
    this.conversation = new Conversation(this, player);
    this.conversation.addToWorld(this.world);
    // make the conversation take input in the world
    this.world.inputManager.setInputReceiver(this.conversation);
  }

  /**
   * Ends the conversation.
   */
  onConversationEnd(): void {
    if (!this.conversation || !this.world) return;
    // return world input back to the conversation listener
    this.conversation.removeFromWorld(this.world);
    this.world?.inputManager.setInputReceiver(this.conversation?.listener);
    this.conversation = undefined;
  }

  /* -------------------------------------------------------------------------- */
  /*                               ADDING TO WORLD                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Adds the conversant to the world––and the world's interactions.
   * @param world
   */
  public addToWorld(world: World): void {
    super.addToWorld(world);
    const i = world.interactables.indexOf(this);
    if (i < 0) world.interactables.push(this);
  }

  /**
   * Removes the conversant to the world––and the world's interactions.
   * @param world
   */
  public removeFromWorld(world: World): void {
    super.removeFromWorld(world);
    const i = world.interactables.indexOf(this);
    if (i >= 0) world.interactables.splice(i, 1);
  }
}
