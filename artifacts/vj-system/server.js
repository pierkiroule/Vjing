const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);

const HTTP_PORT = process.env.PORT || 3000;
const WS_PORT = 8080;

const state = {
  scene: 'audioReactive',
  videoSource: 'file',
  intensity: 0.5,
  mode: 'calm',
  ipcamUrl: ''
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

server.listen(HTTP_PORT, () => {
  console.log('HTTP server running on port ' + HTTP_PORT);
});

const wsServer = new WebSocket.Server({ port: WS_PORT });

const clients = new Set();

wsServer.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'state', data: state }));

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (e) {
      return;
    }

    if (msg.scene !== undefined) state.scene = msg.scene;
    if (msg.videoSource !== undefined) state.videoSource = msg.videoSource;
    if (msg.intensity !== undefined) state.intensity = msg.intensity;
    if (msg.mode !== undefined) state.mode = msg.mode;
    if (msg.ipcamUrl !== undefined) state.ipcamUrl = msg.ipcamUrl;
  });

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', () => {
    clients.delete(ws);
  });
});

setInterval(() => {
  const payload = JSON.stringify({ type: 'state', data: state });
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}, 30);

console.log('WebSocket server running on port ' + WS_PORT);
