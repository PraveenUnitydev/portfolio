/* ════════════════════════════════════════════════════════
   background.js — Ambient Scene  v3
   Clean, atmospheric — soft particles + glowing orbs
   + subtle grid. Not cluttered.
════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas   = document.getElementById('bgc');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);
  camera.position.z = 28;

  /* ── 1. SOFT PARTICLES — fewer, dimmer ────────────── */
  const N   = window.innerWidth < 768 ? 1200 : 2500;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 120;
    pos[i*3+1] = (Math.random() - 0.5) * 120;
    pos[i*3+2] = (Math.random() - 0.5) * 60 - 10;

    // Mostly blue-white, occasional cyan accent
    const r = Math.random();
    if (r < 0.15) {
      // Cyan
      col[i*3] = 0.22; col[i*3+1] = 0.74; col[i*3+2] = 0.98;
    } else if (r < 0.25) {
      // Indigo
      col[i*3] = 0.51; col[i*3+1] = 0.55; col[i*3+2] = 0.98;
    } else {
      // Soft blue-white
      col[i*3] = 0.55; col[i*3+1] = 0.67; col[i*3+2] = 0.85;
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.12, vertexColors: true,
    transparent: true, opacity: 0.45,
    sizeAttenuation: true,
  })));

  /* ── 2. LARGE GLOWING ORBS (ambient light sources) ── */
  function makeOrb(color, x, y, z, size) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(size, 16, 16),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.03 })
    );
    orb.position.set(x, y, z);
    scene.add(orb);

    // Outer glow ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(size * 1.2, size * 2.5, 64),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.02, side: THREE.DoubleSide,
      })
    );
    ring.position.set(x, y, z);
    scene.add(ring);
    return { orb, ring };
  }

  const orbs = [
    makeOrb(0x38bdf8, 14, 2, -12, 6),    // cyan right
    makeOrb(0x818cf8, -12, -3, -15, 5),  // indigo left
    makeOrb(0xf472b6, 2, -10, -20, 4),   // rose bottom
  ];

  /* ── 3. SUBTLE GRID PLANE ────────────────────────── */
  const grid = new THREE.GridHelper(200, 60, 0x1e3a5a, 0x1e3a5a);
  grid.material.transparent = true;
  grid.material.opacity = 0.10;
  grid.position.y = -12;
  scene.add(grid);

  /* ── 4. DISTANT WIREFRAME SHAPES (very subtle) ───── */
  const shapeMat = new THREE.MeshBasicMaterial({
    color: 0x2a4a6a, wireframe: true, transparent: true, opacity: 0.06,
  });
  const shapes = [];

  function addShape(geo, x, y, z) {
    const m = new THREE.Mesh(geo, shapeMat.clone());
    m.position.set(x, y, z);
    m.userData.rx = (Math.random() - 0.5) * 0.004;
    m.userData.ry = (Math.random() - 0.5) * 0.004;
    scene.add(m); shapes.push(m);
  }

  if (window.innerWidth >= 768) {
    addShape(new THREE.IcosahedronGeometry(3, 1),  16, 4, -22);
    addShape(new THREE.OctahedronGeometry(2.5, 1), -14, -4, -24);
    addShape(new THREE.TorusKnotGeometry(2.5, 0.5, 80, 10, 2, 3), 0, 8, -28);
  }

  /* ── INPUT ───────────────────────────────────────── */
  let mx = 0, my = 0, sy = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / innerWidth)  * 2 - 1;
    my = -(e.clientY / innerHeight) * 2 + 1;
  });
  window.addEventListener('scroll', () => { sy = window.scrollY; }, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* ── ANIMATE ─────────────────────────────────────── */
  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.006;

    // Camera gentle parallax
    camera.position.x += (mx * 2.5 - camera.position.x) * 0.03;
    camera.position.y += (my * 1.5 - sy * 0.001 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    // Orbs pulse
    orbs.forEach((o, i) => {
      o.orb.material.opacity = 0.02 + 0.015 * Math.sin(t * 0.7 + i * 2.1);
      o.ring.rotation.z += 0.002;
    });

    // Distant shapes rotate slowly
    shapes.forEach(s => { s.rotation.x += s.userData.rx; s.rotation.y += s.userData.ry; });

    // Particle drift
    const pa = geo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      pa[i*3+1] += Math.sin(t + i * 0.08) * 0.002;
    }
    geo.attributes.position.needsUpdate = true;

    // Grid breathe
    grid.material.opacity = 0.07 + 0.03 * Math.sin(t * 0.4);

    renderer.render(scene, camera);
  }());
}());
