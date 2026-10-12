import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public hp: number = GAME_CONFIG.player.maxHp;
  public isInvulnerable: boolean = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private isDead: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setSize(24, 30);
    this.setOffset(4, 2);

    this.initControls();
  }

  private initControls(): void {
    if (this.scene.input.keyboard) {
      this.cursors = this.scene.input.keyboard.createCursorKeys();
      this.keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
  }

  public update(): void {
    if (this.isDead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const left = this.cursors?.left.isDown || this.keyA?.isDown;
    const right = this.cursors?.right.isDown || this.keyD?.isDown;
    const jump = this.cursors?.up.isDown || this.keyW?.isDown || this.keySpace?.isDown;

    // Horizontal Movement
    if (left) {
      body.setVelocityX(-GAME_CONFIG.player.speed);
      this.setFlipX(true);
      if (body.blocked.down && this.anims.exists('hero-run')) {
        this.play('hero-run', true);
      }
    } else if (right) {
      body.setVelocityX(GAME_CONFIG.player.speed);
      this.setFlipX(false);
      if (body.blocked.down && this.anims.exists('hero-run')) {
        this.play('hero-run', true);
      }
    } else {
      body.setVelocityX(0);
      if (body.blocked.down && this.anims.exists('hero-idle')) {
        this.play('hero-idle', true);
      }
    }

    // Jump
    if (jump && body.blocked.down) {
      body.setVelocityY(GAME_CONFIG.player.jumpVelocity);
      AudioManager.getInstance().playSfx('jump', 0.6);
      if (this.anims.exists('hero-jump')) {
        this.play('hero-jump', true);
      }
    }

    // Air animation
    if (!body.blocked.down && this.anims.exists('hero-jump')) {
      this.play('hero-jump', true);
    }
  }

  public takeDamage(amount: number = 1): boolean {
    if (this.isInvulnerable || this.isDead) return false;

    this.hp -= amount;
    AudioManager.getInstance().playSfx('hit', 0.8);

    if (this.hp <= 0) {
      this.die();
      return true;
    }

    // Trigger invulnerability with flashing effect
    this.isInvulnerable = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(GAME_CONFIG.player.invulnerabilityDuration / 200),
      onComplete: () => {
        this.alpha = 1;
        this.isInvulnerable = false;
      }
    });

    // Knockback
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocityY(-200);
      body.setVelocityX(this.flipX ? 150 : -150);
    }

    return false;
  }

  public bounce(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocityY(GAME_CONFIG.enemy.stompBounceVelocity);
    }
  }

  public die(): void {
    if (this.isDead) return;
    this.isDead = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, -350);
      body.checkCollision.none = true;
    }
    this.setTint(0xff4444);
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
