
import { useCallback, useEffect, useRef, useState } from "react";
import PianoKeyboard from "./components/PianoKeyboard";
import { pianoKeys, midiToFrequency } from "./data/pianoKeys";
import { PolyphonicSynth } from "./audio/PolyphonicSynth";

export default function App() {
  const synthRef = useRef<PolyphonicSynth | null>(null);
  const [testResult, setTestResult] = useState("Not tested");

  const totalKeys = pianoKeys.length;
  const blackKeys = pianoKeys.filter((key) => key.isBlack).length;
  const whiteKeys = totalKeys - blackKeys;

  // Reuse one synthesizer.
  const getSynth = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new PolyphonicSynth();
    }

    return synthRef.current;
  }, []);

  const handlePlayNote = useCallback(
    (frequencyHz: number) => {
      getSynth().playNote(frequencyHz);
    },
    [getSynth]
  );

  // Test: play 9 notes and verify FIFO stealing.
  const handleFifoTest = useCallback(() => {
    const synth = getSynth();

    // Start with an empty voice collection.
    synth.stopAll();

    const midiNotes = [60, 62, 64, 65, 67, 69, 71, 72, 74];
    const frequencies = midiNotes.map(midiToFrequency);

    frequencies.forEach((frequency) => {
      synth.playNote(frequency);
    });

    const active = synth.getActiveFrequencies();

    // The first note (C4) should have been removed.
    const expected = frequencies.slice(1);

    const passed =
      active.length === 8 &&
      active.every(
        (frequency, index) =>
          Math.abs(frequency - expected[index]) < 0.001
      );

    setTestResult(
      passed
        ? "PASS: 8 active voices. Oldest C4 removed, D5 added."
        : "FAIL: FIFO voice stealing did not match expectations."
    );

    console.log("FIFO Test:", {
      requestedNotes: 9,
      activeVoiceCount: synth.getActiveVoiceCount(),
      activeFrequencies: active,
      passed,
    });
  }, [getSynth]);

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
        Click piano keys to play multiple notes.
        Maximum polyphony: 8 voices.
      </p>

      <section className="fifo-test">
        <h2>FIFO Voice Stealing Test</h2>

        <p>
          Play 9 notes. The oldest note should be stolen.
        </p>

        <button type="button" onClick={handleFifoTest}>
          Test 9-Note FIFO
        </button>

        <output aria-live="polite">
          {testResult}
        </output>
      </section>
    </main>
  );
}
