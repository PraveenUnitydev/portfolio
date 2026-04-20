/* ════════════════════════════════════════════════════════
   ui.js — Interface & Interaction  v3

   1. Custom animated cursor
   2. Scroll-reveal (IntersectionObserver on .reveal)
   3. Skill bar animation (scroll-triggered)
   4. Hero name glitch scramble on hover
   5. Nav badge status cycle
   6. Mobile hamburger menu
════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. CUSTOM CURSOR ──────────────────────────────── */
  const curRing = document.getElementById('cur');
  const curDot  = document.getElementById('cur-dot');
  let mx = 0, my = 0, cx = 0, cy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    curDot.style.left = mx + 'px';
    curDot.style.top  = my + 'px';
  });

  (function tickCursor() {
    cx += (mx - cx) * 0.15;
    cy += (my - cy) * 0.15;
    curRing.style.left = cx + 'px';
    curRing.style.top  = cy + 'px';
    requestAnimationFrame(tickCursor);
  })();

  document.querySelectorAll('a, button, .ach, .pcard, .sbtn, .btn').forEach(el => {
    el.addEventListener('mouseenter', () => curRing.classList.add('big'));
    el.addEventListener('mouseleave', () => curRing.classList.remove('big'));
  });


  /* ── 2. SCROLL REVEAL ──────────────────────────────── */
  // Any element with class "reveal" fades+slides up when
  // it enters the viewport. Add "reveal-delay-N" (1–6) for
  // staggered timing within a group.
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target); // fire once only
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));


  /* ── 3. SKILL BAR ANIMATION ────────────────────────── */
  // Triggered by IntersectionObserver when the bar scrolls in.
  // To update a skill %, change data-pct and .sk-pct text in HTML.
  const skillObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const fill = e.target.querySelector('.sk-fill');
        if (fill) fill.style.width = e.target.dataset.pct + '%';
        skillObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.sk-item').forEach(el => skillObs.observe(el));


  /* ── 4. HERO NAME GLITCH SCRAMBLE ──────────────────── */
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?';

  document.querySelectorAll('.hero-name .c1, .hero-name .c2').forEach(el => {
    const orig = el.textContent;
    let iv = null;

    el.addEventListener('mouseenter', () => {
      clearInterval(iv);
      let revealed = 0;
      iv = setInterval(() => {
        el.textContent = orig.split('').map((ch, j) =>
          j < revealed ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
        ).join('');
        if (++revealed > orig.length) { el.textContent = orig; clearInterval(iv); }
      }, 38);
    });
  });


  /* ── 5. NAV BADGE STATUS CYCLE ─────────────────────── */
  const STATUSES = ['AVAILABLE', 'OPEN TO WORK', 'UNITY EXPERT', 'XR BUILDER', 'AI ENABLED'];
  const badge = document.querySelector('.nav-badge');
  let si = 0;

  if (badge) {
    setInterval(() => {
      si = (si + 1) % STATUSES.length;
      badge.textContent = STATUSES[si];
    }, 3000);
  }


  /* ── 6. MOBILE HAMBURGER MENU ──────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  function openMobileNav() {
    hamburger.classList.add('open');
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // Exposed globally so mobile nav links can call it
  window.closeMobileNav = function () {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (hamburger) hamburger.addEventListener('click', () => {
    hamburger.classList.contains('open') ? window.closeMobileNav() : openMobileNav();
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.closeMobileNav();
  });

  // Close on backdrop click (clicking the overlay itself)
  if (mobileNav) mobileNav.addEventListener('click', e => {
    if (e.target === mobileNav) window.closeMobileNav();
  });

}());
