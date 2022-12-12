/*
 * IInputProvider.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */

export interface IInputProvider {
  isListening: boolean;

  // for toggling input listening
  listen(): void;
  deafen(): void;

  // used for updating game pad state
  update?(): void;
}
