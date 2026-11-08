
export class DrumAudioEngine {
  private ctx: AudioContext | null = null;

  play(padId: string) {
    // Browser requires a user gesture before playing audio.
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }

    const ctx = this.ctx;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // Basic drum sound configuration.
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

    const sound = sounds[padId];
    if (!sound) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = sound.type;
    oscillator.frequency.setValueAtTime(sound.frequency, now);

    // Gradually reduce volume to avoid abrupt clicks.
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + sound.duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + sound.duration);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  dispose() {
    const ctx = this.ctx;
    this.ctx = null;

    if (ctx && ctx.state !== "closed") {
      void ctx.close();
    }
  }
}
