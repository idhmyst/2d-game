import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9349',
  '--window-size=1280,720',
  '--no-sandbox',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9349/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url.includes('localhost:3000'));
    if (!gameTab) {
      console.log('Tabs available:', tabs.map(t => t.url));
      chrome.kill();
      process.exit(1);
    }
    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));

      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 10,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                const g = window.__PHASER_GAME__;
                const s = g?.scene?.scenes?.[0];
                const p = s?.player;
                
                return {
                  url: window.location.href,
                  gameBooted: g?.isBooted,
                  sceneKey: s?.scene?.key,
                  playerX: p ? p.x : null,
                  playerY: p ? p.y : null,
                  bodyTouchingDown: p?.body?.touching?.down,
                  bodyBlockedDown: p?.body?.blocked?.down,
                  gravityY: p?.body?.gravity?.y,
                  worldGravityY: s?.physics?.world?.gravity?.y
                };
              })()
            `,
            returnByValue: true
          }
        }));

        // After 500ms trigger right button press
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 20,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  window.__globalInput.right = true;
                  const g = window.__PHASER_GAME__;
                  const s = g?.scene?.scenes?.[0];
                  const p = s?.player;
                  return {
                    pressedRight: true,
                    startX: p?.x
                  };
                })()
              `,
              returnByValue: true
            }
          }));

          // After another 500ms check moved X
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 30,
              method: 'Runtime.evaluate',
              params: {
                expression: `
                  (() => {
                    const g = window.__PHASER_GAME__;
                    const s = g?.scene?.scenes?.[0];
                    const p = s?.player;
                    window.__globalInput.right = false;
                    return {
                      endX: p?.x,
                      endY: p?.y,
                      velX: p?.body?.velocity?.x
                    };
                  })()
                `,
                returnByValue: true
              }
            }));
          }, 500);
        }, 1000);
      }, 2000);
    };

    let startX = null;
    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.id === 10) console.log('INITIAL STATE:', d.result?.result?.value);
      if (d.id === 20) {
        console.log('INPUT PRESSED:', d.result?.result?.value);
        startX = d.result?.result?.value?.startX;
      }
      if (d.id === 30) {
        const endData = d.result?.result?.value;
        console.log('RESULT AFTER MOVEMENT:', {
          startX,
          endX: endData?.endX,
          deltaX: endData?.endX - startX,
          velX: endData?.velX
        });
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
