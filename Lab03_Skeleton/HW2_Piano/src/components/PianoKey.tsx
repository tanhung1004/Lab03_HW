
import { memo } from "react";
import type { PianoKeyData } from "../types/piano";

interface PianoKeyProps {
  note: PianoKeyData;
  left: number;
  isActive: boolean;
  onPlayNote: (midi: number, frequencyHz: number) => void;
  onPressChange: (midi: number, pressed: boolean) => void;
}

function PianoKey({
  note,
  left,
  isActive,
  onPlayNote,
  onPressChange,
}: PianoKeyProps) {
  const showLabel =
    (!note.isBlack && note.noteName.startsWith("C")) ||
    note.noteName === "A0";

  return (
    <li
      className={`piano-key ${
        note.isBlack ? "piano-key--black" : "piano-key--white"
      }`}
      style={{ left }}
    >
      <button
        type="button"
        className={`piano-key-button ${
          isActive ? "is-active" : ""
        }`}
        aria-label={`Play ${note.noteName}`}
        title={`${note.noteName} - ${note.frequencyHz.toFixed(2)} Hz`}
        onClick={() => onPlayNote(note.midi, note.frequencyHz)}
        onPointerDown={(e) => {
          if (e.button === 0) {
            onPressChange(note.midi, true);
          }
        }}
        onPointerUp={() => onPressChange(note.midi, false)}
        onPointerLeave={() => onPressChange(note.midi, false)}
        onPointerCancel={() => onPressChange(note.midi, false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onPressChange(note.midi, true);
          }
        }}
        onKeyUp={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onPressChange(note.midi, false);
          }
        }}
        onBlur={() => onPressChange(note.midi, false)}
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

// Skip rendering when props have not changed.
export default memo(PianoKey);
