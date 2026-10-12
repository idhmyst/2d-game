import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Splash loading UI
    const titleText = this.add.text(width / 2, height / 2 - 50, 'LOADING GAME...', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '24px',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1e293b, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2, 320, 24, 6);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x38bdf8, 1);
      progressBar.fillRoundedRect(width / 2 - 156, height / 2 + 4, 312 * value, 16, 4);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      titleText.destroy();
    });

    // Load Audio Assets
    this.load.audio('bgm', 'assets/audio/bgm.mp3');
    this.load.audio('jump', 'assets/audio/jump.wav');
    this.load.audio('hit', 'assets/audio/hit.wav');
    this.load.audio('coin', 'assets/audio/coin.wav');

    // Load Sprites
    this.load.spritesheet('hero', 'assets/sprites/hero.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('enemies', 'assets/sprites/enemies.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.image('tileset', 'assets/sprites/tileset.png');

    // Load UI
    this.load.image('button', 'assets/ui/button.png');
    this.load.spritesheet('hud_icons', 'assets/ui/hud_icons.png', {
      frameWidth: 24,
      frameHeight: 24
    });
  }

  public create(): void {
    this.ensureFallbackTextures();
    this.createAnimations();
    this.scene.start('MenuScene');
  }

  private ensureFallbackTextures(): void {
    // If hero texture failed or has only 1 frame, ensure animation frames exist
    if (!this.textures.exists('hero')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x38bdf8, 1);
      g.fillRoundedRect(4, 4, 24, 28, 4);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(12, 12, 3);
      g.fillCircle(20, 12, 3);
      g.generateTexture('hero', 32, 32);
      g.destroy();
    }

    if (!this.textures.exists('enemies')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xef4444, 1);
      g.fillRoundedRect(4, 6, 24, 24, 4);
      g.fillStyle(0x000000, 1);
      g.fillRect(8, 12, 4, 4);
      g.fillRect(20, 12, 4, 4);
      g.generateTexture('enemies', 32, 32);
      g.destroy();
    }

    if (!this.textures.exists('tileset')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x10b981, 1);
      g.fillRect(0, 0, 32, 8);
      g.fillStyle(0x78350f, 1);
      g.fillRect(0, 8, 32, 24);
      g.generateTexture('tileset', 32, 32);
      g.destroy();
    }

    if (!this.textures.exists('button')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x6366f1, 1);
      g.fillRoundedRect(0, 0, 180, 50, 10);
      g.generateTexture('button', 180, 50);
      g.destroy();
    }
  }

  private createAnimations(): void {
    const heroTexture = this.textures.get('hero');
    const heroFrames = heroTexture ? heroTexture.getFrameNames() : [];

    if (heroFrames.length > 2) {
      this.anims.create({
        key: 'hero-idle',
        frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 1 }),
        frameRate: 3,
        repeat: -1
      });

      this.anims.create({
        key: 'hero-run',
        frames: this.anims.generateFrameNumbers('hero', { start: 2, end: 5 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: 'hero-jump',
        frames: [{ key: 'hero', frame: 2 }],
        frameRate: 1
      });
    }

    const enemyTexture = this.textures.get('enemies');
    const enemyFrames = enemyTexture ? enemyTexture.getFrameNames() : [];
    if (enemyFrames.length > 1) {
      this.anims.create({
        key: 'enemy-walk',
        frames: this.anims.generateFrameNumbers('enemies', { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1
      });
    }
  }
}
