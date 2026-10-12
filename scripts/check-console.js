import { spawn } from 'child_process';
import http from 'http';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--no-sandbox',
  '--disable-gpu',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    console.log('Tabs:', tabs[0]?.webSocketDebuggerUrl);

    if (tabs[0]?.webSocketDebuggerUrl) {
      // Connect to WebSocket using native WebSocket in Node 26
      const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
      };
      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER LOG]', data.params.type, data.params.args.map(a => a.value || a.description));
        }
        if (data.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER ERROR]', data.params.exceptionDetails);
        }
      };
      setTimeout(() => {
        chrome.kill();
        process.exit(0);
      }, 4000);
    }
  } catch (e) {
    console.error('Debug error:', e);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
