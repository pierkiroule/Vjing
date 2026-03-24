var state = {
  scene: 'audioReactive',
  videoSource: 'file',
  intensity: 0.5,
  mode: 'calm'
};

var renderer = null;
var scene = null;
var camera = null;
var lastTime = 0;
var ws = null;
var wsReconnectTimeout = null;

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
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function initWS() {
  if (wsReconnectTimeout) {
    clearTimeout(wsReconnectTimeout);
    wsReconnectTimeout = null;
  }

  var wsUrl = 'ws://' + location.hostname + ':8080';
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

  state.scene = newState.scene || state.scene;
  state.videoSource = newState.videoSource || state.videoSource;
  state.intensity = typeof newState.intensity === 'number' ? newState.intensity : state.intensity;
  state.mode = newState.mode || state.mode;

  if (state.scene !== prevScene) {
    SceneManager.loadScene(state.scene);
  }

  if (state.videoSource !== prevVideoSource) {
    applyVideoSource(state.videoSource);
  }
}

function applyVideoSource(source) {
  if (source === 'webcam') {
    VideoManager.useWebcam();
  } else if (source === 'ipcam') {
    var url = prompt('Enter IP cam URL (e.g. http://192.168.1.x/video):') || '';
    if (url) {
      VideoManager.useIPCam(url);
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
  renderer.render(scene, camera);
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
