/* ════════════════════════════════════════════════════════
   background.js — Neural Aurora  v4

   A 14,000-particle flow field that creates aurora-like
   ribbons flowing through 3D noise. Combined with a
   morphing wireframe sphere that breathes organically.

   Technique:
   • Each particle follows a vector field derived from
     3 offset noise functions (curl-like flow)
   • Additive blending: overlapping streams glow brighter
   • Two layers: small bright particles + large soft halo
   • Color gradient: cyan (top) → indigo → rose (bottom)
   • Speed brightness: faster = whiter/brighter
   • Central morphing sphere that pulses and deforms
════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const isMobile = window.innerWidth < 768;

  /* ── RENDERER ──────────────────────────────────────── */
  const canvas   = document.getElementById('bgc');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300);
  camera.position.z = 30;

  /* ── PARTICLE COUNT (performance-scaled) ───────────── */
  const N = isMobile ? 5000 : 14000;

  /* ── BUFFERS ───────────────────────────────────────── */
  const positions  = new Float32Array(N * 3);
  const colors     = new Float32Array(N * 3);
  const velocities = new Float32Array(N * 3);
  const phases     = new Float32Array(N);

  /* ── INITIALISE PARTICLES ──────────────────────────── */
  for (let i = 0; i < N; i++) {
    // Spread in a elongated cloud
    const theta = Math.random() * Math.PI * 2;
    const r = 6 + Math.random() * 16;
    positions[i*3]   = (Math.cos(theta) * r + (Math.random() - 0.5) * 6);
    positions[i*3+1] = (Math.random() - 0.5) * 26;
    positions[i*3+2] = (Math.sin(theta) * r * 0.35) - 4;

    velocities[i*3]   = (Math.random() - 0.5) * 0.01;
    velocities[i*3+1] = (Math.random() - 0.5) * 0.01;
    velocities[i*3+2] = (Math.random() - 0.5) * 0.005;

    phases[i] = Math.random() * Math.PI * 2;

    // Default color
    colors[i*3] = 0.22; colors[i*3+1] = 0.74; colors[i*3+2] = 0.98;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  /* ── PARTICLE MATERIALS (two layers for glow) ──────── */
  // Layer 1: small, crisp, bright (the actual streams)
  const matCrisp = new THREE.PointsMaterial({
    size: isMobile ? 0.11 : 0.09,
    vertexColors: true,
    transparent: true, opacity: 0.90,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // Layer 2: large, soft, dim (the halo glow around streams)
  const matGlow = new THREE.PointsMaterial({
    size: isMobile ? 0.50 : 0.40,
    vertexColors: true,
    transparent: true, opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  scene.add(new THREE.Points(geo, matCrisp));
  scene.add(new THREE.Points(geo, matGlow));

  /* ── MORPHING WIREFRAME SPHERE ─────────────────────── */
  // Create sphere geometry and store original vertices
  const sphereGeo    = new THREE.SphereGeometry(5.5, isMobile ? 28 : 48, isMobile ? 28 : 48);
  const origSpherePos = sphereGeo.attributes.position.array.slice(); // snapshot

  const sphereMesh = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: isMobile ? 0.06 : 0.07,
  }));
  scene.add(sphereMesh);

  // Inner solid sphere (very faint glow fill)
  const innerSphere = new THREE.Mesh(
    new THREE.SphereGeometry(5.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.015 })
  );
  scene.add(innerSphere);

  // Three orbit rings around the sphere
  const RING_COLORS = [0x38bdf8, 0x818cf8, 0xf472b6];
  const rings = RING_COLORS.map((color, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(6.5 + i * 1.8, 0.013, 4, 120),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18 - i * 0.04 })
    );
    ring.rotation.x = i * 0.55;
    ring.rotation.z = i * 0.35;
    scene.add(ring);
    return ring;
  });

  // Orbit dot trails on each ring
  RING_COLORS.forEach((color, i) => {
    const dGeo = new THREE.BufferGeometry();
    const dPos = new Float32Array(200 * 3);
    const radius = 6.5 + i * 1.8;
    for (let j = 0; j < 200; j++) {
      const a = (j / 200) * Math.PI * 2;
      dPos[j*3] = Math.cos(a) * radius;
      dPos[j*3+1] = 0;
      dPos[j*3+2] = Math.sin(a) * radius;
    }
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    const dotCloud = new THREE.Points(dGeo, new THREE.PointsMaterial({
      color, size: 0.04, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    dotCloud.rotation.x = rings[i].rotation.x;
    dotCloud.rotation.z = rings[i].rotation.z;
    scene.add(dotCloud);
    rings[i].userData.dots = dotCloud;
  });

  /* ── SUBTLE GROUND GRID ────────────────────────────── */
  const grid = new THREE.GridHelper(200, 60, 0x1e3a5a, 0x1e3a5a);
  grid.material.transparent = true; grid.material.opacity = 0.08;
  grid.position.y = -14;
  scene.add(grid);

  /* ── NOISE FUNCTION (fast, smooth, no library needed) ─
     Composed sin/cos at varying frequencies creates
     smooth pseudo-random fields similar to Perlin noise */
  function noise(x, y, z, t) {
    const S = 0.17, T = 0.38;
    return (
      Math.sin(x*S       + t*T)       * Math.cos(y*S*0.8  + t*T*0.7) +
      Math.sin(y*S       + z*S*0.9    + t*T*0.55) * 0.60 +
      Math.cos(z*S*0.75  + x*S*0.5   + t*T*0.80) * 0.40
    ) * 0.48;
  }

  /* ── COLOR FUNCTION ────────────────────────────────── */
  // Maps particle Y position → gradient: cyan/indigo/rose
  // Speed boosts brightness (fast streams glow white)
  const C_CYAN   = [0.22, 0.74, 0.98];
  const C_INDIGO = [0.51, 0.55, 0.97];
  const C_ROSE   = [0.96, 0.45, 0.71];

  function updateColor(i, py, speed, t) {
    const ny  = Math.max(0, Math.min(1, (py + 13) / 26));
    const bright = Math.min(1.8, 0.65 + speed * 60);

    let r, g, b;
    if (ny > 0.60) {
      const f = (ny - 0.60) / 0.40;
      r = C_INDIGO[0] + (C_CYAN[0]   - C_INDIGO[0]) * f;
      g = C_INDIGO[1] + (C_CYAN[1]   - C_INDIGO[1]) * f;
      b = C_INDIGO[2] + (C_CYAN[2]   - C_INDIGO[2]) * f;
    } else if (ny > 0.28) {
      const f = (ny - 0.28) / 0.32;
      r = C_ROSE[0] + (C_INDIGO[0] - C_ROSE[0]) * f;
      g = C_ROSE[1] + (C_INDIGO[1] - C_ROSE[1]) * f;
      b = C_ROSE[2] + (C_INDIGO[2] - C_ROSE[2]) * f;
    } else {
      r = C_ROSE[0]; g = C_ROSE[1]; b = C_ROSE[2];
    }

    colors[i*3]   = Math.min(1, r * bright);
    colors[i*3+1] = Math.min(1, g * bright);
    colors[i*3+2] = Math.min(1, b * bright);
  }

  /* ── INPUT ─────────────────────────────────────────── */
  let mouseX = 0, mouseY = 0, scrollY = 0;
  let smoothMX = 0, smoothMY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / innerWidth)  * 2 - 1;
    mouseY = -(e.clientY / innerHeight) * 2 + 1;
  });
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* ── BOUNDS for particle wrapping ──────────────────── */
  const BX = 24, BY = 15, BZ = 12;
  /* flow speed */
  const SPD = 0.009;

  /* ── ANIMATION LOOP ────────────────────────────────── */
  let t = 0;

  (function loop() {
    requestAnimationFrame(loop);
    t += 0.007;

    /* Camera parallax */
    smoothMX += (mouseX - smoothMX) * 0.05;
    smoothMY += (mouseY - smoothMY) * 0.05;
    camera.position.x += (smoothMX * 3.0 - camera.position.x) * 0.04;
    camera.position.y += (smoothMY * 2.0 - scrollY * 0.0007 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    /* ── MORPHING SPHERE ────────────────────────────── */
    const sv = sphereGeo.attributes.position.array;
    for (let i = 0; i < sv.length / 3; i++) {
      const ox = origSpherePos[i*3], oy = origSpherePos[i*3+1], oz = origSpherePos[i*3+2];
      const len = Math.sqrt(ox*ox + oy*oy + oz*oz);
      // Displace each vertex along its normal using noise
      const d = 0.0 +
        Math.sin(ox * 0.4 + t * 0.9)  * Math.cos(oy * 0.35 + t * 0.7) * 0.7 +
        Math.cos(oz * 0.45 + t * 0.8) * Math.sin(ox * 0.3  + t * 1.1) * 0.5;
      const scale = (len + d) / len;
      sv[i*3]   = ox * scale;
      sv[i*3+1] = oy * scale;
      sv[i*3+2] = oz * scale;
    }
    sphereGeo.attributes.position.needsUpdate = true;
    sphereGeo.computeVertexNormals();
    sphereMesh.rotation.y += 0.002;
    sphereMesh.rotation.x += 0.001;

    // Opacity pulse
    sphereMesh.material.opacity = 0.05 + 0.025 * Math.sin(t * 0.8);
    innerSphere.material.opacity = 0.01 + 0.01 * Math.sin(t * 0.8);

    /* ── ORBIT RINGS ────────────────────────────────── */
    rings.forEach((ring, i) => {
      ring.rotation.z += 0.004 + i * 0.001;
      ring.rotation.y += 0.002 + i * 0.0005;
      if (ring.userData.dots) {
        ring.userData.dots.rotation.z = ring.rotation.z;
        ring.userData.dots.rotation.y = ring.rotation.y;
        ring.userData.dots.rotation.x = ring.rotation.x;
      }
    });

    /* ── PARTICLE FLOW FIELD ────────────────────────── */
    const pos = geo.attributes.position.array;

    for (let i = 0; i < N; i++) {
      const ix = i*3, iy = i*3+1, iz = i*3+2;
      let px = pos[ix], py = pos[iy], pz = pos[iz];

      /* Curl-like flow: three offset noise samples */
      const fx =  noise(px,  py,  pz,  t);
      const fy =  noise(py,  pz,  px,  t + 1.7);
      const fz =  noise(pz,  px,  py,  t + 3.4) * 0.4;

      /* Soft sphere repulsion — particles flow AROUND sphere */
      const dx = px, dy = py, dz = pz;
      const dSq = dx*dx + dy*dy + dz*dz;
      const rSq = 36; // sphere radius^2 ≈ 6²
      let repX = 0, repY = 0, repZ = 0;
      if (dSq < rSq * 1.8 && dSq > 0.01) {
        const pushStr = (rSq * 1.8 - dSq) / (rSq * 1.8) * 0.004;
        const invD = 1.0 / Math.sqrt(dSq);
        repX = dx * invD * pushStr;
        repY = dy * invD * pushStr;
        repZ = dz * invD * pushStr;
      }

      /* Weak centripetal pull — keeps cloud together */
      const distSq = px*px + py*py*0.3 + pz*pz;
      const pull = distSq > 180 ? 0.0025 : 0;

      velocities[ix] = velocities[ix] * 0.91 + fx * SPD + repX - px * pull + smoothMX * 0.0006;
      velocities[iy] = velocities[iy] * 0.91 + fy * SPD * 0.65 + repY - py * pull * 0.4 + smoothMY * 0.0004;
      velocities[iz] = velocities[iz] * 0.91 + fz * SPD * 0.45 + repZ - pz * pull;

      px += velocities[ix];
      py += velocities[iy];
      pz += velocities[iz];

      /* Wrap out-of-bounds particles to opposite side */
      if (px > BX)  px = -BX + 0.1; else if (px < -BX) px = BX - 0.1;
      if (py > BY)  py = -BY + 0.1; else if (py < -BY) py = BY - 0.1;
      if (pz > BZ)  pz = -BZ + 0.1; else if (pz < -BZ) pz = BZ - 0.1;

      pos[ix] = px; pos[iy] = py; pos[iz] = pz;

      /* Speed → brightness */
      const speed = Math.abs(velocities[ix]) + Math.abs(velocities[iy]) + Math.abs(velocities[iz]);
      updateColor(i, py, speed, t);
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;

    /* Grid soft pulse */
    grid.material.opacity = 0.06 + 0.025 * Math.sin(t * 0.35);

    renderer.render(scene, camera);
  }());

}());
