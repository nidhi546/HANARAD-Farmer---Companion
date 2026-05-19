/* ── HANARAD Farmer-Companion — Landing Page JS ── */

(function () {
  'use strict';

  // ── Navbar scroll effect ──────────────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // ── Mobile hamburger menu ─────────────────────────────────────────────────
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks  = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when a nav link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── Smooth scroll for anchor links ───────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = navbar ? navbar.offsetHeight : 0;
        const top  = target.getBoundingClientRect().top + window.pageYOffset - navH - 10;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ── Intersection Observer — fade-in animations ────────────────────────────
  const fadeEls = document.querySelectorAll(
    '.about-card, .feature-card, .lang-card, .testimonial-card, .contact-card, .screenshot-item'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(function (el, i) {
      el.classList.add('fade-in');
      el.style.transitionDelay = (i % 4) * 80 + 'ms';
      observer.observe(el);
    });
  } else {
    // Fallback for older browsers
    fadeEls.forEach(function (el) { el.classList.add('visible'); });
  }

  // ── Section headings fade in ──────────────────────────────────────────────
  const headingEls = document.querySelectorAll('.section-title, .section-desc, .section-label');
  if ('IntersectionObserver' in window) {
    const headObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          headObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    headingEls.forEach(function (el) {
      el.classList.add('fade-in');
      headObs.observe(el);
    });
  }

  // ── Active nav link highlighting based on scroll position ─────────────────
  const sections = document.querySelectorAll('section[id]');
  const navALinks = document.querySelectorAll('.nav-links a[href^="#"]');

  function setActiveNavLink() {
    const scrollPos = window.scrollY + (navbar ? navbar.offsetHeight + 20 : 80);

    let current = '';
    sections.forEach(function (section) {
      if (section.offsetTop <= scrollPos) {
        current = section.getAttribute('id');
      }
    });

    navALinks.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', setActiveNavLink, { passive: true });
  setActiveNavLink();

  // ── Download button CTA tracking (console only — swap for analytics) ──────
  document.querySelectorAll('.store-btn, .btn-primary').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const label = btn.textContent.trim().slice(0, 40);
      console.info('[HANARAD Analytics] CTA click:', label);
      // If Firebase web SDK is added later:
      // firebase.analytics().logEvent('cta_click', { label });
    });
  });

  // ── Testimonial auto-scroll (simple carousel on mobile) ──────────────────
  const testGrid = document.querySelector('.testimonials-grid');
  if (testGrid && window.innerWidth < 768) {
    let isPaused = false;
    testGrid.addEventListener('touchstart', function () { isPaused = true; }, { passive: true });
    testGrid.addEventListener('touchend', function () {
      setTimeout(function () { isPaused = false; }, 2000);
    }, { passive: true });
  }

  // ── Phone mockup animation — cycle through screens ───────────────────────
  const miniCards = document.querySelectorAll('.screen-mini-card');
  let activeCard = 0;
  if (miniCards.length) {
    setInterval(function () {
      miniCards.forEach(function (c) { c.style.opacity = '0.6'; c.style.transform = 'scale(0.97)'; });
      miniCards[activeCard].style.opacity = '1';
      miniCards[activeCard].style.transform = 'scale(1)';
      miniCards[activeCard].style.transition = 'all 0.4s ease';
      activeCard = (activeCard + 1) % miniCards.length;
    }, 1800);
  }

  // ── Console branding ──────────────────────────────────────────────────────
  console.log(
    '%c🌾 HANARAD Farmer-Companion %c\nSmart Farming, Better Harvest\nsupport@hanarad.app',
    'font-size:16px;font-weight:900;color:#2E7D32;',
    'font-size:12px;color:#555;'
  );

})();
