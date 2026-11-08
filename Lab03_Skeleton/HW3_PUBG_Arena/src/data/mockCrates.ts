
import type { PubgCrateDrop } from "../types/arena";

/**
 * HW3-07: Mock PUBG rewards.
 *
 * First crate: already LIVE for testing.
 * Second and third crates: scheduled events.
 *
 * All values are fictional demo data.
 */

const demoStartMs = Date.now();

export const mockCrates: readonly PubgCrateDrop[] = [
  {
    id: "pvs-vip-ticket",
    title: "PVS Finals VIP Pass + 5,000 G-Coin",
    priceVnd: 499000,
    remainingStock: 50,

    // Started 1 minute ago.
    // Live duration = 15 minutes (HW3-06).
    dropEpochMs: demoStartMs - 60 * 1000,
  },
  {
    id: "gcoin-contraband",
    title: "G-Coin Contraband Crate",
    priceVnd: 99000,
    remainingStock: 100,

    // Starts in 2 minutes.
    dropEpochMs: demoStartMs + 2 * 60 * 1000,
  },
  {
    id: "pvs-premium-ticket",
    title: "PVS Grand Finals Premium Ticket",
    priceVnd: 299000,
    remainingStock: 75,

    // Starts in 5 minutes.
    dropEpochMs: demoStartMs + 5 * 60 * 1000,
  },
];
