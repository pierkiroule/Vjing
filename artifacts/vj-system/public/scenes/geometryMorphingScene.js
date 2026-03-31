var geometryMorphingScene = (function () {
  var mesh = null;
  var material = null;
  var originalPositions = [];
  var time = 0;
  var morphTargets = [];
  var currentTarget = 0;
  var morphProgress = 0;

  // Géométries cibles pour le morphing
  var geometries = [];

  function init(ctx) {
    // Créer les géométries de référence
    var sphereGeo = new THREE.SphereGeometry(1, 48, 48);
    var torusGeo = new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16);
    var icosaGeo = new THREE.IcosahedronGeometry(1, 3);
    var octaGeo = new THREE.OctahedronGeometry(1, 2);
    var dodecaGeo = new THREE.DodecahedronGeometry(1, 1);
    
    // Standardiser le nombre de vertices
    var baseGeo = new THREE.SphereGeometry(1, 32, 32);
    
    // Créer les morph targets
    geometries = [sphereGeo, torusGeo, icosaGeo, octaGeo, dodecaGeo];
    
    // Nouveau: créer des géométries avec le même nombre de points
    var positions = baseGeo.attributes.position;
    var count = positions.count;
    
    // Stocker les positions originales
    for (var i = 0; i < count; i++) {
      originalPositions.push(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
    }
    
    // Créer les targets pour chaque géométrie
    geometries.forEach(function(geo) {
      var targetPositions = [];
      var pos = geo.attributes.position;
      var targetCount = Math.min(pos.count, count);
      
      for (var i = 0; i < count; i++) {
        if (i < targetCount) {
          targetPositions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
        } else {
          // Compléter avec les dernières positions
          targetPositions.push(
            pos.getX(targetCount - 1),
            pos.getY(targetCount - 1),
            pos.getZ(targetCount - 1)
          );
        }
      }
      morphTargets.push(targetPositions);
    });

    // Material avec éclairage
    material = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0x440044,
      metalness: 0.8,
      roughness: 0.2,
      flatShading: true,
      side: THREE.DoubleSide
    });

    mesh = new THREE.Mesh(baseGeo, material);
    ctx.scene.add(mesh);

    // Ajouter des lumières
    var light1 = new THREE.PointLight(0xff00ff, 2, 20);
    light1.position.set(3, 3, 3);
    ctx.scene.add(light1);

    var light2 = new THREE.PointLight(0x00ffff, 2, 20);
    light2.position.set(-3, -3, 3);
    ctx.scene.add(light2);

    var ambientLight = new THREE.AmbientLight(0x222222);
    ctx.scene.add(ambientLight);

    // Background sombre
    ctx.scene.background = new THREE.Color(0x050510);
  }

  function update(dt, state, ctx) {
    time += dt;
    var level = ctx.AudioManager.getAudioLevel();
    var intensity = state.intensity || 1;
    
    // progression du morphing
    morphProgress += dt * 0.5 * (1 + level * 3);
    
    // Changer de cible automatiquement
    if (morphProgress >= 1) {
      morphProgress = 0;
      currentTarget = (currentTarget + 1) % morphTargets.length;
    }
    
    // Interpoler entre les géométries
    var positions = mesh.geometry.attributes.position;
    var target = morphTargets[currentTarget];
    var nextTarget = morphTargets[(currentTarget + 1) % morphTargets.length];
    
    var easeProgress = morphProgress * morphProgress * (3 - 2 * morphProgress); // ease smoothstep
    
    for (var i = 0; i < positions.count; i++) {
      var idx = i * 3;
      
      var x1 = target[idx] || 0;
      var y1 = target[idx + 1] || 0;
      var z1 = target[idx + 2] || 0;
      
      var x2 = nextTarget[idx] || 0;
      var y2 = nextTarget[idx + 1] || 0;
      var z2 = nextTarget[idx + 2] || 0;
      
      // Interpolation
      var x = x1 + (x2 - x1) * easeProgress;
      var y = y1 + (y2 - y1) * easeProgress;
      var z = z1 + (z2 - z1) * easeProgress;
      
      // Ajouter la déformation basée sur l'audio
      var noiseScale = 0.3 * level * intensity;
      var noiseFreq = 3 + level * 5;
      
      var noiseX = Math.sin(y * noiseFreq + time * 2) * noiseScale;
      var noiseY = Math.sin(z * noiseFreq + time * 2.5) * noiseScale;
      var noiseZ = Math.sin(x * noiseFreq + time * 1.8) * noiseScale;
      
      positions.setXYZ(i, 
        x + noiseX, 
        y + noiseY, 
        z + noiseZ
      );
    }
    
    positions.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    
    // Rotation globale
    mesh.rotation.y += dt * (0.2 + level * 0.5 * intensity);
    mesh.rotation.x += dt * 0.1;
    
    // Pulsation based on audio
    var baseScale = 1 + level * 0.5 * intensity;
    var pulse = Math.sin(time * 8) * 0.1 * level * intensity;
    mesh.scale.setScalar(baseScale + pulse);
    
    // Couleur réactive
    var hue = (time * 0.1) % 1;
    var saturation = 0.7 + level * 0.3;
    var lightness = 0.4 + level * 0.3;
    material.color.setHSL(hue, saturation, lightness);
    material.emissive.setHSL((hue + 0.5) % 1, saturation, 0.2 + level * 0.2);
    
    // Metalness réactif
    material.metalness = 0.5 + level * 0.5;
    material.roughness = 0.4 - level * 0.3;
  }

  function dispose(ctx) {
    if (mesh) {
      ctx.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh = null;
    }
    if (material) {
      material.dispose();
      material = null;
    }
    originalPositions = [];
    morphTargets = [];
  }

  return { init: init, update: update, dispose: dispose };
})();