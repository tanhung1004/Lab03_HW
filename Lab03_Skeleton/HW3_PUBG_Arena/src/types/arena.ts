
/**
 * HW3-02: PUBG Vietnam Arena Domain Contracts
 * Based on the Lab 03 assignment specification.
 */

// Current phase of an airdrop event
export type DropPhase =
  | "WARMUP"
  | "AIRDROP_LIVE"
  | "LOOTED_OUT"
  | "EXPIRED";

// Ticket or G-Coin crate information
export interface PubgCrateDrop {
  readonly id: string;
  readonly title: string;
  readonly priceVnd: number;
  readonly remainingStock: number;
  readonly dropEpochMs: number;
}

// PUBG Vietnam squad leaderboard data
export interface PubgVnSquadStanding {
  readonly squadId: string;
  readonly squadName: string;
  readonly wwcdCount: number;
  readonly placementPts: number;
  readonly killPts: number;
}
