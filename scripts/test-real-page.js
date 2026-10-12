import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9348',
  '--window-size=1280,720',
  '--no-sandbox',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9348/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.type === 'page');
    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Log.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));

      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 10,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
                return {
                  url: window.location.href,
                  scripts,
                  hasPhaser: typeof Phaser,
                  windowKeys: Object.keys(window).filter(k => !k.startsWith('webkit'))
                };
              })()
            `,
            returnByValue: true
          }
        }));
      }, 1500);
    };

    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', d.params.type, d.params.args.map(a => a.value || a.description));
      }
      if (d.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION IN TAB:', d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text);
      }
      if (d.id === 10) {
        console.log('TAB SCRIPTS AND WINDOW:', JSON.stringify(d.result?.result?.value, null, 2));
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
