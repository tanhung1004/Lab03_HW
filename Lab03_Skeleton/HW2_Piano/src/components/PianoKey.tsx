
import type { PianoKeyData } from "../types/piano";

interface PianoKeyProps {
  note: PianoKeyData;
  left: number;
}

export default function PianoKey({ note, left }: PianoKeyProps) {
  const showLabel =
    (!note.isBlack && note.noteName.startsWith("C")) ||
    note.noteName === "A0";

  return (
    <li
      className={`piano-key ${
        note.isBlack ? "piano-key--black" : "piano-key--white"
      }`}
      style={{ left }}
      title={`${note.noteName} - ${note.frequencyHz.toFixed(2)} Hz`}
    >
      <span className="sr-only">
        {note.noteName}, {note.isBlack ? "black key" : "white key"}
      </span>

      {showLabel && (
        <span className="piano-key-label" aria-hidden="true">
          {note.noteName}
        </span>
      )}
    </li>
  );
}
