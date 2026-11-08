
const sounds: Record<string, {
  frequency: number;
  duration: number;
  type: OscillatorType;
}> = {
  kick: { frequency: 90, duration: 0.4, type: "sine" },
  snare: { frequency: 180, duration: 0.2, type: "triangle" },
  "closed-hihat": { frequency: 800, duration: 0.08, type: "square" },
  "open-hihat": { frequency: 600, duration: 0.4, type: "square" },
  clap: { frequency: 400, duration: 0.12, type: "triangle" },
  tom: { frequency: 150, duration: 0.3, type: "sine" },
  crash: { frequency: 1000, duration: 0.7, type: "sawtooth" },
};

export class DrumAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private samples = new Float32Array(2048);

  play(padId: string) {
    const sound = sounds[padId];
    if (!sound) return;

    if (!this.ctx) {
      this.ctx = new AudioContext();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.connect(this.ctx.destination);
    }

    const ctx = this.ctx;
    const analyser = this.analyser;
    if (!analyser) return;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = sound.type;
    oscillator.frequency.setValueAtTime(sound.frequency, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + sound.duration
    );

    // Route audio through the analyser.
    oscillator.connect(gain);
    gain.connect(analyser);

    oscillator.start(now);
    oscillator.stop(now + sound.duration);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  getLevelDb(): number {
    if (!this.analyser || this.ctx?.state !== "running") {
      return -60;
    }

    // Read the real audio signal.
    this.analyser.getFloatTimeDomainData(this.samples);

    let sum = 0;
    for (const sample of this.samples) {
      sum += sample * sample;
    }

    const rms = Math.sqrt(sum / this.samples.length);
    const db = 20 * Math.log10(Math.max(rms, 0.000001));

    return Math.max(-60, Math.min(0, db));
  }

  dispose() {
    const ctx = this.ctx;
    this.ctx = null;

    this.analyser?.disconnect();
    this.analyser = null;

    if (ctx && ctx.state !== "closed") {
      void ctx.close();
    }
  }
}
