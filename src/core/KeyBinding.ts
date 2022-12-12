/*
 * KeyBinding.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */
export class KeyBinding {
  public eventCodes: string[];
  public isPressed = false;
  public justPressed = false;
  public justReleased = false;

  constructor(...code: string[]) {
    this.eventCodes = code;
  }
}
