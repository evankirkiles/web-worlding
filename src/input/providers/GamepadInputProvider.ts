/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * GamepadInputProvider.ts
 * author: evan kirkiles
 * created on Thu Dec 08 2022
 * 2022 the player space,
 */
import { InputManager } from '../../core/InputManager';
import { InputButton, InputJoystick } from '../../enums/UserInputs';
import { IInputProvider } from '../../interfaces/IInputProvider';
import type Gamepads_ from 'gamepads';

let Gamepads: typeof Gamepads_;

export default class GamepadInputProvider implements IInputProvider {
  private manager: InputManager;
  isListening = false;

  // map controller joysticks (XY)
  bindings_controllers: InputJoystick[] = [InputJoystick.MAIN, InputJoystick.SECONDARY];

  // map controller buttons
  bindings_buttons: (InputButton | null)[] = [
    null,
    null,
    null,
    null,
    InputButton.UP,
    InputButton.USE,
    InputButton.VIEWTOGGLE,
    InputButton.DOWN,
  ];

  /**
   * On construction, immediately add a listener that will continually check
   * if a new gamepad has connected to the game.
   * @param manager
   */
  constructor(manager: InputManager) {
    this.manager = manager;
    Gamepads = require('gamepads');
    Gamepads.start(); // begin scanning for gamepads to connect with
    Gamepads.addEventListener('connect', (e: any) => {
      console.log('Gamepad connected.');
      e.gamepad.joystickDeadzone = 0.1;
      // add listeners to gamepad
      e.gamepad.addEventListener('buttonvaluechange', (evt: any) => {
        console.log('hi');
        this.onButtonChange(evt);
      });
      e.gamepad.addEventListener(
        'joystickmove',
        (evt: any) => this.onJoystickMove(evt, InputJoystick.MAIN),
        [0, 1], // js1
      );
      e.gamepad.addEventListener(
        'joystickmove',
        (evt: any) => this.onJoystickMove(evt, InputJoystick.SECONDARY),
        [2, 3], // js2
      );
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                                  STATEFULS                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * Applies all the handlers to the DOM, if not already applied
   */
  listen() {
    this.isListening = true;
  }

  /**
   * Removes all the mouse handlers to the DOM, if not already removed
   */
  deafen(): void {
    this.isListening = false;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  LISTENERS                                 */
  /* -------------------------------------------------------------------------- */

  onButtonChange(e: any): void {
    console.log(e.index, this.bindings_buttons[e.index]);
    if (!this.isListening || !this.bindings_buttons[e.index]) return;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.manager.handleButtonEvent(this.bindings_buttons[e.index]!, !!e.value);
  }

  /**
   * Emit joystick events to input manager
   * @param e
   * @param joystick
   * @returns
   */
  onJoystickMove(e: any, joystick: InputJoystick): void {
    if (!this.isListening) return;
    const invert = joystick === InputJoystick.MAIN ? -1 : 1;
    const x = Math.abs(e.horizontalValue) < 0.1 ? 0 : e.horizontalValue * invert;
    const y = Math.abs(e.verticalValue) < 0.1 ? 0 : e.verticalValue * invert;
    this.manager.handleJoystickEvent(joystick, Math.atan2(y, x), Math.hypot(x, y), x !== 0 || y !== 0);
    return;
  }
}
