
import type { DrumPadDefinition } from "../types/drum";

interface DrumPadProps {
  pad: DrumPadDefinition;
  isPressed: boolean;
}

export default function DrumPad({
  pad,
  isPressed,
}: DrumPadProps) {
  return (
    <li className={`drum-card ${isPressed ? "is-pressed" : ""}`}>
      <kbd className="drum-key">{pad.keyLabel}</kbd>
      <strong className="drum-name">{pad.name}</strong>
      <small className="drum-code">{pad.keyCode}</small>
    </li>
  );
}
