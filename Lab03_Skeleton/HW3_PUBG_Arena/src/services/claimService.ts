
import { mockCrates } from "../data/mockCrates";
import type { PubgCrateDrop } from "../types/arena";
import { getDropPhase } from "./dropPhase";

/**
 * HW3-09 — Mock Claim Server
 *
 * Supports:
 * - Optimistic claim confirmation.
 * - HTTP 409 simulation.
 * - Server-side stock validation.
 * - Atomic inventory update within one JS runtime.
 * - Independent server instances for concurrency tests.
 *
 * This is NOT a real HTTP backend.
 */

export interface ClaimResponse {
  crateId: string;
  remainingStock: number;
}

export class MockHttpError extends Error {
  readonly status: number;
  readonly remainingStock: number;

  constructor(
    status: number,
    message: string,
    remainingStock: number
  ) {
    super(message);

    this.name = "MockHttpError";
    this.status = status;
    this.remainingStock = remainingStock;
  }
}

// Works in both browser and Node.js.
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Create an independent in-memory claim server.
 *
 * Each instance has its own stock Map, so tests
 * cannot modify the main application's inventory.
 */
export function createMockClaimServer(
  initialCrates: readonly PubgCrateDrop[],
  latencyMs = 800
) {
  const crateById = new Map(
    initialCrates.map((crate) => [
      crate.id,
      { ...crate },
    ])
  );

  const serverStock = new Map<string, number>(
    initialCrates.map((crate) => [
      crate.id,
      crate.remainingStock,
    ])
  );

  async function claim(
    crateId: string,
    simulateConflict = false
  ): Promise<ClaimResponse> {
    // Simulate multiple requests arriving together.
    await delay(latencyMs);

    const crate = crateById.get(crateId);
    const stock = serverStock.get(crateId);

    if (!crate || stock === undefined) {
      throw new Error("Crate does not exist.");
    }

    // Force HTTP 409 for rollback testing.
    if (simulateConflict) {
      throw new MockHttpError(
        409,
        "Conflict: simulated competing claim.",
        stock
      );
    }

    // Verify stock and event deadline.
    const phase = getDropPhase(
      {
        ...crate,
        remainingStock: stock,
      },
      Date.now()
    );

    if (phase !== "AIRDROP_LIVE") {
      throw new MockHttpError(
        409,
        `Conflict: drop is ${phase}.`,
        stock
      );
    }

    if (stock <= 0) {
      throw new MockHttpError(
        409,
        "Conflict: no stock remaining.",
        stock
      );
    }

    /**
     * Critical section:
     *
     * No await between checking the stock
     * and decreasing it.
     *
     * These operations execute together
     * in this single JavaScript runtime.
     */
    const remainingStock = stock - 1;

    serverStock.set(crateId, remainingStock);

    return {
      crateId,
      remainingStock,
    };
  }

  // Read-only accessor for concurrency tests.
  function getStock(
    crateId: string
  ): number | undefined {
    return serverStock.get(crateId);
  }

  return {
    requestClaim: claim,
    getStock,
  };
}

// Main demo server used by the actual Claim buttons.
const mainServer = createMockClaimServer(mockCrates);

// Preserve the original API for App.tsx.
export function requestClaim(
  crateId: string,
  simulateConflict = false
): Promise<ClaimResponse> {
  return mainServer.requestClaim(
    crateId,
    simulateConflict
  );
}
