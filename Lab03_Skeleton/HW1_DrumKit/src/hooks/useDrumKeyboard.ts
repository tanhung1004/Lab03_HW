
import { useEffect } from "react";

export function useDrumKeyboard(
  padMap: ReadonlyMap<string, string>,
  onPadChange: (padId: string, isPressed: boolean) => void,
  isEnabled = true
) {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const padId = padMap.get(e.code);

      if (padId) {
        onPadChange(padId, true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const padId = padMap.get(e.code);

      if (padId) {
        onPadChange(padId, false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [padMap, onPadChange, isEnabled]);
}
