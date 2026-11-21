import { CHORDS, TRACKS, DRUM_PRESETS } from './constants.js';
import { LoFiAudioEngine } from './audio-engine.js';
import { CRTVisualizer } from './visualizer.js';

let presetIndex = 0;

const engine = new LoFiAudioEngine(highlightStep, highlightChordPad);
const visualizer = new CRTVisualizer(document.getElementById('visualizer'), engine);

// Build Chord Pads
const chordGrid = document.getElementById('chord-pads');
CHORDS.forEach((chord, idx) => {
  const btn = document.createElement('button');
  btn.className = 'chord-pad';
  btn.dataset.index = idx;
  btn.innerHTML = `
    <span class="key-badge">${chord.key} / ${idx + 1}</span>
    <span class="chord-name">${chord.name}</span>
  `;
  btn.addEventListener('pointerdown', () => engine.playChord(idx));
  chordGrid.appendChild(btn);
});

function highlightChordPad(idx) {
  const pads = document.querySelectorAll('.chord-pad');
  pads.forEach((p, i) => p.classList.toggle('triggered', i === idx));
  setTimeout(() => pads[idx]?.classList.remove('triggered'), 450);
}

// Build Step LEDs & Sequencer Grid
const stepLeds = document.getElementById('step-indicators');
const spacer = document.createElement('div');
stepLeds.appendChild(spacer);
for (let s = 0; s < 16; s++) {
  const led = document.createElement('div');
  led.className = 'step-led';
  stepLeds.appendChild(led);
}

const seqGrid = document.getElementById('sequencer-grid');
function renderSequencer() {
  seqGrid.innerHTML = '';
  TRACKS.forEach((track) => {
    const row = document.createElement('div');
    row.className = 'track-row';

    const meta = document.createElement('div');
    meta.className = 'track-meta';
    meta.innerHTML = `<span>${track.name}</span>`;

    const muteBtn = document.createElement('button');
    muteBtn.className = `mute-btn ${engine.muted[track.id] ? 'muted' : ''}`;
    muteBtn.textContent = 'M';
    muteBtn.addEventListener('click', () => {
      engine.muted[track.id] = !engine.muted[track.id];
      muteBtn.classList.toggle('muted', engine.muted[track.id]);
    });
    meta.appendChild(muteBtn);
    row.appendChild(meta);

    for (let s = 0; s < 16; s++) {
      const btn = document.createElement('button');
      btn.className = `step-btn ${engine.patterns[track.id][s] ? 'active' : ''}`;
      btn.dataset.step = s;
      btn.addEventListener('click', () => {
        engine.patterns[track.id][s] = engine.patterns[track.id][s] ? 0 : 1;
        btn.classList.toggle('active', Boolean(engine.patterns[track.id][s]));
      });
      row.appendChild(btn);
    }

    seqGrid.appendChild(row);
  });
}

function highlightStep(step) {
  document.querySelectorAll('.step-led').forEach((led, idx) => {
    led.classList.toggle('current', idx === step);
  });
  document.querySelectorAll('.step-btn').forEach((btn) => {
    btn.classList.toggle('playing-step', Number(btn.dataset.step) === step);
  });
}

renderSequencer();

// Transport & Parameter Bindings
const playBtn = document.getElementById('play-btn');
const playLabel = document.getElementById('play-label');

function togglePlay() {
  if (engine.isPlaying) {
    engine.stop();
    playBtn.classList.remove('playing');
    playLabel.textContent = 'PLAY';
  } else {
    engine.start();
    playBtn.classList.add('playing');
    playLabel.textContent = 'PAUSE';
  }
}

playBtn.addEventListener('click', togglePlay);
document.getElementById('stop-btn').addEventListener('click', () => {
  engine.stop();
  playBtn.classList.remove('playing');
  playLabel.textContent = 'PLAY';
});

document.getElementById('bpm-slider').addEventListener('input', (e) => {
  const val = Number(e.target.value);
  document.getElementById('bpm-val').textContent = val;
  engine.setBpm(val);
});

document.getElementById('swing-slider').addEventListener('input', (e) => {
  const val = Number(e.target.value);
  document.getElementById('swing-val').textContent = `${val}%`;
  engine.setSwing(val);
});

document.getElementById('filter-slider').addEventListener('input', (e) => {
  const val = Number(e.target.value);
  document.getElementById('filter-val').textContent =
    val >= 1000 ? `${(val / 1000).toFixed(1)}kHz` : `${val}Hz`;
  engine.setCutoff(val);
});

// Tape & Ambience Controls
const vinylToggle = document.getElementById('vinyl-toggle');
const vinylVol = document.getElementById('vinyl-vol');
vinylToggle.addEventListener('click', () => {
  engine.init();
  const next = !engine.vinylEnabled;
  vinylToggle.classList.toggle('active', next);
  engine.setVinyl(next, Number(vinylVol.value));
});
vinylVol.addEventListener('input', (e) => {
  engine.init();
  engine.setVinyl(engine.vinylEnabled, Number(e.target.value));
});

const rainToggle = document.getElementById('rain-toggle');
const rainVol = document.getElementById('rain-vol');
rainToggle.addEventListener('click', () => {
  engine.init();
  const next = !engine.rainEnabled;
  rainToggle.classList.toggle('active', next);
  engine.setRain(next, Number(rainVol.value));
});
rainVol.addEventListener('input', (e) => {
  engine.init();
  engine.setRain(engine.rainEnabled, Number(e.target.value));
});

const flutterToggle = document.getElementById('flutter-toggle');
flutterToggle.addEventListener('click', () => {
  engine.flutterEnabled = !engine.flutterEnabled;
  flutterToggle.classList.toggle('active', engine.flutterEnabled);
});
document.getElementById('flutter-depth').addEventListener('input', (e) => {
  engine.flutterDepth = Number(e.target.value);
});

document.getElementById('master-vol').addEventListener('input', (e) => {
  engine.init();
  engine.setMasterVolume(Number(e.target.value));
});

// Auto-Progression & Pattern Actions
const autoProgBtn = document.getElementById('auto-prog-btn');
autoProgBtn.addEventListener('click', () => {
  engine.autoProg = !engine.autoProg;
  autoProgBtn.classList.toggle('active', engine.autoProg);
});

document.getElementById('prog-select').addEventListener('change', (e) => {
  engine.currentProgression = e.target.value;
  engine.barCount = 0;
});

document.getElementById('preset-btn').addEventListener('click', () => {
  presetIndex = (presetIndex + 1) % DRUM_PRESETS.length;
  engine.patterns = JSON.parse(JSON.stringify(DRUM_PRESETS[presetIndex].patterns));
  renderSequencer();
});

document.getElementById('clear-btn').addEventListener('click', () => {
  TRACKS.forEach((t) => engine.patterns[t.id].fill(0));
  renderSequencer();
});

// Visualizer Mode Switcher
document.querySelectorAll('.viz-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.viz-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    visualizer.setMode(btn.dataset.mode);
  });
});

// Keyboard Shortcuts (Spacebar + Chord Keys A-H / 1-6)
const KEY_MAP = { a: 0, s: 1, d: 2, f: 3, g: 4, h: 5, '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 };
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlay();
  }
  const idx = KEY_MAP[e.key.toLowerCase()];
  if (idx !== undefined) {
    engine.playChord(idx);
  }
});
