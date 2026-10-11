/**
 * OptionWheel.js - Vanilla JavaScript version of React Bits <OptionWheel />
 * Enables interactive 3D cylindrical option selector wheel in native HTML/JS.
 */

(function (global) {
  'use strict';

  class OptionWheel {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) {
        throw new Error('OptionWheel: Target container element not found.');
      }

      this.options = {
        items: options.items || ['Original Green', 'Ultra White', 'Juiced Mango Loco', 'Ultra Paradise', 'Pipeline Punch', 'Ultra Violet'],
        defaultSelected: options.defaultSelected || 0,
        textColor: options.textColor || '#a6a6a6',
        activeColor: options.activeColor || '#39ff14',
        side: options.side || 'left',
        fontSize: options.fontSize || 2.8,
        spacing: options.spacing || 1.4,
        curve: options.curve || 1,
        tilt: options.tilt || 6,
        blur: options.blur || 2,
        fade: options.fade || 0.25,
        smoothing: options.smoothing || 200,
        inset: options.inset || 80,
        loop: options.loop || false,
        draggable: options.draggable !== false,
        soundUrl: options.soundUrl || '/sounds/click-soft.mp3',
        soundVolume: options.soundVolume || 0.5,
        onChange: options.onChange || (() => {}),
        className: options.className || '',
        ...options
      };

      this.selectedIndex = this.options.defaultSelected;
      this.currentOffset = this.options.defaultSelected;
      this.targetOffset = this.options.defaultSelected;
      this.isDragging = false;
      this.lastClickIndex = this.options.defaultSelected;
      this.rafId = null;

      // Drag physics
      this.dragStartY = 0;
      this.dragStartOffset = 0;
      this.lastY = 0;
      this.velocity = 0;
      this.lastTime = 0;

      this.init();
    }

    init() {
      this.container.classList.add('option-wheel-container');
      if (this.options.className) this.container.classList.add(this.options.className);

      this.container.style.setProperty('--wheel-text-color', this.options.textColor);
      this.container.style.setProperty('--wheel-active-color', this.options.activeColor);
      this.container.style.setProperty('--wheel-font-size', `${this.options.fontSize}rem`);

      this.viewport = document.createElement('div');
      this.viewport.className = 'option-wheel-viewport';
      this.container.innerHTML = '';
      this.container.appendChild(this.viewport);

      this.itemElements = this.options.items.map((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'option-wheel-item';
        itemEl.innerHTML = `<span class="option-wheel-label">${item}</span>`;
        itemEl.addEventListener('click', () => this.selectItem(index));
        this.viewport.appendChild(itemEl);
        return itemEl;
      });

      this.bindEvents();
      this.render();
    }

    playClickSound() {
      // Use Web Audio API click synthesizer
      if (window.beastSound) {
        window.beastSound.playClick();
      }
    }

    clampOffset(val) {
      if (this.options.loop) {
        const count = this.options.items.length;
        return ((val % count) + count) % count;
      }
      return Math.max(0, Math.min(this.options.items.length - 1, val));
    }

    selectItem(index) {
      this.targetOffset = this.clampOffset(index);
      this.animateToTarget();
    }

    animateToTarget() {
      const step = () => {
        const diff = this.targetOffset - this.currentOffset;
        if (Math.abs(diff) < 0.002) {
          this.currentOffset = this.targetOffset;
          const finalIndex = Math.round(this.targetOffset);
          if (finalIndex !== this.selectedIndex) {
            this.selectedIndex = finalIndex;
            this.options.onChange(finalIndex, this.options.items[finalIndex]);
          }
          this.render();
          return;
        }

        // Spring easing
        this.currentOffset += diff * (1 / (this.options.smoothing / 16.6));

        // Sound trigger
        const rounded = Math.round(this.currentOffset);
        if (rounded !== this.lastClickIndex) {
          this.lastClickIndex = rounded;
          this.playClickSound();
        }

        this.render();
        this.rafId = requestAnimationFrame(step);
      };

      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(step);
    }

    bindEvents() {
      // Pointer drag
      this.container.addEventListener('pointerdown', (e) => {
        if (!this.options.draggable) return;
        this.isDragging = true;
        this.dragStartY = e.clientY;
        this.dragStartOffset = this.currentOffset;
        this.lastY = e.clientY;
        this.lastTime = performance.now();
        this.velocity = 0;

        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.container.setPointerCapture) {
          this.container.setPointerCapture(e.pointerId);
        }
      });

      this.container.addEventListener('pointermove', (e) => {
        if (!this.isDragging) return;

        const currentY = e.clientY;
        const deltaY = this.dragStartY - currentY;
        const now = performance.now();
        const dt = Math.max(1, now - this.lastTime);

        this.velocity = ((this.lastY - currentY) / dt) * 16.6;
        this.lastY = currentY;
        this.lastTime = now;

        const pixelPerItem = this.options.fontSize * 16 * this.options.spacing * 1.5;
        const newOffset = this.dragStartOffset + deltaY / pixelPerItem;

        this.currentOffset = this.clampOffset(newOffset);

        const rounded = Math.round(this.currentOffset);
        if (rounded !== this.lastClickIndex) {
          this.lastClickIndex = rounded;
          this.playClickSound();
        }

        this.render();
      });

      const handlePointerUp = (e) => {
        if (!this.isDragging) return;
        this.isDragging = false;

        const throwDistance = this.velocity * 0.15;
        const rawTarget = this.currentOffset + throwDistance;
        this.targetOffset = this.clampOffset(Math.round(rawTarget));
        this.animateToTarget();

        if (this.container.releasePointerCapture) {
          try {
            this.container.releasePointerCapture(e.pointerId);
          } catch (err) {}
        }
      };

      this.container.addEventListener('pointerup', handlePointerUp);
      this.container.addEventListener('pointercancel', handlePointerUp);

      // Wheel scrub
      this.container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const dir = e.deltaY > 0 ? 1 : -1;
        this.selectItem(Math.round(this.currentOffset + dir));
      }, { passive: false });
    }

    render() {
      const { items, curve, tilt, blur, fade, inset, side, spacing, fontSize, activeColor, textColor, loop } = this.options;
      const roundedSelected = Math.round(this.currentOffset);

      this.itemElements.forEach((el, index) => {
        let delta = index - this.currentOffset;

        if (loop) {
          const count = items.length;
          delta = ((delta % count) + count) % count;
          if (delta > count / 2) delta -= count;
        }

        const absDelta = Math.abs(delta);
        const isSelected = roundedSelected === index;

        // 3D Cylinder projection
        const angleStep = 0.35 * curve;
        const angle = delta * angleStep;

        const y = Math.sin(angle) * (fontSize * 16 * spacing * 4.2);
        const curveDirection = side === 'left' ? 1 : -1;
        const x = (1 - Math.cos(angle)) * inset * curveDirection;
        const z = (Math.cos(angle) - 1) * 180;

        const rotateX = -delta * (tilt * 4.5);
        const rotateY = side === 'left' ? -delta * 4 : delta * 4;

        const scale = Math.max(0.65, 1 - absDelta * 0.12);
        const opacity = Math.max(fade, 1 - absDelta * 0.28);
        const itemBlur = Math.min(8, absDelta * blur);

        el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
        el.style.opacity = opacity;
        el.style.filter = itemBlur > 0.1 ? `blur(${itemBlur}px)` : 'none';
        el.style.color = isSelected ? activeColor : textColor;

        if (isSelected) {
          el.classList.add('active');
          if (!el.querySelector('.option-wheel-active-marker')) {
            const marker = document.createElement('span');
            marker.className = 'option-wheel-active-marker';
            el.appendChild(marker);
          }
        } else {
          el.classList.remove('active');
          const marker = el.querySelector('.option-wheel-active-marker');
          if (marker) marker.remove();
        }
      });
    }

    setActiveColor(color) {
      this.options.activeColor = color;
      this.container.style.setProperty('--wheel-active-color', color);
      this.render();
    }
  }

  global.OptionWheel = OptionWheel;
})(window);
