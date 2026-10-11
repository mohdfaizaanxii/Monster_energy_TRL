/**
 * sound.js - Monster Energy Web Audio API Sound Synthesizer
 * 100% dependency-free, synthesized audio engine for tactile UI feedback.
 */

class BeastSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.hasInteracted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.init();
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.playPowerUp();
    }
    return this.enabled;
  }

  /**
   * Sound 1: Can Crack & Fizz ("Psssht!")
   * Simulates cracking an ice-cold aluminum can tab open with high-pressure gas release
   */
  playCanPop() {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;

    // 1. Sharp metallic snap / crack (impact click)
    const osc = this.ctx.createOscillator();
    const gainSnap = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gainSnap.gain.setValueAtTime(0.7, t);
    gainSnap.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gainSnap);
    gainSnap.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);

    // 2. High-pressure white noise hiss / fizz ("Psssht")
    const bufferSize = this.ctx.sampleRate * 0.45;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    // Highpass filter for fizzy effervescence
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, t + 0.02);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0, t);
    noiseGain.gain.linearRampToValueAtTime(0.55, t + 0.04);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    whiteNoise.start(t + 0.02);
    whiteNoise.stop(t + 0.47);
  }

  /**
   * Sound 2: High-Tech Cyber Tick / Button Click
   */
  playClick() {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Sound 3: Energy Power-Up / Vault Unlock Bass Surge
   */
  playPowerUp() {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.25);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.45);

    // Lowpass filter to keep it deep & punchy
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.45);

    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.52);
  }

  /**
   * Sound 4: Success Chime / Order Dispatched
   */
  playSuccess() {
    if (!this.enabled || !this.ctx) return;
    this.init();

    const notes = [440, 554.37, 659.25, 880]; // A Major arpeggio
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.37);
    });
  }
}

// Global instance
window.beastSound = new BeastSoundEngine();
