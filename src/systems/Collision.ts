import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

export class CollisionSystem {
  /**
   * Evaluates if a collision between player and enemy is a stomp (player jumps on enemy)
   * or a damage hit (player touches enemy from side/bottom).
   */
  public static isStomp(player: Player, enemy: Enemy): boolean {
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;

    if (!playerBody || !enemyBody) return false;

    // Player must be falling downwards and bottom of player should be roughly at or above enemy center/top
    const isFalling = playerBody.velocity.y > 0;
    const isAbove = (playerBody.bottom - playerBody.velocity.y * 0.05) <= enemyBody.top + 16;

    return isFalling && isAbove;
  }

  /**
   * Check if player has fallen beyond the dead zone limit
   */
  public static isOutOfBounds(player: Player, deadZoneY: number): boolean {
    return player.y > deadZoneY;
  }
}
