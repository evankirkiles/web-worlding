/*
 * PlayerStateBase.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */
import { IPlayerState } from '../../interfaces/IPlayerState';
import { Player } from '../Player';

export enum PlayerState {
  WALK = 'walk',
  DROPIDLE = 'dropIdle',
  IDLE = 'idle',
  FALLING = 'falling',
}

export abstract class PlayerStateBase implements IPlayerState {
  public player: Player;
  public timer: number;
  public animationLength = 0;

  public canFindInteractions: boolean;
  public canEnterInteraction: boolean;
  public canLeaveInteraction: boolean;

  /**
   * Builds the foundation of a state for a player
   * @param player The player this state applies to
   */
  constructor(player: Player) {
    this.player = player;

    // apply default values to velocity simulator
    this.player.velocitySimulator.damping = this.player.defaultVelocitySimulatorDamping;
    this.player.velocitySimulator.mass = this.player.defaultVelocitySimulatorMass;
    // apply default values to rotation simulator
    this.player.rotationSimulator.damping = this.player.defaultRotationSimulatorDamping;
    this.player.rotationSimulator.mass = this.player.defaultRotationSimulatorMass;

    // set arcade settings
    this.player.arcadeVelocityIsAdditive = false;
    this.player.setArcadeVelocityInfluence(1, 0, 1);

    // interaction settings
    this.canFindInteractions = true;
    this.canEnterInteraction = false;
    this.canLeaveInteraction = true;

    // timer starts at 0
    this.timer = 0;
  }

  /* -------------------------------------------------------------------------- */
  /*                                 UPDATE LOOP                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Increments the timer of the state
   * @param timeStep The time step used for calculations
   */
  public update(timeStep: number): void {
    this.timer += timeStep;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  STATEFULS                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * Gets whether or not a direction is pressed
   * @returns
   */
  public anyDirection(): boolean {
    return this.player.inputManager.joysticks.main.isActive;
  }

  /* -------------------------------------------------------------------------- */
  /*                                 ANIMATIONS                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * Plays the animation of the state
   * @param animName The name of the animation in the Player GLTF
   * @param fadeIn How long to take in fading in the animation
   */
  protected playAnimation(animName: string, fadeIn: number): void {
    this.animationLength = this.player.setAnimation(animName, fadeIn);
  }

  /**
   * Returns whether or not the animation will have ended after the frame.
   * @param timeStep The timestep this frame will take
   */
  public animationEnded(timeStep: number): boolean {
    if (!this.player.mixer) return true;
    if (this.animationLength) {
      return this.timer > this.animationLength - timeStep;
    }
    console.error('Error: Set this.animationLength in state constructor!');
    return false;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  LISTENERS                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * Checks whether a user has attempted to begin an interaction
   */
  public onInputChange(): void {
    // if the player can find interactions and they press enter, look for them
    if (this.canFindInteractions && this.player.inputManager.buttons.use.justPressed) {
      // this.player TODO: Find interaction
      // if the player can enter interactions and they are in an interaction
    } else if (this.canEnterInteraction && this.player.interactionEntryInstance !== null) {
      // if the player presses any movement key, get out of the interaction
      if (this.player.inputManager.joysticks.main.isActive) {
        this.player.interactionEntryInstance = null;
        this.player.inputManager.buttons.up.isPressed = false;
      }
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              STATE TRANSITIONS                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Begins the adequate drop state a Player enters into after falling.
   */
  public setAppropriateDropState(): void {
    // if really falling hard, drop into a heavy impact
    if (this.player.groundImpactData.velocity.y < -6) {
      // console.log('hard drop');
      // STATE: Drop Hard
      this.player.setStateSerialized(PlayerState.WALK);
      // otherwise check if moving in any direction
    } else if (this.anyDirection()) {
      // on a minor drop, drop into a run (carrying velocity)
      if (this.player.groundImpactData.velocity.y < -2) {
        // STATE: Drop into a run
        this.player.setStateSerialized(PlayerState.WALK);
        // otherwise, continue the action the user was doing before
      } else {
        // STATE: Walk
        this.player.setStateSerialized(PlayerState.WALK);
      }
    } else {
      // if not moving in any direction, drop into idle
      this.player.setStateSerialized(PlayerState.DROPIDLE);
    }
  }

  /**
   * Sets the appropriate start walk state a Player enters into.
   */
  public setAppropriateStartWalkState(): void {
    // const range = Math.PI;
    // const angle = Utils.getSignedAngleBetweenVectors(
    //   this.player.orientation,
    //   this.player.getCameraRelativeMovementVector()
    // );
    this.player.setStateSerialized(PlayerState.WALK);
    // if (angle > range * 0.8) {
    //   this.player.setState(new StartWalkBackLeft(this.player));
    // } else if (angle < -range * 0.8) {
    //   this.player.setState(new StartWalkBackRight(this.player));
    // } else if (angle > range * 0.3) {
    //   this.player.setState(new StartWalkLeft(this.player));
    // } else if (angle < range * -0.3) {
    //   this.player.setState(new StartWalkRight(this.player));
    // } else {
    //   this.player.setState(new StartWalkForward(this.player));
    // }
  }

  /**
   * Runs the check if the Player should be falling, and, if so, begins the fall.
   */
  public checkFallInAir(): void {
    if (!this.player.rayHasHit) {
      this.player.setStateSerialized(PlayerState.FALLING);
    }
  }
}
