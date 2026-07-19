// node-pty has a prebuilt-binary issue on Node v24/arm64 — use the multiarch prebuilt fork
const pty = require('@homebridge/node-pty-prebuilt-multiarch');
const { WebSocketServer } = require('ws');

const PORT = process.env.TERMINAL_PORT || 3001;
const wss = new WebSocketServer({ port: PORT });

console.log(`Terminal server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('Terminal client connected');

  const shell = process.env.SHELL || 'zsh';

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
  });

  // PTY output → browser
  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  });

  // Browser input → PTY
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'input') {
        ptyProcess.write(msg.data);
      } else if (msg.type === 'resize') {
        ptyProcess.resize(
          Math.max(1, Math.floor(msg.cols)),
          Math.max(1, Math.floor(msg.rows))
        );
      }
    } catch {
      // plain text fallback
      ptyProcess.write(raw.toString());
    }
  });

  ws.on('close', () => {
    console.log('Terminal client disconnected');
    try { ptyProcess.kill(); } catch {}
  });

  ptyProcess.onExit(({ exitCode }) => {
    console.log(`Shell exited with code ${exitCode}`);
    try { ws.close(); } catch {}
  });
});
