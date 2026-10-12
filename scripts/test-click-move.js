import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9226',
  '--no-sandbox',
  '--disable-gpu',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9226/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

      // Wait 1 second for Phaser to load and start scene
      setTimeout(() => {
        // Dispatch pointerdown on #btn-right
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                const btn = document.getElementById('btn-right');
                btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
                return btn !== null;
              })()
            `,
            returnByValue: true
          }
        }));

        // After 500ms check player movement
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const game = window.Phaser?.GAMES?.[0];
                  const scene = game?.scene?.scenes?.[0];
                  const player = scene?.player;
                  return {
                    playerX: player?.x,
                    playerY: player?.y,
                    velocityX: player?.body?.velocity?.x
                  };
                })()
              `,
              returnByValue: true
            }
          }));
        }, 600);
      }, 1500);
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === 3) {
        console.log('PLAYER MOVEMENT VERIFICATION:', data.result?.result?.value);
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error('Movement test error:', e);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
