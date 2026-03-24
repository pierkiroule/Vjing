var audioReactiveScene = (function () {
  var mesh = null;
  var geometry = null;
  var material = null;
  var time = 0;

  function init(ctx) {
    geometry = new THREE.SphereGeometry(1, 64, 64);
    material = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true
    });
    mesh = new THREE.Mesh(geometry, material);
    ctx.scene.add(mesh);
  }

  function update(dt, state, ctx) {
    time += dt;
    var level = ctx.AudioManager.getAudioLevel();
    var intensity = state.intensity;
    var scale;

    if (state.mode === 'chaos') {
      scale = 1 + level * 4 * intensity + Math.sin(time * 8) * 0.2 * intensity;
    } else {
      scale = 1 + level * 2 * intensity;
    }

    mesh.scale.set(scale, scale, scale);
    mesh.rotation.y += dt * (0.3 + level * 2 * intensity);
    mesh.rotation.x += dt * 0.1;

    var r = Math.floor(level * 255);
    var g = Math.floor((1 - level) * 200);
    var b = 200 + Math.floor(level * 55);
    material.color.setRGB(r / 255, g / 255, b / 255);
  }

  function dispose(ctx) {
    if (mesh) {
      ctx.scene.remove(mesh);
      mesh = null;
    }
    if (geometry) {
      geometry.dispose();
      geometry = null;
    }
    if (material) {
      material.dispose();
      material = null;
    }
  }

  return { init: init, update: update, dispose: dispose };
})();
