
import type {
  DropPhase,
  PubgCrateDrop,
} from "../types/arena";

/**
 * HW3-06 — Airdrop Phase State Machine
 *
 * Each demo airdrop remains open for 15 minutes.
 * The phase is derived from time and remaining stock.
 */

export const DROP_LIVE_DURATION_MS = 15 * 60 * 1000;

/**
 * Phase rules:
 *
 * Before opening time         -> WARMUP
 * After event closing time     -> EXPIRED
 * During event, zero stock     -> LOOTED_OUT
 * During event, stock > 0      -> AIRDROP_LIVE
 */
export function getDropPhase(
  drop: PubgCrateDrop,
  nowEpochMs: number
): DropPhase {
  const opensAt = drop.dropEpochMs;
  const closesAt = opensAt + DROP_LIVE_DURATION_MS;

  if (nowEpochMs < opensAt) {
    return "WARMUP";
  }

  if (nowEpochMs >= closesAt) {
    return "EXPIRED";
  }

  if (drop.remainingStock <= 0) {
    return "LOOTED_OUT";
  }

  return "AIRDROP_LIVE";
}

// Display text for each state.
export function getPhaseLabel(
  phase: DropPhase
): string {
  switch (phase) {
    case "WARMUP":
      return "SCHEDULED";

    case "AIRDROP_LIVE":
      return "AIRDROP LIVE";

    case "LOOTED_OUT":
      return "LOOTED OUT";

    case "EXPIRED":
      return "EXPIRED";
  }
}
