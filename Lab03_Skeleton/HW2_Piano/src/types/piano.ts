
export interface PianoKeyData {
  readonly midi: number;
  readonly noteName: string;
  readonly frequencyHz: number;
  readonly isBlack: boolean;
}

// Data structure for future recording features.
export interface RecordedNote {
  readonly midi: number;
  readonly freqHz: number;
  readonly durationMs: number;
  readonly deltaMs: number;
}
