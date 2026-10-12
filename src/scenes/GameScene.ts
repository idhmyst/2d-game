import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { CollisionSystem } from '../systems/Collision';
import { AudioManager } from '../systems/AudioManager';
import { StorageManager } from '../systems/Storage';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private coins!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;

  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Graphics[] = [];
  private hudContainer!: Phaser.GameObjects.Container;
  private audioManager!: AudioManager;

  private isGameOver: boolean = false;
  private levelWidth: number = 2400;
  private levelHeight: number = 600;

  constructor() {
    super('GameScene');
  }

  public create(): void {
    this.isGameOver = false;
    this.score = 0;
    this.audioManager = AudioManager.getInstance();
    this.audioManager.setScene(this);

    // Setup world & physics bounds
    this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);

    // Background visuals
    this.createBackground();

    // Platforms & obstacles
    this.createPlatforms();

    // Player
    this.player = new Player(this, 100, 300);

    // Collectibles (Coins)
    this.createCoins();

    // Enemies
    this.createEnemies();

    // Physics Colliders & Triggers
    this.setupCollisions();

    // Camera follow
    this.setupCamera();

    // HUD Display
    this.createHUD();

    // Restart/Mute shortcuts
    this.input.keyboard?.on('keydown-M', () => {
      this.audioManager.toggleMute();
    });
  }

  public update(): void {
    if (this.isGameOver) return;

    // Update Player & Enemies
    this.player.update();

    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (enemy.active) {
        enemy.update();
      }
    });

    // Out of bounds check
    if (CollisionSystem.isOutOfBounds(this.player, this.levelHeight + 50)) {
      this.triggerGameOver(false);
    }
  }

  private createBackground(): void {
    // Parallax-like layered background shapes
    const bgGraphics = this.add.graphics();

    // Mountain silhouettes in distance
    bgGraphics.fillStyle(0x18182f, 1);
    for (let x = 0; x < this.levelWidth; x += 300) {
      bgGraphics.beginPath();
      bgGraphics.moveTo(x, 480);
      bgGraphics.lineTo(x + 150, 180 + (x % 90));
      bgGraphics.lineTo(x + 300, 480);
      bgGraphics.closePath();
      bgGraphics.fillPath();
    }

    // Midground hills
    bgGraphics.fillStyle(0x21254a, 1);
    for (let x = -50; x < this.levelWidth; x += 220) {
      bgGraphics.beginPath();
      bgGraphics.moveTo(x, 500);
      bgGraphics.lineTo(x + 110, 290 + (x % 50));
      bgGraphics.lineTo(x + 220, 500);
      bgGraphics.closePath();
      bgGraphics.fillPath();
    }
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    // Helper to build a platform segment
    const addPlatform = (x: number, y: number, width: number, height: number = 32) => {
      const g = this.add.graphics();
      // Grass top
      g.fillStyle(0x10b981, 1);
      g.fillRoundedRect(0, 0, width, 10, 3);
      // Dirt body
      g.fillStyle(0x334155, 1);
      g.fillRect(0, 8, width, height - 8);

      const texKey = `plat_${width}_${height}`;
      if (!this.textures.exists(texKey)) {
        g.generateTexture(texKey, width, height);
      }
      g.destroy();

      const plat = this.platforms.create(x + width / 2, y + height / 2, texKey) as Phaser.Physics.Arcade.Sprite;
      plat.refreshBody();
    };

    // Ground segments with pits
    addPlatform(0, 420, 500);
    addPlatform(580, 420, 450);
    addPlatform(1120, 420, 550);
    addPlatform(1760, 420, 640);

    // Elevated platforms
    addPlatform(200, 320, 140);
    addPlatform(390, 240, 140);
    addPlatform(640, 310, 160);
    addPlatform(860, 230, 140);
    addPlatform(1050, 310, 120);
    addPlatform(1240, 220, 160);
    addPlatform(1470, 300, 140);
    addPlatform(1670, 220, 140);
    addPlatform(1900, 290, 160);
    addPlatform(2120, 210, 160);

    // Goal Flagpole at the end
    const flagPole = this.add.graphics();
    flagPole.fillStyle(0xf59e0b, 1);
    flagPole.fillRect(2300, 220, 8, 200);
    flagPole.fillStyle(0xef4444, 1);
    flagPole.fillTriangle(2308, 220, 2348, 240, 2308, 260);

    const goalZone = this.add.zone(2300, 320, 40, 200);
    this.physics.add.existing(goalZone, true);
    this.physics.add.overlap(this.player, goalZone, () => {
      this.triggerVictory();
    });
  }

  private createCoins(): void {
    this.coins = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    const coinPositions = [
      { x: 230, y: 280 }, { x: 270, y: 280 },
      { x: 420, y: 200 }, { x: 460, y: 200 },
      { x: 680, y: 270 }, { x: 720, y: 270 },
      { x: 900, y: 190 }, { x: 930, y: 190 },
      { x: 1280, y: 180 }, { x: 1320, y: 180 },
      { x: 1510, y: 260 }, { x: 1710, y: 180 },
      { x: 1950, y: 250 }, { x: 2160, y: 170 },
      { x: 320, y: 380 }, { x: 750, y: 380 }, { x: 1350, y: 380 }, { x: 1850, y: 380 }
    ];

    coinPositions.forEach((pos, idx) => {
      const g = this.add.graphics();
      g.fillStyle(0xfbbf24, 1);
      g.fillCircle(10, 10, 9);
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(10, 10, 6);
      g.generateTexture(`coin_tex_${idx}`, 20, 20);
      g.destroy();

      const coin = this.coins.create(pos.x, pos.y, `coin_tex_${idx}`) as Phaser.Physics.Arcade.Sprite;

      // Bobbing floating animation
      this.tweens.add({
        targets: coin,
        y: pos.y - 6,
        duration: 800 + (idx % 300),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  private createEnemies(): void {
    this.enemies = this.physics.add.group();

    const enemySpawns = [
      { x: 350, y: 390, patrol: 80 },
      { x: 720, y: 390, patrol: 90 },
      { x: 920, y: 200, patrol: 50 },
      { x: 1300, y: 390, patrol: 100 },
      { x: 1520, y: 270, patrol: 50 },
      { x: 1880, y: 390, patrol: 80 }
    ];

    enemySpawns.forEach((spawn) => {
      const enemy = new Enemy(this, spawn.x, spawn.y, spawn.patrol);
      this.enemies.add(enemy);
    });
  }

  private setupCollisions(): void {
    // Player vs Platforms
    this.physics.add.collider(this.player, this.platforms);

    // Enemies vs Platforms
    this.physics.add.collider(this.enemies, this.platforms);

    // Player vs Coins (Overlap pickup)
    this.physics.add.overlap(this.player, this.coins, (_player, coinObj) => {
      const coin = coinObj as Phaser.Physics.Arcade.Sprite;
      this.collectCoin(coin);
    });

    // Player vs Enemies
    this.physics.add.collider(this.player, this.enemies, (_playerObj, enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (enemy.isDefeated) return;

      if (CollisionSystem.isStomp(this.player, enemy)) {
        // Stomp kill!
        this.player.bounce();
        enemy.stomp();
        this.score += GAME_CONFIG.score.enemyStompValue;
        this.updateScoreDisplay();
        this.audioManager.playSfx('hit', 0.8);
      } else {
        // Player hurt!
        const dead = this.player.takeDamage(1);
        this.updateHUDHearts();
        if (dead) {
          this.triggerGameOver(false);
        }
      }
    });
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  private createHUD(): void {
    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setScrollFactor(0);
    this.hudContainer.setDepth(100);

    // HUD Background strip
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x0f172a, 0.7);
    hudBg.fillRoundedRect(16, 14, 260, 48, 8);
    hudBg.lineStyle(1, 0x334155, 0.8);
    hudBg.strokeRoundedRect(16, 14, 260, 48, 8);
    this.hudContainer.add(hudBg);

    // Hearts
    this.drawHUDHearts();

    // Score text
    this.scoreText = this.add.text(140, 28, 'SCORE: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#f8fafc'
    });
    this.hudContainer.add(this.scoreText);
  }

  private drawHUDHearts(): void {
    this.hearts.forEach((h) => h.destroy());
    this.hearts = [];

    for (let i = 0; i < GAME_CONFIG.player.maxHp; i++) {
      const h = this.add.graphics();
      h.setScrollFactor(0);
      const isFilled = i < this.player.hp;

      h.fillStyle(isFilled ? 0xef4444 : 0x475569, 1);
      h.fillCircle(36 + i * 28, 38, 9);
      this.hudContainer.add(h);
      this.hearts.push(h);
    }
  }

  private updateHUDHearts(): void {
    this.drawHUDHearts();
  }

  private collectCoin(coin: Phaser.Physics.Arcade.Sprite): void {
    coin.disableBody(true, true);
    this.score += GAME_CONFIG.score.coinValue;
    this.updateScoreDisplay();
    this.audioManager.playSfx('coin', 0.6);

    // Tiny pickup sparkle/score popup
    const popup = this.add.text(coin.x, coin.y - 10, `+${GAME_CONFIG.score.coinValue}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#fbbf24'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: popup.y - 25,
      alpha: 0,
      duration: 600,
      onComplete: () => popup.destroy()
    });
  }

  private updateScoreDisplay(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  private triggerGameOver(victory: boolean): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    StorageManager.saveLastScore(this.score);
    const isNewHigh = StorageManager.saveHighScore(this.score);

    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        victory,
        isNewHighScore: isNewHigh
      });
    });
  }

  private triggerVictory(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Victory bonus
    this.score += 500;
    this.updateScoreDisplay();
    this.audioManager.playSfx('coin', 0.9);

    const banner = this.add.text(this.cameras.main.midPoint.x, this.cameras.main.midPoint.y - 50, 'LEVEL COMPLETE!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#34d399'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: banner,
      scale: 1.2,
      duration: 400,
      yoyo: true,
      repeat: 1
    });

    this.triggerGameOver(true);
  }
}
