// All sound is generated procedurally with the Web Audio API — no external audio
// assets to source/license for a 5-hour hackathon. Kept intentionally simple.
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private heartbeatTimer: number | null = null;
  private heartbeatIntensity = 0;
  private lastFootstep = 0;

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);
    this.noiseBuffer = this.buildNoiseBuffer();
    this.startAmbient();
  }

  private resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  private buildNoiseBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private noiseSource(): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    return src;
  }

  private startAmbient() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 45;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    drone.connect(droneGain).connect(this.master);
    drone.start();

    const hiss = this.noiseSource();
    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'lowpass';
    hissFilter.frequency.value = 400;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.015;
    hiss.connect(hissFilter).connect(hissGain).connect(this.master);
    hiss.start();
  }

  playFootstep(sprint: boolean, now: number) {
    if (!this.ctx || !this.master) return;
    if (now - this.lastFootstep < (sprint ? 0.28 : 0.42)) return;
    this.lastFootstep = now;
    const ctx = this.ctx;
    const src = this.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(sprint ? 0.18 : 0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    src.stop(ctx.currentTime + 0.1);
  }

  playDoorCreak() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.6);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 300;
    filter.Q.value = 4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.connect(filter).connect(gain).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  }

  playPickup() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    [660, 880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(this.master!);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  playGrowl(intensity: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const src = this.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200 + intensity * 200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2 * intensity, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    src.stop(ctx.currentTime + 1.0);
  }

  playStinger() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.8);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc.connect(gain).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  }

  playRitual() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 2.5);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 3);
    osc.connect(gain).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 3);
  }

  playVictory() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
      osc.connect(gain).connect(this.master!);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  }

  setHeartbeat(intensity: number) {
    if (!this.ctx || !this.master) return;
    if (intensity <= 0.02) {
      if (this.heartbeatTimer !== null) {
        window.clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      return;
    }
    const changed = Math.abs(intensity - this.heartbeatIntensity) > 0.15;
    if (this.heartbeatTimer === null || changed) {
      if (this.heartbeatTimer !== null) window.clearInterval(this.heartbeatTimer);
      this.heartbeatIntensity = intensity;
      const beat = () => {
        if (!this.ctx || !this.master) return;
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 55;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.connect(gain).connect(this.master);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      };
      this.heartbeatTimer = window.setInterval(beat, Math.max(280, 900 - intensity * 650));
      beat();
    }
  }

  unlock() {
    this.init();
    this.resume();
  }
}

export const audioManager = new AudioManager();
