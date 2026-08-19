/* ── MOBILE DETECTION — runs before anything else ── */
(function () {
  function checkMobile() {
    var w = window.innerWidth || document.documentElement.clientWidth;
    if (w < 1024) {
      document.body.classList.add('is-mobile');
    } else {
      document.body.classList.remove('is-mobile');
    }
  }
  // Run immediately
  checkMobile();
  // Re-run on resize
  window.addEventListener('resize', checkMobile);
  // Also run after fonts load (can affect layout)
  document.addEventListener('DOMContentLoaded', checkMobile);
}());

/* ════════════════════════════════════════════════════════
   ui.js — Interface & Interaction  v4 (mobile-first)
════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. CUSTOM CURSOR (desktop only) ──────────────── */
  const curRing = document.getElementById('cur');
  const curDot  = document.getElementById('cur-dot');

  if (window.matchMedia('(hover: hover)').matches) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      curDot.style.left = mx + 'px'; curDot.style.top = my + 'px';
    });
    (function tickCursor() {
      cx += (mx - cx) * 0.15; cy += (my - cy) * 0.15;
      curRing.style.left = cx + 'px'; curRing.style.top = cy + 'px';
      requestAnimationFrame(tickCursor);
    })();
    document.querySelectorAll('a, button, .ach, .pcard, .sbtn, .btn').forEach(el => {
      el.addEventListener('mouseenter', () => curRing.classList.add('big'));
      el.addEventListener('mouseleave', () => curRing.classList.remove('big'));
    });
  }

  /* ── 2. SCROLL REVEAL ─────────────────────────────── */
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.10 }); // lower threshold = triggers earlier on mobile
  document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

  /* ── 3. SKILL BARS ────────────────────────────────── */
  const skillObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const fill = e.target.querySelector('.sk-fill');
        if (fill) fill.style.width = e.target.dataset.pct + '%';
        skillObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.sk-item').forEach(el => skillObs.observe(el));

  /* ── 4. HERO GLITCH SCRAMBLE ──────────────────────── */
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?';
  document.querySelectorAll('.hero-name .c1, .hero-name .c2').forEach(el => {
    const orig = el.textContent;
    let iv = null;
    el.addEventListener('mouseenter', () => {
      clearInterval(iv);
      let n = 0;
      iv = setInterval(() => {
        el.textContent = orig.split('').map((ch, j) =>
          j < n ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
        ).join('');
        if (++n > orig.length) { el.textContent = orig; clearInterval(iv); }
      }, 38);
    });
    // Tap version for mobile
    el.addEventListener('touchstart', () => {
      clearInterval(iv); let n = 0;
      iv = setInterval(() => {
        el.textContent = orig.split('').map((ch, j) =>
          j < n ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
        ).join('');
        if (++n > orig.length) { el.textContent = orig; clearInterval(iv); }
      }, 38);
    }, { passive: true });
  });

  /* ── 5. NAV BADGE CYCLE ───────────────────────────── */
  const STATUSES = ['AVAILABLE', 'OPEN TO WORK', 'UNITY EXPERT', 'XR BUILDER', 'AI ENABLED'];
  const badge = document.querySelector('.nav-badge');
  let si = 0;
  if (badge) setInterval(() => { si = (si + 1) % STATUSES.length; badge.textContent = STATUSES[si]; }, 3000);

  /* ── 6. MOBILE HAMBURGER ──────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  window.closeMobileNav = function () {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.contains('open');
      isOpen ? window.closeMobileNav() : openNav();
    });
  }
  function openNav() {
    hamburger.classList.add('open');
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // Close on backdrop tap
  if (mobileNav) mobileNav.addEventListener('click', e => {
    if (e.target === mobileNav) window.closeMobileNav();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.closeMobileNav();
  });

  /* ── 7. NAV SCROLL HIDE/SHOW on mobile ───────────── */
  let lastScrollY = 0;
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    const curr = window.scrollY;
    if (curr > lastScrollY && curr > 80) {
      nav.style.transform = 'translateY(-100%)';
      nav.style.transition = 'transform 0.3s ease';
    } else {
      nav.style.transform = 'translateY(0)';
    }
    lastScrollY = curr;
  }, { passive: true });

}());
