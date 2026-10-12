import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private moveSpeed: number = GAME_CONFIG.enemy.speed;
  private moveDirection: number = -1; // -1: left, 1: right
  private minX: number;
  private maxX: number;
  public isDefeated: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolDistance: number = 120) {
    super(scene, x, y, 'enemies');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.minX = x - patrolDistance;
    this.maxX = x + patrolDistance;

    this.setCollideWorldBounds(false);
    this.setSize(24, 26);
    this.setOffset(4, 6);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocityX(this.moveDirection * this.moveSpeed);
    }
  }

  public update(): void {
    if (this.isDefeated) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // Patrol boundary or obstacle bounce
    if (this.x <= this.minX || body.blocked.left) {
      this.moveDirection = 1;
      this.setFlipX(true);
    } else if (this.x >= this.maxX || body.blocked.right) {
      this.moveDirection = -1;
      this.setFlipX(false);
    }

    body.setVelocityX(this.moveDirection * this.moveSpeed);

    if (this.anims.exists('enemy-walk') && !this.anims.isPlaying) {
      this.play('enemy-walk');
    }
  }

  public stomp(): void {
    if (this.isDefeated) return;
    this.isDefeated = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.checkCollision.none = true;
      body.setVelocity(0, 0);
    }

    // Squash tween then destroy
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      scaleX: 1.4,
      y: this.y + 12,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        this.destroy();
      }
    });
  }
}
