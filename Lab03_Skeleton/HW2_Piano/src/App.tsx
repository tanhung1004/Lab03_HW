
import { useCallback, useEffect, useRef } from "react";
import PianoKeyboard from "./components/PianoKeyboard";
import { pianoKeys } from "./data/pianoKeys";
import { PolyphonicSynth } from "./audio/PolyphonicSynth";

export default function App() {
  const synthRef = useRef<PolyphonicSynth | null>(null);

  const totalKeys = pianoKeys.length;
  const blackKeys = pianoKeys.filter(
    (key) => key.isBlack
  ).length;
  const whiteKeys = totalKeys - blackKeys;

  // Play a note when a piano key is clicked.
  const handlePlayNote = useCallback(
    (frequencyHz: number) => {
      if (!synthRef.current) {
        synthRef.current = new PolyphonicSynth();
      }

      synthRef.current.playNote(frequencyHz);
    },
    []
  );

  // Clean up the AudioContext on unmount.
  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  return (
    <main className="piano-page">
      <header className="piano-header">
        <p className="piano-eyebrow">
          LAB 03 / HOMEWORK 02
        </p>

        <h1>Polyphonic Piano Studio</h1>
        <p>88-Key Digital Piano — A0 to C8</p>
      </header>

      <section aria-labelledby="piano-title">
        <h2 id="piano-title">Piano Keyboard</h2>

        <div className="piano-stats">
          <span>Total: {totalKeys}</span>
          <span>White: {whiteKeys}</span>
          <span>Black: {blackKeys}</span>
        </div>

        <PianoKeyboard onPlayNote={handlePlayNote} />
      </section>

      <p className="piano-note">
        Click a piano key to play its sound.
        Polyphonic audio will be added in HW2-06.
      </p>
    </main>
  );
}
