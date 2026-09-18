// All sound is generated procedurally with the Web Audio API — no external audio
// assets needed. The game must work identically with audio unavailable/blocked, so
// every method is a safe no-op until `unlock()` has been called from a user gesture.
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', gainPeak = 0.18, delay = 0) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(gainPeak, start + Math.min(0.03, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  click() {
    this.tone(320, 0.06, 'square', 0.08);
  }

  cupSelect() {
    this.tone(520, 0.1, 'sine', 0.1);
  }

  cupMove() {
    this.tone(220, 0.15, 'triangle', 0.08);
  }

  swap() {
    this.tone(300, 0.08, 'square', 0.09);
    this.tone(420, 0.08, 'square', 0.09, 0.09);
  }

  clueReveal() {
    this.tone(700, 0.12, 'sine', 0.1);
    this.tone(900, 0.15, 'sine', 0.08, 0.08);
  }

  suspense() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 1.1);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.4);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    osc.connect(gain).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 1.3);
  }

  poison() {
    this.tone(180, 0.5, 'sawtooth', 0.22);
    this.tone(90, 0.6, 'sawtooth', 0.18, 0.05);
  }

  safe() {
    this.tone(660, 0.18, 'sine', 0.14);
    this.tone(880, 0.22, 'sine', 0.12, 0.1);
  }

  damage() {
    this.tone(140, 0.3, 'square', 0.2);
  }

  victory() {
    [523, 659, 784, 1047].forEach((freq, i) => this.tone(freq, 0.5, 'triangle', 0.16, i * 0.15));
  }

  defeat() {
    [400, 340, 260, 180].forEach((freq, i) => this.tone(freq, 0.6, 'sawtooth', 0.14, i * 0.18));
  }
}

export const audioManager = new AudioManager();
