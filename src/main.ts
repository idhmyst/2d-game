import Phaser from 'phaser';

// --- GLOBAL INPUT TRACKER ---
export const globalInput = {
  left: false,
  right: false,
  jump: false
};
if (typeof window !== 'undefined') {
  (window as any).__globalInput = globalInput;
}

// --- UNIFIED FULLSCREEN TOGGLE ---
export function toggleGameFullscreen() {
  const elem = document.getElementById('game-wrapper') || document.documentElement;
  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
}

if (typeof window !== 'undefined') {
  // Global Keyboard Controls (Always active, no focus needed)
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    const code = e.code;
    if (k === 'a' || k === 'arrowleft' || code === 'KeyA' || code === 'ArrowLeft') {
      globalInput.left = true;
    }
    if (k === 'd' || k === 'arrowright' || code === 'KeyD' || code === 'ArrowRight') {
      globalInput.right = true;
    }
    if (k === 'w' || k === 'arrowup' || k === ' ' || code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
      globalInput.jump = true;
    }
    if (code === 'KeyF' || k === 'f') {
      toggleGameFullscreen();
    }
    if (code === 'KeyR' || k === 'r') {
      const g = (window as any).__PHASER_GAME__;
      if (g) {
        const s = g.scene.getScene('GameScene');
        if (s) s.scene.restart();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    const code = e.code;
    if (k === 'a' || k === 'arrowleft' || code === 'KeyA' || code === 'ArrowLeft') {
      globalInput.left = false;
    }
    if (k === 'd' || k === 'arrowright' || code === 'KeyD' || code === 'ArrowRight') {
      globalInput.right = false;
    }
    if (k === 'w' || k === 'arrowup' || k === ' ' || code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
      globalInput.jump = false;
    }
  });

  // Handle Fullscreen state change
  document.addEventListener('fullscreenchange', () => {
    const fsBtn = document.getElementById('btn-fs');
    if (fsBtn) {
      fsBtn.textContent = document.fullscreenElement ? '🗗' : '⛶';
      fsBtn.title = document.fullscreenElement ? 'Keluar Layar Penuh (F)' : 'Layar Penuh (F)';
    }
    const g = (window as any).__PHASER_GAME__;
    if (g && g.scale) {
      setTimeout(() => {
        g.scale.refresh();
      }, 100);
    }
  });

  // Setup HTML On-Screen Controls with Click & Hold Support
  const setupHTMLControls = () => {
    // Auto-focus game wrapper
    const wrapper = document.getElementById('game-wrapper');
    if (wrapper) wrapper.focus();

    window.addEventListener('click', () => {
      document.getElementById('game-wrapper')?.focus();
    });

    const bindBtn = (id: string, key: 'left' | 'right' | 'jump') => {
      const el = document.getElementById(id);
      if (!el) return;

      let minTimer: any = null;

      const press = (ev: Event) => {
        ev.preventDefault();
        document.getElementById('game-wrapper')?.focus();
        clearTimeout(minTimer);
        globalInput[key] = true;
        el.classList.add('active');
      };

      const release = (ev: Event) => {
        ev.preventDefault();
        // Keep active for at least 320ms on tap so character visibly runs
        clearTimeout(minTimer);
        minTimer = setTimeout(() => {
          globalInput[key] = false;
          el.classList.remove('active');
        }, 320);
      };

      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('mousedown', press);
      el.addEventListener('mouseup', release);
      el.addEventListener('touchstart', press, { passive: false });
      el.addEventListener('touchend', release, { passive: false });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    };

    bindBtn('btn-left', 'left');
    bindBtn('btn-right', 'right');
    bindBtn('btn-jump', 'jump');

    const fsBtn = document.getElementById('btn-fs');
    if (fsBtn) {
      fsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleGameFullscreen();
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHTMLControls);
  } else {
    setTimeout(setupHTMLControls, 50);
  }
}

// --- AUDIO MANAGER ---
class AudioManager {
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  play(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, config);
    }
  }
}

// --- MARIO-STYLE LEVEL DATA ---
interface LevelConfig {
  name: string;
  worldWidth: number;
  skyColorTop: number;
  skyColorBottom: number;
  hillsColor: number;
  groundColor: number;
  grassColor: number;
  pipes: { x: number; height: number }[];
  blocks: { x: number; y: number; type: 'brick' | 'question'; hasCoin?: boolean }[];
  spikes: { x: number; y: number; width: number }[];
  enemies: { x: number; y: number; patrol: number }[];
  coins: { x: number; y: number }[];
  goalX: number;
}

const LEVELS: LevelConfig[] = [
  {
    name: 'WORLD 1-1: GREEN HILLS',
    worldWidth: 3200,
    skyColorTop: 0x5c94fc,
    skyColorBottom: 0xc4e0e5,
    hillsColor: 0x48bb78,
    groundColor: 0x8b4513,
    grassColor: 0x22c55e,
    pipes: [
      { x: 500, height: 44 },
      { x: 950, height: 60 },
      { x: 1600, height: 48 },
      { x: 2350, height: 64 }
    ],
    blocks: [
      { x: 300, y: 440, type: 'question', hasCoin: true },
      { x: 332, y: 440, type: 'brick' },
      { x: 364, y: 440, type: 'question', hasCoin: true },
      { x: 396, y: 440, type: 'brick' },
      { x: 428, y: 440, type: 'question', hasCoin: true },
      // Elevated platform blocks (easy jump from ground)
      { x: 720, y: 410, type: 'brick' },
      { x: 752, y: 410, type: 'question', hasCoin: true },
      { x: 784, y: 410, type: 'brick' },
      // Stepping block to reach secret line
      { x: 1160, y: 430, type: 'brick' },
      { x: 1200, y: 360, type: 'question', hasCoin: true },
      { x: 1232, y: 360, type: 'brick' },
      { x: 1264, y: 360, type: 'brick' },
      { x: 1296, y: 360, type: 'question', hasCoin: true },
      // Staircase near goal
      { x: 2600, y: 520, type: 'brick' },
      { x: 2632, y: 520, type: 'brick' },
      { x: 2632, y: 488, type: 'brick' },
      { x: 2664, y: 520, type: 'brick' },
      { x: 2664, y: 488, type: 'brick' },
      { x: 2664, y: 456, type: 'brick' }
    ],
    spikes: [
      { x: 800, y: 568, width: 48 },
      { x: 1420, y: 568, width: 64 },
      { x: 2050, y: 568, width: 64 }
    ],
    enemies: [
      { x: 420, y: 530, patrol: 70 },
      { x: 680, y: 530, patrol: 80 },
      { x: 1100, y: 530, patrol: 90 },
      { x: 1350, y: 530, patrol: 60 },
      { x: 1800, y: 530, patrol: 100 },
      { x: 2200, y: 530, patrol: 80 }
    ],
    coins: [
      { x: 300, y: 395 }, { x: 364, y: 395 }, { x: 428, y: 395 },
      { x: 500, y: 460 }, { x: 752, y: 365 }, { x: 950, y: 440 },
      { x: 1232, y: 315 }, { x: 1264, y: 315 }, { x: 1600, y: 455 },
      { x: 1900, y: 520 }, { x: 1950, y: 520 }, { x: 2000, y: 520 },
      { x: 2350, y: 435 }, { x: 2500, y: 520 }
    ],
    goalX: 2900
  },
  {
    name: 'WORLD 1-2: SUNSET FORTRESS',
    worldWidth: 3600,
    skyColorTop: 0xf97316,
    skyColorBottom: 0xfef08a,
    hillsColor: 0x9a3412,
    groundColor: 0x475569,
    grassColor: 0x64748b,
    pipes: [
      { x: 450, height: 48 },
      { x: 1100, height: 64 },
      { x: 1800, height: 52 },
      { x: 2550, height: 68 }
    ],
    blocks: [
      { x: 260, y: 440, type: 'question', hasCoin: true },
      { x: 292, y: 440, type: 'brick' },
      { x: 650, y: 400, type: 'question', hasCoin: true },
      { x: 682, y: 400, type: 'brick' },
      { x: 714, y: 400, type: 'question', hasCoin: true },
      // Stepping block to reach platform
      { x: 1310, y: 430, type: 'brick' },
      { x: 1350, y: 365, type: 'brick' },
      { x: 1382, y: 365, type: 'question', hasCoin: true },
      { x: 1414, y: 365, type: 'brick' },
      { x: 2100, y: 410, type: 'brick' },
      { x: 2132, y: 410, type: 'question', hasCoin: true },
      { x: 2164, y: 410, type: 'brick' }
    ],
    spikes: [
      { x: 750, y: 568, width: 80 },
      { x: 1280, y: 568, width: 96 },
      { x: 1950, y: 568, width: 110 },
      { x: 2350, y: 568, width: 80 }
    ],
    enemies: [
      { x: 380, y: 530, patrol: 60 },
      { x: 880, y: 530, patrol: 90 },
      { x: 1480, y: 530, patrol: 80 },
      { x: 1650, y: 530, patrol: 90 },
      { x: 2250, y: 530, patrol: 100 },
      { x: 2800, y: 530, patrol: 110 }
    ],
    coins: [
      { x: 260, y: 395 }, { x: 650, y: 355 }, { x: 714, y: 355 },
      { x: 1100, y: 440 }, { x: 1382, y: 320 }, { x: 1550, y: 520 },
      { x: 1800, y: 450 }, { x: 2132, y: 365 }, { x: 2450, y: 520 },
      { x: 2700, y: 520 }, { x: 3000, y: 520 }
    ],
    goalX: 3300
  }
];

// --- MAIN GAME SCENE ---
class GameScene extends Phaser.Scene {
  private currentLevelIndex: number = 0;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private blocksGroup!: Phaser.Physics.Arcade.StaticGroup;
  private pipesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private hazardsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private coinsGroup!: Phaser.Physics.Arcade.Group;
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // Stats & State
  private score: number = 0;
  private lives: number = 3;
  private coinsCount: number = 0;
  private isInvulnerable: boolean = false;
  private isLevelComplete: boolean = false;
  private isDying: boolean = false;

  // UI
  private hudContainer!: Phaser.GameObjects.Container;
  private scoreText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private heartIcons: Phaser.GameObjects.Image[] = [];

  // Parallax layers
  private clouds: Phaser.GameObjects.Graphics[] = [];
  private audioMgr!: AudioManager;
  private usingHeroSprite: boolean = false;
  private targetX: number | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // 1. Audio
    this.load.audio('bgm', 'assets/audio/bgm.mp3');
    this.load.audio('jump', 'assets/audio/jump.wav');
    this.load.audio('coin', 'assets/audio/coin.wav');
    this.load.audio('hurt', 'assets/audio/hurt.wav');
    this.load.audio('gameover', 'assets/audio/gameover.wav');

    // 2. Sprites
    this.load.spritesheet('hero_sprite', 'assets/sprites/hero.png', {
      frameWidth: 32,
      frameHeight: 48
    });

    // 3. Generate Rich Graphics Procedurally for retro theme
    this.generateProceduralTextures();
  }

  private generateProceduralTextures(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });

    // Fallback Player (Blue square)
    gfx.clear();
    gfx.fillStyle(0x38bdf8);
    gfx.fillRoundedRect(0, 0, 32, 48, 6);
    gfx.generateTexture('player_fallback', 32, 48);

    // Ground Dirt Tile (32x32)
    gfx.clear();
    gfx.fillStyle(0x8b4513);
    gfx.fillRect(0, 0, 32, 32);
    gfx.fillStyle(0xa0522d);
    gfx.fillRect(2, 2, 28, 8);
    gfx.fillStyle(0x652a06);
    gfx.fillRect(4, 16, 6, 6);
    gfx.fillRect(18, 22, 6, 6);
    gfx.generateTexture('tex_ground', 32, 32);

    // Grass Top Tile (32x32)
    gfx.clear();
    gfx.fillStyle(0x8b4513);
    gfx.fillRect(0, 0, 32, 32);
    gfx.fillStyle(0x22c55e);
    gfx.fillRect(0, 0, 32, 10);
    // Grass blades pattern
    gfx.fillStyle(0x16a34a);
    gfx.fillTriangle(4, 10, 8, 14, 12, 10);
    gfx.fillTriangle(18, 10, 22, 14, 26, 10);
    gfx.generateTexture('tex_grass_top', 32, 32);

    // Brick Block (32x32)
    gfx.clear();
    gfx.fillStyle(0xb45309);
    gfx.fillRect(0, 0, 32, 32);
    gfx.lineStyle(2, 0x451a03);
    gfx.strokeRect(1, 1, 30, 30);
    gfx.beginPath();
    gfx.moveTo(1, 16); gfx.lineTo(31, 16);
    gfx.moveTo(16, 1); gfx.lineTo(16, 16);
    gfx.moveTo(8, 16); gfx.lineTo(8, 31);
    gfx.moveTo(24, 16); gfx.lineTo(24, 31);
    gfx.strokePath();
    gfx.generateTexture('tex_brick', 32, 32);

    // Question Mark Block (32x32 golden block)
    gfx.clear();
    gfx.fillStyle(0xf59e0b);
    gfx.fillRoundedRect(0, 0, 32, 32, 4);
    gfx.lineStyle(2, 0xd97706);
    gfx.strokeRoundedRect(1, 1, 30, 30, 4);
    // Draw "?" mark
    gfx.fillStyle(0xffffff);
    gfx.fillRect(10, 6, 12, 4);
    gfx.fillRect(18, 10, 4, 4);
    gfx.fillRect(14, 14, 8, 4);
    gfx.fillRect(14, 18, 4, 4);
    gfx.fillRect(14, 24, 4, 4);
    gfx.generateTexture('tex_question', 32, 32);

    // Empty/Hit Question Block (32x32 brown solid)
    gfx.clear();
    gfx.fillStyle(0x78716c);
    gfx.fillRoundedRect(0, 0, 32, 32, 4);
    gfx.lineStyle(2, 0x44403c);
    gfx.strokeRoundedRect(1, 1, 30, 30, 4);
    gfx.generateTexture('tex_block_empty', 32, 32);

    // Animated Golden Coin (20x20)
    gfx.clear();
    gfx.fillStyle(0xfbbf24);
    gfx.fillCircle(10, 10, 9);
    gfx.fillStyle(0xf59e0b);
    gfx.fillCircle(10, 10, 6);
    gfx.fillStyle(0xfef08a);
    gfx.fillCircle(8, 7, 2);
    gfx.generateTexture('tex_coin', 20, 20);

    // Goomba / Enemy (32x32 mushroom-like monster)
    gfx.clear();
    gfx.fillStyle(0x991b1b);
    gfx.fillRoundedRect(2, 4, 28, 22, 10);
    // Eyes
    gfx.fillStyle(0xffffff);
    gfx.fillRect(7, 12, 5, 8);
    gfx.fillRect(20, 12, 5, 8);
    gfx.fillStyle(0x000000);
    gfx.fillRect(9, 14, 3, 5);
    gfx.fillRect(20, 14, 3, 5);
    // Eyebrows (angry)
    gfx.lineStyle(2, 0x000000);
    gfx.lineBetween(6, 10, 13, 13);
    gfx.lineBetween(26, 10, 19, 13);
    // Feet
    gfx.fillStyle(0x1e293b);
    gfx.fillRoundedRect(4, 24, 10, 8, 3);
    gfx.fillRoundedRect(18, 24, 10, 8, 3);
    gfx.generateTexture('tex_enemy', 32, 32);

    // Classic Red Spikes (32x16)
    gfx.clear();
    gfx.fillStyle(0xdc2626);
    for (let s = 0; s < 32; s += 8) {
      gfx.fillTriangle(s, 16, s + 4, 0, s + 8, 16);
    }
    gfx.generateTexture('tex_spike', 32, 16);

    // Heart Icon for Lives (22x20)
    gfx.clear();
    gfx.fillStyle(0xef4444);
    gfx.fillCircle(6, 6, 6);
    gfx.fillCircle(16, 6, 6);
    gfx.fillTriangle(0, 8, 22, 8, 11, 20);
    gfx.generateTexture('tex_heart', 22, 20);

    // Flagpole (16x280)
    gfx.clear();
    gfx.fillStyle(0x10b981);
    gfx.fillCircle(8, 8, 8);
    gfx.fillStyle(0xe2e8f0);
    gfx.fillRect(6, 16, 4, 260);
    gfx.fillStyle(0x334155);
    gfx.fillRect(0, 266, 16, 14);
    gfx.generateTexture('tex_flagpole', 16, 280);

    // Flag Banner (36x24 triangle)
    gfx.clear();
    gfx.fillStyle(0xef4444);
    gfx.fillTriangle(0, 0, 36, 12, 0, 24);
    gfx.generateTexture('tex_flag', 36, 24);

    gfx.destroy();
  }

  create() {
    this.isLevelComplete = false;
    this.isDying = false;
    this.isInvulnerable = false;

    this.audioMgr = new AudioManager(this);
    this.audioMgr.play('bgm', { loop: true, volume: 0.4 });

    const lvl = LEVELS[this.currentLevelIndex];

    // Set World Physics Bounds
    this.physics.world.setBounds(0, 0, lvl.worldWidth, 600);

    // 1. Dynamic Parallax Background
    this.createScenicBackground(lvl);

    // 2. Physics Groups
    this.platforms = this.physics.add.staticGroup();
    this.blocksGroup = this.physics.add.staticGroup();
    this.pipesGroup = this.physics.add.staticGroup();
    this.hazardsGroup = this.physics.add.staticGroup();
    this.coinsGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.enemiesGroup = this.physics.add.group();

    // 3. Player Setup (Must precede terrain & collision setups)
    this.createPlayer();

    // 4. Build Level Elements
    this.buildLevelTerrain(lvl);

    // 5. Setup Collisions & Overlaps
    this.setupPhysicsInteractions();

    // 6. Camera Follow
    this.cameras.main.setBounds(0, 0, lvl.worldWidth, 600);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    // 7. HUD Display (Fixed to screen)
    this.createHUD(lvl);

    // 8. Keyboard Controls & Capture
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.input.keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.S,
        Phaser.Input.Keyboard.KeyCodes.D
      ]);
    }

    // Direct mouse / tap controls on canvas
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.game.canvas) this.game.canvas.focus();
      const wrapper = document.getElementById('game-wrapper');
      if (wrapper) wrapper.focus();

      if (pointer.y < 60) return; // Don't trigger movement if clicking HUD area

      // Unlock Web Audio if browser suspended it
      const ctx = (this.sound as any)?.context;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      // Tap upper half -> Jump!
      if (pointer.y < 380) {
        globalInput.jump = true;
        this.time.delayedCall(240, () => {
          globalInput.jump = false;
        });
      }

      // Set target destination (Click anywhere to walk there!)
      this.targetX = pointer.worldX;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || pointer.y < 60) return;
      this.targetX = pointer.worldX;
    });

    this.input.on('pointerup', () => {
      globalInput.jump = false;
    });
  }

  private createScenicBackground(lvl: LevelConfig): void {
    // Sky Gradient (Widescreen 16:9 width 1066)
    const skyGfx = this.add.graphics().setScrollFactor(0);
    skyGfx.fillGradientStyle(lvl.skyColorTop, lvl.skyColorTop, lvl.skyColorBottom, lvl.skyColorBottom, 1);
    skyGfx.fillRect(0, 0, 1066, 600);

    // Distant Mountains / Pyramids (ScrollFactor 0.1)
    const mountains = this.add.graphics().setScrollFactor(0.1);
    mountains.fillStyle(0x3b82f6, 0.4);
    for (let x = 0; x < lvl.worldWidth * 0.5; x += 360) {
      mountains.beginPath();
      mountains.moveTo(x, 560);
      mountains.lineTo(x + 180, 220 + (x % 90));
      mountains.lineTo(x + 360, 560);
      mountains.closePath();
      mountains.fillPath();
    }

    // Lush Rolling Hills (ScrollFactor 0.3)
    const hills = this.add.graphics().setScrollFactor(0.3);
    hills.fillStyle(lvl.hillsColor, 0.85);
    for (let x = -50; x < lvl.worldWidth * 0.7; x += 260) {
      hills.beginPath();
      hills.arc(x + 130, 560, 160, Math.PI, 0, false);
      hills.fillPath();
    }

    // Fluffy Drifting Clouds (ScrollFactor 0.2)
    this.clouds = [];
    for (let i = 0; i < 15; i++) {
      const cx = Phaser.Math.Between(0, lvl.worldWidth);
      const cy = Phaser.Math.Between(40, 220);
      const cloudGfx = this.add.graphics();
      cloudGfx.setScrollFactor(0.2);
      cloudGfx.fillStyle(0xffffff, 0.85);
      cloudGfx.fillCircle(cx, cy, 26);
      cloudGfx.fillCircle(cx + 24, cy - 8, 20);
      cloudGfx.fillCircle(cx + 46, cy, 24);
      cloudGfx.fillRoundedRect(cx - 10, cy, 70, 16, 8);
      this.clouds.push(cloudGfx);
    }

    // Foreground Bushes (ScrollFactor 1.0)
    const bushes = this.add.graphics();
    bushes.fillStyle(0x15803d, 1);
    for (let x = 120; x < lvl.worldWidth - 300; x += 420) {
      bushes.fillCircle(x, 560, 24);
      bushes.fillCircle(x + 28, 552, 28);
      bushes.fillCircle(x + 56, 560, 24);
    }
  }

  private buildLevelTerrain(lvl: LevelConfig): void {
    // 1. Continuous Ground with intermittent pits (gap challenges)
    const pitGaps = [
      { start: 850, end: 930 },
      { start: 1680, end: 1780 },
      { start: 2420, end: 2520 }
    ];

    const isPit = (x: number) => pitGaps.some(p => x >= p.start && x <= p.end);

    for (let x = 0; x < lvl.worldWidth; x += 32) {
      if (isPit(x)) continue;

      // Top grass layer
      this.platforms.create(x + 16, 568, 'tex_grass_top');
      // Sub-dirt layers
      this.platforms.create(x + 16, 600, 'tex_ground');
    }

    // 2. Mario Pipes (Solid obstacle + platform)
    lvl.pipes.forEach((pipe) => {
      this.createPipe(pipe.x, 552 - pipe.height, pipe.height);
    });

    // 3. Blocks (Bricks & Question Mark Lucky Blocks)
    lvl.blocks.forEach((b) => {
      const texKey = b.type === 'question' ? 'tex_question' : 'tex_brick';
      const block = this.blocksGroup.create(b.x, b.y, texKey) as Phaser.Physics.Arcade.Sprite;
      block.setData('type', b.type);
      block.setData('hasCoin', b.hasCoin ?? false);
      block.setData('hit', false);
      block.refreshBody();
    });

    // 4. Spikes / Hazards
    lvl.spikes.forEach((s) => {
      for (let sx = 0; sx < s.width; sx += 32) {
        this.hazardsGroup.create(s.x + sx + 16, s.y, 'tex_spike');
      }
    });

    // 5. Coins
    lvl.coins.forEach((c) => {
      const coin = this.coinsGroup.create(c.x, c.y, 'tex_coin') as Phaser.Physics.Arcade.Sprite;
      // Gentle floating tween
      this.tweens.add({
        targets: coin,
        y: c.y - 6,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // 6. Enemies (Patrolling Goombas)
    lvl.enemies.forEach((e) => {
      const enemy = this.enemiesGroup.create(e.x, e.y, 'tex_enemy') as Phaser.Physics.Arcade.Sprite;
      enemy.setBounce(0.1);
      enemy.setCollideWorldBounds(false);
      enemy.setSize(26, 26);
      enemy.setOffset(3, 6);
      enemy.setData('minX', e.x - e.patrol);
      enemy.setData('maxX', e.x + e.patrol);
      enemy.setData('dir', -1);
      enemy.setVelocityX(-70);
    });

    // 7. Destination / Victory Flagpole
    this.createGoalFlag(lvl.goalX);
  }

  private createPipe(x: number, y: number, height: number): void {
    const pipeGfx = this.make.graphics({ x: 0, y: 0 });
    // Pipe Body
    pipeGfx.fillStyle(0x16a34a);
    pipeGfx.fillRect(4, 18, 48, height);
    pipeGfx.fillStyle(0x22c55e);
    pipeGfx.fillRect(8, 18, 10, height);
    // Pipe Rim
    pipeGfx.fillStyle(0x15803d);
    pipeGfx.fillRoundedRect(0, 0, 56, 18, 4);
    pipeGfx.fillStyle(0x4ade80);
    pipeGfx.fillRect(6, 2, 10, 14);

    const key = `pipe_${height}`;
    if (!this.textures.exists(key)) {
      pipeGfx.generateTexture(key, 56, height + 18);
    }
    pipeGfx.destroy();

    const pipeSprite = this.pipesGroup.create(x, y - 9 + (height / 2), key) as Phaser.Physics.Arcade.Sprite;
    pipeSprite.refreshBody();
  }

  private createGoalFlag(x: number): void {
    // Flagpole
    const pole = this.add.image(x, 412, 'tex_flagpole');
    const flag = this.add.image(x + 22, 292, 'tex_flag');

    // Castle structure at the finish line
    const castleGfx = this.add.graphics();
    castleGfx.fillStyle(0x475569);
    castleGfx.fillRect(x + 70, 390, 130, 162);
    // Battlements
    for (let bx = 0; bx < 130; bx += 26) {
      castleGfx.fillRect(x + 70 + bx, 370, 16, 20);
    }
    // Doorway
    castleGfx.fillStyle(0x0f172a);
    castleGfx.fillRoundedRect(x + 115, 470, 40, 82, 14);

    // Goal Trigger Zone
    const goalZone = this.add.zone(x, 412, 30, 280);
    this.physics.add.existing(goalZone, true);
    this.physics.add.overlap(this.player, goalZone, () => {
      this.triggerLevelVictory(flag, pole);
    });
  }

  private createPlayer(): void {
    this.usingHeroSprite = this.textures.exists('hero_sprite');

    // Create Animations
    if (this.usingHeroSprite) {
      if (!this.anims.exists('hero_idle')) {
        this.anims.create({
          key: 'hero_idle',
          frames: this.anims.generateFrameNumbers('hero_sprite', { start: 0, end: 3 }),
          frameRate: 6,
          repeat: -1
        });
      }
      if (!this.anims.exists('hero_run')) {
        this.anims.create({
          key: 'hero_run',
          frames: this.anims.generateFrameNumbers('hero_sprite', { start: 4, end: 9 }),
          frameRate: 11,
          repeat: -1
        });
      }
      if (!this.anims.exists('hero_jump')) {
        this.anims.create({
          key: 'hero_jump',
          frames: [{ key: 'hero_sprite', frame: 10 }],
          frameRate: 1
        });
      }
    }

    const tex = this.usingHeroSprite ? 'hero_sprite' : 'player_fallback';
    this.player = this.physics.add.sprite(80, 520, tex);
    this.player.setCollideWorldBounds(false);
    this.player.setSize(24, 44);
    this.player.setOffset(4, 4);

    if (this.usingHeroSprite) {
      this.player.play('hero_idle');
    }
  }

  private setupPhysicsInteractions(): void {
    // Collisions with terrain
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.pipesGroup);
    this.physics.add.collider(this.enemiesGroup, this.platforms);
    this.physics.add.collider(this.enemiesGroup, this.pipesGroup);

    // Blocks (Hit from bottom like Mario)
    this.physics.add.collider(this.player, this.blocksGroup, (pObj, bObj) => {
      const playerBody = (pObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).body;
      const block = bObj as Phaser.Physics.Arcade.Sprite;

      // Mario Head Butt: Player rising and hitting bottom of block
      if (playerBody.blocked.up && playerBody.velocity.y < 0) {
        this.hitBlock(block);
      }
    });

    // Coins Pickup
    this.physics.add.overlap(this.player, this.coinsGroup, (_player, coinObj) => {
      const coin = coinObj as Phaser.Physics.Arcade.Sprite;
      this.collectCoin(coin);
    });

    // Hazards (Spikes)
    this.physics.add.overlap(this.player, this.hazardsGroup, () => {
      this.playerHurt();
    });

    // Enemies (Stomp vs Damage)
    this.physics.add.collider(this.player, this.enemiesGroup, (_pObj, eObj) => {
      const enemy = eObj as Phaser.Physics.Arcade.Sprite;
      const pBody = this.player.body;
      const eBody = enemy.body as Phaser.Physics.Arcade.Body | null;
      if (!pBody || !eBody) return;

      // In-air stomp from above
      if (pBody.velocity.y > 0 && pBody.bottom <= eBody.top + 18) {
        // Stomp kill!
        this.player.setVelocityY(-400); // Mario bounce
        this.score += 200;
        this.updateHUD();
        this.audioMgr.play('hurt', { volume: 0.6 });

        // Squash enemy
        enemy.setVelocity(0, 0);
        if (enemy.body) {
          enemy.body.checkCollision.none = true;
        }
        this.tweens.add({
          targets: enemy,
          scaleY: 0.2,
          y: enemy.y + 12,
          alpha: 0,
          duration: 200,
          onComplete: () => enemy.destroy()
        });
      } else {
        // Player touched from side/bottom
        this.playerHurt();
      }
    });
  }

  private hitBlock(block: Phaser.Physics.Arcade.Sprite): void {
    if (block.getData('hit')) return;

    // Bump block animation
    const originalY = block.y;
    this.tweens.add({
      targets: block,
      y: originalY - 10,
      duration: 80,
      yoyo: true,
      onComplete: () => {
        block.y = originalY;
      }
    });

    const hasCoin = block.getData('hasCoin');
    if (hasCoin) {
      block.setData('hit', true);
      block.setTexture('tex_block_empty');
      this.audioMgr.play('coin', { volume: 0.8 });
      this.score += 100;
      this.coinsCount++;
      this.updateHUD();

      // Coin pop-up effect
      const popCoin = this.add.image(block.x, block.y - 16, 'tex_coin');
      this.tweens.add({
        targets: popCoin,
        y: block.y - 60,
        alpha: 0,
        duration: 400,
        onComplete: () => popCoin.destroy()
      });
    } else {
      this.audioMgr.play('hurt', { volume: 0.4 });
    }
  }

  private collectCoin(coin: Phaser.Physics.Arcade.Sprite): void {
    coin.disableBody(true, true);
    this.audioMgr.play('coin', { volume: 0.8 });
    this.score += 10;
    this.coinsCount++;
    this.updateHUD();

    // Floating text
    const text = this.add.text(coin.x, coin.y - 10, '+10', {
      fontSize: '12px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: text.y - 20,
      alpha: 0,
      duration: 500,
      onComplete: () => text.destroy()
    });
  }

  private playerHurt(): void {
    if (this.isInvulnerable || this.isDying || this.isLevelComplete) return;

    this.lives--;
    this.audioMgr.play('hurt', { volume: 0.9 });
    this.updateHUD();

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    // Invulnerability flashing
    this.isInvulnerable = true;
    this.player.setVelocityY(-260);
    this.player.setVelocityX(this.player.flipX ? 150 : -150);

    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.player.alpha = 1;
        this.isInvulnerable = false;
      }
    });
  }

  private triggerGameOver(): void {
    this.isDying = true;
    this.audioMgr.play('gameover');
    this.player.setVelocity(0, -450);
    this.player.setCollideWorldBounds(false);
    this.player.body.checkCollision.none = true;
    this.player.setTint(0xef4444);

    const banner = this.add.text(533, 260, 'GAME OVER', {
      fontSize: '36px',
      color: '#ef4444',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setScrollFactor(0);

    this.time.delayedCall(2000, () => {
      banner.destroy();
      this.lives = 3;
      this.score = 0;
      this.coinsCount = 0;
      this.scene.restart();
    });
  }

  private triggerLevelVictory(flag: Phaser.GameObjects.Image, pole: Phaser.GameObjects.Image): void {
    if (this.isLevelComplete || this.isDying) return;
    this.isLevelComplete = true;

    // Slide flag down the pole
    this.tweens.add({
      targets: flag,
      y: pole.y + 110,
      duration: 800,
      ease: 'Power2'
    });

    // Player victory walk towards castle
    this.player.setVelocityX(120);
    this.audioMgr.play('coin', { volume: 1 });

    const victoryBanner = this.add.text(533, 240, 'STAGE CLEAR!', {
      fontSize: '32px',
      color: '#22c55e',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setScrollFactor(0);

    this.time.delayedCall(2200, () => {
      victoryBanner.destroy();
      // Next level or loop
      this.currentLevelIndex = (this.currentLevelIndex + 1) % LEVELS.length;
      this.scene.restart();
    });
  }

  // --- SNAPPY MARIO PHYSICS LOOP ---
  update() {
    if (this.isDying) return;

    // Pitfall Death check
    if (this.player.y > 600) {
      this.playerHurt();
      if (this.lives > 0) {
        // Respawn nearby
        this.player.setPosition(Math.max(60, this.player.x - 200), 400);
        this.player.setVelocity(0, 0);
      }
      return;
    }

    if (this.isLevelComplete) return;

    const onGround = Boolean(this.player.body.touching.down || this.player.body.blocked.down);
    const left = Boolean(globalInput.left || this.cursors?.left?.isDown || this.keyA?.isDown);
    const right = Boolean(globalInput.right || this.cursors?.right?.isDown || this.keyD?.isDown);
    const jumpPressed = Boolean(globalInput.jump || this.cursors?.up?.isDown || this.keyW?.isDown || this.keySpace?.isDown);

    // 1. Direct Horizontal Velocity Control (100% Responsive Keyboard, Button & Click-to-Move)
    const moveSpeed = 230;
    if (left) {
      this.targetX = null;
      this.player.setVelocityX(-moveSpeed);
      this.player.setFlipX(true);
      if (this.usingHeroSprite && onGround) {
        this.player.play('hero_run', true);
      }
    } else if (right) {
      this.targetX = null;
      this.player.setVelocityX(moveSpeed);
      this.player.setFlipX(false);
      if (this.usingHeroSprite && onGround) {
        this.player.play('hero_run', true);
      }
    } else if (this.targetX !== null) {
      // Walk towards clicked world position
      const diff = this.targetX - this.player.x;
      if (Math.abs(diff) > 12) {
        const dir = diff > 0 ? 1 : -1;
        this.player.setVelocityX(dir * moveSpeed);
        this.player.setFlipX(dir < 0);
        if (this.usingHeroSprite && onGround) {
          this.player.play('hero_run', true);
        }
      } else {
        this.targetX = null;
        this.player.setVelocityX(0);
        if (this.usingHeroSprite && onGround) {
          this.player.play('hero_idle', true);
        }
      }
    } else {
      this.player.setVelocityX(0);
      if (this.usingHeroSprite && onGround) {
        this.player.play('hero_idle', true);
      }
    }

    // 2. Snappy Mario Jump Physics
    if (jumpPressed && onGround) {
      this.player.setVelocityY(-610);
      this.audioMgr.play('jump', { volume: 0.65 });
      if (this.usingHeroSprite) {
        this.player.play('hero_jump', true);
      }
    }

    // Cut velocity when releasing jump button early (Variable Jump Height)
    if (!jumpPressed && this.player.body.velocity.y < -180) {
      this.player.setVelocityY(-180);
    }

    if (!onGround && this.usingHeroSprite) {
      this.player.play('hero_jump', true);
    }

    // 3. Update Enemies Patrol
    this.enemiesGroup.getChildren().forEach((c) => {
      const enemy = c as Phaser.Physics.Arcade.Sprite;
      if (!enemy.active || !enemy.body) return;
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      const minX = enemy.getData('minX');
      const maxX = enemy.getData('maxX');
      let dir = enemy.getData('dir');

      if (enemy.x <= minX || body.blocked.left) {
        dir = 1;
        enemy.setData('dir', 1);
        enemy.setFlipX(true);
      } else if (enemy.x >= maxX || body.blocked.right) {
        dir = -1;
        enemy.setData('dir', -1);
        enemy.setFlipX(false);
      }
      enemy.setVelocityX(dir * 70);
    });
  }

  // --- HUD DISPLAY ---
  private createHUD(lvl: LevelConfig): void {
    if (this.hudContainer) {
      this.hudContainer.destroy();
    }
    this.hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

    // Top translucent bar (1034px width for 1066px widescreen)
    const bar = this.add.graphics();
    bar.fillStyle(0x0f172a, 0.82);
    bar.fillRoundedRect(16, 12, 1034, 44, 8);
    bar.lineStyle(1.5, 0x334155, 0.9);
    bar.strokeRoundedRect(16, 12, 1034, 44, 8);
    this.hudContainer.add(bar);

    // Level Title
    this.levelText = this.add.text(32, 24, lvl.name, {
      fontSize: '14px',
      color: '#38bdf8',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    });
    this.hudContainer.add(this.levelText);

    // Score
    this.scoreText = this.add.text(380, 24, `SCORE: ${this.score}`, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    });
    this.hudContainer.add(this.scoreText);

    // Coins
    const coinIcon = this.add.image(590, 32, 'tex_coin');
    this.hudContainer.add(coinIcon);
    this.coinText = this.add.text(608, 24, `x ${this.coinsCount}`, {
      fontSize: '14px',
      color: '#fbbf24',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    });
    this.hudContainer.add(this.coinText);

    // Hearts (Lives)
    this.drawHearts();

    // Fullscreen Button in HUD
    const fsBtn = this.add.text(1022, 34, '⛶', {
      fontSize: '20px',
      color: '#38bdf8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', () => {
      toggleGameFullscreen();
    });
    this.hudContainer.add(fsBtn);
  }

  private drawHearts(): void {
    this.heartIcons.forEach(h => h.destroy());
    this.heartIcons = [];

    for (let i = 0; i < 3; i++) {
      const heart = this.add.image(850 + i * 28, 32, 'tex_heart');
      if (i >= this.lives) {
        heart.setTint(0x475569); // Lost heart
      }
      this.hudContainer.add(heart);
      this.heartIcons.push(heart);
    }
  }

  private updateHUD(): void {
    if (this.scoreText) this.scoreText.setText(`SCORE: ${this.score}`);
    if (this.coinText) this.coinText.setText(`x ${this.coinsCount}`);
    this.drawHearts();
  }
}

// --- BOOTSTRAP PHASER GAME (Modern 16:9 1066x600 Resolution) ---
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  pixelArt: true,
  autoFocus: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1066,
    height: 600
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1180 },
      debug: false
    }
  },
  scene: [GameScene]
});
(game as any).events.off('blur');
(game as any).events.off('hidden');
if (typeof window !== 'undefined') {
  (window as any).__PHASER_GAME__ = game;
}
