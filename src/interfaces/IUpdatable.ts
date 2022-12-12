/*
 * IUpdatable.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */
export interface IUpdatable {
  updateOrder: number;
  update(timestep: number, unscaledTimeStep: number): void;
}
