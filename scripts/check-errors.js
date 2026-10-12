import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9996',
  '--window-size=1280,720',
  '--no-sandbox',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9996/json');
    const tabs = await listRes.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:3000/' } }));
    };

    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.id === 10) {
        console.log('WINDOW INSPECTION:', d.result?.result?.value);
      }
    };

    setTimeout(() => {
      ws.send(JSON.stringify({
        id: 10,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            (() => {
              return {
                phaserGlobal: typeof window.Phaser,
                hasPhaserGameOnWindow: !!window.__PHASER_GAME__,
                phaserGamesArrayLength: window.Phaser?.GAMES?.length,
                firstGameScenes: window.Phaser?.GAMES?.[0]?.scene?.scenes?.map(s => s.constructor.name)
              };
            })()
          `,
          returnByValue: true
        }
      }));
    }, 2500);

    setTimeout(() => {
      chrome.kill();
      process.exit(0);
    }, 3500);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1000);
