import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9889',
  '--window-size=1280,720',
  '--no-sandbox',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9889/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                const g = window.__PHASER_GAME__;
                if (!g) return "NO GAME";
                return g.scene.scenes.map(s => ({
                  key: s.scene.key,
                  status: s.scene.status,
                  hasPlayer: !!s.player,
                  playerX: s.player ? s.player.x : null
                }));
              })()
            `,
            returnByValue: true
          }
        }));
      }, 1500);
    };

    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.id === 2) {
        console.log('SCENES DETAILED STATUS:', d.result?.result?.value);
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
