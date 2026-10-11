/**
 * SplitFlapText.js - Pure JavaScript & CSS implementation of React Bits <SplitFlapText />
 * Faithfully reproduces the mechanical split-flap departure board cascade animation.
 */

(function (global) {
  'use strict';

  const CHARSETS = {
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    numeric: '0123456789'
  };

  const toCssUnit = value => (typeof value === 'number' ? `${value}px` : value);

  const resolveCharset = charset => {
    if (CHARSETS[charset]) return CHARSETS[charset];
    return typeof charset === 'string' && charset.length > 0 ? charset : CHARSETS.alphanumeric;
  };

  const normalizePhrase = (phrase, width) => {
    const safe = String(phrase ?? '');
    return safe.padEnd(width, ' ').slice(0, width);
  };

  const sampleChar = charset => charset.charAt(Math.floor(Math.random() * charset.length)) || ' ';

  const buildSequence = (target, flips, charset) => {
    const steps = [];
    for (let i = 0; i < flips; i += 1) {
      steps.push(sampleChar(charset));
    }
    steps.push(target);
    return steps;
  };

  class SplitFlapText {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) {
        throw new Error('SplitFlapText: Target container element not found.');
      }

      this.options = {
        words: options.words || ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'],
        text: options.text,
        flipDuration: options.flipDuration ?? 0.12,
        stagger: options.stagger ?? 0.06,
        cycleDelay: options.cycleDelay ?? 2400,
        charset: options.charset || 'alphanumeric',
        flipsPerChar: options.flipsPerChar ?? 8,
        tileColor: options.tileColor || '#111827',
        textColor: options.textColor || '#f8fafc',
        tileRadius: options.tileRadius ?? 8,
        gap: options.gap ?? 6,
        fontSize: options.fontSize ?? 42,
        loop: options.loop !== false,
        padTo: options.padTo ?? 12,
        className: options.className || '',
        ...options
      };

      this.rafId = null;
      this.cycleTimer = null;
      this.cancelled = false;
      this.phraseIndex = 0;

      this.init();
    }

    init() {
      // Prepare phrases
      const sourceWords = Array.isArray(this.options.words) && this.options.words.length > 0 
        ? this.options.words 
        : ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'];

      this.phrases = typeof this.options.text === 'string' 
        ? [this.options.text] 
        : sourceWords.map(w => String(w ?? ''));

      const longest = this.phrases.reduce((max, phrase) => Math.max(max, phrase.length), 1);
      this.width = Math.max(1, Math.ceil(Number(this.options.padTo) || 0), longest);

      this.normalizedPhrases = this.phrases.map(p => normalizePhrase(p, this.width));

      // Build DOM structure
      this.root = document.createElement('div');
      this.root.className = `split-flap-text ${this.options.className}`.trim();
      this.root.setAttribute('role', 'text');

      // Set CSS Custom Properties
      this.root.style.setProperty('--split-flap-tile-color', this.options.tileColor);
      this.root.style.setProperty('--split-flap-text-color', this.options.textColor);
      this.root.style.setProperty('--split-flap-radius', toCssUnit(this.options.tileRadius));
      this.root.style.setProperty('--split-flap-gap', toCssUnit(this.options.gap));
      this.root.style.setProperty('--split-flap-font-size', toCssUnit(this.options.fontSize));
      this.root.style.setProperty('--split-flap-flip-duration', `${Math.max(0.04, Number(this.options.flipDuration) || 0.12)}s`);

      // Initialize tiles DOM
      this.tileElements = [];
      this.tilesData = [];

      const initialPhrase = this.normalizedPhrases[0] || '';
      this.currentText = initialPhrase;

      for (let i = 0; i < this.width; i++) {
        const char = initialPhrase[i] || ' ';
        const tileEl = document.createElement('span');
        tileEl.className = 'split-flap-text__tile';
        tileEl.setAttribute('aria-hidden', 'true');

        tileEl.innerHTML = `
          <span class="split-flap-text__half split-flap-text__half--top">
            <span class="split-flap-text__char">${char === ' ' ? '&nbsp;' : char}</span>
          </span>
          <span class="split-flap-text__half split-flap-text__half--bottom">
            <span class="split-flap-text__char">${char === ' ' ? '&nbsp;' : char}</span>
          </span>
        `;

        this.root.appendChild(tileEl);
        this.tileElements.push(tileEl);
        this.tilesData.push({ current: char, next: char, flipping: false, tick: 0 });
      }

      this.container.innerHTML = '';
      this.container.appendChild(this.root);

      if (this.normalizedPhrases.length > 1) {
        this.startCycle();
      }
    }

    startCycle() {
      const safeCycleDelay = Math.max(400, Number(this.options.cycleDelay) || 2400);
      this.scheduleNext(safeCycleDelay);
    }

    scheduleNext(delay) {
      this.cycleTimer = setTimeout(() => {
        if (this.cancelled) return;

        const nextIndex = this.phraseIndex + 1;
        if (nextIndex >= this.normalizedPhrases.length && !this.options.loop) return;

        this.phraseIndex = nextIndex % this.normalizedPhrases.length;
        const animationDuration = this.animateTo(this.normalizedPhrases[this.phraseIndex]);
        const safeCycleDelay = Math.max(400, Number(this.options.cycleDelay) || 2400);

        this.scheduleNext(safeCycleDelay + animationDuration);
      }, delay);
    }

    animateTo(targetPhrase) {
      const fromPhrase = normalizePhrase(this.currentText, this.width);
      const targetChars = targetPhrase.split('');

      const safeFlipMs = Math.max(40, (Number(this.options.flipDuration) || 0.12) * 1000);
      const safeStaggerMs = Math.max(0, (Number(this.options.stagger) || 0) * 1000);
      const safeFlips = Math.max(0, Math.floor(Number(this.options.flipsPerChar) || 0));
      const activeCharset = resolveCharset(this.options.charset);

      const plans = targetChars
        .map((targetChar, index) => {
          const fromChar = fromPhrase[index] || ' ';
          if (fromChar === targetChar) return null;

          return {
            index,
            from: fromChar,
            target: targetChar,
            sequence: buildSequence(targetChar, safeFlips, activeCharset),
            start: index * safeStaggerMs,
            step: -1,
            done: false
          };
        })
        .filter(Boolean);

      if (!plans.length) {
        this.currentText = targetPhrase;
        return 0;
      }

      const totalDuration = plans.reduce(
        (max, plan) => Math.max(max, plan.start + plan.sequence.length * safeFlipMs),
        0
      );
      const startedAt = performance.now();

      const tick = now => {
        if (this.cancelled) return;

        const elapsed = now - startedAt;
        let shouldContinue = false;

        plans.forEach(plan => {
          const localElapsed = elapsed - plan.start;

          if (localElapsed < 0) {
            shouldContinue = true;
            return;
          }

          const step = Math.floor(localElapsed / safeFlipMs);

          if (step < plan.sequence.length) {
            shouldContinue = true;

            if (step !== plan.step) {
              plan.step = step;
              const curChar = step === 0 ? plan.from : plan.sequence[step - 1];
              const nextChar = plan.sequence[step];
              this.updateTile(plan.index, curChar, nextChar, true);
              window.beastSound?.playClick();
            }
          } else if (!plan.done) {
            plan.done = true;
            this.updateTile(plan.index, plan.target, plan.target, false);
          }
        });

        if (shouldContinue) {
          this.rafId = requestAnimationFrame(tick);
        } else {
          this.currentText = targetPhrase;
          this.rafId = null;
        }
      };

      this.rafId = requestAnimationFrame(tick);
      return totalDuration;
    }

    updateTile(index, currentChar, nextChar, isFlipping) {
      const tileEl = this.tileElements[index];
      if (!tileEl) return;

      const curDisplay = currentChar === ' ' ? '&nbsp;' : currentChar;
      const nextDisplay = nextChar === ' ' ? '&nbsp;' : nextChar;

      const topChar = tileEl.querySelector('.split-flap-text__half--top .split-flap-text__char');
      const bottomChar = tileEl.querySelector('.split-flap-text__half--bottom .split-flap-text__char');

      if (topChar) topChar.innerHTML = curDisplay;
      if (bottomChar) bottomChar.innerHTML = isFlipping ? nextDisplay : curDisplay;

      // Remove existing animated flaps
      tileEl.querySelectorAll('.split-flap-text__flap').forEach(f => f.remove());

      if (isFlipping) {
        const flapFront = document.createElement('span');
        flapFront.className = 'split-flap-text__flap split-flap-text__flap--front';
        flapFront.innerHTML = `<span class="split-flap-text__char">${curDisplay}</span>`;

        const flapBack = document.createElement('span');
        flapBack.className = 'split-flap-text__flap split-flap-text__flap--back';
        flapBack.innerHTML = `<span class="split-flap-text__char">${nextDisplay}</span>`;

        tileEl.appendChild(flapFront);
        tileEl.appendChild(flapBack);
      }
    }

    destroy() {
      this.cancelled = true;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.cycleTimer) clearTimeout(this.cycleTimer);
      if (this.root) this.root.remove();
    }
  }

  global.SplitFlapText = SplitFlapText;
})(window);
