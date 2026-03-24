var particleFieldScene = (function () {
  var points = null;
  var geometry = null;
  var material = null;
  var basePositions = null;
  var COUNT = 600;
  var time = 0;

  function init(ctx) {
    geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(COUNT * 3);
    basePositions = new Float32Array(COUNT * 3);

    for (var i = 0; i < COUNT; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var r = 0.5 + Math.random() * 1.5;
      var x = r * Math.sin(phi) * Math.cos(theta);
      var y = r * Math.sin(phi) * Math.sin(theta);
      var z = r * Math.cos(phi);
      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      basePositions[i * 3]     = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    material = new THREE.PointsMaterial({ color: 0xff6600, size: 0.04 });
    points = new THREE.Points(geometry, material);
    ctx.scene.add(points);
  }

  function update(dt, state, ctx) {
    time += dt;
    var level = ctx.AudioManager.getAudioLevel();
    var intensity = state.intensity;
    var pos = geometry.attributes.position.array;

    var spread = 1 + level * 3 * intensity;
    var jitter = state.mode === 'chaos' ? 0.08 * intensity : 0.01;

    for (var i = 0; i < COUNT; i++) {
      pos[i * 3]     = basePositions[i * 3]     * spread + (Math.random() - 0.5) * jitter;
      pos[i * 3 + 1] = basePositions[i * 3 + 1] * spread + (Math.random() - 0.5) * jitter;
      pos[i * 3 + 2] = basePositions[i * 3 + 2] * spread + (Math.random() - 0.5) * jitter;
    }

    geometry.attributes.position.needsUpdate = true;

    points.rotation.y += dt * (0.2 + level * intensity);
    points.rotation.x += dt * 0.05;

    var r = 1.0;
    var g = 0.3 + level * 0.5;
    var b = level * 0.8 * intensity;
    material.color.setRGB(r, g, b);
    material.size = 0.03 + level * 0.05 * intensity;
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
    basePositions = null;
    time = 0;
  }

  return { init: init, update: update, dispose: dispose };
})();
