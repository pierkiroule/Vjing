var gridWaveScene = (function () {
  var points = null;
  var geometry = null;
  var material = null;
  var COLS = 32;
  var ROWS = 32;
  var COUNT = COLS * ROWS;
  var time = 0;

  function init(ctx) {
    geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(COUNT * 3);

    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) {
        var i = row * COLS + col;
        positions[i * 3]     = (col / (COLS - 1) - 0.5) * 4;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (row / (ROWS - 1) - 0.5) * 4;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    material = new THREE.PointsMaterial({ color: 0x00ffee, size: 0.07 });
    points = new THREE.Points(geometry, material);
    points.rotation.x = -0.5;
    ctx.scene.add(points);
    ctx.camera.position.set(0, 2, 4);
    ctx.camera.lookAt(0, 0, 0);
  }

  function update(dt, state, ctx) {
    time += dt;
    var level = ctx.AudioManager.getAudioLevel();
    var intensity = state.intensity;
    var pos = geometry.attributes.position.array;

    var amp = 0.3 + level * 2.0 * intensity;
    var freq = state.mode === 'chaos' ? 4 + level * 6 : 2;
    var speed = state.mode === 'chaos' ? 4 + level * 4 : 2;

    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) {
        var i = row * COLS + col;
        var x = (col / (COLS - 1) - 0.5) * 4;
        var z = (row / (ROWS - 1) - 0.5) * 4;
        var wave1 = Math.sin(x * freq + time * speed) * amp;
        var wave2 = Math.cos(z * freq * 0.7 + time * speed * 0.8) * amp * 0.5;
        pos[i * 3 + 1] = wave1 + wave2;
      }
    }

    geometry.attributes.position.needsUpdate = true;

    var r = 0 + level * 0.3;
    var g = 0.8 + level * 0.2;
    var b = 0.8 - level * 0.3 * intensity;
    material.color.setRGB(r, g, b);
    material.size = 0.05 + level * 0.06 * intensity;
  }

  function dispose(ctx) {
    if (points) {
      ctx.scene.remove(points);
      points = null;
    }
    if (geometry) {
      geometry.dispose();
      geometry = null;
    }
    if (material) {
      material.dispose();
      material = null;
    }
    time = 0;
  }

  return { init: init, update: update, dispose: dispose };
})();
