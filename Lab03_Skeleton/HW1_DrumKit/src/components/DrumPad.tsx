
import type { DrumPadDefinition } from "../types/drum";

interface DrumPadProps {
  pad: DrumPadDefinition;
}

export default function DrumPad({ pad }: DrumPadProps) {
  return (
    <li className="drum-card">
      <kbd className="drum-key">{pad.keyLabel}</kbd>
      <strong className="drum-name">{pad.name}</strong>
      <small className="drum-code">{pad.keyCode}</small>
    </li>
  );
}
