/*
 * ClosestObjectFinder.ts
 * author: evan kirkiles
 * created on Sun May 07 2023
 * 2023 the nobot space, 
 */
import * as THREE from "three";

export class ClosestObjectFinder<T extends THREE.Object3D> {
  public closestObject?: T;

  private closestDistance: number = Number.POSITIVE_INFINITY;
  private referencePosition: THREE.Vector3;
  private maxDistance: number = Number.POSITIVE_INFINITY;

  /**
   * Builds a helper for finding the closest object to interact with
   * @param referencePosition
   * @param maxDistance
   */
  constructor(referencePosition: THREE.Vector3, maxDistance?: number) {
    this.referencePosition = referencePosition;
    if (maxDistance) this.maxDistance = maxDistance;
  }

  /**
   * Considers an object in the possible closest distances to consider.
   * @param object
   * @param objectPosition
   */
  public consider(object: T): void {
    const distance = this.referencePosition.distanceTo(object.position);
    if (distance < this.maxDistance && distance < this.closestDistance) {
      this.closestDistance = distance;
      this.closestObject = object;
    }
  }
}
