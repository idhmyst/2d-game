import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9236',
  '--window-size=1280,720',
  '--no-sandbox',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9236/json');
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
                return {
                  hasG: !!g,
                  isBooted: g?.isBooted,
                  isRunning: g?.isRunning,
                  canvasParent: g?.canvas?.parentElement?.id,
                  phaserGames: window.Phaser ? window.Phaser.GAMES.length : 'no phaser',
                  allKeysOnWindow: Object.keys(window).filter(k => k.includes('PHASER') || k.includes('Phaser') || k.includes('game') || k.includes('input'))
                };
              })()
            `,
            returnByValue: true
          }
        }));
      }, 2000);
    };

    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.id === 2) {
        console.log('GAME INSPECTION:', JSON.stringify(d.result?.result?.value, null, 2));
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
