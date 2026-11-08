
import { useCallback, useState } from "react";
import PianoKey from "./PianoKey";
import { pianoKeys } from "../data/pianoKeys";

const WHITE_KEY_WIDTH = 44;
const BLACK_KEY_WIDTH = 28;

interface PianoKeyboardProps {
  onPlayNote: (midi: number, frequencyHz: number) => void;
}

let whiteKeyCount = 0;

const positionedKeys = pianoKeys.map((note) => {
  if (note.isBlack) {
    return {
      note,
      left:
        whiteKeyCount * WHITE_KEY_WIDTH -
        BLACK_KEY_WIDTH / 2,
    };
  }

  const left = whiteKeyCount * WHITE_KEY_WIDTH;
  whiteKeyCount++;

  return { note, left };
});

export default function PianoKeyboard({
  onPlayNote,
}: PianoKeyboardProps) {
  const [activeKeys, setActiveKeys] = useState<Set<number>>(
    () => new Set()
  );

  // Stable callback so memoized keys can skip renders.
  const handlePressChange = useCallback(
    (midi: number, pressed: boolean) => {
      setActiveKeys((previous) => {
        if (previous.has(midi) === pressed) {
          return previous;
        }

        const next = new Set(previous);

        if (pressed) {
          next.add(midi);
        } else {
          next.delete(midi);
        }

        return next;
      });
    },
    []
  );

  return (
    <div
      className="piano-viewport"
      role="region"
      aria-label="88-key piano keyboard"
      tabIndex={0}
    >
      <ol
        className="piano-keyboard"
        style={{ width: whiteKeyCount * WHITE_KEY_WIDTH }}
      >
        {positionedKeys.map(({ note, left }) => (
          <PianoKey
            key={note.midi}
            note={note}
            left={left}
            isActive={activeKeys.has(note.midi)}
            onPlayNote={onPlayNote}
            onPressChange={handlePressChange}
          />
        ))}
      </ol>
    </div>
  );
}
