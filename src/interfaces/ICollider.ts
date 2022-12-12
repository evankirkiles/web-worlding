/*
 * ICollider.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */
import type * as CANNON from 'cannon-es';

export interface ICollider {
  body: CANNON.Body;
}
