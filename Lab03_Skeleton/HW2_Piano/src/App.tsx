
import PianoKeyboard from "./components/PianoKeyboard";
import { pianoKeys } from "./data/pianoKeys";

export default function App() {
  const totalKeys = pianoKeys.length;
  const blackKeys = pianoKeys.filter((key) => key.isBlack).length;
  const whiteKeys = totalKeys - blackKeys;

  return (
    <main className="piano-page">
      <header className="piano-header">
        <p className="piano-eyebrow">LAB 03 / HOMEWORK 02</p>

        <h1>Polyphonic Piano Studio</h1>

        <p>
          88-Key Digital Piano — A0 to C8
        </p>
      </header>

      <section aria-labelledby="piano-title">
        <h2 id="piano-title">Piano Keyboard</h2>

        <div className="piano-stats">
          <span>Total: {totalKeys}</span>
          <span>White: {whiteKeys}</span>
          <span>Black: {blackKeys}</span>
        </div>

        <PianoKeyboard />
      </section>

      <p className="piano-note">
        Scroll horizontally to explore all 88 keys.
        Audio playback will be added in the next tasks.
      </p>
    </main>
  );
}
