import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';

window.THREE = THREE;

var state = {
  scene: 'audioReactive',
  videoSource: 'file',
  intensity: 0.5,
  mode: 'calm',
  ipcamUrl: ''
};

var renderer = null;
var scene = null;
var camera = null;
var lastTime = 0;
var ws = null;
var wsReconnectTimeout = null;
var composer = null;
var bloom = null;
var glitch = null;

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 3);

  window.addEventListener('resize', onResize);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.8);
  composer.addPass(bloom);
  glitch = new GlitchPass();
  glitch.enabled = false;
  composer.addPass(glitch);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
}

function initWS() {
  if (wsReconnectTimeout) {
    clearTimeout(wsReconnectTimeout);
    wsReconnectTimeout = null;
  }

  var wsProto = location.protocol === 'https:' ? 'wss://' : 'ws://';
  var wsUrl = wsProto + location.hostname + ':8080';
  ws = new WebSocket(wsUrl);

  ws.onopen = function () {};

  ws.onmessage = function (event) {
    try {
      var msg = JSON.parse(event.data);
      if (msg.type === 'state') {
        applyState(msg.data);
      }
    } catch (e) {}
  };

  ws.onclose = function () {
    wsReconnectTimeout = setTimeout(initWS, 2000);
  };

  ws.onerror = function () {
    try { ws.close(); } catch (e) {}
  };
}

var lastVideoSource = null;

function applyState(newState) {
  var prevScene = state.scene;
  var prevVideoSource = state.videoSource;
  var prevIpcamUrl = state.ipcamUrl;

  state.scene = newState.scene || state.scene;
  state.videoSource = newState.videoSource || state.videoSource;
  state.intensity = typeof newState.intensity === 'number' ? newState.intensity : state.intensity;
  state.mode = newState.mode || state.mode;
  if (typeof newState.ipcamUrl === 'string') state.ipcamUrl = newState.ipcamUrl;

  if (state.scene !== prevScene) {
    SceneManager.loadScene(state.scene);
  }

  var videoSourceChanged = state.videoSource !== prevVideoSource;
  var ipcamUrlChanged = state.videoSource === 'ipcam' && state.ipcamUrl !== prevIpcamUrl && state.ipcamUrl !== '';

  if (videoSourceChanged || ipcamUrlChanged) {
    applyVideoSource(state.videoSource);
  }
}

function applyVideoSource(source) {
  if (source === 'webcam') {
    VideoManager.useWebcam();
  } else if (source === 'ipcam') {
    if (state.ipcamUrl) {
      VideoManager.useIPCam(state.ipcamUrl);
    }
  } else {
    VideoManager.useVideoFile('');
  }
}

function animate(now) {
  requestAnimationFrame(animate);

  var dt = (now - lastTime) / 1000;
  if (dt > 0.1) dt = 0.1;
  lastTime = now;

  SceneManager.update(dt, state);
  bloom.strength = 0.3 + state.intensity * 1.5;
  glitch.enabled = (state.mode === 'chaos');
  composer.render();
}

window.addEventListener('load', function () {
  initRenderer();

  AudioManager.init();

  var ctx = {
    scene: scene,
    camera: camera,
    renderer: renderer,
    AudioManager: AudioManager,
    VideoManager: VideoManager
  };

  SceneManager.setContext(ctx);
  SceneManager.loadScene(state.scene);

  initWS();

  requestAnimationFrame(function (now) {
    lastTime = now;
    requestAnimationFrame(animate);
  });
});
