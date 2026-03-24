var videoDisplayScene = (function () {
  var mesh = null;
  var geometry = null;
  var material = null;
  var texture = null;
  var fallbackReady = false;

  function init(ctx) {
    var vid = ctx.VideoManager.getVideo();

    try {
      texture = new THREE.VideoTexture(vid);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    } catch (e) {
      material = new THREE.MeshBasicMaterial({ color: 0x111111 });
      fallbackReady = true;
    }

    geometry = new THREE.PlaneGeometry(4, 2.25);
    mesh = new THREE.Mesh(geometry, material);
    ctx.scene.add(mesh);

    ctx.camera.position.z = 3;
  }

  function update(dt, state, ctx) {
    if (texture && !fallbackReady) {
      texture.needsUpdate = true;
    }
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
    fallbackReady = false;
  }

  return { init: init, update: update, dispose: dispose };
})();
