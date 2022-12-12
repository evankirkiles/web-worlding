/*
 * ButtonBinding.ts
 * author: evan kirkiles
 * created on Thu Dec 08 2022
 * 2022 the player space,
 */
export class JoystickBinding {
  public angle = 0;
  public magnitude = 0;
  public isActive = false;
  public justActivated = false;
  public justReleased = false;

  handle(angle: number, magnitude: number, pressed: boolean, immediateCallback?: () => void) {
    this.angle = angle;
    this.magnitude = magnitude;
    this.isActive = pressed;
    // reset 'just' attributes
    this.justActivated = false;
    this.justReleased = false;
    // set the 'just' attributes
    if (pressed) this.justActivated = true;
    else this.justReleased = true;
    // perform the callback
    if (immediateCallback) immediateCallback();
    // reset the 'just' attributes
    this.justActivated = false;
    this.justReleased = false;
  }
}
