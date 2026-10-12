import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9234',
  '--window-size=1280,720',
  '--no-sandbox',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9234/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

      // Wait 1.5s for game scene to be active
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                const game = window.__PHASER_GAME__;
                const scene = game?.scene?.getScene('GameScene');
                const player = scene?.player;
                const initialX = player?.x;
                const initialY = player?.y;

                // Check physics status
                const physicsRunning = !scene?.physics?.world?.isPaused;
                const playerBodyActive = player?.body?.enable;
                const playerImmovable = player?.body?.immovable;

                // Simulate keydown D
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', code: 'KeyD', bubbles: true }));
                const inputRight = window.__globalInput?.right;

                return {
                  initialX,
                  initialY,
                  physicsRunning,
                  playerBodyActive,
                  playerImmovable,
                  inputRight,
                  isDying: scene?.isDying,
                  isLevelComplete: scene?.isLevelComplete
                };
              })()
            `,
            returnByValue: true
          }
        }));

        // After 500ms of holding KeyD
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const game = window.__PHASER_GAME__;
                  const scene = game?.scene?.getScene('GameScene');
                  const player = scene?.player;
                  const newX = player?.x;
                  const newY = player?.y;
                  const velX = player?.body?.velocity?.x;
                  const velY = player?.body?.velocity?.y;
                  const touchingDown = player?.body?.touching?.down;
                  const blockedDown = player?.body?.blocked?.down;

                  // Release D
                  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', code: 'KeyD', bubbles: true }));

                  return {
                    newX,
                    newY,
                    velX,
                    velY,
                    touchingDown,
                    blockedDown
                  };
                })()
              `,
              returnByValue: true
            }
          }));
        }, 500);
      }, 1500);
    };

    let step2 = null;
    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.id === 2) step2 = d.result?.result?.value;
      if (d.id === 3) {
        const step3 = d.result?.result?.value;
        console.log('STEP 2 INITIAL:', JSON.stringify(step2, null, 2));
        console.log('STEP 3 AFTER KEYD:', JSON.stringify(step3, null, 2));
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 1000);
