// The Midnight Vault — synthesised sound. Every effect is built from WebAudio
// oscillators and filtered noise at run time: no audio files, no network.
// The engine stays dormant until the first key or click (browsers demand a
// gesture), so screenshot runs and headless play-tests stay silent and safe.
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.alarmNodes = null;
    this.lastBeep = 0;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ready) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  noiseBurst(dur, vol, lowpass) {
    if (!this.ready) return;
    try {
      const t = this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  // Soft shoe on carpet: quieter when crouched, heavier when running.
  footstep(crouched, running) {
    this.noiseBurst(0.07, crouched ? 0.05 : running ? 0.16 : 0.09, running ? 900 : 500);
  }

  // Camera sweep beep, throttled so a room full of cameras does not chatter.
  cameraBeep() {
    const now = performance.now();
    if (now - this.lastBeep < 700) return;
    this.lastBeep = now;
    this.tone(1180, 0.09, 'sine', 0.08);
  }

  // Rising sting the moment suspicion tips into a chase or the alarm trips.
  alertSting() {
    this.tone(220, 0.5, 'sawtooth', 0.16, 660);
    this.tone(330, 0.4, 'square', 0.07, 880);
  }

  // Metallic clink for gold and gems: two detuned pings.
  lootClink() {
    this.tone(1568, 0.28, 'sine', 0.16);
    this.tone(2093, 0.34, 'sine', 0.1);
  }

  empZap() {
    this.noiseBurst(0.3, 0.2, 3200);
    this.tone(880, 0.3, 'sawtooth', 0.1, 110);
  }

  hackBlip() {
    this.tone(740, 0.08, 'square', 0.08);
    setTimeout(() => this.tone(988, 0.1, 'square', 0.08), 90);
    setTimeout(() => this.tone(1319, 0.14, 'square', 0.08), 190);
  }

  doorOpen() {
    this.tone(180, 0.4, 'triangle', 0.14, 420);
  }

  caughtBuzz() {
    this.tone(160, 0.7, 'sawtooth', 0.18, 55);
  }

  winJingle() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => this.tone(n, 0.3, 'triangle', 0.14), i * 130));
  }

  startAlarmLoop() {
    if (!this.ready || this.alarmNodes) return;
    try {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 440;
      const lfo = this.ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 2.2;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      const gain = this.ctx.createGain();
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      lfo.start();
      this.alarmNodes = { osc, lfo, gain };
    } catch {
      this.alarmNodes = null;
    }
  }

  stopAlarmLoop() {
    if (!this.alarmNodes) return;
    try {
      this.alarmNodes.osc.stop();
      this.alarmNodes.lfo.stop();
    } catch {
      // Already stopped.
    }
    this.alarmNodes = null;
  }
}
