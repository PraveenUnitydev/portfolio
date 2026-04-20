/* ════════════════════════════════════════════════════════
   background.js — Full-screen Three.js Particle Scene

   Creates the animated background visible behind all
   sections: floating particles, wireframe shapes,
   orbital rings, a grid, and a torus knot.

   Mouse movement creates a parallax camera effect.
   Scrolling shifts the camera vertically.
════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const canvas   = document.getElementById('bgc');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1000);
  camera.position.z = 30;

  // ── 1. PARTICLE FIELD ──────────────────────────────────
  const PARTICLE_COUNT = 3200;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PARTICLE_COUNT * 3);
  const pCol = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 130;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 130;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 80;

    // Distribute colours: cyan / magenta / green
    const r = Math.random();
    if      (r < 0.33) { pCol[i*3]=0;    pCol[i*3+1]=0.96; pCol[i*3+2]=1;    } // cyan
    else if (r < 0.66) { pCol[i*3]=1;    pCol[i*3+1]=0;    pCol[i*3+2]=0.67; } // magenta
    else               { pCol[i*3]=0.22; pCol[i*3+1]=1;    pCol[i*3+2]=0.08; } // green
  }

  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));

  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.16,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    sizeAttenuation: true,
  }));
  scene.add(particles);

  // ── 2. GRID PLANE ──────────────────────────────────────
  const grid = new THREE.GridHelper(200, 70, 0x00f5ff, 0x00f5ff);
  grid.material.opacity = 0.04;
  grid.material.transparent = true;
  grid.position.y = -15;
  scene.add(grid);

  // ── 3. DRIFTING ICOSAHEDRA ─────────────────────────────
  const icoMat = new THREE.MeshBasicMaterial({
    color: 0x00f5ff, wireframe: true, transparent: true, opacity: 0.06,
  });
  const icosahedra = [];

  for (let i = 0; i < 6; i++) {
    const size = Math.random() * 2.2 + 0.5;
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), icoMat.clone());
    mesh.position.set(
      (Math.random() - 0.5) * 70,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 20 - 18   // pushed much further back
    );
    mesh.userData = {
      vx: (Math.random() - 0.5) * 0.003,
      vy: (Math.random() - 0.5) * 0.003,
      vz: (Math.random() - 0.5) * 0.002,
      rx: Math.random() * 0.006,
      ry: Math.random() * 0.005,
    };
    scene.add(mesh);
    icosahedra.push(mesh);
  }

  // ── 4. HERO TORUS KNOT ─────────────────────────────────
  const torusKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(5, 1.3, 200, 20, 3, 5),
    new THREE.MeshBasicMaterial({ color: 0x00f5ff, wireframe: true, transparent: true, opacity: 0.1 })
  );
  torusKnot.position.set(15, -2, -20);
  scene.add(torusKnot);

  // ── 5. ORBITAL RINGS ───────────────────────────────────
  const ringGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(8 + i * 3, 0.03, 4, 80),
      new THREE.MeshBasicMaterial({ color: 0xff00aa, wireframe: true, transparent: true, opacity: 0.09 })
    );
    ring.rotation.x = Math.PI / 2 + i * 0.4;
    ring.rotation.z = i * 0.3;
    ringGroup.add(ring);
  }
  ringGroup.position.set(-16, 0, -22);
  scene.add(ringGroup);

  // ── 6. OCTAHEDRON CLUSTER ──────────────────────────────
  const octaGroup = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const s = Math.random() * 0.9 + 0.3;
    const m = new THREE.Mesh(
      new THREE.OctahedronGeometry(s, 0),
      new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true, transparent: true, opacity: 0.06 })
    );
    m.position.set(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 10
    );
    m.userData.r = { x: Math.random() * 0.012, y: Math.random() * 0.01 };
    octaGroup.add(m);
  }
  octaGroup.position.set(-22, 8, -4);
  scene.add(octaGroup);

  // ── INPUT TRACKING ──────────────────────────────────────
  let targetMouseX = 0, targetMouseY = 0, scrollY = 0;

  document.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / innerWidth  - 0.5) * 2;
    targetMouseY = -(e.clientY / innerHeight - 0.5) * 2;
  });

  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // ── ANIMATION LOOP ──────────────────────────────────────
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.007;

    // Parallax camera — lerp toward mouse/scroll target
    camera.position.x += (targetMouseX * 4  - camera.position.x) * 0.04;
    camera.position.y += (targetMouseY * 3  - scrollY * 0.0015 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    // Torus knot spin
    torusKnot.rotation.x += 0.003;
    torusKnot.rotation.y += 0.005;

    // Ring group orbit
    ringGroup.rotation.y += 0.004;
    ringGroup.rotation.x += 0.002;

    // Icosahedra drift
    icosahedra.forEach((m) => {
      m.rotation.x += m.userData.rx;
      m.rotation.y += m.userData.ry;
      m.position.x += m.userData.vx;
      m.position.y += m.userData.vy;
      m.position.z += m.userData.vz;
      if (Math.abs(m.position.x) > 38) m.userData.vx *= -1;
      if (Math.abs(m.position.y) > 28) m.userData.vy *= -1;
      if (Math.abs(m.position.z) > 22) m.userData.vz *= -1;
    });

    // Octahedra rotate
    octaGroup.children.forEach((c) => {
      c.rotation.x += c.userData.r.x;
      c.rotation.y += c.userData.r.y;
    });
    octaGroup.rotation.y += 0.003;

    // Particle vertical drift (slow sine wave)
    const pa = pGeo.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pa[i * 3 + 1] += Math.sin(time + i * 0.05) * 0.003;
    }
    pGeo.attributes.position.needsUpdate = true;

    // Grid opacity pulse
    grid.material.opacity = 0.03 + 0.012 * Math.sin(time * 0.5);

    renderer.render(scene, camera);
  }

  animate();

})();
