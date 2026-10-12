import { GAME_CONFIG } from '../config';

export class StorageManager {
  private static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  public static getHighScore(): number {
    if (!this.isAvailable()) return 0;
    const value = window.localStorage.getItem(GAME_CONFIG.storageKeys.highScore);
    return value ? parseInt(value, 10) || 0 : 0;
  }

  public static saveHighScore(score: number): boolean {
    const currentHigh = this.getHighScore();
    if (score > currentHigh) {
      if (this.isAvailable()) {
        window.localStorage.setItem(GAME_CONFIG.storageKeys.highScore, score.toString());
      }
      return true; // New record
    }
    return false;
  }

  public static getLastScore(): number {
    if (!this.isAvailable()) return 0;
    const value = window.localStorage.getItem(GAME_CONFIG.storageKeys.lastScore);
    return value ? parseInt(value, 10) || 0 : 0;
  }

  public static saveLastScore(score: number): void {
    if (this.isAvailable()) {
      window.localStorage.setItem(GAME_CONFIG.storageKeys.lastScore, score.toString());
    }
  }

  public static isSoundMuted(): boolean {
    if (!this.isAvailable()) return false;
    return window.localStorage.getItem(GAME_CONFIG.storageKeys.soundMuted) === 'true';
  }

  public static setSoundMuted(muted: boolean): void {
    if (this.isAvailable()) {
      window.localStorage.setItem(GAME_CONFIG.storageKeys.soundMuted, muted ? 'true' : 'false');
    }
  }
}
