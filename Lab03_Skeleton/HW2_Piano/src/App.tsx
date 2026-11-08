
import { useCallback, useEffect, useRef, useState } from "react";
import PianoKeyboard from "./components/PianoKeyboard";
import { pianoKeys, midiToFrequency } from "./data/pianoKeys";
import { PolyphonicSynth } from "./audio/PolyphonicSynth";
import type { RecordedNote } from "./types/piano";

type ReplaySpeed = 0.5 | 1 | 2;

// Wait asynchronously between recorded notes.
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, ms));
  });

export default function App() {
  const synthRef = useRef<PolyphonicSynth | null>(null);

  const [testResult, setTestResult] = useState("Not tested");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);

  // HW2-10: Replay state.
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayStatus, setReplayStatus] = useState("Not played yet.");

  const recordingRef = useRef(false);
  const recordingQueue = useRef<RecordedNote[]>([]);
  const previousNoteTime = useRef<number | null>(null);

  const playingRef = useRef(false);
  const replaySession = useRef(0);

  const totalKeys = pianoKeys.length;
  const blackKeys = pianoKeys.filter((key) => key.isBlack).length;
  const whiteKeys = totalKeys - blackKeys;

  const getSynth = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new PolyphonicSynth();
    }
    return synthRef.current;
  }, []);

  // HW2-09: Recording.
  const startRecording = () => {
    if (playingRef.current) return;

    recordingQueue.current = [];
    previousNoteTime.current = null;
    recordingRef.current = true;

    setRecordedNotes([]);
    setIsRecording(true);
    setReplayStatus("Not played yet.");
  };

  const stopRecording = () => {
    recordingRef.current = false;
    setIsRecording(false);
  };

  const handlePlayNote = useCallback(
    (midi: number, frequencyHz: number) => {
      // Avoid mixing manual notes with sequence replay.
      if (playingRef.current) return;

      getSynth().playNote(frequencyHz);

      if (!recordingRef.current) return;

      const now = performance.now();
      const previous = previousNoteTime.current;

      const note: RecordedNote = {
        midi,
        freqHz: frequencyHz,
        durationMs: 1500,
        deltaMs:
          previous === null ? 0 : Math.round(now - previous),
      };

      recordingQueue.current.push(note);
      previousNoteTime.current = now;

      setRecordedNotes([...recordingQueue.current]);
    },
    [getSynth]
  );

  // HW2-10: Asynchronous FIFO sequence replay.
  const replaySequence = useCallback(
    async (speed: ReplaySpeed) => {
      if (
        playingRef.current ||
        recordingRef.current ||
        recordingQueue.current.length === 0
      ) {
        return;
      }

      // Snapshot the FIFO queue before replay.
      const sequence = [...recordingQueue.current];

      playingRef.current = true;
      setIsPlaying(true);
      setReplayStatus(`Playing at ${speed}x speed...`);

      const session = ++replaySession.current;
      const synth = getSynth();

      // Clear any notes left from manual playback.
      synth.stopAll();

      try {
        for (const note of sequence) {
          // Apply playback speed to recorded timing.
          await delay(note.deltaMs / speed);

          // Do not continue after component cleanup.
          if (session !== replaySession.current) return;

          synth.playNote(
            note.freqHz,
            note.durationMs / speed
          );
        }

        // Let the last scheduled note finish.
        const lastDuration =
          sequence[sequence.length - 1].durationMs / speed;

        await delay(lastDuration);

        if (session === replaySession.current) {
          setReplayStatus(`Replay completed at ${speed}x.`);
        }
      } catch (error) {
        console.error("Replay failed:", error);

        if (session === replaySession.current) {
          setReplayStatus("Replay failed.");
        }
      } finally {
        if (session === replaySession.current) {
          playingRef.current = false;
          setIsPlaying(false);
        }
      }
    },
    [getSynth]
  );

  // Existing FIFO voice stealing test.
  const handleFifoTest = useCallback(() => {
    if (playingRef.current) return;

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
        (freq, index) =>
          Math.abs(freq - expected[index]) < 0.001
      );

    setTestResult(
      passed
        ? "PASS: 8 voices, oldest C4 removed."
        : "FAIL: FIFO voice stealing."
    );
  }, [getSynth]);

  useEffect(() => {
    return () => {
      // Prevent pending replay from playing more notes.
      replaySession.current++;
      playingRef.current = false;
      recordingRef.current = false;

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
        Record a melody and replay it at different speeds.
      </p>

      <section className="recording-panel">
        <h2>Melody Recorder</h2>

        <div className="recording-controls">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording || isPlaying}
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

        {/* HW2-10: Variable speed replay */}
        <div className="replay-panel">
          <h3>Replay Sequence</h3>

          <div className="replay-controls">
            {([0.5, 1, 2] as ReplaySpeed[]).map((speed) => (
              <button
                type="button"
                key={speed}
                disabled={
                  isRecording ||
                  isPlaying ||
                  recordedNotes.length === 0
                }
                onClick={() => void replaySequence(speed)}
              >
                Replay {speed.toFixed(1)}x
              </button>
            ))}
          </div>

          <output role="status" aria-live="polite">
            {replayStatus}
          </output>
        </div>
      </section>

      <section className="fifo-test">
        <h2>FIFO Voice Stealing Test</h2>
        <p>Play 9 notes. The oldest note should be stolen.</p>

        <button
          type="button"
          onClick={handleFifoTest}
          disabled={isPlaying}
        >
          Test 9-Note FIFO
        </button>

        <output aria-live="polite">{testResult}</output>
      </section>
    </main>
  );
}
