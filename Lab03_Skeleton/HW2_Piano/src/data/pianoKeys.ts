
import type { PianoKeyData } from "../types/piano";

// Piano range: A0 (21) to C8 (108)
export const PIANO_START_MIDI = 21;
export const PIANO_END_MIDI = 108;
export const PIANO_KEY_COUNT = 88;

// 12 notes in one octave
export const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
] as const;

// Black key positions within an octave
const BLACK_KEY_POSITIONS = new Set([1, 3, 6, 8, 10]);

// Convert MIDI number to frequency (Hz)
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Generate one piano key from a MIDI number
export function createPianoKey(midi: number): PianoKeyData {
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;

  return {
    midi,
    noteName: `${NOTE_NAMES[noteIndex]}${octave}`,
    frequencyHz: midiToFrequency(midi),
    isBlack: BLACK_KEY_POSITIONS.has(noteIndex),
  };
}

// Generate all 88 keys automatically
export const pianoKeys: PianoKeyData[] = Array.from(
  { length: PIANO_KEY_COUNT },
  (_, index) => createPianoKey(PIANO_START_MIDI + index)
);
