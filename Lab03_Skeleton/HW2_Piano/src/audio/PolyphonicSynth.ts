
interface PianoVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
  frequencyHz: number;
  startAt: number;
}

const MAX_VOICES = 8;
const ATTACK_TIME = 0.015;
const RELEASE_TIME = 0.04;
const NOTE_DURATION = 1.5;

export class PolyphonicSynth {
  private ctx: AudioContext | null = null;
  private voices = new Map<number, PianoVoice>();
  private nextVoiceId = 0;

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

    let startAt = ctx.currentTime;

    // FIFO: release the oldest voice when reaching 8 voices.
    if (this.voices.size >= MAX_VOICES) {
      const oldestId = this.voices.keys().next().value;

      if (oldestId !== undefined) {
        // Wait until the old voice finishes its release.
        startAt = this.releaseVoice(oldestId);
      }
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequencyHz, startAt);

    // Attack: gradually increase the volume.
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(
      0.08,
      startAt + ATTACK_TIME
    );

    // Natural decay.
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startAt + NOTE_DURATION
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const voiceId = ++this.nextVoiceId;

    this.voices.set(voiceId, {
      oscillator,
      gain,
      frequencyHz,
      startAt,
    });

    // Disconnect nodes after the oscillator ends.
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.voices.delete(voiceId);
    };

    oscillator.start(startAt);
    oscillator.stop(startAt + NOTE_DURATION + 0.01);
  }

  // Release a voice smoothly before stopping it.
  private releaseVoice(voiceId: number): number {
    const voice = this.voices.get(voiceId);
    const ctx = this.ctx;

    if (!voice || !ctx) {
      return ctx?.currentTime ?? 0;
    }

    this.voices.delete(voiceId);

    const releaseStart = Math.max(
      ctx.currentTime,
      voice.startAt
    );
    const releaseEnd = releaseStart + RELEASE_TIME;

    // Keep the current gain value before fading.
    voice.gain.gain.cancelAndHoldAtTime(releaseStart);

    voice.gain.gain.linearRampToValueAtTime(
      0.0001,
      releaseEnd
    );

    voice.oscillator.stop(releaseEnd + 0.005);

    return releaseEnd + 0.005;
  }

  stopAll(): void {
    for (const voiceId of Array.from(this.voices.keys())) {
      this.releaseVoice(voiceId);
    }
  }

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
    const ctx = this.ctx;
    if (!ctx) return;

    this.stopAll();
    this.ctx = null;

    // Let release envelopes finish before closing audio.
    window.setTimeout(() => {
      if (ctx.state !== "closed") {
        void ctx.close().catch(console.error);
      }
    }, 100);
  }
}
