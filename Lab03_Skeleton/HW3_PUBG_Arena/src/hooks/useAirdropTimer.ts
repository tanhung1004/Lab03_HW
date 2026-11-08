
import { useEffect, useState } from "react";

/**
 * HW3-05 — Zero-Drift Airdrop Timer
 *
 * Features:
 * - Calculate remaining time using Date.now().
 * - Avoid accumulated setInterval drift.
 * - Support server clock offset.
 * - Synchronize when browser tab becomes visible.
 * - Synchronize on window focus and pageshow.
 * - Pause interval while browser tab is hidden.
 * - Clean up timers and event listeners.
 */

interface AirdropTimerResult {
  remainingMs: number;
  isLive: boolean;
}

// Calculate remaining time using the actual clock.
function calculateRemaining(
  targetEpochMs: number,
  serverOffsetMs: number
): number {
  const currentTime = Date.now() + serverOffsetMs;

  return Math.max(0, targetEpochMs - currentTime);
}

export function useAirdropTimer(
  targetEpochMs: number,
  serverOffsetMs = 0
): AirdropTimerResult {
  const [remainingMs, setRemainingMs] = useState(() =>
    calculateRemaining(targetEpochMs, serverOffsetMs)
  );

  useEffect(() => {
    let intervalId: number | undefined;

    // Recalculate from the real clock.
    const synchronizeTimer = () => {
      setRemainingMs(
        calculateRemaining(targetEpochMs, serverOffsetMs)
      );
    };

    // Remove the current interval, if any.
    const stopInterval = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    // Start timer only while the page is visible.
    const startInterval = () => {
      stopInterval();
      synchronizeTimer();

      if (document.visibilityState === "visible") {
        intervalId = window.setInterval(
          synchronizeTimer,
          1000
        );
      }
    };

    // Handle switching between browser tabs.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startInterval();
      } else {
        stopInterval();
      }
    };

    // Synchronize when the browser regains focus.
    const handleFocus = () => {
      synchronizeTimer();
    };

    // Synchronize when the page is restored.
    const handlePageShow = () => {
      synchronizeTimer();
    };

    // Start the initial countdown.
    startInterval();

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);

    // Cleanup when component unmounts.
    return () => {
      stopInterval();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [targetEpochMs, serverOffsetMs]);

  return {
    remainingMs,
    isLive: remainingMs === 0,
  };
}
