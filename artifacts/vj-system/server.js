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

const VALID_SCENES = new Set(['audioReactive', 'videoDisplay', 'liveCamera']);
const VALID_SOURCES = new Set(['file', 'webcam', 'ipcam']);
const VALID_MODES = new Set(['calm', 'chaos']);

let dirty = false;

function applyMessage(msg) {
  if (typeof msg.scene === 'string' && VALID_SCENES.has(msg.scene)) {
    if (state.scene !== msg.scene) { state.scene = msg.scene; dirty = true; }
  }
  if (typeof msg.videoSource === 'string' && VALID_SOURCES.has(msg.videoSource)) {
    if (state.videoSource !== msg.videoSource) { state.videoSource = msg.videoSource; dirty = true; }
  }
  if (typeof msg.intensity === 'number' && isFinite(msg.intensity)) {
    const v = Math.max(0, Math.min(1, msg.intensity));
    if (state.intensity !== v) { state.intensity = v; dirty = true; }
  }
  if (typeof msg.mode === 'string' && VALID_MODES.has(msg.mode)) {
    if (state.mode !== msg.mode) { state.mode = msg.mode; dirty = true; }
  }
  if (typeof msg.ipcamUrl === 'string') {
    if (state.ipcamUrl !== msg.ipcamUrl) { state.ipcamUrl = msg.ipcamUrl; dirty = true; }
  }
}

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
    applyMessage(msg);
  });

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', () => {
    clients.delete(ws);
  });
});

setInterval(() => {
  if (!dirty || clients.size === 0) return;
  dirty = false;
  const payload = JSON.stringify({ type: 'state', data: state });
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}, 30);

console.log('WebSocket server running on port ' + WS_PORT);
