/* ════════════════════════════════════════════════════════
   background.js — Aurora Ribbons  v5

   CONCEPT: Flowing silk-like ribbon strips made of
   triangle meshes, evolving parametric paths (Lissajous),
   additive blending so crossing ribbons glow at intersections.
   Combined with particle atmosphere + morphing sphere.

   SCENE:
   1. 7 Aurora Ribbons  — mesh strips, gradient colors, flowing paths
   2. Particle Atmosphere — 5K soft depth particles
   3. Morphing Sphere    — wireframe core that breathes
   4. Subtle Grid        — ground reference
════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const isMobile = window.innerWidth < 768;

  /* ── RENDERER ─────────────────────────────────────── */
  const canvas   = document.getElementById('bgc');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 300);
  camera.position.z = 32;

  /* ════════════════════════════════════════════════════
     1. AURORA RIBBONS
     Each ribbon is a strip of quads following a parametric
     path that slowly evolves. Additive blending makes
     ribbon crossings glow naturally.
  ════════════════════════════════════════════════════ */
  const SEGS = isMobile ? 70 : 160;  // segments per ribbon

  /* Ribbon configuration: path params + visual style */
  const RIBBON_CFGS = [
    // Long horizontal sweeps — cyan to indigo
    { ax:26, ay: 9, az:5, fx:1.0, fy:2.0, fz:1.5, px:0.0, py:0.0, pz:0.0, sx:0.28, sy:0.22, sz:0.20, w:1.0, c1:[0.15,0.72,0.98], c2:[0.50,0.54,0.97] },
    { ax:24, ay:11, az:4, fx:2.0, fy:1.0, fz:2.0, px:1.0, py:1.5, pz:0.5, sx:0.20, sy:0.30, sz:0.25, w:0.75, c1:[0.50,0.54,0.97], c2:[0.96,0.44,0.71] },
    // Diagonal ribbon — rose to amber
    { ax:22, ay:13, az:6, fx:1.5, fy:1.5, fz:1.0, px:2.0, py:3.0, pz:1.0, sx:0.35, sy:0.18, sz:0.28, w:0.65, c1:[0.96,0.44,0.71], c2:[0.99,0.75,0.14] },
    // Wide sweeping — indigo to cyan
    { ax:28, ay: 8, az:7, fx:0.5, fy:2.5, fz:1.5, px:0.5, py:4.0, pz:2.0, sx:0.18, sy:0.32, sz:0.22, w:1.2, c1:[0.50,0.54,0.97], c2:[0.15,0.72,0.98] },
    // Thin accent — cyan only
    { ax:20, ay:10, az:3, fx:3.0, fy:1.0, fz:2.0, px:3.0, py:0.5, pz:1.5, sx:0.40, sy:0.15, sz:0.30, w:0.40, c1:[0.22,0.85,1.00], c2:[0.40,0.65,1.00] },
    // Deep ribbon — amber to rose
    { ax:25, ay:12, az:5, fx:1.0, fy:3.0, fz:1.0, px:4.0, py:2.5, pz:3.0, sx:0.22, sy:0.38, sz:0.18, w:0.55, c1:[0.99,0.75,0.14], c2:[0.96,0.44,0.71] },
    // Flowing side ribbon — indigo
    { ax:18, ay:15, az:8, fx:2.0, fy:2.0, fz:0.5, px:1.5, py:1.0, pz:0.8, sx:0.30, sy:0.25, sz:0.35, w:0.50, c1:[0.42,0.44,0.95], c2:[0.15,0.72,0.98] },
  ];

  /* Build ribbon geometry (static, updated each frame) */
  function buildRibbonGeo() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(SEGS * 2 * 3);
    const colors    = new Float32Array(SEGS * 2 * 3);

    const indices = [];
    for (let i = 0; i < SEGS - 1; i++) {
      const a = i*2, b = i*2+1, c = (i+1)*2, d = (i+1)*2+1;
      indices.push(a,c,b, b,c,d);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    return geo;
  }

  /* Create ribbon mesh (core + glow layer) */
  function createRibbon() {
    const geo  = buildRibbonGeo();
    const core = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: isMobile ? 0.28 : 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
    const glow = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: isMobile ? 0.07 : 0.05,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
    scene.add(core);
    scene.add(glow);
    return { geo, core, glow };
  }

  /* Update ribbon vertices along its parametric path */
  function updateRibbon(ribbon, cfg, t) {
    const pos = ribbon.geo.attributes.position.array;
    const col = ribbon.geo.attributes.color.array;

    // Scale glow geometry slightly wider than core
    ribbon.glow.scale.set(1.05, 1.05, 1.05);

    for (let i = 0; i < SEGS; i++) {
      const u  = i / (SEGS - 1);       // 0..1 along ribbon
      const u2 = (i + 0.5) / (SEGS - 1);

      /* Parametric path — Lissajous family */
      const px = cfg.ax * Math.sin(cfg.fx * u * Math.PI * 2 + cfg.px + t * cfg.sx);
      const py = cfg.ay * Math.sin(cfg.fy * u * Math.PI * 2 + cfg.py + t * cfg.sy);
      const pz = cfg.az * Math.cos(cfg.fz * u * Math.PI * 2 + cfg.pz + t * cfg.sz);

      /* Tangent (finite diff for ribbon orientation) */
      const px2 = cfg.ax * Math.sin(cfg.fx * u2 * Math.PI * 2 + cfg.px + t * cfg.sx);
      const py2 = cfg.ay * Math.sin(cfg.fy * u2 * Math.PI * 2 + cfg.py + t * cfg.sy);
      const pz2 = cfg.az * Math.cos(cfg.fz * u2 * Math.PI * 2 + cfg.pz + t * cfg.sz);
      let tx = px2-px, ty = py2-py, tz = pz2-pz;
      const tl = Math.sqrt(tx*tx+ty*ty+tz*tz) || 1;
      tx/=tl; ty/=tl; tz/=tl;

      /* Ribbon normal = tangent × world-up */
      let nx = ty*0 - tz*1;
      let ny = tz*0 - tx*0;
      let nz = tx*1 - ty*0;
      const nl = Math.sqrt(nx*nx+ny*ny+nz*nz) || 1;
      nx/=nl; ny/=nl; nz/=nl;

      /* Width: tapers at ends, pulses */
      const taper  = Math.sin(u * Math.PI);          // 0 at tips, 1 at center
      const pulse  = 1 + 0.18 * Math.sin(t*2.2 + u*9 + cfg.px);
      const half   = cfg.w * taper * pulse;

      /* Two edge verts of the strip */
      const ix = i * 2;
      pos[ix*3]   = px - nx*half; pos[ix*3+1] = py - ny*half; pos[ix*3+2] = pz - nz*half;
      pos[(ix+1)*3]   = px + nx*half; pos[(ix+1)*3+1] = py + ny*half; pos[(ix+1)*3+2] = pz + nz*half;

      /* Color gradient along ribbon length */
      const [r1,g1,b1] = cfg.c1, [r2,g2,b2] = cfg.c2;
      // Add slight brightness pulse near center
      const bright = 0.85 + 0.15 * taper;
      const r = (r1 + (r2-r1)*u) * bright;
      const g = (g1 + (g2-g1)*u) * bright;
      const b = (b1 + (b2-b1)*u) * bright;
      col[ix*3]=r; col[ix*3+1]=g; col[ix*3+2]=b;
      col[(ix+1)*3]=r; col[(ix+1)*3+1]=g; col[(ix+1)*3+2]=b;
    }

    ribbon.geo.attributes.position.needsUpdate = true;
    ribbon.geo.attributes.color.needsUpdate    = true;
    ribbon.geo.computeBoundingSphere();
  }

  /* Create all ribbons (skip last 2 on mobile for performance) */
  const ribbonCount = isMobile ? 5 : RIBBON_CFGS.length;
  const ribbons = RIBBON_CFGS.slice(0, ribbonCount).map(() => createRibbon());

  /* ════════════════════════════════════════════════════
     2. PARTICLE ATMOSPHERE (soft depth)
  ════════════════════════════════════════════════════ */
  const PN   = isMobile ? 1800 : 5000;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PN * 3);
  const pCol = new Float32Array(PN * 3);
  const pVel = new Float32Array(PN * 3);

  const ATM_COLORS = [
    [0.22,0.74,0.98], // cyan
    [0.50,0.54,0.97], // indigo
    [0.96,0.44,0.71], // rose
    [0.60,0.70,0.90], // blue-white
  ];

  for (let i = 0; i < PN; i++) {
    pPos[i*3]   = (Math.random()-0.5)*70;
    pPos[i*3+1] = (Math.random()-0.5)*50;
    pPos[i*3+2] = (Math.random()-0.5)*30 - 8;
    pVel[i*3]   = (Math.random()-0.5)*0.008;
    pVel[i*3+1] = (Math.random()-0.5)*0.006;
    pVel[i*3+2] = 0;
    const c = ATM_COLORS[i % ATM_COLORS.length];
    pCol[i*3]=c[0]; pCol[i*3+1]=c[1]; pCol[i*3+2]=c[2];
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: isMobile ? 0.10 : 0.08,
    vertexColors: true, transparent: true, opacity: 0.38,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  /* ════════════════════════════════════════════════════
     3. MORPHING WIREFRAME SPHERE
  ════════════════════════════════════════════════════ */
  const sGeo  = new THREE.SphereGeometry(4.5, isMobile ? 24 : 44, isMobile ? 24 : 44);
  const sOrig = sGeo.attributes.position.array.slice();

  const sphere = new THREE.Mesh(sGeo, new THREE.MeshBasicMaterial({
    color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.06,
  }));
  scene.add(sphere);

  /* Inner fill */
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(4.5, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.012 })
  ));

  /* Orbit rings around sphere */
  const RING_COLS = [0x38bdf8, 0x818cf8, 0xf472b6];
  const rings = RING_COLS.map((col, i) => {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(5.8 + i*1.6, 0.012, 4, 110),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.20 - i*0.05,
        blending: THREE.AdditiveBlending, depthWrite: false })
    );
    r.rotation.x = i * 0.6; r.rotation.z = i * 0.4;
    scene.add(r);
    return r;
  });

  /* ════════════════════════════════════════════════════
     4. GRID
  ════════════════════════════════════════════════════ */
  const grid = new THREE.GridHelper(220, 55, 0x1a3050, 0x1a3050);
  grid.material.transparent = true; grid.material.opacity = 0.07;
  grid.position.y = -16;
  scene.add(grid);

  /* ── INPUT ─────────────────────────────────────────── */
  let mx = 0, my = 0, sy = 0, smx = 0, smy = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX/innerWidth)*2-1; my = -(e.clientY/innerHeight)*2+1;
  });
  window.addEventListener('scroll', () => { sy = window.scrollY; }, { passive:true });
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* ── ANIMATE ───────────────────────────────────────── */
  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.007;

    smx += (mx-smx)*0.04; smy += (my-smy)*0.04;
    camera.position.x += (smx*3.5 - camera.position.x)*0.04;
    camera.position.y += (smy*2.0 - sy*0.0006 - camera.position.y)*0.04;
    camera.lookAt(0,0,0);

    /* Update ribbons */
    ribbons.forEach((rib, i) => updateRibbon(rib, RIBBON_CFGS[i], t));

    /* Morph sphere */
    const sv = sGeo.attributes.position.array;
    for (let i = 0; i < sv.length/3; i++) {
      const ox=sOrig[i*3], oy=sOrig[i*3+1], oz=sOrig[i*3+2];
      const len = Math.sqrt(ox*ox+oy*oy+oz*oz) || 1;
      const d = Math.sin(ox*0.38+t*0.85)*Math.cos(oy*0.32+t*0.65)*0.65
              + Math.cos(oz*0.42+t*0.75)*Math.sin(ox*0.28+t*1.10)*0.45;
      const s = (len+d)/len;
      sv[i*3]=ox*s; sv[i*3+1]=oy*s; sv[i*3+2]=oz*s;
    }
    sGeo.attributes.position.needsUpdate = true;
    sphere.rotation.y += 0.003; sphere.rotation.x += 0.001;
    sphere.material.opacity = 0.045 + 0.022*Math.sin(t*0.75);

    /* Spin rings */
    rings.forEach((r,i) => { r.rotation.z += 0.004+i*0.001; r.rotation.y += 0.002; });

    /* Particle drift (gentle, no noise — ribbons are the hero) */
    const pa = pGeo.attributes.position.array;
    for (let i=0; i<PN; i++) {
      pa[i*3]   += pVel[i*3];
      pa[i*3+1] += pVel[i*3+1] + Math.sin(t+i*0.07)*0.001;
      if (Math.abs(pa[i*3])>38) pa[i*3]*=-0.98;
      if (Math.abs(pa[i*3+1])>28) pa[i*3+1]*=-0.98;
    }
    pGeo.attributes.position.needsUpdate = true;

    grid.material.opacity = 0.05+0.025*Math.sin(t*0.35);
    renderer.render(scene, camera);
  }());
}());
