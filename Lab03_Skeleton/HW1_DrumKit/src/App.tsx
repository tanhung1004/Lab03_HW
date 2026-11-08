
import DrumPad from "./components/DrumPad";
import { drumPads } from "./data/drumPads";

export default function App() {
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
            <DrumPad key={pad.id} pad={pad} />
          ))}
        </ul>
      </section>

      <p className="drum-note">
        Audio and keyboard controls coming soon.
      </p>
    </main>
  );
}
