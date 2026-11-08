
import type { DrumPadDefinition } from "../types/drum";

interface DrumPadProps {
  pad: DrumPadDefinition;
}

export default function DrumPad({ pad }: DrumPadProps) {
  return (
    <li>
      <strong>{pad.name}</strong>
      {" — "}
      <kbd>{pad.keyLabel}</kbd>
    </li>
  );
}
