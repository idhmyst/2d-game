import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9995',
  '--window-size=1280,720',
  '--no-sandbox',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9995/json');
    const tabs = await listRes.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Log.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 4, method: 'Page.navigate', params: { url: 'http://localhost:3000/' } }));
    };

    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION EVENT:', JSON.stringify(d.params, null, 2));
      }
      if (d.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE API:', d.params.type, d.params.args);
      }
      if (d.id === 10) {
        console.log('EVAL RESULT:', d.result);
      }
    };

    setTimeout(() => {
      ws.send(JSON.stringify({
        id: 10,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            import('/src/main.ts').then(() => {
              return { success: true, globalInput: window.__globalInput, phaser: typeof window.__PHASER_GAME__ };
            }).catch(err => {
              return { error: err.message, stack: err.stack };
            })
          `,
          awaitPromise: true,
          returnByValue: true
        }
      }));
    }, 2000);

    setTimeout(() => {
      chrome.kill();
      process.exit(0);
    }, 4500);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1000);
