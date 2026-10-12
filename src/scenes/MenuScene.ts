import Phaser from 'phaser';
import { StorageManager } from '../systems/Storage';
import { AudioManager } from '../systems/AudioManager';

export class MenuScene extends Phaser.Scene {
  private soundButtonText!: Phaser.GameObjects.Text;

  constructor() {
    super('MenuScene');
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const audio = AudioManager.getInstance();
    audio.setScene(this);

    // Dynamic gradient background stars/particles
    this.createBackgroundFX(width, height);

    // Title
    const title = this.add.text(width / 2, height / 2 - 110, 'PIXEL QUEST', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '36px',
      color: '#38bdf8'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 - 65, '2D Platformer Adventure', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Floating animation on title
    this.tweens.add({
      targets: title,
      y: title.y - 8,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // High Score Badge
    const highScore = StorageManager.getHighScore();
    this.add.text(width / 2, height / 2 - 25, `🏆 BEST SCORE: ${highScore}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#fbbf24'
    }).setOrigin(0.5);

    // Start Button
    this.createButton(width / 2, height / 2 + 45, 'PLAY GAME', () => {
      audio.playSfx('coin', 0.5);
      audio.playBgm('bgm', 0.4);
      this.scene.start('GameScene');
    });

    // Sound Toggle Button
    const isMuted = audio.getMuted();
    this.soundButtonText = this.createButton(
      width / 2,
      height / 2 + 115,
      isMuted ? 'SOUND: OFF' : 'SOUND: ON',
      () => {
        const muted = audio.toggleMute();
        this.soundButtonText.setText(muted ? 'SOUND: OFF' : 'SOUND: ON');
      },
      0x334155
    );

    // Keyboard shortcut for mute
    this.input.keyboard?.on('keydown-M', () => {
      const muted = audio.toggleMute();
      this.soundButtonText.setText(muted ? 'SOUND: OFF' : 'SOUND: ON');
    });

    // Instructions hint
    this.add.text(width / 2, height - 30, 'Controls: [A/D or Arrows] Move  •  [W or Space] Jump', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#64748b'
    }).setOrigin(0.5);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    callback: () => void,
    bgColor: number = 0x6366f1
  ): Phaser.GameObjects.Text {
    const btnContainer = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(-100, -22, 200, 44, 8);
    bg.lineStyle(2, 0xa5b4fc, 0.4);
    bg.strokeRoundedRect(-100, -22, 200, 44, 8);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    btnContainer.add([bg, text]);
    btnContainer.setSize(200, 44);
    btnContainer.setInteractive({ useHandCursor: true });

    btnContainer.on('pointerover', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    btnContainer.on('pointerout', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });

    btnContainer.on('pointerdown', callback);

    return text;
  }

  private createBackgroundFX(width: number, height: number): void {
    const particles = this.add.graphics();
    for (let i = 0; i < 40; i++) {
      const px = Phaser.Math.Between(0, width);
      const py = Phaser.Math.Between(0, height);
      const radius = Phaser.Math.FloatBetween(1, 2.5);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.7);

      particles.fillStyle(0x60a5fa, alpha);
      particles.fillCircle(px, py, radius);
    }
  }
}
