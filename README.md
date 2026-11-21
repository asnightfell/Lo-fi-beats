# Lo-fi-beats
Lo-fi beats creator

# KOMOREBI SP-404X — In-Browser Lo-Fi Beat Studio

A zero-dependency Web Audio API lo-fi beat workstation featuring a 16-step swing drum sequencer, polyphonic Rhodes chord pads, procedural vinyl crackle and rain ambience, tape wow/flutter modulation, and a real-time CRT oscilloscope/spectrum visualizer.

## Features
- **16-Step Drum Sequencer**: Synthesized Dusty Kick, Tape Snare, Dark Hat, and Wood Rim with swing groove, per-track mutes, and built-in beat variations.
- **Rhodes Chord Pad Synth**: 6 jazz voicings (`Fmaj9`, `Em7`, `Dm9`, `Cmaj9`, `Am11`, `G13sus`) playable via mouse/touch, keyboard (`A S D F G H` / `1–6`), or automated progression loops.
- **Tape & Texture Rack**: Real-time procedural vinyl crackle, rain noise generator, LFO pitch wow & flutter, and master warm low-pass filter sweep.
- **CRT Audio Visualizer**: Switchable dual, oscilloscope waveform, and frequency spectrum views.

## Running Locally
Because the project uses native ES modules (`<script type="module">`), serve the directory over a local HTTP server rather than opening `index.html` via `file://`:

```bash
npx serve .
# or
python3 -m http.server 8080
