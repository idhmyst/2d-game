import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9356',
  '--window-size=1280,720',
  '--no-sandbox',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9356/json');
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.type === 'page');
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: 'http://localhost:3000/' } }));
    };

    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', d.params.type, d.params.args.map(a => a.value || a.description).join(' '));
      }
      if (d.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', d.params.exceptionDetails);
      }
      if (d.method === 'Page.loadEventFired') {
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 10,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const g = window.__PHASER_GAME__;
                  const s = g?.scene?.scenes?.[0];
                  return {
                    gameRunning: g?.loop?.running,
                    gameFps: g?.loop?.actualFps,
                    sceneActive: s?.sys?.settings?.active,
                    sceneVisible: s?.sys?.settings?.visible,
                    sceneStatus: s?.sys?.settings?.status,
                    isSleeping: s?.sys?.isSleeping?.(),
                    isPaused: s?.physics?.world?.isPaused,
                    updateCount: window.__DEBUG_STATE__?.updateCount,
                    updateError: window.__UPDATE_ERROR__,
                    updateStacks: window.__UPDATE_STACKS__
                  };
                })()
              `,
              returnByValue: true
            }
          }));
        }, 1500);
      }
      if (d.id === 10) {
        console.log('DIAGNOSTICS RESULT:', JSON.stringify(d.result?.result?.value, null, 2));
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
