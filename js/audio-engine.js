import { CHORDS, PROGRESSIONS, DRUM_PRESETS } from './constants.js';

export class LoFiAudioEngine {
  constructor(onStepCallback, onChordTriggerCallback) {
    this.ctx = null;
    this.masterGain = null;
    this.lpf = null;
    this.analyser = null;

    this.vinylGain = null;
    this.rainGain = null;

    this.isPlaying = false;
    this.bpm = 78;
    this.swing = 0.28;
    this.cutoff = 2400;

    this.vinylEnabled = true;
    this.vinylLevel = 0.35;
    this.rainEnabled = false;
    this.rainLevel = 0.25;
    this.flutterEnabled = true;
    this.flutterDepth = 0.45;

    this.autoProg = true;
    this.currentProgression = 'midnight';
    this.barCount = 0;

    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.timerID = null;

    this.muted = { kick: false, snare: false, hat: false, perc: false };
    this.patterns = JSON.parse(JSON.stringify(DRUM_PRESETS[0].patterns));

    this.onStep = onStepCallback;
    this.onChordTrigger = onChordTriggerCallback;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master Warm Low-Pass Filter + Soft Saturator
    this.lpf = this.ctx.createBiquadFilter();
    this.lpf.type = 'lowpass';
    this.lpf.frequency.value = this.cutoff;
    this.lpf.Q.value = 0.9;

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.008;
    compressor.release.value = 0.18;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.82;

    this.lpf.connect(compressor);
    compressor.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this._setupVinylCrackle();
    this._setupRainAmbience();
  }

  _setupVinylCrackle() {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const r = Math.random();
      // Subtle floor hiss + occasional dust pops
      data[i] = r > 0.9982
        ? (Math.random() * 2 - 1) * 0.75
        : (Math.random() * 2 - 1) * 0.018;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 1800;
    hp.Q.value = 0.7;

    this.vinylGain = this.ctx.createGain();
    this.vinylGain.gain.value = this.vinylEnabled ? this.vinylLevel : 0;

    noise.connect(hp);
    hp.connect(this.vinylGain);
    this.vinylGain.connect(this.masterGain);
    noise.start();
  }

  _setupRainAmbience() {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = data[i];
      data[i] *= 1.8;
    }

    const rain = this.ctx.createBufferSource();
    rain.buffer = buffer;
    rain.loop = true;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 950;
    bp.Q.value = 0.5;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = this.rainEnabled ? this.rainLevel : 0;

    rain.connect(bp);
    bp.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    rain.start();
  }

  triggerKick(time) {
    if (this.muted.kick) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(118, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.14);

    gain.gain.setValueAtTime(0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.34);

    osc.connect(gain);
    gain.connect(this.lpf);
    osc.start(time);
    osc.stop(time + 0.35);
  }

  triggerSnare(time) {
    if (this.muted.snare) return;
    // Filtered noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1150;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.lpf);
    noise.start(time);

    // Body thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(175, time);
    osc.frequency.exponentialRampToValueAtTime(85, time + 0.09);

    oscGain.gain.setValueAtTime(0.35, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.lpf);
    osc.start(time);
    osc.stop(time + 0.13);
  }

  triggerHat(time) {
    if (this.muted.hat) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.07);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.065);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(this.lpf);
    noise.start(time);
  }

  triggerPerc(time) {
    if (this.muted.perc) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, time);
    osc.frequency.exponentialRampToValueAtTime(290, time + 0.05);

    gain.gain.setValueAtTime(0.26, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(gain);
    gain.connect(this.lpf);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  playChord(chordIndex, time = null) {
    this.init();
    const startTime = time ?? this.ctx.currentTime;
    const chord = CHORDS[chordIndex];
    if (!chord) return;

    const duration = (60 / this.bpm) * 3.8;

    // Tape Wow & Flutter LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 1.6;
    lfoGain.gain.value = this.flutterEnabled ? this.flutterDepth * 7 : 0;
    lfo.connect(lfoGain);
    lfo.start(startTime);
    lfo.stop(startTime + duration + 0.3);

    chord.freqs.forEach((freq, idx) => {
      const strumOffset = idx * 0.018;
      const t0 = startTime + strumOffset;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(freq, t0);
      osc2.frequency.setValueAtTime(freq * 2, t0); // Rhodes bell overtone
      osc1.detune.value = (Math.random() - 0.5) * 8;

      lfoGain.connect(osc1.detune);
      lfoGain.connect(osc2.detune);

      const noteGain = this.ctx.createGain();
      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.value = 0.14;

      noteGain.gain.setValueAtTime(0.0001, t0);
      noteGain.gain.linearRampToValueAtTime(0.11, t0 + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.055, t0 + 0.45);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

      osc1.connect(noteGain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(noteGain);
      noteGain.connect(this.lpf);

      osc1.start(t0);
      osc2.start(t0);
      osc1.stop(t0 + duration + 0.05);
      osc2.stop(t0 + duration + 0.05);
    });

    if (this.onChordTrigger) {
      const delayMs = Math.max(0, (startTime - this.ctx.currentTime) * 1000);
      setTimeout(() => this.onChordTrigger(chordIndex), delayMs);
    }
  }

  start() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.barCount = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.04;
    this._scheduler();
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this.timerID);
    this.currentStep = 0;
    if (this.onStep) this.onStep(-1);
  }

  _scheduler() {
    if (!this.isPlaying) return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this._scheduleStep(this.currentStep, this.nextNoteTime);
      this._advanceStep();
    }
    this.timerID = setTimeout(() => this._scheduler(), 25);
  }

  _scheduleStep(step, time) {
    if (this.patterns.kick[step]) this.triggerKick(time);
    if (this.patterns.snare[step]) this.triggerSnare(time);
    if (this.patterns.hat[step]) this.triggerHat(time);
    if (this.patterns.perc[step]) this.triggerPerc(time);

    // Trigger chord on beat 1 of every bar when Auto Prog is active
    if (step === 0 && this.autoProg) {
      const prog = PROGRESSIONS[this.currentProgression];
      const chordIdx = prog[this.barCount % prog.length];
      this.playChord(chordIdx, time);
      this.barCount++;
    }

    const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000);
    setTimeout(() => {
      if (this.isPlaying && this.onStep) this.onStep(step);
    }, delayMs);
  }

  _advanceStep() {
    const sixteenth = 60 / this.bpm / 4;
    const isOdd = this.currentStep % 2 === 1;
    const swingOffset = isOdd ? sixteenth * this.swing : -sixteenth * this.swing * 0.35;
    this.nextNoteTime += sixteenth + swingOffset;

    this.currentStep = (this.currentStep + 1) % 16;
  }

  setBpm(val) { this.bpm = val; }
  setSwing(val) { this.swing = val / 100; }
  setCutoff(val) {
    this.cutoff = val;
    if (this.lpf) this.lpf.frequency.setTargetAtTime(val, this.ctx.currentTime, 0.02);
  }
  setMasterVolume(val) {
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
  }
  setVinyl(enabled, level) {
    this.vinylEnabled = enabled;
    this.vinylLevel = level;
    if (this.vinylGain) {
      this.vinylGain.gain.setTargetAtTime(enabled ? level : 0, this.ctx.currentTime, 0.04);
    }
  }
  setRain(enabled, level) {
    this.rainEnabled = enabled;
    this.rainLevel = level;
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(enabled ? level : 0, this.ctx.currentTime, 0.04);
    }
  }
}
