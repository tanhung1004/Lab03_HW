
// Standard 88-key piano range: A0 to C8.
export const PIANO_START_MIDI = 21;
export const PIANO_END_MIDI = 108;
export const PIANO_KEY_COUNT =
  PIANO_END_MIDI - PIANO_START_MIDI + 1;

// Standard note names in one octave.
export const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
] as const;

// Equal temperament tuning: A4 = 440 Hz.
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
