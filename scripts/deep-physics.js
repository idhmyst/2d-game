import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9345',
  '--window-size=1280,720',
  '--no-sandbox',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9345/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

      setTimeout(() => {
        // Evaluate physics loop directly
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                const game = window.__PHASER_GAME__;
                const scene = game ? game.scene.scenes[0] : null;
                const player = scene ? scene.player : null;
                
                if (!player) {
                  return { error: 'No player found', hasGame: !!game, scenesCount: game?.scene?.scenes?.length };
                }

                const initialX = player.x;
                const initialY = player.y;

                // Force input
                window.__globalInput.right = true;

                // Manually run one update step or check velocity
                return {
                  initialX,
                  initialY,
                  playerSpeed: player.body?.speed,
                  playerVelocityX: player.body?.velocity?.x,
                  playerVelocityY: player.body?.velocity?.y,
                  playerGravity: player.body?.gravity?.y,
                  worldGravity: scene.physics.world.gravity.y,
                  playerOnGround: player.body?.blocked?.down || player.body?.touching?.down,
                  playerBodyEnable: player.body?.enable,
                  playerMoves: player.body?.moves,
                  playerImmovable: player.body?.immovable
                };
              })()
            `,
            returnByValue: true
          }
        }));

        // After 300ms of __globalInput.right = true
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const game = window.__PHASER_GAME__;
                  const scene = game ? game.scene.scenes[0] : null;
                  const player = scene ? scene.player : null;
                  return {
                    newX: player ? player.x : null,
                    newY: player ? player.y : null,
                    velocityX: player?.body?.velocity?.x,
                    isDying: scene?.isDying,
                    isLevelComplete: scene?.isLevelComplete
                  };
                })()
              `,
              returnByValue: true
            }
          }));
        }, 300);
      }, 2000);
    };

    let step2 = null;
    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.id === 2) step2 = d.result?.result?.value;
      if (d.id === 3) {
        console.log('PHYSICS STEP 2:', JSON.stringify(step2, null, 2));
        console.log('PHYSICS STEP 3:', JSON.stringify(d.result?.result?.value, null, 2));
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1000);
