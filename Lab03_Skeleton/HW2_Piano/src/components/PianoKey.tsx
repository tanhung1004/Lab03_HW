
import type { PianoKeyData } from "../types/piano";

interface PianoKeyProps {
  note: PianoKeyData;
  left: number;
  onPlayNote: (frequencyHz: number) => void;
}

export default function PianoKey({
  note,
  left,
  onPlayNote,
}: PianoKeyProps) {
  const showLabel =
    (!note.isBlack && note.noteName.startsWith("C")) ||
    note.noteName === "A0";

  return (
    <li
      className={`piano-key ${
        note.isBlack
          ? "piano-key--black"
          : "piano-key--white"
      }`}
      style={{ left }}
    >
      <button
        type="button"
        className="piano-key-button"
        aria-label={`Play ${note.noteName}`}
        title={`${note.noteName} - ${note.frequencyHz.toFixed(2)} Hz`}
        onClick={() => onPlayNote(note.frequencyHz)}
      >
        {showLabel && (
          <span className="piano-key-label" aria-hidden="true">
            {note.noteName}
          </span>
        )}
      </button>
    </li>
  );
}
