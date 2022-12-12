/*
 * LoadingTrackerEntry.ts
 * author: evan kirkiles
 * created on Sat Jun 25 2022
 * 2022 the player space,
 */
export class LoadingTrackerEntry {
  public path: string;
  public total = 0;
  public progress = 0;
  public finished = true;

  /**
   * A simple class for wrapping a timestep in the download.
   * @param path The path to the desired download item
   */
  constructor(path: string) {
    this.path = path;
  }
}
