
interface PianoVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
  frequencyHz: number;
  startAt: number;
}

// Piano audio configuration
const MAX_VOICES = 8;
const ATTACK_TIME = 0.015; // 15ms
const RELEASE_TIME = 0.04; // 40ms
const DEFAULT_DURATION_MS = 1500;
const MIN_DURATION = 0.08;
const MIN_GAIN = 0.0001;
const MAX_GAIN = 0.08;

export class PolyphonicSynth {
  private ctx: AudioContext | null = null;

  // ES6 Map preserves FIFO insertion order.
  private voices = new Map<number, PianoVoice>();
  private nextVoiceId = 0;

  // Play a note with an optional duration in milliseconds.
  // HW2-10: durationMs supports variable-speed replay.
  playNote(
    frequencyHz: number,
    durationMs = DEFAULT_DURATION_MS
  ): void {
    // Validate audio parameters.
    if (
      !Number.isFinite(frequencyHz) ||
      frequencyHz <= 0 ||
      !Number.isFinite(durationMs)
    ) {
      return;
    }

    // Initialize AudioContext on first interaction.
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }

    const ctx = this.ctx;

    // Resume audio if the browser suspended it.
    if (ctx.state === "suspended") {
      void ctx.resume().catch(console.error);
    }

    // Convert milliseconds into seconds.
    const noteDuration = Math.max(
      MIN_DURATION,
      durationMs / 1000
    );

    let startAt = ctx.currentTime;

    // HW2-06: FIFO voice stealing.
    // Release the oldest voice when 8 voices are active.
    if (this.voices.size >= MAX_VOICES) {
      const oldestId = this.voices.keys().next().value;

      if (oldestId !== undefined) {
        startAt = this.releaseVoice(oldestId);
      }
    }

    // Create audio nodes.
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      frequencyHz,
      startAt
    );

    // HW2-07: Smooth attack envelope.
    gain.gain.setValueAtTime(MIN_GAIN, startAt);

    gain.gain.linearRampToValueAtTime(
      MAX_GAIN,
      startAt + ATTACK_TIME
    );

    // HW2-10: Decay depends on noteDuration.
    gain.gain.exponentialRampToValueAtTime(
      MIN_GAIN,
      startAt + noteDuration
    );

    // Connect oscillator to speakers.
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    // Give every voice a unique ID.
    const voiceId = ++this.nextVoiceId;

    this.voices.set(voiceId, {
      oscillator,
      gain,
      frequencyHz,
      startAt,
    });

    // Clean up audio nodes after playback ends.
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();

      this.voices.delete(voiceId);
    };

    // Schedule note playback.
    oscillator.start(startAt);
    oscillator.stop(startAt + noteDuration + 0.01);
  }

  // HW2-07: Smoothly release an active voice.
  private releaseVoice(voiceId: number): number {
    const voice = this.voices.get(voiceId);
    const ctx = this.ctx;

    if (!voice || !ctx) {
      return ctx?.currentTime ?? 0;
    }

    // Remove from active voice tracking.
    this.voices.delete(voiceId);

    const releaseStart = Math.max(
      ctx.currentTime,
      voice.startAt
    );

    const releaseEnd = releaseStart + RELEASE_TIME;

    // Preserve current gain before releasing.
    voice.gain.gain.cancelAndHoldAtTime(releaseStart);

    // Fade out smoothly to avoid audio popping.
    voice.gain.gain.linearRampToValueAtTime(
      MIN_GAIN,
      releaseEnd
    );

    // Stop oscillator after release.
    voice.oscillator.stop(releaseEnd + 0.005);

    return releaseEnd + 0.005;
  }

  // Stop all currently tracked voices.
  stopAll(): void {
    const voiceIds = Array.from(this.voices.keys());

    for (const voiceId of voiceIds) {
      this.releaseVoice(voiceId);
    }
  }

  // Return the current number of active voices.
  getActiveVoiceCount(): number {
    return this.voices.size;
  }

  // Return active note frequencies in FIFO order.
  getActiveFrequencies(): number[] {
    return Array.from(
      this.voices.values(),
      (voice) => voice.frequencyHz
    );
  }

  // Release voices and close AudioContext.
  dispose(): void {
    const ctx = this.ctx;

    if (!ctx) return;

    this.stopAll();
    this.ctx = null;

    // Allow release envelopes to finish before closing.
    window.setTimeout(() => {
      if (ctx.state !== "closed") {
        void ctx.close().catch(console.error);
      }
    }, 100);
  }
}
