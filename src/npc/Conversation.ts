/*
 * Conversation.ts
 * author: evan kirkiles
 * created on Sun May 07 2023
 * 2023 the nobot space, 
 */
import { Player } from '../players/Player';
import { IInputReceiver } from '../interfaces/IInputReceiver';
import { IWorldEntity } from '../interfaces/IWorldEntity';
import { EntityType } from '../enums/EntityType';
import { World } from '../world/World';
import { Idle, Listening, Speaking } from '../players/states/_stateLibrary';
// import { SpeechBubble } from "./SpeechBubble";
import { Conversant } from './Conversant';
import { InputManager } from '../input/InputManager';
import { InputButton } from '../enums/UserInputs';
import { SpeechBubble } from './SpeechBubble';

export class Conversation implements IWorldEntity, IInputReceiver {
  public updateOrder = 1;
  public entityType: EntityType = EntityType.Decoration;
  public inputManager: InputManager;

  public world?: World;
  public speaker: Conversant;
  public listener: Player;

  public bubble?: SpeechBubble;
  // public currentBubble?: SpeechBubble;

  /**
   * Builds a conversation between a player and a player, handling input
   * and stuff!
   * @param player
   * @param partner
   */
  constructor(speaker: Conversant, listener: Player) {
    this.speaker = speaker;
    this.listener = listener;
    this.inputManager = listener.inputManager;
  }

  /* -------------------------------------------------------------------------- */
  /*                                WORLD ENTITY                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Adds the conversation to the world, grabbing input and setting the states
   * of each of the participants of the conversation.
   * @param world
   */
  addToWorld(world: World): void {
    // make sure the conversation is not already in the world
    if (world.updatables.includes(this)) {
      console.warn('Could not add CONVERSATION to world it already exists in!');
      // if not, add it to the world and set the states of the players
    } else {
      this.world = world;
      world.updatables.push(this);
      this.bubble = new SpeechBubble(this.world);
      this.speaker.add(this.bubble);
      world.updatables.push(this.bubble);
      this.bubble.position.set(-0.2, 0.5, 0);
      this.speaker.setState(new Speaking(this.speaker, this.listener));
      this.listener.setState(new Listening(this.listener, this.speaker));
    }
  }

  /**
   * Removes the conversation from the world, reverting participants back to idle.
   * @param world
   */
  removeFromWorld(world: World): void {
    // make sure the conversation is in the world
    if (!world.updatables.includes(this)) {
      console.warn('Could not remove CONVERSATION from a world it does not exist in!');
      // if not, add it to the world and set the states of the players
    } else {
      // return all people back to their normal state
      world.updatables = world.updatables.filter((player) => player !== this && player !== this.bubble);
      if (this.bubble) this.speaker.remove(this.bubble);
      this.speaker.setState(new Idle(this.speaker));
      this.listener.setState(new Idle(this.listener));
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                  HANDLERS                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Move the camera operator over to the triangular point focused on the midway
   * between the two players on the . We just set a default height here
   * @returns
   */
  inputReceiverInit(): void {
    if (!this.world) return;
    this.world.cameraOperator.followMode = true;
    this.world.cameraOperator.target = this.speaker;
    // this.world.cameraOperator.setTarget(...this.speaker.position.toArray(), true);
    // this.world.cameraOperator.target = this.speaker;
    // add an override target
    // this.world.cameraOperator.overrideTarget = new THREE.Vector3();
  }

  inputReceiverChange(): void {
    return;
  }

  inputReceiverUpdate(): void {
    if (!this.world) return;
    // look in the speaker's direction
    // this.speaker.getWorldPosition(this.world.cameraOperator.overrideTarget!);
  }

  /* ---------------------------------- Input --------------------------------- */

  /**
   * Buttons are used to move throughout the conversation.
   *
   * @param button
   * @param pressed
   */
  handleButtonEvent(button: InputButton, pressed: boolean): void {
    switch (button) {
      case InputButton.USE:
        if (pressed) this.speaker.onConversationEnd();
        break;
      default:
        break;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                  UPDATING                                  */
  /* -------------------------------------------------------------------------- */

  /**
   * Updates the interaction every timestep
   * @param timeStep The timestep to use in calculations
   */
  public update(): void {
    return;
  }
}
