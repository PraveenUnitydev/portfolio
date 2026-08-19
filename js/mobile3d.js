/* ════════════════════════════════════════════════════════
   mobile3d.js — Immersive Mobile Interactions

   1. GYROSCOPE PARALLAX
      Hero name/subtitle shift based on phone tilt.
      Feels like an XR spatial interface.

   2. 3D SCROLL REVEALS
      Cards/sections reveal with rotateX perspective
      as they enter the viewport.

   3. SCROLL PARALLAX
      Hero elements drift at different rates on scroll.
════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.innerWidth >= 1024) return; // desktop: skip entirely

  /* ── ELEMENTS ──────────────────────────────────────── */
  const heroName  = document.querySelector('.hero-name');
  const heroRole  = document.querySelector('.hero-role');
  const heroTag   = document.querySelector('.hero-tag');
  const heroTags  = document.querySelector('.inline-tags');
  const heroCta   = document.querySelector('.hero-cta');

  /* ══════════════════════════════════════════════════════
     1. GYROSCOPE PARALLAX
     Layers move at different depths when phone tilts.
     Requests permission on iOS 13+, works natively on Android.
  ══════════════════════════════════════════════════════ */
  let gyroX = 0, gyroY = 0;
  let smoothGX = 0, smoothGY = 0;
  let gyroActive = false;

  function applyGyro() {
    // Smooth the gyro values (lerp)
    smoothGX += (gyroX - smoothGX) * 0.08;
    smoothGY += (gyroY - smoothGY) * 0.08;

    if (heroName)  heroName.style.transform  = `translate(${smoothGX * 10}px, ${smoothGY * 6}px)`;
    if (heroRole)  heroRole.style.transform  = `translate(${smoothGX * 6}px,  ${smoothGY * 4}px)`;
    if (heroTag)   heroTag.style.transform   = `translate(${smoothGX * 4}px,  ${smoothGY * 2}px)`;
    if (heroTags)  heroTags.style.transform  = `translate(${smoothGX * 8}px,  ${smoothGY * 5}px)`;
    if (heroCta)   heroCta.style.transform   = `translate(${smoothGX * 5}px,  ${smoothGY * 3}px)`;

    requestAnimationFrame(applyGyro);
  }

  function onDeviceOrientation(e) {
    // gamma = left/right tilt (-90 to 90), beta = front/back (-180 to 180)
    const gamma = e.gamma || 0;
    const beta  = e.beta  || 0;

    // Normalise to -1..1 range, clamp, and invert for natural feel
    gyroX = Math.max(-1, Math.min(1, gamma / 30)) * -1;
    gyroY = Math.max(-1, Math.min(1, (beta - 45) / 40)) * -1;
  }

  function enableGyro() {
    window.addEventListener('deviceorientation', onDeviceOrientation, true);
    if (!gyroActive) { gyroActive = true; applyGyro(); }
  }

  // iOS 13+ requires user gesture + permission
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // Show a subtle prompt on first tap
    document.addEventListener('touchstart', function askPermission() {
      DeviceOrientationEvent.requestPermission()
        .then(function (state) { if (state === 'granted') enableGyro(); })
        .catch(function () {});
      document.removeEventListener('touchstart', askPermission);
    }, { once: true });
  } else {
    // Android + older iOS: enable immediately
    enableGyro();
  }

  /* ══════════════════════════════════════════════════════
     2. 3D SCROLL REVEALS
     Elements animate in with perspective rotateX
     as they enter the viewport.
  ══════════════════════════════════════════════════════ */
  const REVEAL_SELECTORS = [
    '.pcard',
    '.tli',
    '.ach',
    '.sk-item',
    '.wf-case',
    '.xp-left',
    '.wf-stack',
    '.sec-head .eyebrow',
    '.sec-head .sec-title',
  ].join(', ');

  const revealEls = document.querySelectorAll(REVEAL_SELECTORS);
  revealEls.forEach(el => el.classList.add('m-reveal'));

  const revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('m-in');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  revealEls.forEach(el => revealObs.observe(el));

  /* ══════════════════════════════════════════════════════
     3. SCROLL PARALLAX ON HERO
     Different elements scroll at different speeds,
     creating a sense of layered depth.
  ══════════════════════════════════════════════════════ */
  let lastScrollY = 0;
  let ticking = false;

  function onScroll() {
    lastScrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(updateScrollParallax);
      ticking = true;
    }
  }

  function updateScrollParallax() {
    const sy = lastScrollY;

    // Only apply within hero section
    const heroH = window.innerHeight;
    if (sy < heroH) {
      const pct = sy / heroH; // 0..1

      // Elements move UP at different rates (parallax)
      // Deeper layers move less (stay closer to center)
      if (heroName)  heroName.style.transform  = `translate(${smoothGX * 10}px, calc(${smoothGY * 6}px - ${sy * 0.20}px))`;
      if (heroRole)  heroRole.style.transform  = `translate(${smoothGX * 6}px,  calc(${smoothGY * 4}px - ${sy * 0.14}px))`;
      if (heroTags)  heroTags.style.transform  = `translate(${smoothGX * 8}px,  calc(${smoothGY * 5}px - ${sy * 0.10}px))`;
      if (heroCta)   heroCta.style.transform   = `translate(${smoothGX * 5}px,  calc(${smoothGY * 3}px - ${sy * 0.08}px))`;

      // Fade hero content as it scrolls out
      const heroEl = document.getElementById('hero');
      if (heroEl) heroEl.style.opacity = Math.max(0, 1 - pct * 1.8);
    }

    ticking = false;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ══════════════════════════════════════════════════════
     4. STAT NUMBERS — count up on scroll into view
  ══════════════════════════════════════════════════════ */
  const statVals = document.querySelectorAll('.stat-val');

  function parseNum(str) {
    return parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
  }
  function getSuffix(str) {
    return str.replace(/[0-9.]/g, '');
  }

  statVals.forEach(function (el) {
    const target   = parseNum(el.textContent);
    const suffix   = getSuffix(el.textContent);
    el.dataset.target = target;
    el.dataset.suffix = suffix;
    el.textContent = '0' + suffix;
  });

  const counterObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      const el     = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix;
      const dur    = 1200; // ms
      const start  = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const pct     = Math.min(elapsed / dur, 1);
        // Ease out cubic
        const eased   = 1 - Math.pow(1 - pct, 3);
        const current = Math.round(eased * target * 10) / 10;
        el.textContent = (Number.isInteger(target) ? Math.round(current) : current) + suffix;
        if (pct < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.5 });

  statVals.forEach(el => counterObs.observe(el));

}());
