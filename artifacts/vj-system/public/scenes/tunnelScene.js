var tunnelScene = (function () {
  var rings = [];
  var RING_COUNT = 24;
  var TUNNEL_LENGTH = 20;
  var time = 0;

  function init(ctx) {
    ctx.camera.position.set(0, 0, 0);
    ctx.camera.lookAt(0, 0, -1);

    for (var i = 0; i < RING_COUNT; i++) {
      var geometry = new THREE.TorusGeometry(1.2, 0.03, 8, 48);
      var hue = i / RING_COUNT;
      var material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 1.0, 0.6)
      });
      var mesh = new THREE.Mesh(geometry, material);
      var z = -((i / RING_COUNT) * TUNNEL_LENGTH);
      mesh.position.set(0, 0, z);
      rings.push({ mesh: mesh, geometry: geometry, material: material, baseZ: z, hue: hue });
      ctx.scene.add(mesh);
    }
  }

  function update(dt, state, ctx) {
    time += dt;
    var level = ctx.AudioManager.getAudioLevel();
    var intensity = state.intensity;
    var speed = state.mode === 'chaos' ? 6 + level * 10 * intensity : 3 + level * 4 * intensity;

    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      r.mesh.position.z += speed * dt;

      if (r.mesh.position.z > 2) {
        r.mesh.position.z -= TUNNEL_LENGTH;
      }

      var scaleXY = 1 + level * 0.6 * intensity;
      r.mesh.scale.set(scaleXY, scaleXY, 1);

      var spin = state.mode === 'chaos' ? dt * (1 + level * 4) : dt * 0.3;
      r.mesh.rotation.z += spin;

      var hue = (r.hue + time * 0.1) % 1;
      r.material.color.setHSL(hue, 1.0, 0.4 + level * 0.4 * intensity);
    }
  }

  function dispose(ctx) {
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      ctx.scene.remove(r.mesh);
      r.geometry.dispose();
      r.material.dispose();
    }
    rings = [];
    time = 0;
  }

  return { init: init, update: update, dispose: dispose };
})();
