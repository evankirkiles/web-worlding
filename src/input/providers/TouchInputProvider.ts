/*
 * TouchInputProvider.ts
 * author: evan kirkiles
 * created on Thu Dec 08 2022
 * 2022 the player space,
 */
import { InputManager } from '../InputManager';
import { InputButton, InputJoystick } from '../../enums/UserInputs';
import { IInputProvider } from '../../interfaces/IInputProvider';
import NippleJs from 'nipplejs';

export default class TouchInputProvider implements IInputProvider {
  private manager: InputManager;
  isListening = false;

  // dom element in which to place the nipple
  public domElement: HTMLElement;
  // nipple for main movement
  public nippleDomElement: HTMLDivElement;
  public nippleManager?: ReturnType<typeof NippleJs.create>;
  public nippleState = 'end';

  // buttons for other forms of movement. up/down buttons on left, view toggle in center
  public buttonMapping: {
    [key in InputButton]?: {
      domElement: HTMLDivElement;
      boundMouseDownListener: () => void;
      boundMouseUpListener: () => void;
    };
  };

  // is the device a touch screen? if not, we do not show anything
  public isTouchScreen = false;

  constructor(manager: InputManager, domElement: HTMLElement = document.body, forceEnable?: boolean) {
    this.manager = manager;
    this.domElement = domElement;

    // check if we're on a touch screen
    this.isTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || !!forceEnable;

    // create the nipple dom element
    this.nippleDomElement = document.createElement('div');
    this.nippleDomElement.style.position = 'absolute';
    this.nippleDomElement.style.bottom = 'calc(75px + 3vw)';
    this.nippleDomElement.style.right = 'calc(75px + 3vw)';
    this.nippleDomElement.style.width = '1px';
    this.nippleDomElement.style.height = '1px';
    this.nippleDomElement.style.zIndex = '1';

    // create the button dom elements
    this.buttonMapping = [InputButton.UP, InputButton.DOWN, InputButton.SPEED, InputButton.VIEWTOGGLE].reduce<
      typeof this.buttonMapping
    >((acc, button) => {
      const domElement = document.createElement('div');
      domElement.style.position = 'absolute';
      domElement.style.zIndex = '1';
      domElement.style.width = '50px';
      domElement.style.height = '50px';
      domElement.style.backgroundColor = 'black';
      domElement.style.border = '1px solid white';
      domElement.style.borderRadius = '50%';
      domElement.style.display = 'flex';
      domElement.style.flexDirection = 'column';
      domElement.style.justifyContent = 'center';
      domElement.style.alignItems = 'center';
      domElement.style.fontSize = '20px';
      domElement.style.color = 'white';
      domElement.style.opacity = '0.6';
      domElement.style.cursor = 'pointer';
      domElement.className = 'web-worlding-button';
      switch (button) {
        case InputButton.DOWN:
          domElement.style.left = 'calc(35px + 3vw)';
          domElement.style.bottom = 'calc(35px + 3vw)';
          domElement.textContent = '↓';
          break;
        case InputButton.UP:
          domElement.style.left = 'calc(35px + 3vw)';
          domElement.style.bottom = 'calc(100px + 3vw)';
          domElement.textContent = '↑';
          break;
        case InputButton.VIEWTOGGLE:
          domElement.style.left = 'calc(50vw - 25px)';
          domElement.style.bottom = 'calc(35px + 3vw)';
          domElement.textContent = '↻';
          break;
        case InputButton.SPEED:
          domElement.style.display = 'none';
      }
      acc[button] = {
        domElement,
        boundMouseDownListener: () => this.onButtonEvent(button, true),
        boundMouseUpListener: () => this.onButtonEvent(button, false),
      };
      return acc;
    }, {});
  }

  /* -------------------------------------------------------------------------- */
  /*                                  STATEFULS                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * Applies all the handlers to the DOM, if not already applied
   */
  listen() {
    if (this.isListening || !this.isTouchScreen) return;
    this.isListening = true;
    // add 360º nipple
    this.domElement.append(this.nippleDomElement);
    this.nippleManager = NippleJs.create({
      zone: this.nippleDomElement,
      mode: 'static',
      dynamicPage: true,
      shape: 'circle',
    });
    this.nippleManager.on('end', () => this.onNippleStop());
    this.nippleManager.on('move', (evt, data) => this.onNippleMove(evt, data));
    // append all dom elements to canvas, with event listeners
    Object.values(this.buttonMapping).forEach(({ domElement, boundMouseDownListener, boundMouseUpListener }) => {
      this.domElement.append(domElement);
      domElement.addEventListener('mousedown', boundMouseDownListener, false);
      domElement.addEventListener('mouseup', boundMouseUpListener, false);
    });
  }

  /**
   * Removes all the mouse handlers to the DOM, if not already removed
   */
  deafen(): void {
    if (!this.isListening || !this.isTouchScreen) return;
    this.isListening = false;
    this.nippleDomElement.remove();
    if (this.nippleManager) this.nippleManager.destroy();
    // remove all dom elements from canvas, with event listeners
    Object.values(this.buttonMapping).forEach(({ domElement }) => {
      domElement.remove();
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                                  LISTENERS                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * Funnels an OnKeyDown event through to the input receiver
   * @param event A KeyDown event
   */
  public onNippleMove(evt: NippleJs.EventData, data: NippleJs.JoystickOutputData): void {
    this.manager.handleJoystickEvent(InputJoystick.MAIN, data.angle.radian ?? 0, data.distance / 75, true);
  }

  /**
   * Funnels an OnKeyDown event through to the input receiver
   * @param event A KeyDown event
   */
  public onNippleStop(): void {
    this.manager.handleJoystickEvent(InputJoystick.MAIN, 0, 0, false);
  }

  /**
   * Funnel button events from DOM elements into the input manager.
   * @param button
   * @param value
   */
  public onButtonEvent(button: InputButton, value: boolean) {
    this.manager.handleButtonEvent(button, value);
  }
}
