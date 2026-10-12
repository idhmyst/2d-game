import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9360',
  '--window-size=1280,720',
  '--no-sandbox',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9360/json');
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.type === 'page');
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:3000/' } }));
    };

    let exceptions = [];
    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.method === 'Runtime.exceptionThrown') {
        exceptions.push(d.params.exceptionDetails);
        console.error('[BROWSER EXCEPTION]', d.params.exceptionDetails);
      }
      if (d.method === 'Page.loadEventFired') {
        setTimeout(() => {
          // Check MenuScene is active
          ws.send(JSON.stringify({
            id: 10,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const g = window.__PHASER_GAME__;
                  const activeScenes = g.scene.getScenes(true).map(s => s.scene.key);
                  const menuScene = g.scene.getScene('MenuScene');
                  const gameScene = g.scene.getScene('GameScene');

                  // Test start Level 2 (Petang)
                  g.scene.start('GameScene', { levelIndex: 1 });

                  return {
                    initialActive: activeScenes,
                    hasMenu: Boolean(menuScene),
                    hasGame: Boolean(gameScene)
                  };
                })()
              `,
              returnByValue: true
            }
          }));

          // After 600ms, check if GameScene is now active with Level 2
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 20,
              method: 'Runtime.evaluate',
              params: {
                expression: `
                  (() => {
                    const g = window.__PHASER_GAME__;
                    const activeScenes = g.scene.getScenes(true).map(s => s.scene.key);
                    const s = g.scene.getScene('GameScene');
                    return {
                      currentLevel: s?.currentLevelIndex,
                      activeScenes,
                      playerX: s?.player?.x,
                      levelName: s?.levelText?.text
                    };
                  })()
                `,
                returnByValue: true
              }
            }));
          }, 600);
        }, 1200);
      }

      if (d.id === 10) {
        console.log('MENU STATE:', d.result?.result?.value);
      }
      if (d.id === 20) {
        const res = {
          gameSceneState: d.result?.result?.value,
          exceptionsCount: exceptions.length
        };
        console.log('TRANSITION TEST RESULT:', JSON.stringify(res, null, 2));
        fs.writeFileSync('menu-test-result.json', JSON.stringify(res, null, 2));
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
