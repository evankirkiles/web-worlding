/*
 * ButtonBinding.ts
 * author: evan kirkiles
 * created on Thu Dec 08 2022
 * 2022 the player space,
 */
export class ButtonBinding {
  public isPressed = false;
  public justPressed = false;
  public justReleased = false;

  handle(pressed: boolean, immediateCallback?: () => void) {
    if (this.isPressed === pressed) return;
    this.isPressed = pressed;
    // reset 'just' attributes
    this.justPressed = false;
    this.justReleased = false;
    // set the 'just' attributes
    if (pressed) this.justPressed = true;
    else this.justReleased = true;
    // perform the callback
    if (immediateCallback) immediateCallback();
    // reset the 'just' attributes
    this.justPressed = false;
    this.justReleased = false;
  }
}
