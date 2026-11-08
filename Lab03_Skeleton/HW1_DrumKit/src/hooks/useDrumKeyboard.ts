
import { useEffect } from "react";

export function useDrumKeyboard(
  padMap: ReadonlyMap<string, string>,
  onPadChange: (padId: string, isPressed: boolean) => void,
  isEnabled = true
) {
  useEffect(() => {
    if (!isEnabled) return;

    // Keep track of currently pressed physical keys.
    const pressedCodes = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;

      // Ignore shortcuts when typing in editable fields.
      if (target instanceof HTMLElement) {
        const tag = target.tagName;

        if (
          ["INPUT", "TEXTAREA", "SELECT"].includes(tag) ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Prevent OS auto-repeat and browser shortcuts.
      if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      const padId = padMap.get(e.code);

      // Ignore unsupported or already pressed keys.
      if (!padId || pressedCodes.has(e.code)) {
        return;
      }

      e.preventDefault();

      pressedCodes.add(e.code);
      onPadChange(padId, true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Always allow key release, even if focus has moved.
      if (!pressedCodes.has(e.code)) return;

      pressedCodes.delete(e.code);

      const padId = padMap.get(e.code);

      if (padId) {
        onPadChange(padId, false);
      }
    };

    // Prevent a stuck pad when the browser loses focus.
    const releaseAll = () => {
      for (const code of pressedCodes) {
        const padId = padMap.get(code);

        if (padId) {
          onPadChange(padId, false);
        }
      }

      pressedCodes.clear();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        releaseAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", releaseAll);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [padMap, onPadChange, isEnabled]);
}
