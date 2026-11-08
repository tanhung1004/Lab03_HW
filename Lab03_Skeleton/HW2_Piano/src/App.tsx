
import { useCallback, useEffect, useRef, useState } from "react";
import PianoKeyboard from "./components/PianoKeyboard";
import { pianoKeys, midiToFrequency } from "./data/pianoKeys";
import { PolyphonicSynth } from "./audio/PolyphonicSynth";
import type { RecordedNote } from "./types/piano";

export default function App() {
  const synthRef = useRef<PolyphonicSynth | null>(null);

  // FIFO test result from HW2-06.
  const [testResult, setTestResult] = useState("Not tested");

  // HW2-09: Recording state.
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);

  // Refs keep callbacks stable for React.memo.
  const recordingRef = useRef(false);
  const previousNoteTime = useRef<number | null>(null);
  const recordingQueue = useRef<RecordedNote[]>([]);

  const totalKeys = pianoKeys.length;
  const blackKeys = pianoKeys.filter((key) => key.isBlack).length;
  const whiteKeys = totalKeys - blackKeys;

  const getSynth = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new PolyphonicSynth();
    }

    return synthRef.current;
  }, []);

  // Start a new recording.
  const startRecording = () => {
    recordingQueue.current = [];
    previousNoteTime.current = null;

    setRecordedNotes([]);
    recordingRef.current = true;
    setIsRecording(true);
  };

  // Stop recording and keep the captured notes.
  const stopRecording = () => {
    recordingRef.current = false;
    setIsRecording(false);
  };

  // Play the piano and optionally record the note.
  const handlePlayNote = useCallback(
    (midi: number, frequencyHz: number) => {
      getSynth().playNote(frequencyHz);

      if (!recordingRef.current) return;

      const now = performance.now();
      const previous = previousNoteTime.current;

      // Time since the previous note started.
      const deltaMs =
        previous === null ? 0 : Math.round(now - previous);

      const note: RecordedNote = {
        midi,
        freqHz: frequencyHz,
        durationMs: 1500,
        deltaMs,
      };

      // FIFO: append notes in chronological order.
      recordingQueue.current.push(note);
      previousNoteTime.current = now;

      setRecordedNotes([...recordingQueue.current]);
    },
    [getSynth]
  );

  // Existing HW2-06 FIFO voice stealing test.
  const handleFifoTest = useCallback(() => {
    const synth = getSynth();

    synth.stopAll();

    const midiNotes = [60, 62, 64, 65, 67, 69, 71, 72, 74];
    const frequencies = midiNotes.map(midiToFrequency);

    frequencies.forEach((frequency) => {
      synth.playNote(frequency);
    });

    const active = synth.getActiveFrequencies();
    const expected = frequencies.slice(1);

    const passed =
      active.length === 8 &&
      active.every(
        (frequency, index) =>
          Math.abs(frequency - expected[index]) < 0.001
      );

    setTestResult(
      passed
        ? "PASS: 8 voices, oldest C4 removed."
        : "FAIL: FIFO voice stealing."
    );
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
        Play the piano or record a short melody.
      </p>

      {/* HW2-09: Note Recording */}
      <section className="recording-panel">
        <h2>Melody Recorder</h2>

        <div className="recording-controls">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording}
          >
            Start Recording
          </button>

          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording}
          >
            Stop Recording
          </button>
        </div>

        <output aria-live="polite">
          {isRecording
            ? `Recording... ${recordedNotes.length} notes`
            : `Recorded notes: ${recordedNotes.length}`}
        </output>

        <h3>Recorded Note Sequence (FIFO)</h3>

        {recordedNotes.length === 0 ? (
          <p>No notes recorded yet.</p>
        ) : (
          <ol className="recorded-notes">
            {recordedNotes.map((note, index) => (
              <li key={index}>
                MIDI {note.midi} |
                {" "}{note.freqHz.toFixed(2)} Hz |
                {" "}{note.durationMs} ms |
                {" "}Delta: {note.deltaMs} ms
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Keep the original FIFO test */}
      <section className="fifo-test">
        <h2>FIFO Voice Stealing Test</h2>

        <p>
          Play 9 notes. The oldest note should be stolen.
        </p>

        <button type="button" onClick={handleFifoTest}>
          Test 9-Note FIFO
        </button>

        <output aria-live="polite">{testResult}</output>
      </section>
    </main>
  );
}
