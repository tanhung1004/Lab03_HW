
import { useEffect, useState } from "react";

// Calculate remaining time based on the actual clock.
// This avoids accumulated setInterval drift.
function calculateRemaining(
  targetEpochMs: number,
  serverOffsetMs: number
): number {
  return Math.max(
    0,
    targetEpochMs - (Date.now() + serverOffsetMs)
  );
}

export function usePubgAirdropTimer(
  targetEpochMs: number,
  serverOffsetMs = 0
) {
  const [remainingMs, setRemainingMs] = useState(() =>
    calculateRemaining(targetEpochMs, serverOffsetMs)
  );

  useEffect(() => {
    const updateCountdown = () => {
      setRemainingMs(
        calculateRemaining(targetEpochMs, serverOffsetMs)
      );
    };

    // Synchronize immediately when target or offset changes.
    updateCountdown();

    // Refresh the displayed countdown every second.
    const timerId = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [targetEpochMs, serverOffsetMs]);

  return {
    remainingMs,
    isLive: remainingMs === 0,
  };
}
