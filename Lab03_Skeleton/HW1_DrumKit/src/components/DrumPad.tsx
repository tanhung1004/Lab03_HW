
import type { DrumPadDefinition } from "../types/drum";

interface DrumPadProps {
  pad: DrumPadDefinition;
  isPressed: boolean;
  onPadChange: (padId: string, isPressed: boolean) => void;
}

export default function DrumPad({
  pad,
  isPressed,
  onPadChange,
}: DrumPadProps) {
  return (
    <li className={`drum-card ${isPressed ? "is-pressed" : ""}`}>
      <button
        type="button"
        className="drum-button"
        aria-label={`${pad.name} drum, shortcut ${pad.keyLabel}`}
        aria-pressed={isPressed}

        onPointerDown={() => onPadChange(pad.id, true)}
        onPointerUp={() => onPadChange(pad.id, false)}
        onPointerLeave={() => onPadChange(pad.id, false)}
        onPointerCancel={() => onPadChange(pad.id, false)}

        onClick={(e) => {
          // Keyboard or assistive-technology activation.
          if (e.detail === 0) {
            onPadChange(pad.id, true);

            window.setTimeout(() => {
              onPadChange(pad.id, false);
            }, 120);
          }
        }}
      >
        <kbd className="drum-key">{pad.keyLabel}</kbd>
        <strong className="drum-name">{pad.name}</strong>
        <small className="drum-code">{pad.keyCode}</small>
      </button>
    </li>
  );
}
