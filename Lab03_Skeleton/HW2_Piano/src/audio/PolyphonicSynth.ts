
interface PianoVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
  frequencyHz: number;
}

export class PolyphonicSynth {
  private ctx: AudioContext | null = null;

  // Map preserves insertion order for FIFO.
  private voices = new Map<number, PianoVoice>();
  private nextVoiceId = 0;

  private readonly MAX_VOICES = 8;

  playNote(frequencyHz: number): void {
    if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
      return;
    }

    if (!this.ctx) {
      this.ctx = new AudioContext();
    }

    const ctx = this.ctx;

    if (ctx.state === "suspended") {
      void ctx.resume().catch(console.error);
    }

    // If full, stop the oldest voice.
    if (this.voices.size >= this.MAX_VOICES) {
      const oldestId = this.voices.keys().next().value;

      if (oldestId !== undefined) {
        this.stopVoice(oldestId);
      }
    }

    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequencyHz, now);

    // Basic envelope, refined in HW2-07.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 1.5
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const voiceId = ++this.nextVoiceId;

    this.voices.set(voiceId, {
      oscillator,
      gain,
      frequencyHz,
    });

    // Remove naturally finished notes.
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.voices.delete(voiceId);
    };

    oscillator.start(now);
    oscillator.stop(now + 1.51);
  }

  private stopVoice(voiceId: number): void {
    const voice = this.voices.get(voiceId);

    if (!voice || !this.ctx) return;

    this.voices.delete(voiceId);

    const now = this.ctx.currentTime;

    // Immediate stop for the FIFO implementation.
    // Smooth voice release will be added in HW2-07.
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(0, now);

    try {
      voice.oscillator.stop(now);
    } catch {
      // Ignore if the oscillator has already stopped.
    }
  }

  stopAll(): void {
    for (const voiceId of Array.from(this.voices.keys())) {
      this.stopVoice(voiceId);
    }
  }

  // Public inspection methods for testing.
  getActiveVoiceCount(): number {
    return this.voices.size;
  }

  getActiveFrequencies(): number[] {
    return Array.from(
      this.voices.values(),
      (voice) => voice.frequencyHz
    );
  }

  dispose(): void {
    this.stopAll();

    const ctx = this.ctx;
    this.ctx = null;

    if (ctx && ctx.state !== "closed") {
      void ctx.close().catch(console.error);
    }
  }
}
