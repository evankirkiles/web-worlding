/*
 * IPlayerState.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */
export interface IPlayerState {
  canFindInteractions: boolean;
  canEnterInteraction: boolean;
  canLeaveInteraction: boolean;

  update(timeStep: number): void;
  onInputChange(): void;
}
