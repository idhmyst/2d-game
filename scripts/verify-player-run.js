import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9355',
  '--window-size=1280,720',
  '--no-sandbox',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9355/json');
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.type === 'page');
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:3000/' } }));
    };

    let initialX = null;
    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.method === 'Page.loadEventFired') {
        setTimeout(() => {
          // Check initial playerX and trigger moving towards targetX = 350
          ws.send(JSON.stringify({
            id: 10,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const g = window.__PHASER_GAME__;
                  const s = g?.scene?.scenes?.[0];
                  const p = s?.player;
                  const startX = p ? p.x : null;

                  // Trigger click on canvas at x = 350
                  s.targetX = 350;

                  return { startX };
                })()
              `,
              returnByValue: true
            }
          }));

          // After 400ms check playerX
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 20,
              method: 'Runtime.evaluate',
              params: {
                expression: `
                  (() => {
                    const g = window.__PHASER_GAME__;
                    const s = g?.scene?.scenes?.[0];
                    const p = s?.player;
                    return {
                      endX: p ? p.x : null,
                      velX: p?.body?.velocity?.x,
                      targetX: s?.targetX
                    };
                  })()
                `,
                returnByValue: true
              }
            }));
          }, 400);
        }, 1500);
      }
      if (d.id === 10) {
        initialX = d.result?.result?.value?.startX;
        console.log('INITIAL PLAYER X:', initialX);
      }
      if (d.id === 20) {
        const res = d.result?.result?.value;
        const verified = {
          initialX,
          endX: res?.endX,
          pixelsMoved: res?.endX - initialX,
          velX: res?.velX
        };
        console.log('VERIFICATION OF MOVEMENT:', verified);
        fs.writeFileSync('verified-movement.json', JSON.stringify(verified, null, 2));
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
