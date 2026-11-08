
import { useEffect, useState } from "react";

/**
 * HW3-06 — Zero-Drift Airdrop Timer
 *
 * - Calculates time using Date.now().
 * - Supports optional server offset.
 * - Synchronizes on tab visibility changes.
 * - Synchronizes on focus and pageshow.
 * - Keeps the current time updating after
 *   countdown reaches zero.
 * - Cleans up timers and event listeners.
 */

interface AirdropTimerResult {
  remainingMs: number;
  isLive: boolean;
  nowMs: number;
}

export function useAirdropTimer(
  targetEpochMs: number,
  serverOffsetMs = 0
): AirdropTimerResult {
  const [nowMs, setNowMs] = useState(
    () => Date.now() + serverOffsetMs
  );

  useEffect(() => {
    let intervalId: number | undefined;

    // Always read the real clock, not interval counts.
    const synchronizeTimer = () => {
      setNowMs(Date.now() + serverOffsetMs);
    };

    const stopInterval = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

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

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startInterval();
      } else {
        stopInterval();
      }
    };

    const handleFocus = () => {
      synchronizeTimer();
    };

    const handlePageShow = () => {
      startInterval();
    };

    // Initial synchronization.
    startInterval();

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      stopInterval();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );

      window.removeEventListener(
        "pageshow",
        handlePageShow
      );
    };
  }, [targetEpochMs, serverOffsetMs]);

  const remainingMs = Math.max(
    0,
    targetEpochMs - nowMs
  );

  return {
    remainingMs,
    isLive: remainingMs === 0,
    nowMs,
  };
}
