
export type DrumKeyCode =
  | "KeyW"
  | "KeyA"
  | "KeyS"
  | "KeyD"
  | "KeyJ"
  | "KeyK"
  | "KeyL";

export interface DrumPadDefinition {
  readonly id: string;
  readonly name: string;
  readonly keyLabel: string;
  readonly keyCode: DrumKeyCode;
}
