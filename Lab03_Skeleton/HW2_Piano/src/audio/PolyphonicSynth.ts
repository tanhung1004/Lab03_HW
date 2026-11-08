
interface PianoVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
}

export class PolyphonicSynth {
  private ctx: AudioContext | null = null;
  private activeVoice: PianoVoice | null = null;

  // HW2-05: Play one note at a time.
  playNote(frequencyHz: number): void {
    if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
      return;
    }

    // Create AudioContext on the first user interaction.
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }

    const ctx = this.ctx;

    if (ctx.state === "suspended") {
      void ctx.resume().catch(console.error);
    }

    // Release the previous note.
    this.releaseActiveVoice();

    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    // Generate a simple piano-like tone.
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequencyHz, now);

    // Short volume envelope to reduce clicking.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.45
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const voice: PianoVoice = { oscillator, gain };
    this.activeVoice = voice;

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();

      if (this.activeVoice === voice) {
        this.activeVoice = null;
      }
    };

    oscillator.start(now);
    oscillator.stop(now + 0.46);
  }

  private releaseActiveVoice(): void {
    if (!this.ctx || !this.activeVoice) return;

    const { gain } = this.activeVoice;
    const now = this.ctx.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0.0001, now, 0.01);

    this.activeVoice = null;
  }

  dispose(): void {
    this.releaseActiveVoice();

    const ctx = this.ctx;
    this.ctx = null;

    if (ctx && ctx.state !== "closed") {
      void ctx.close();
    }
  }
}
