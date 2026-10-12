import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9777',
  '--window-size=1280,720',
  '--no-sandbox',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9777/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

      // Wait 1.5s for game scene to be active
      setTimeout(() => {
        // Check initial player position
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                const game = window.__PHASER_GAME__;
                const scene = game?.scene?.getScene('GameScene');
                const p = scene?.player;
                const initialX = p ? p.x : null;
                
                // Simulate holding right button
                const btn = document.getElementById('btn-right');
                btn.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, bubbles: true }));

                return { initialX, rightDown: window.__globalInput.right };
              })()
            `,
            returnByValue: true
          }
        }));

        // After 400ms check moved position
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const game = window.__PHASER_GAME__;
                  const scene = game?.scene?.getScene('GameScene');
                  const p = scene?.player;
                  const movedX = p ? p.x : null;
                  const velocityX = p ? p.body.velocity.x : null;

                  // Release button
                  const btn = document.getElementById('btn-right');
                  btn.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }));

                  return { movedX, velocityX, rightReleased: !window.__globalInput.right };
                })()
              `,
              returnByValue: true
            }
          }));
        }, 400);
      }, 1500);
    };

    let initialData = null;
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === 2) {
        initialData = data.result?.result?.value;
      }
      if (data.id === 3) {
        const movedData = data.result?.result?.value;
        console.log('PLAYER MOVEMENT VERIFIED:', {
          initialX: initialData?.initialX,
          movedX: movedData?.movedX,
          velocityX: movedData?.velocityX,
          deltaX: movedData?.movedX - initialData?.initialX,
          rightReleased: movedData?.rightReleased
        });
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error('Test error:', e);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
