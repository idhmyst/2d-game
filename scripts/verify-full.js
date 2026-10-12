import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9666',
  '--window-size=1280,720',
  '--no-sandbox',
  'http://localhost:3000/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9666/json');
    const tabs = await listRes.json();
    const gameTab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
    const ws = new WebSocket(gameTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

      setTimeout(() => {
        // Step 1: Check elements and state
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                const btnLeft = document.getElementById('btn-left');
                const btnRight = document.getElementById('btn-right');
                const btnJump = document.getElementById('btn-jump');
                const btnFs = document.getElementById('btn-fs');
                const canvas = document.querySelector('canvas');
                
                // Simulate holding right button
                btnRight.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, bubbles: true }));
                const rightPressed = window.__globalInput.right;
                btnRight.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }));
                const rightReleased = !window.__globalInput.right;

                // Simulate key press
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', code: 'KeyD', bubbles: true }));
                const keyPressed = window.__globalInput.right;
                window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', code: 'KeyD', bubbles: true }));
                const keyReleased = !window.__globalInput.right;

                // Simulate canvas click right side
                canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 900, clientY: 450, bubbles: true }));
                const canvasClickRight = window.__globalInput.right;
                canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
                const canvasClickReleased = !window.__globalInput.right;

                return {
                  canvasWidth: canvas?.width,
                  canvasHeight: canvas?.height,
                  hasButtons: !!btnLeft && !!btnRight && !!btnJump && !!btnFs,
                  rightPressed,
                  rightReleased,
                  keyPressed,
                  keyReleased,
                  canvasClickRight,
                  canvasClickReleased
                };
              })()
            `,
            returnByValue: true
          }
        }));
      }, 1500);
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === 2) {
        console.log('ALL TESTS RESULT:', JSON.stringify(data.result?.result?.value, null, 2));
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error('Test error:', e);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
