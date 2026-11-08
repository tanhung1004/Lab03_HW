
import type { PubgCrateDrop } from "../types/arena";

// Demo countdowns relative to project startup.
// Actual event timestamps will come from a server later.
const demoStartMs = Date.now();

export const mockCrates: readonly PubgCrateDrop[] = [
  {
    id: "pvs-vip-ticket",
    title: "PVS Finals VIP Pass + 5,000 G-Coin",
    priceVnd: 499000,
    remainingStock: 50,
    dropEpochMs: demoStartMs + 30 * 60 * 1000,
  },
  {
    id: "gcoin-contraband",
    title: "G-Coin Contraband Crate",
    priceVnd: 99000,
    remainingStock: 100,
    dropEpochMs: demoStartMs + 60 * 60 * 1000,
  },
  {
    id: "pvs-premium-ticket",
    title: "PVS Grand Finals Premium Ticket",
    priceVnd: 299000,
    remainingStock: 75,
    dropEpochMs: demoStartMs + 90 * 60 * 1000,
  },
];
