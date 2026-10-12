import Phaser from 'phaser';
import { StorageManager } from './Storage';

export class AudioManager {
  private static instance: AudioManager;
  private scene: Phaser.Scene | null = null;
  private bgm: Phaser.Sound.BaseSound | null = null;
  private isMuted: boolean = false;

  private constructor() {
    this.isMuted = StorageManager.isSoundMuted();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public setScene(scene: Phaser.Scene): void {
    this.scene = scene;
    if (this.scene.sound) {
      this.scene.sound.mute = this.isMuted;
    }
  }

  public playBgm(key: string = 'bgm', volume: number = 0.5): void {
    if (!this.scene) return;

    if (this.bgm && this.bgm.isPlaying) {
      return;
    }

    try {
      if (this.scene.cache.audio.has(key)) {
        this.bgm = this.scene.sound.add(key, { loop: true, volume });
        this.bgm.play();
      }
    } catch (e) {
      console.warn('Could not start BGM:', e);
    }
  }

  public stopBgm(): void {
    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.stop();
      this.bgm.destroy();
      this.bgm = null;
    }
  }

  public playSfx(key: string, volume: number = 0.7): void {
    if (!this.scene || this.isMuted) return;

    try {
      if (this.scene.cache.audio.has(key)) {
        this.scene.sound.play(key, { volume });
      }
    } catch (e) {
      console.warn(`Could not play SFX [${key}]:`, e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    StorageManager.setSoundMuted(this.isMuted);

    if (this.scene && this.scene.sound) {
      this.scene.sound.mute = this.isMuted;
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}
