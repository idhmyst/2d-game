import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9237',
  '--window-size=1280,720',
  '--no-sandbox',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9237/json');
    const tabs = await listRes.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Log.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
    };

    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        console.log('CHROME CONSOLE:', d.params.type, d.params.args.map(a => a.value || a.description));
      }
      if (d.method === 'Runtime.exceptionThrown') {
        console.error('CHROME EXCEPTION:', d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text);
      }
      if (d.method === 'Log.entryAdded') {
        console.log('CHROME LOG:', d.params.entry);
      }
    };

    setTimeout(() => {
      chrome.kill();
      process.exit(0);
    }, 4000);
  } catch (e) {
    console.error('Test error:', e);
    chrome.kill();
    process.exit(1);
  }
}, 1000);
