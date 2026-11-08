
import { useCallback, useEffect, useRef, useState } from "react";
import DrumPad from "./components/DrumPad";
import { drumPads } from "./data/drumPads";
import { useDrumKeyboard } from "./hooks/useDrumKeyboard";
import { DrumAudioEngine } from "./audio/DrumAudioEngine";

const padMap = new Map(
  drumPads.map((pad) => [pad.keyCode, pad.id])
);

interface DrumHit {
  id: number;
  name: string;
  key: string;
  time: string;
}

export default function App() {
  const [pressedPads, setPressedPads] = useState<Set<string>>(
    () => new Set()
  );

  const [hits, setHits] = useState<DrumHit[]>([]);
  const [levelDb, setLevelDb] = useState(-60);

  const audioEngine = useRef<DrumAudioEngine | null>(null);
  const activePads = useRef(new Set<string>());
  const hitCounter = useRef(0);

  // Update the audio meter and clean up resources.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const db = audioEngine.current?.getLevelDb() ?? -60;
      setLevelDb(db);
    }, 30);

    return () => {
      window.clearInterval(timer);
      audioEngine.current?.dispose();
      audioEngine.current = null;
    };
  }, []);

  const handlePadChange = useCallback(
    (padId: string, isPressed: boolean) => {
      const active = activePads.current;

      // Ignore duplicate press/release events.
      if (active.has(padId) === isPressed) return;

      if (isPressed) {
        const pad = drumPads.find((item) => item.id === padId);
        if (!pad) return;

        active.add(padId);

        if (!audioEngine.current) {
          audioEngine.current = new DrumAudioEngine();
        }

        audioEngine.current.play(padId);

        // Save up to 8 recent drum hits.
        setHits((previous) => [
          {
            id: ++hitCounter.current,
            name: pad.name,
            key: pad.keyLabel,
            time: new Date().toLocaleTimeString("vi-VN"),
          },
          ...previous,
        ].slice(0, 8));
      } else {
        active.delete(padId);
      }

      setPressedPads(new Set(active));
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
              onPadChange={handlePadChange}
            />
          ))}
        </ul>
      </section>

      <p className="drum-note">
        Press W A S D J K L to activate the pads.
      </p>

      <section className="studio-monitor" aria-label="Drum monitoring">
        <div className="monitor-panel">
          <h2>Audio Level</h2>

          <meter
            className="audio-meter"
            min={-60}
            max={0}
            value={levelDb}
            aria-label="Audio signal level in dBFS"
          />

          <p>{levelDb.toFixed(1)} dBFS</p>
        </div>

        <div className="monitor-panel">
          <h2>Hit History</h2>

          <output aria-live="polite" aria-atomic="true">
            {hits.length > 0
              ? `Latest hit: ${hits[0].name}`
              : "No hits yet."}
          </output>

          <ol className="hit-list">
            {hits.map((hit) => (
              <li key={hit.id}>
                {hit.time} — {hit.name} ({hit.key})
              </li>
            ))}
          </ol>
        </div>
      </section>

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
