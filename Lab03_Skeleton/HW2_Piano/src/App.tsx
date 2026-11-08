
import { useCallback, useEffect, useRef, useState } from "react";
import PianoKeyboard from "./components/PianoKeyboard";
import { pianoKeys, midiToFrequency } from "./data/pianoKeys";
import { PolyphonicSynth } from "./audio/PolyphonicSynth";
import type { RecordedNote } from "./types/piano";

type ReplaySpeed = 0.5 | 1 | 2;

// HW2-11: Create an abortable delay.
function waitWithAbort(
  ms: number,
  signal: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Replay stopped", "AbortError"));
      return;
    }

    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, Math.max(0, ms));

    const onAbort = () => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);

      reject(new DOMException("Replay stopped", "AbortError"));
    };

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export default function App() {
  const synthRef = useRef<PolyphonicSynth | null>(null);

  // HW2-06: FIFO voice stealing test.
  const [testResult, setTestResult] = useState("Not tested");

  // HW2-09: Recording.
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);

  const recordingRef = useRef(false);
  const recordingQueue = useRef<RecordedNote[]>([]);
  const previousNoteTime = useRef<number | null>(null);

  // HW2-10/11: Replay and cancellation.
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayStatus, setReplayStatus] = useState("Not played yet.");

  const playingRef = useRef(false);
  const replayController = useRef<AbortController | null>(null);

  // Piano statistics.
  const totalKeys = pianoKeys.length;
  const blackKeys = pianoKeys.filter((key) => key.isBlack).length;
  const whiteKeys = totalKeys - blackKeys;

  // Reuse a single AudioContext through the synth.
  const getSynth = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new PolyphonicSynth();
    }

    return synthRef.current;
  }, []);

  // Start recording a new melody.
  const startRecording = () => {
    if (playingRef.current || recordingRef.current) return;

    synthRef.current?.stopAll();

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

  // Play a piano note and record it when recording is enabled.
  const handlePlayNote = useCallback(
    (midi: number, frequencyHz: number) => {
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

  // HW2-10/11: Replay with AbortController support.
  const replaySequence = useCallback(
    async (speed: ReplaySpeed) => {
      if (
        playingRef.current ||
        recordingRef.current ||
        recordingQueue.current.length === 0
      ) {
        return;
      }

      const sequence = [...recordingQueue.current];

      const controller = new AbortController();
      replayController.current = controller;
      playingRef.current = true;

      setIsPlaying(true);
      setReplayStatus(`Playing at ${speed.toFixed(1)}x...`);

      const synth = getSynth();
      synth.stopAll();

      try {
        // Replay each recorded note in FIFO order.
        for (const note of sequence) {
          // First note has deltaMs = 0.
          if (note.deltaMs > 0) {
            await waitWithAbort(
              note.deltaMs / speed,
              controller.signal
            );
          }

          if (controller.signal.aborted) {
            throw new DOMException("Replay stopped", "AbortError");
          }

          synth.playNote(
            note.freqHz,
            note.durationMs / speed
          );
        }

        // Wait for the last note to finish.
        const last = sequence[sequence.length - 1];

        await waitWithAbort(
          last.durationMs / speed + 60,
          controller.signal
        );

        if (
          !controller.signal.aborted &&
          replayController.current === controller
        ) {
          setReplayStatus(
            `Replay completed at ${speed.toFixed(1)}x.`
          );
        }
      } catch (error) {
        // Ignore errors from an already cancelled session.
        if (replayController.current === controller) {
          if (controller.signal.aborted) {
            setReplayStatus("Sequence stopped.");
          } else {
            console.error("Replay failed:", error);
            synth.stopAll();
            setReplayStatus("Replay failed.");
          }
        }
      } finally {
        // A previous session must not reset a newer session.
        if (replayController.current === controller) {
          replayController.current = null;
          playingRef.current = false;
          setIsPlaying(false);
        }
      }
    },
    [getSynth]
  );

  // HW2-11: Stop pending tasks and active audio.
  const stopSequence = useCallback(() => {
    const controller = replayController.current;
    if (!controller) return;

    // Reject pending delay promises immediately.
    controller.abort();

    replayController.current = null;
    playingRef.current = false;

    // Smoothly release all active voices.
    synthRef.current?.stopAll();

    setIsPlaying(false);
    setReplayStatus("Sequence stopped by user.");
  }, []);

  // HW2-06: Keep the FIFO voice-stealing test.
  const handleFifoTest = useCallback(() => {
    if (playingRef.current || recordingRef.current) return;

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

    console.log("FIFO test:", {
      activeVoiceCount: synth.getActiveVoiceCount(),
      activeFrequencies: active,
      passed,
    });
  }, [getSynth]);

  // HW2-11: Cleanup when the component unmounts.
  useEffect(() => {
    return () => {
      replayController.current?.abort();
      replayController.current = null;

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
        Record your melody and replay it at different speeds.
      </p>

      {/* Recording panel */}
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

        {/* Replay controls */}
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

            {/* HW2-11: Stop Sequence */}
            <button
              type="button"
              className="stop-sequence"
              disabled={!isPlaying}
              onClick={stopSequence}
            >
              Stop Sequence
            </button>
          </div>

          <output role="status" aria-live="polite">
            {replayStatus}
          </output>
        </div>
      </section>

      {/* FIFO test panel */}
      <section className="fifo-test">
        <h2>FIFO Voice Stealing Test</h2>

        <p>
          Play 9 notes. The oldest note should be stolen.
        </p>

        <button
          type="button"
          onClick={handleFifoTest}
          disabled={isPlaying || isRecording}
        >
          Test 9-Note FIFO
        </button>

        <output aria-live="polite">
          {testResult}
        </output>
      </section>
    </main>
  );
}
