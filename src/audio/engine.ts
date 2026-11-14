/**
 * Audio 100 % sintetizado con Web Audio API (sin archivos): ambiente (viento, lluvia,
 * zumbido del generador, latido), contador Geiger con cadencia según la dosis,
 * efectos de interfaz y alarmas. El contexto se crea tras el primer gesto del usuario.
 */

export interface AmbientState {
  wind: number; // 0..1
  rain: number; // 0..1
  generator: boolean;
  geigerCps: number; // clics por segundo (0 = sin contador)
  heartbeat: boolean;
}

export type Sfx = 'tap' | 'confirm' | 'buy' | 'dig' | 'day' | 'event' | 'boss' | 'alarm' | 'win' | 'death' | 'perk' | 'error';

export interface Volumes {
  master: number;
  ambient: number;
  sfx: number;
  muted: boolean;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private ambientBus!: GainNode;
  private sfxBus!: GainNode;
  private noise!: AudioBuffer;
  private windGain?: GainNode;
  private windFilter?: BiquadFilterNode;
  private rainGain?: GainNode;
  private genGain?: GainNode;
  private heartTimer?: ReturnType<typeof setInterval>;
  private geigerTimer?: ReturnType<typeof setTimeout>;
  private geigerCps = 0;
  private vol: Volumes = { master: 0.7, ambient: 0.6, sfx: 0.8, muted: false };
  private pending: AmbientState | null = null;

  get ready() {
    return !!this.ctx;
  }

  /** Llamar desde un gesto del usuario (requisito de iOS/Chrome). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.ambientBus = ctx.createGain();
    this.sfxBus = ctx.createGain();
    this.ambientBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.master.connect(ctx.destination);
    // Ruido blanco de 2 s reutilizable
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let seed = 22222;
    for (let i = 0; i < d.length; i++) {
      seed = (seed * 16807) % 2147483647;
      d[i] = (seed / 2147483647) * 2 - 1;
    }
    this.buildAmbient();
    this.applyVolumes();
    if (this.pending) this.setAmbient(this.pending);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  setVolumes(v: Volumes) {
    this.vol = v;
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.vol.muted ? 0 : this.vol.master, t, 0.05);
    this.ambientBus.gain.setTargetAtTime(this.vol.ambient, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.vol.sfx, t, 0.05);
  }

  private noiseSource(loop = true) {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    src.loop = loop;
    return src;
  }

  private buildAmbient() {
    const ctx = this.ctx!;
    // Viento: ruido → paso banda modulado por un LFO lento
    const wind = this.noiseSource();
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 400;
    this.windFilter.Q.value = 0.8;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain).connect(this.windFilter.frequency);
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    wind.connect(this.windFilter).connect(this.windGain).connect(this.ambientBus);
    wind.start();
    lfo.start();
    // Lluvia: ruido paso alto
    const rain = this.noiseSource();
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    rain.connect(hp).connect(this.rainGain).connect(this.ambientBus);
    rain.start();
    // Generador: diente de sierra a 50 Hz + armónico, filtrado
    const o1 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.value = 50;
    const o2 = ctx.createOscillator();
    o2.type = 'square';
    o2.frequency.value = 100;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    const trem = ctx.createOscillator();
    trem.frequency.value = 7;
    const tremGain = ctx.createGain();
    tremGain.gain.value = 0.015;
    this.genGain = ctx.createGain();
    this.genGain.gain.value = 0;
    trem.connect(tremGain).connect(this.genGain.gain);
    const mix = ctx.createGain();
    mix.gain.value = 0.5;
    o1.connect(mix);
    o2.connect(mix);
    mix.connect(lp).connect(this.genGain).connect(this.ambientBus);
    o1.start();
    o2.start();
    trem.start();
  }

  setAmbient(a: AmbientState) {
    if (!this.ctx) {
      this.pending = a;
      return;
    }
    const t = this.ctx.currentTime;
    this.windGain!.gain.setTargetAtTime(a.wind * 0.35, t, 1.5);
    this.windFilter!.frequency.setTargetAtTime(300 + a.wind * 500, t, 2);
    this.rainGain!.gain.setTargetAtTime(a.rain * 0.12, t, 1.5);
    this.genGain!.gain.setTargetAtTime(a.generator ? 0.06 : 0, t, 0.8);
    this.setGeiger(a.geigerCps);
    if (a.heartbeat && !this.heartTimer) this.heartTimer = setInterval(() => this.heartbeat(), 1100);
    if (!a.heartbeat && this.heartTimer) {
      clearInterval(this.heartTimer);
      this.heartTimer = undefined;
    }
  }

  /** Clics Geiger como proceso de Poisson (intervalos exponenciales). */
  private setGeiger(cps: number) {
    this.geigerCps = cps;
    if (this.geigerTimer || cps <= 0) return;
    const tick = () => {
      this.geigerTimer = undefined;
      if (this.geigerCps <= 0 || !this.ctx) return;
      this.click();
      // La UI puede usar Math.random: no afecta a la simulación.
      const wait = (-Math.log(1 - Math.random()) / this.geigerCps) * 1000;
      this.geigerTimer = setTimeout(tick, Math.min(4000, Math.max(12, wait)));
    };
    tick();
  }

  private click() {
    const ctx = this.ctx!;
    const src = this.noiseSource(false);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
    src.connect(hp).connect(g).connect(this.ambientBus);
    src.start(t, Math.random() * 1.5, 0.02);
  }

  private heartbeat() {
    if (!this.ctx) return;
    for (const [dt, f] of [
      [0, 60],
      [0.18, 52],
    ] as const)
      this.tone(f, 0.12, { type: 'sine', gain: 0.35, at: dt, bus: this.ambientBus });
  }

  private tone(freq: number, dur: number, o: { type?: OscillatorType; gain?: number; at?: number; slideTo?: number; bus?: GainNode } = {}) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + (o.at ?? 0);
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(o.bus ?? this.sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private thud(at = 0, freq = 120) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + at;
    const src = this.noiseSource(false);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = freq * 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(lp).connect(g).connect(this.sfxBus);
    src.start(t, 0, 0.3);
  }

  play(s: Sfx) {
    if (!this.ctx || this.vol.muted) return;
    switch (s) {
      case 'tap':
        this.tone(900, 0.04, { type: 'triangle', gain: 0.06 });
        break;
      case 'confirm':
        this.tone(660, 0.08, { type: 'triangle', gain: 0.12 });
        this.tone(990, 0.1, { type: 'triangle', gain: 0.1, at: 0.07 });
        break;
      case 'buy':
        [1320, 1760].forEach((f, i) => this.tone(f, 0.12, { type: 'square', gain: 0.05, at: i * 0.06 }));
        break;
      case 'dig':
        this.thud(0, 90);
        this.thud(0.32, 110);
        break;
      case 'day':
        this.tone(440, 0.25, { type: 'sine', gain: 0.1, slideTo: 330 });
        break;
      case 'event':
        [220, 277, 330].forEach((f, i) => this.tone(f, 1.1, { type: 'triangle', gain: 0.07, at: i * 0.05 }));
        break;
      case 'boss':
        this.tone(55, 2.2, { type: 'sawtooth', gain: 0.12 });
        this.tone(58, 2.2, { type: 'sawtooth', gain: 0.1 });
        this.tone(165, 1.6, { type: 'triangle', gain: 0.06, at: 0.3 });
        break;
      case 'alarm':
        for (let i = 0; i < 3; i++) {
          this.tone(880, 0.16, { type: 'square', gain: 0.07, at: i * 0.36 });
          this.tone(660, 0.16, { type: 'square', gain: 0.07, at: i * 0.36 + 0.18 });
        }
        break;
      case 'win':
        [392, 494, 587, 784].forEach((f, i) => this.tone(f, 0.5, { type: 'triangle', gain: 0.1, at: i * 0.12 }));
        break;
      case 'perk':
        [523, 659, 784].forEach((f, i) => this.tone(f, 0.3, { type: 'sine', gain: 0.12, at: i * 0.08 }));
        break;
      case 'death':
        this.tone(330, 2.5, { type: 'sawtooth', gain: 0.1, slideTo: 55 });
        this.tone(247, 2.5, { type: 'triangle', gain: 0.08, slideTo: 41 });
        break;
      case 'error':
        this.tone(150, 0.18, { type: 'square', gain: 0.08 });
        break;
    }
  }
}

export const audio = new AudioEngine();
