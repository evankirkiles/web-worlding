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
import {
  GamepadEventCode,
  GamepadHandler,
  GamepadHandlerEventCode,
  StandardMapping,
  _GamepadEvent,
} from '../../lib/gamepads/gamepads';

export default class GamepadInputProvider implements IInputProvider {
  private manager: InputManager;
  isListening = false;
  joystickDeadzone = 0.15;

  // map controller joysticks (XY)
  bindings_controllers: InputJoystick[] = [InputJoystick.MAIN, InputJoystick.SECONDARY];

  // map controller buttons
  bindings_buttons: (InputButton | null)[] = [
    null,
    null,
    null,
    null,
    InputButton.UP,
    InputButton.DOWN,
    InputButton.VIEWTOGGLE,
    InputButton.USE,
  ];

  /**
   * On construction, immediately add a listener that will continually check
   * if a new gamepad has connected to the game.
   * @param manager
   */
  constructor(manager: InputManager) {
    this.manager = manager;
    const Gamepads = new GamepadHandler();
    Gamepads.start(); // begin scanning for gamepads to connect with
    Gamepads.addEventListener(GamepadHandlerEventCode.Connect, (e: _GamepadEvent) => {
      console.log('Gamepad connected.');
      // add listeners to gamepad
      e.gamepad.addEventListener(GamepadEventCode.ButtonValueChange, (evt: any) => {
        this.onButtonChange(evt);
      });
      e.gamepad.addEventListener(
        GamepadEventCode.JoystickMove,
        (evt: any) => this.onJoystickMove(evt, InputJoystick.MAIN),
        StandardMapping.Axis.JOYSTICK_LEFT, // js1
      );
      e.gamepad.addEventListener(
        GamepadEventCode.JoystickMove,
        (evt: any) => this.onJoystickMove(evt, InputJoystick.SECONDARY),
        StandardMapping.Axis.JOYSTICK_RIGHT, // js2
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
    const x = Math.abs(e.horizontalValue) < this.joystickDeadzone ? 0 : e.horizontalValue * invert;
    const y = Math.abs(e.verticalValue) < this.joystickDeadzone ? 0 : e.verticalValue * invert;
    this.manager.handleJoystickEvent(joystick, Math.atan2(y, x), Math.hypot(x, y), x !== 0 || y !== 0);
    return;
  }
}
