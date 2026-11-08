
import DrumPad from "./components/DrumPad";
import { drumPads } from "./data/drumPads";

export default function App() {
  return (
    <main className="starter-page">
      <h1>HW1 - Production Studio Drum Kit</h1>
      <p>Lab 03 - Drum Pad Structure</p>

      <h2>{drumPads.length} Drum Pads</h2>

      <ul>
        {drumPads.map((pad) => (
          <DrumPad key={pad.id} pad={pad} />
        ))}
      </ul>

      <p>Audio and keyboard controls: coming in later tasks.</p>
    </main>
  );
}
