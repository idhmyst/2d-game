import Phaser from 'phaser';
import { StorageManager } from '../systems/Storage';
import { AudioManager } from '../systems/AudioManager';

interface GameOverData {
  score: number;
  victory: boolean;
  isNewHighScore: boolean;
}

export class GameOverScene extends Phaser.Scene {
  private finalScore: number = 0;
  private isVictory: boolean = false;
  private isNewHighScore: boolean = false;

  constructor() {
    super('GameOverScene');
  }

  public init(data: GameOverData): void {
    this.finalScore = data.score || 0;
    this.isVictory = data.victory || false;
    this.isNewHighScore = data.isNewHighScore || false;
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const audio = AudioManager.getInstance();
    audio.setScene(this);

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0a0a14, 0.9);
    overlay.fillRect(0, 0, width, height);

    // Title
    const titleText = this.isVictory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = this.isVictory ? '#34d399' : '#f87171';

    const title = this.add.text(width / 2, height / 2 - 120, titleText, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '32px',
      color: titleColor
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Score display
    this.add.text(width / 2, height / 2 - 50, `SCORE: ${this.finalScore}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#f8fafc'
    }).setOrigin(0.5);

    // High Score / New Record notice
    const highScore = StorageManager.getHighScore();
    if (this.isNewHighScore) {
      const recordText = this.add.text(width / 2, height / 2 - 15, '★ NEW HIGH SCORE! ★', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#fbbf24'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: recordText,
        alpha: 0.4,
        duration: 400,
        yoyo: true,
        repeat: -1
      });
    } else {
      this.add.text(width / 2, height / 2 - 15, `HIGH SCORE: ${highScore}`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '15px',
        color: '#94a3b8'
      }).setOrigin(0.5);
    }

    // Play Again Button
    this.createButton(width / 2, height / 2 + 50, 'PLAY AGAIN', () => {
      audio.playSfx('coin', 0.5);
      this.scene.start('GameScene');
    }, 0x10b981);

    // Main Menu Button
    this.createButton(width / 2, height / 2 + 115, 'MAIN MENU', () => {
      audio.playSfx('coin', 0.5);
      this.scene.start('MenuScene');
    }, 0x475569);

    // Keyboard restart shortcut (Space / Enter)
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('GameScene');
    });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    callback: () => void,
    bgColor: number
  ): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(-100, -22, 200, 44, 8);
    bg.lineStyle(2, 0xffffff, 0.2);
    bg.strokeRoundedRect(-100, -22, 200, 44, 8);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(200, 44);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });
    btn.on('pointerout', () => {
      this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 });
    });
    btn.on('pointerdown', callback);

    return btn;
  }
}
