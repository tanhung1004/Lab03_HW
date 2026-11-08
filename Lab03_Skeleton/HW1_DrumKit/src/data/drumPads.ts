
import type { DrumPadDefinition } from "../types/drum";

export const drumPads: DrumPadDefinition[] = [
  { id: "kick", name: "Kick", keyLabel: "W", keyCode: "KeyW" },
  { id: "snare", name: "Snare", keyLabel: "A", keyCode: "KeyA" },
  { id: "closed-hihat", name: "Closed Hi-Hat", keyLabel: "S", keyCode: "KeyS" },
  { id: "open-hihat", name: "Open Hi-Hat", keyLabel: "D", keyCode: "KeyD" },
  { id: "clap", name: "Clap", keyLabel: "J", keyCode: "KeyJ" },
  { id: "tom", name: "Tom", keyLabel: "K", keyCode: "KeyK" },
  { id: "crash", name: "Crash", keyLabel: "L", keyCode: "KeyL" },
];
