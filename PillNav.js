/**
 * PillNav.js - Pure JavaScript implementation of React Bits <PillNav /> with GSAP
 */

(function (global) {
  'use strict';

  class PillNav {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) return;

      this.options = {
        logo: options.logo || 'Assets/monster-logo.svg',
        logoAlt: options.logoAlt || 'Monster Energy Logo',
        items: options.items || [
          { label: 'THE DROP', href: '#hero-experience' },
          { label: 'FLAVORS', href: '#flavors-section' },
          { label: 'CUSTOM VAULT', href: '#vault-builder' },
          { label: 'THE LAB', href: '#performance-lab' },
          { label: 'ATHLETES', href: '#athletes-section' },
          { label: 'REVIEWS', href: '#reviews-section' }
        ],
        activeHref: options.activeHref || '#hero-experience',
        ease: options.ease || 'power3.easeOut',
        baseColor: options.baseColor || '#00FF41',
        pillColor: options.pillColor || '#12151c',
        hoveredPillTextColor: options.hoveredPillTextColor || '#000000',
        pillTextColor: options.pillTextColor || '#ffffff',
        ...options
      };

      this.isMobileMenuOpen = false;
      this.tlRefs = [];
      this.activeTweenRefs = [];
      this.init();
    }

    init() {
      const { logo, logoAlt, items, activeHref, baseColor, pillColor, hoveredPillTextColor, pillTextColor } = this.options;

      this.container.classList.add('pill-nav-container');

      this.container.innerHTML = `
        <div class="pill-nav-outer-shell">
          <nav class="pill-nav" aria-label="Primary" style="--base: ${baseColor}; --pill-bg: ${pillColor}; --hover-text: ${hoveredPillTextColor}; --pill-text: ${pillTextColor};">
            <a class="pill-logo" href="${items[0]?.href || '#'}" aria-label="${logoAlt}" id="pill-nav-logo">
              <img src="${logo}" alt="${logoAlt}" id="pill-logo-img">
            </a>

            <div class="pill-nav-items desktop-only" id="pill-nav-items-wrapper">
              <ul class="pill-list" role="menubar">
                ${items.map((item, i) => `
                  <li role="none">
                    <a role="menuitem" href="${item.href}" class="pill ${activeHref === item.href ? 'is-active' : ''}" data-index="${i}">
                      <span class="hover-circle" aria-hidden="true"></span>
                      <span class="label-stack">
                        <span class="pill-label">${item.label}</span>
                        <span class="pill-label-hover" aria-hidden="true">${item.label}</span>
                      </span>
                    </a>
                  </li>
                `).join('')}
              </ul>
            </div>

            <button class="mobile-menu-button mobile-only" id="pill-mobile-btn" aria-label="Toggle menu">
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
            </button>
          </nav>

          <!-- Interactive Action Icons (Replay Intro, Sound FX, Cart) -->
          <div class="pill-nav-actions" id="pill-nav-actions-slot"></div>
        </div>

        <div class="mobile-menu-popover mobile-only" id="pill-mobile-menu" style="--base: ${baseColor}; --pill-bg: ${pillColor}; --hover-text: ${hoveredPillTextColor}; --pill-text: ${pillTextColor};">
          <ul class="mobile-menu-list">
            ${items.map(item => `
              <li>
                <a href="${item.href}" class="mobile-menu-link ${activeHref === item.href ? 'is-active' : ''}">
                  ${item.label}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      `;

      // Move action buttons from header into pill nav slot if they exist
      const actionsSlot = this.container.querySelector('#pill-nav-actions-slot');
      const existingActions = document.getElementById('header-action-utilities');
      if (actionsSlot && existingActions) {
        actionsSlot.appendChild(existingActions);
      }

      this.setupGSAPAnimations();
    }

    setupGSAPAnimations() {
      const gsapInstance = window.gsap;
      if (!gsapInstance) return;

      const ease = this.options.ease;
      const pills = this.container.querySelectorAll('.pill');
      const logoEl = this.container.querySelector('#pill-nav-logo');
      const logoImg = this.container.querySelector('#pill-logo-img');
      const mobileBtn = this.container.querySelector('#pill-mobile-btn');
      const mobileMenu = this.container.querySelector('#pill-mobile-menu');

      // Layout geometry for circles
      const layoutCircles = () => {
        pills.forEach((pill, index) => {
          const circle = pill.querySelector('.hover-circle');
          if (!circle) return;

          const rect = pill.getBoundingClientRect();
          const { width: w, height: h } = rect;
          if (w === 0 || h === 0) return;

          const R = ((w * w) / 4 + h * h) / (2 * h);
          const D = Math.ceil(2 * R) + 2;
          const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
          const originY = D - delta;

          circle.style.width = `${D}px`;
          circle.style.height = `${D}px`;
          circle.style.bottom = `-${delta}px`;

          gsapInstance.set(circle, {
            xPercent: -50,
            scale: 0,
            transformOrigin: `50% ${originY}px`
          });

          const label = pill.querySelector('.pill-label');
          const white = pill.querySelector('.pill-label-hover');

          if (label) gsapInstance.set(label, { y: 0 });
          if (white) gsapInstance.set(white, { y: h + 12, opacity: 0 });

          this.tlRefs[index]?.kill();
          const tl = gsapInstance.timeline({ paused: true });

          tl.to(circle, { scale: 1.2, xPercent: -50, duration: 1.6, ease, overwrite: 'auto' }, 0);
          if (label) tl.to(label, { y: -(h + 8), duration: 1.6, ease, overwrite: 'auto' }, 0);
          if (white) {
            gsapInstance.set(white, { y: Math.ceil(h + 100), opacity: 0 });
            tl.to(white, { y: 0, opacity: 1, duration: 1.6, ease, overwrite: 'auto' }, 0);
          }

          this.tlRefs[index] = tl;
        });
      };

      layoutCircles();
      window.addEventListener('resize', layoutCircles);

      // Pill hover events
      pills.forEach((pill, index) => {
        pill.addEventListener('mouseenter', () => {
          const tl = this.tlRefs[index];
          if (!tl) return;
          this.activeTweenRefs[index]?.kill();
          this.activeTweenRefs[index] = tl.tweenTo(tl.duration(), {
            duration: 0.28,
            ease,
            overwrite: 'auto'
          });
          window.beastSound?.playClick();
        });

        pill.addEventListener('mouseleave', () => {
          const tl = this.tlRefs[index];
          if (!tl) return;
          this.activeTweenRefs[index]?.kill();
          this.activeTweenRefs[index] = tl.tweenTo(0, {
            duration: 0.2,
            ease,
            overwrite: 'auto'
          });
        });

        pill.addEventListener('click', () => {
          pills.forEach(p => p.classList.remove('is-active'));
          pill.classList.add('is-active');
        });
      });

      // Logo 360-spin
      if (logoEl && logoImg) {
        logoEl.addEventListener('mouseenter', () => {
          gsapInstance.to(logoImg, {
            rotate: '+=360',
            duration: 0.45,
            ease: 'back.out(1.5)',
            overwrite: 'auto'
          });
          window.beastSound?.playClick();
        });
      }

      // Mobile Menu Toggle
      if (mobileBtn && mobileMenu) {
        const navHeader = document.getElementById('navbar') || this.container.closest('.pill-nav-header-container');

        mobileBtn.addEventListener('click', () => {
          this.isMobileMenuOpen = !this.isMobileMenuOpen;
          const lines = mobileBtn.querySelectorAll('.hamburger-line');

          if (this.isMobileMenuOpen) {
            navHeader?.classList.add('nav-mobile-open');
            gsapInstance.to(lines[0], { rotation: 45, y: 3.5, duration: 0.25, ease });
            gsapInstance.to(lines[1], { rotation: -45, y: -3.5, duration: 0.25, ease });
            gsapInstance.set(mobileMenu, { visibility: 'visible' });
            gsapInstance.fromTo(mobileMenu, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease });
          } else {
            navHeader?.classList.remove('nav-mobile-open');
            gsapInstance.to(lines[0], { rotation: 0, y: 0, duration: 0.25, ease });
            gsapInstance.to(lines[1], { rotation: 0, y: 0, duration: 0.25, ease });
            gsapInstance.to(mobileMenu, {
              opacity: 0,
              y: 10,
              duration: 0.2,
              ease,
              onComplete: () => gsapInstance.set(mobileMenu, { visibility: 'hidden' })
            });
          }
        });

        mobileMenu.querySelectorAll('.mobile-menu-link').forEach(link => {
          link.addEventListener('click', () => {
            this.isMobileMenuOpen = false;
            navHeader?.classList.remove('nav-mobile-open');
            const lines = mobileBtn.querySelectorAll('.hamburger-line');
            gsapInstance.to(lines[0], { rotation: 0, y: 0, duration: 0.2, ease });
            gsapInstance.to(lines[1], { rotation: 0, y: 0, duration: 0.2, ease });
            gsapInstance.to(mobileMenu, {
              opacity: 0,
              y: 10,
              duration: 0.2,
              ease,
              onComplete: () => gsapInstance.set(mobileMenu, { visibility: 'hidden' })
            });
          });
        });

        document.addEventListener('click', (e) => {
          if (this.isMobileMenuOpen && !this.container.contains(e.target)) {
            this.isMobileMenuOpen = false;
            navHeader?.classList.remove('nav-mobile-open');
            const lines = mobileBtn.querySelectorAll('.hamburger-line');
            gsapInstance.to(lines[0], { rotation: 0, y: 0, duration: 0.2, ease });
            gsapInstance.to(lines[1], { rotation: 0, y: 0, duration: 0.2, ease });
            gsapInstance.to(mobileMenu, {
              opacity: 0,
              y: 10,
              duration: 0.2,
              ease,
              onComplete: () => gsapInstance.set(mobileMenu, { visibility: 'hidden' })
            });
          }
        });
      }
    }
  }

  global.PillNav = PillNav;
})(window);
