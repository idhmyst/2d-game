import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9357',
  '--window-size=1280,720',
  '--no-sandbox',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9357/json');
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.type === 'page');
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:3000/' } }));
    };

    let startX = null;
    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.method === 'Page.loadEventFired') {
        setTimeout(() => {
          // Check initial X and simulate pointerdown on #btn-right
          ws.send(JSON.stringify({
            id: 10,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const g = window.__PHASER_GAME__;
                  const s = g?.scene?.scenes?.[0];
                  const p = s?.player;
                  const btnRight = document.getElementById('btn-right');
                  
                  // Trigger pointerdown on right button
                  btnRight.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));

                  return {
                    initialX: p ? p.x : null
                  };
                })()
              `,
              returnByValue: true
            }
          }));

          // After 300ms, check player moved
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
                    const btnRight = document.getElementById('btn-right');
                    btnRight.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));

                    return {
                      endX: p ? p.x : null,
                      velX: p?.body?.velocity?.x
                    };
                  })()
                `,
                returnByValue: true
              }
            }));
          }, 300);
        }, 1200);
      }

      if (d.id === 10) {
        startX = d.result?.result?.value?.initialX;
        console.log('START X:', startX);
      }
      if (d.id === 20) {
        const val = d.result?.result?.value;
        const res = {
          startX,
          endX: val?.endX,
          diff: val?.endX - startX,
          velX: val?.velX
        };
        console.log('TOUCH BUTTON TEST RESULT:', res);
        fs.writeFileSync('touch-button-result.json', JSON.stringify(res, null, 2));
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
