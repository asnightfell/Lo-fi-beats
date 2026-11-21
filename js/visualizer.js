export class CRTVisualizer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;
    this.mode = 'dual'; // 'dual' | 'wave' | 'spec'
    this._render = this._render.bind(this);
    requestAnimationFrame(this._render);
  }

  setMode(mode) {
    this.mode = mode;
  }

  _render() {
    const { width, height } = this.canvas;
    const c = this.ctx;

    c.fillStyle = 'rgba(11, 19, 14, 0.36)';
    c.fillRect(0, 0, width, height);

    // Subtle CRT phosphor grid
    c.strokeStyle = 'rgba(74, 222, 128, 0.07)';
    c.lineWidth = 1;
    for (let x = 0; x < width; x += 28) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, height);
      c.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(width, y);
      c.stroke();
    }

    const analyser = this.engine.analyser;
    if (!analyser) {
      // Idle flatline
      c.strokeStyle = '#4ade80';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, height / 2);
      c.lineTo(width, height / 2);
      c.stroke();
      requestAnimationFrame(this._render);
      return;
    }

    if (this.mode === 'spec' || this.mode === 'dual') {
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);
      const bars = 48;
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        const val = freqData[i * 3] / 255;
        const barH = val * (height * 0.78);
        c.fillStyle = this.mode === 'dual'
          ? 'rgba(74, 222, 128, 0.22)'
          : 'rgba(74, 222, 128, 0.75)';
        c.fillRect(i * barWidth + 2, height - barH, barWidth - 4, barH);
      }
    }

    if (this.mode === 'wave' || this.mode === 'dual') {
      const timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);

      c.strokeStyle = '#4ade80';
      c.shadowColor = '#4ade80';
      c.shadowBlur = 8;
      c.lineWidth = 2;
      c.beginPath();

      const slice = width / timeData.length;
      let x = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
        x += slice;
      }
      c.stroke();
      c.shadowBlur = 0;
    }

    requestAnimationFrame(this._render);
  }
}
