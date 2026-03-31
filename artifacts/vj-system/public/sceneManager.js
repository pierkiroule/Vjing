var SceneManager = (function () {
  var currentScene = null;
  var currentSceneName = null;
  var ctx = null;

  var sceneMap = {
    audioReactive: audioReactiveScene,
    videoDisplay: videoDisplayScene,
    liveCamera: liveCameraScene,
    particleField: particleFieldScene,
    tunnel: tunnelScene,
    gridWave: gridWaveScene,
    geometryMorphing: geometryMorphingScene
  };

  function setContext(context) {
    ctx = context;
  }

  function loadScene(name) {
    if (name === currentSceneName) return;

    if (currentScene) {
      try {
        currentScene.dispose(ctx);
      } catch (e) {}
    }

    ctx.scene.background = new THREE.Color(0x000000);
    ctx.camera.position.set(0, 0, 3);
    ctx.camera.lookAt(0, 0, 0);

    var next = sceneMap[name];
    if (!next) {
      next = sceneMap['audioReactive'];
      name = 'audioReactive';
    }

    currentScene = next;
    currentSceneName = name;

    try {
      currentScene.init(ctx);
    } catch (e) {}
  }

  function update(dt, state) {
    if (!currentScene) return;
    try {
      currentScene.update(dt, state, ctx);
    } catch (e) {}
  }

  function dispose() {
    if (currentScene) {
      try {
        currentScene.dispose(ctx);
      } catch (e) {}
      currentScene = null;
      currentSceneName = null;
    }
  }

  return {
    setContext: setContext,
    loadScene: loadScene,
    update: update,
    dispose: dispose
  };
})();
