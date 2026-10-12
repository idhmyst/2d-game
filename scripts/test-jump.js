import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9359',
  '--window-size=1280,720',
  '--no-sandbox',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9359/json');
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.type === 'page');
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:3000/' } }));
    };

    let startY = null;
    let minY = 9999;
    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.method === 'Page.loadEventFired') {
        setTimeout(() => {
          // Trigger jump
          ws.send(JSON.stringify({
            id: 10,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const s = window.__PHASER_GAME__?.scene?.scenes?.[0];
                  const p = s?.player;
                  const startY = p ? p.y : null;

                  // Trigger jump input
                  const btnJump = document.getElementById('btn-jump');
                  btnJump.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

                  return { startY };
                })()
              `,
              returnByValue: true
            }
          }));

          // Track Y over 600ms
          let checks = 0;
          const interval = setInterval(() => {
            checks++;
            ws.send(JSON.stringify({
              id: 100 + checks,
              method: 'Runtime.evaluate',
              params: {
                expression: `window.__PHASER_GAME__?.scene?.scenes?.[0]?.player?.y`,
                returnByValue: true
              }
            }));
            if (checks >= 10) {
              clearInterval(interval);
              setTimeout(() => {
                const maxJumpHeight = startY - minY;
                console.log('JUMP TEST: startY =', startY, 'minY (peak) =', minY, 'maxJumpHeight =', maxJumpHeight);
                fs.writeFileSync('jump-test-result.json', JSON.stringify({ startY, minY, maxJumpHeight }, null, 2));
                chrome.kill();
                process.exit(0);
              }, 100);
            }
          }, 50);
        }, 1200);
      }

      if (d.id === 10) {
        startY = d.result?.result?.value?.startY;
        minY = startY;
      }
      if (d.id >= 100) {
        const currentY = d.result?.result?.value;
        if (currentY !== undefined && currentY < minY) {
          minY = currentY;
        }
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 1000);
