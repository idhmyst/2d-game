export const GAME_CONFIG = {
  width: 800,
  height: 480,
  gravity: 980,
  player: {
    speed: 220,
    jumpVelocity: -430,
    maxHp: 3,
    invulnerabilityDuration: 1200 // ms
  },
  enemy: {
    speed: 70,
    stompBounceVelocity: -300
  },
  score: {
    coinValue: 100,
    enemyStompValue: 200
  },
  storageKeys: {
    highScore: 'platformer_high_score',
    soundMuted: 'platformer_sound_muted',
    lastScore: 'platformer_last_score'
  }
} as const;
