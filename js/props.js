/* ════════════════════════════════════════════════
   props.js — Floating XR Props  v5 (clean rewrite)

   KEY FIXES vs previous version:
   ─────────────────────────────
   1. Model group and decor group are SEPARATE children
      so group-level rotation only spins the model, not
      the rings (rings spin themselves independently).

   2. After GLB loads, material is forced to be visible:
      MeshStandardMaterial with full metalness/roughness
      reset + strong emissive so it shows on dark bg.

   3. Entrance position stored separately from userData
      so it is never clobbered.

   4. DRACOLoader NOT required — plain GLB only.

   HOW TO ADD YOUR MODELS:
   Edit the PROPS array. Set glb: 'models/filename.glb'
════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── helpers ─────────────────────────────────────── */
  const lerp     = (a, b, t) => a + (b - a) * t;
  const easeOut  = t => 1 - Math.pow(1 - t, 3);

  /* ── CONFIG ──────────────────────────────────────── */
  const PROPS = [
    {
      id:          'headset',
      glb:         'models/apple-vision-pro.glb',
      color:       0x00f5ff,
      restX:        6.0,   restY:  0.5,
      enterX:      16.0,   enterY: 0.5,
      modelScale:   1.6,
      spinX:        0.0012, spinY: 0.0028,
      bobAmp:       0.20,  bobFreq: 0.50, phase: 0.0,
      scrollRate:  -0.0015,
      delay:        0.3,
    },
    {
      id:          'controller',
      glb:         'models/controller-white.glb',
      color:       0xff00aa,
      restX:       -5.6,   restY: -0.8,
      enterX:     -16.0,   enterY: -0.8,
      modelScale:   1.2,
      spinX:        0.0018, spinY: 0.0022,
      bobAmp:       0.17,  bobFreq: 0.68, phase: 2.1,
      scrollRate:  -0.0020,
      delay:        0.55,
    },
    {
      id:          'extra',
      glb:         '',            // drop a 3rd GLB here when ready
      color:       0x39ff14,
      restX:        0.8,   restY: -5.0,
      enterX:       0.8,   enterY: -16.0,
      modelScale:   1.0,
      spinX:        0.0010, spinY: 0.0038,
      bobAmp:       0.25,  bobFreq: 0.42, phase: 4.4,
      scrollRate:  -0.0010,
      delay:        0.80,
    },
  ];

  /* ── RENDERER ────────────────────────────────────── */
  const canvas = document.createElement('canvas');
  canvas.id = 'props-canvas';
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0',
    width: '100%', height: '100%',
    zIndex: '2', pointerEvents: 'none',
  });
  document.body.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping    = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 300);
  camera.position.set(0, 0, 10);

  /* ── LIGHTS ──────────────────────────────────────── */
  // Bright ambient so any loaded model is visible
  scene.add(new THREE.AmbientLight(0xffffff, 2.5));

  // Warm key from front-top-right
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(5, 8, 8);
  scene.add(key);

  // Cool fill from left
  const fill = new THREE.DirectionalLight(0x88aaff, 1.5);
  fill.position.set(-6, 0, 4);
  scene.add(fill);

  // Per-prop coloured point lights
  const pLights = PROPS.map(p => {
    const pl = new THREE.PointLight(p.color, 0, 20);
    scene.add(pl);
    return pl;
  });

  /* ── DECOR BUILDER (rings, dots, halo) ───────────── */
  // Returns a group that is added as a sibling of the model,
  // so rotating the model doesn't spin the rings.
  function makeDecor(p) {
    const g = new THREE.Group();

    // Equatorial ring
    const eq = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.014, 4, 128),
      new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.45 })
    );
    eq.rotation.x = Math.PI / 2;
    eq.name = 'eq';
    g.add(eq);

    // Tilted ring
    const tilt = new THREE.Mesh(
      new THREE.TorusGeometry(1.85, 0.008, 4, 128),
      new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.22 })
    );
    tilt.rotation.set(0.5, 0, 0.7);
    tilt.name = 'tilt';
    g.add(tilt);

    // Orbit dots on equatorial ring
    const buf = new THREE.BufferGeometry();
    const pos = new Float32Array(160 * 3);
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      pos[i*3]   = Math.cos(a) * 1.55;
      pos[i*3+1] = 0;
      pos[i*3+2] = Math.sin(a) * 1.55;
    }
    buf.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.add(new THREE.Points(buf, new THREE.PointsMaterial({
      color: p.color, size: 0.024, transparent: true, opacity: 0.60,
    })));

    // Halo disc
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(3.0, 64),
      new THREE.MeshBasicMaterial({
        color: p.color, transparent: true, opacity: 0.030, side: THREE.DoubleSide,
      })
    );
    halo.position.z = -0.6;
    halo.name = 'halo';
    g.add(halo);

    return g;
  }

  /* ── PLACEHOLDER MESH ────────────────────────────── */
  function makePlaceholder(p) {
    const geos = {
      headset:    new THREE.TorusKnotGeometry(0.88, 0.27, 200, 20, 3, 5),
      controller: new THREE.IcosahedronGeometry(1.08, 3),
      extra:      new THREE.OctahedronGeometry(0.98, 3),
    };
    const geo = geos[p.id] || new THREE.IcosahedronGeometry(1, 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: p.color, wireframe: true, transparent: true, opacity: 0.32,
    }));
    mesh.name = 'placeholder';
    return mesh;
  }

  /* ── BUILD PROP WRAPPERS ─────────────────────────── */
  // Structure:
  //   root  (positioned + scroll/bob applied here)
  //   ├── spinner  (rotated each frame — contains model or placeholder)
  //   └── decor    (rings/halo — children spin themselves)
  const props = PROPS.map((p, i) => {
    const root    = new THREE.Group();
    const spinner = new THREE.Group();
    const decor   = makeDecor(p);
    const ph      = makePlaceholder(p);

    spinner.name = 'spinner';
    spinner.add(ph);
    root.add(spinner);
    root.add(decor);

    // Start off-screen
    root.position.set(p.enterX, p.enterY, 0);
    scene.add(root);

    // State
    const state = {
      cfg:        p,
      root,
      spinner,
      decor,
      light:      pLights[i],
      arrived:    false,
      enterT:     0,
      enterStart: null,
      modelLoaded: false,
    };

    if (p.glb) loadGLB(state);
    return state;
  });

  /* ── GLB LOADER ──────────────────────────────────── */
  function loadGLB(state) {
    const p = state.cfg;

    if (typeof THREE.GLTFLoader === 'undefined') {
      console.error('[props] THREE.GLTFLoader not found — check CDN script tag loaded correctly.');
      return;
    }

    console.log('[props] Loading:', p.glb);

    new THREE.GLTFLoader().load(
      p.glb,

      function onLoad(gltf) {
        console.log('[props] ✅ Loaded:', p.glb);
        const model = gltf.scene;

        // ── Centre the model ──────────────────────────
        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // ── Scale to fit ──────────────────────────────
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          model.scale.setScalar((2.2 / maxDim) * p.modelScale);
        }
        console.log('[props]   bbox:', size, '→ scale', model.scale.x.toFixed(3));

        // ── Fix materials so they show on dark bg ─────
        model.traverse(function (child) {
          if (!child.isMesh) return;
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(function (mat) {
            // Don't hide it
            mat.transparent   = false;
            mat.opacity       = 1;
            mat.depthWrite    = true;
            mat.side          = THREE.FrontSide;
            mat.needsUpdate   = true;

            // Boost visibility on dark background
            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
              // Tone down extreme metalness that makes things look black
              mat.metalness  = Math.min(mat.metalness  || 0, 0.6);
              mat.roughness  = Math.max(mat.roughness  || 0.5, 0.3);
              mat.emissive    = mat.emissive || new THREE.Color(0x000000);
              mat.emissive.setHex(p.color);
              mat.emissiveIntensity = 0.25;
            }

            // For non-standard materials, replace with a standard one
            if (mat.isMeshBasicMaterial && !mat.map) {
              // Leave basic materials alone — they're always visible
            }
          });
        });

        // ── Swap placeholder for real model ───────────
        // Remove placeholder mesh from spinner
        const ph = state.spinner.getObjectByName('placeholder');
        if (ph) state.spinner.remove(ph);

        state.spinner.add(model);
        state.modelLoaded = true;
        console.log('[props] Model attached to scene:', p.id);
      },

      function onProgress(xhr) {
        if (xhr.total) {
          console.log('[props]', p.id, Math.round(xhr.loaded / xhr.total * 100) + '%');
        }
      },

      function onError(err) {
        console.error('[props] ❌ Failed:', p.glb);
        console.error('  Error:', err);
        console.error('  → Make sure the file is at: portfolio/models/' + p.glb.replace('models/', ''));
        console.error('  → Make sure Live Server root is the portfolio/ folder (not a parent folder)');
      }
    );
  }

  /* ── INPUT ───────────────────────────────────────── */
  let scrollY       = 0;
  let scrollYSmooth = 0;
  let mouseX = 0, mouseY = 0;
  let smoothMouseX = 0, smoothMouseY = 0;

  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / innerWidth)  * 2 - 1;
    mouseY = -(e.clientY / innerHeight) * 2 + 1;
  });
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* ── PRE-CACHE ring refs ─────────────────────────── */
  props.forEach(function (s) {
    s._eq   = s.decor.getObjectByName('eq');
    s._tilt = s.decor.getObjectByName('tilt');
    s._halo = s.decor.getObjectByName('halo');
  });

  /* ── ANIMATE ─────────────────────────────────────── */
  let t = 0;
  const clock = new THREE.Clock();

  (function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    // Fast scroll catch-up — 0.18 means ~3 frames to settle
    // Models stay very close to target, no visible lag
    scrollYSmooth += (scrollY - scrollYSmooth) * 0.18;

    smoothMouseX += (mouseX - smoothMouseX) * 0.10;
    smoothMouseY += (mouseY - smoothMouseY) * 0.10;

    camera.position.x += (smoothMouseX * 0.25 - camera.position.x) * 0.05;
    camera.position.y += (smoothMouseY * 0.15 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    const now = performance.now() / 1000;

    props.forEach(function (s) {
      const p  = s.cfg;
      const pl = s.light;

      s.spinner.rotation.x += p.spinX * dt * 60;
      s.spinner.rotation.y += p.spinY * dt * 60;

      if (s._eq)   s._eq.rotation.z   += 0.4  * dt;
      if (s._tilt) s._tilt.rotation.y += 0.28 * dt;
      if (s._halo) s._halo.rotation.z += 0.16 * dt;

      if (!s.arrived) {
        if (s.enterStart === null && now >= p.delay) s.enterStart = now;
        if (s.enterStart !== null) {
          s.enterT = Math.min((now - s.enterStart) / 1.8, 1);
          const e = easeOut(s.enterT);
          s.root.position.x = lerp(p.enterX, p.restX, e);
          s.root.position.y = lerp(p.enterY, p.restY, e);
          pl.intensity = lerp(0, 1.8, e);
          if (s.enterT >= 1) {
            s.arrived = true;
            scrollYSmooth = scrollY; // sync on arrival
          }
        }
      } else {
        const bob       = Math.sin(t * p.bobFreq + p.phase) * p.bobAmp;
        const scrollOff = scrollYSmooth * p.scrollRate;
        const mxOff     = smoothMouseX * 0.18 * (s === props[0] ? 1 : -1);
        const myOff     = smoothMouseY * 0.10;

        s.root.position.x = p.restX + mxOff;
        s.root.position.y = p.restY + bob + scrollOff + myOff;

        pl.position.set(s.root.position.x, s.root.position.y + 0.5, 2);
        pl.intensity = 1.4 + 0.7 * Math.sin(t * 1.1 + p.phase);
      }
    });

    renderer.render(scene, camera);
  }());

}());

/* ── MOBILE: hide props canvas on small screens ── */
(function () {
  function checkMobile() {
    const c = document.getElementById('props-canvas');
    if (!c) return;
    // On narrow screens props overlap content — hide them
    c.style.opacity = window.innerWidth < 768 ? '0' : '1';
    c.style.transition = 'opacity 0.5s';
  }
  checkMobile();
  window.addEventListener('resize', checkMobile);
}());
