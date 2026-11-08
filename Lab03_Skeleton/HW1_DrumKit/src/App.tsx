
import { useCallback, useEffect, useRef, useState } from "react";
import DrumPad from "./components/DrumPad";
import { drumPads } from "./data/drumPads";
import { useDrumKeyboard } from "./hooks/useDrumKeyboard";
import { DrumAudioEngine } from "./audio/DrumAudioEngine";

// Map physical keyboard codes to drum pad IDs.
const padMap = new Map(
  drumPads.map((pad) => [pad.keyCode, pad.id])
);

export default function App() {
  // Track currently pressed drum pads.
  const [pressedPads, setPressedPads] = useState<Set<string>>(
    () => new Set()
  );

  // Keep one audio engine instance.
  const audioEngine = useRef<DrumAudioEngine | null>(null);

  // Clean up audio resources when the component unmounts.
  useEffect(() => {
    return () => {
      audioEngine.current?.dispose();
      audioEngine.current = null;
    };
  }, []);

  // Handle pressing and releasing drum pads.
  const handlePadChange = useCallback(
    (padId: string, isPressed: boolean) => {
      // Play a sound when a pad is pressed.
      if (isPressed) {
        if (!audioEngine.current) {
          audioEngine.current = new DrumAudioEngine();
        }

        audioEngine.current.play(padId);
      }

      // Update the visual state.
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

  // Enable keyboard controls.
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
              onPadChange={handlePadChange}
            />
          ))}
        </ul>
      </section>

      <p className="drum-note">
        Press W A S D J K L to activate the pads.
      </p>

      {/* Keyboard focus isolation test */}
      <div className="test-input">
        <label htmlFor="practice-note">
          Practice Note (Keyboard Focus Test)
        </label>

        <input
          id="practice-note"
          type="text"
          placeholder="Type W A S D J K L here..."
        />
      </div>
    </main>
  );
}
