
import type { PubgVnSquadStanding } from "../types/arena";

// Fictional statistics for demonstration purposes.
// These are not official esports tournament results.

export const mockSquads: readonly PubgVnSquadStanding[] = [
  {
    squadId: "te",
    squadName: "The Expendables",
    wwcdCount: 3,
    placementPts: 65,
    killPts: 82,
  },
  {
    squadId: "ces",
    squadName: "Cerberus Esports",
    wwcdCount: 2,
    placementPts: 60,
    killPts: 75,
  },
  {
    squadId: "re",
    squadName: "Roy Esports",
    wwcdCount: 1,
    placementPts: 52,
    killPts: 64,
  },
  {
    squadId: "agg",
    squadName: "AGG",
    wwcdCount: 1,
    placementPts: 45,
    killPts: 58,
  },
];
