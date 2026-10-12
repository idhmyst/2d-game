import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  '--no-sandbox',
  '--disable-gpu',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9225/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
    console.log('Testing tab:', gameTab.url);

    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            expression: `JSON.stringify({
              url: window.location.href,
              btnLeft: Boolean(document.getElementById('btn-left')),
              btnRight: Boolean(document.getElementById('btn-right')),
              btnJump: Boolean(document.getElementById('btn-jump')),
              btnFs: Boolean(document.getElementById('btn-fs'))
            })`,
            returnByValue: true
          }
        }));
      }, 1000);
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === 2) {
        console.log('GAME TAB CHECK:', data.result?.result?.value);
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error('Test error:', e);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
