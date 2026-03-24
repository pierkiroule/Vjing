var liveCameraScene = (function () {
  var mesh = null;
  var geometry = null;
  var material = null;
  var texture = null;
  var time = 0;

  function init(ctx) {
    var vid = ctx.VideoManager.getVideo();

    try {
      texture = new THREE.VideoTexture(vid);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    } catch (e) {
      material = new THREE.MeshBasicMaterial({ color: 0x220033 });
    }

    geometry = new THREE.PlaneGeometry(4, 2.25);
    mesh = new THREE.Mesh(geometry, material);
    ctx.scene.add(mesh);

    ctx.camera.position.z = 3;
  }

  function update(dt, state, ctx) {
    time += dt;

    if (texture) {
      texture.needsUpdate = true;
    }

    var level = ctx.AudioManager.getAudioLevel();
    var intensity = state.intensity;

    var scaleX, scaleY;
    if (state.mode === 'chaos') {
      scaleX = 1 + Math.sin(time * 7 + level * 10) * 0.08 * intensity;
      scaleY = 1 + Math.cos(time * 5 + level * 8) * 0.08 * intensity;
    } else {
      scaleX = 1 + level * 0.05 * intensity;
      scaleY = 1 + level * 0.05 * intensity;
    }

    mesh.scale.set(scaleX, scaleY, 1);
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
    if (texture) {
      texture.dispose();
      texture = null;
    }
    time = 0;
  }

  return { init: init, update: update, dispose: dispose };
})();
