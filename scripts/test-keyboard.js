import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9358',
  '--window-size=1280,720',
  '--no-sandbox',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9358/json');
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
          // Focus window and canvas
          ws.send(JSON.stringify({
            id: 10,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  window.focus();
                  const c = document.querySelector('canvas');
                  if (c) c.focus();
                  const s = window.__PHASER_GAME__?.scene?.scenes?.[0];
                  return { startX: s?.player?.x };
                })()
              `,
              returnByValue: true
            }
          }));

          // Send KeyDown for 'KeyD'
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 11,
              method: 'Input.dispatchKeyEvent',
              params: {
                type: 'keyDown',
                key: 'd',
                code: 'KeyD',
                windowsVirtualKeyCode: 68
              }
            }));

            // Check after 300ms
            setTimeout(() => {
              ws.send(JSON.stringify({
                id: 20,
                method: 'Runtime.evaluate',
                params: {
                  expression: `
                    (() => {
                      const s = window.__PHASER_GAME__?.scene?.scenes?.[0];
                      const p = s?.player;
                      return {
                        endX: p ? p.x : null,
                        velX: p?.body?.velocity?.x
                      };
                    })()
                  `,
                  returnByValue: true
                }
              }));

              // KeyUp
              ws.send(JSON.stringify({
                id: 21,
                method: 'Input.dispatchKeyEvent',
                params: {
                  type: 'keyUp',
                  key: 'd',
                  code: 'KeyD',
                  windowsVirtualKeyCode: 68
                }
              }));
            }, 300);
          }, 100);
        }, 1200);
      }

      if (d.id === 10) {
        startX = d.result?.result?.value?.startX;
        console.log('KEYBOARD TEST START X:', startX);
      }
      if (d.id === 20) {
        const val = d.result?.result?.value;
        const res = {
          startX,
          endX: val?.endX,
          diff: val?.endX - startX,
          velX: val?.velX
        };
        console.log('KEYBOARD TEST RESULT:', res);
        fs.writeFileSync('keyboard-test-result.json', JSON.stringify(res, null, 2));
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
