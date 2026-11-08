
import { useCallback, useState } from "react";
import DrumPad from "./components/DrumPad";
import { drumPads } from "./data/drumPads";
import { useDrumKeyboard } from "./hooks/useDrumKeyboard";

// Map: KeyW -> kick, KeyA -> snare, ...
const padMap = new Map(
  drumPads.map((pad) => [pad.keyCode, pad.id])
);

export default function App() {
  const [pressedPads, setPressedPads] = useState<Set<string>>(
    () => new Set()
  );

  const handlePadChange = useCallback(
    (padId: string, isPressed: boolean) => {
      setPressedPads((previous) => {
        if (previous.has(padId) === isPressed) {
          return previous;
        }

        const next = new Set(previous);

        if (isPressed) {
          next.add(padId);
        } else {
          next.delete(padId);
        }

        return next;
      });
    },
    []
  );

  useDrumKeyboard(padMap, handlePadChange);

  return (
    <main className="drum-studio">
      <header className="drum-header">
        <p className="drum-label">LAB 03 / HOMEWORK 01</p>
        <h1>Production Studio</h1>
        <p>Interactive Drum Kit</p>
      </header>

      <section aria-labelledby="drum-title">
        <h2 id="drum-title">{drumPads.length} Drum Pads</h2>

        <ul className="drum-grid">
          {drumPads.map((pad) => (
            <DrumPad
              key={pad.id}
              pad={pad}
              isPressed={pressedPads.has(pad.id)}
            />
          ))}
        </ul>
      </section>

      <p className="drum-note">
        Press W A S D J K L to activate the pads.
      </p>
    </main>
  );
}
