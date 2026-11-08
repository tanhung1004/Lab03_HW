
import { mockCrates } from "../data/mockCrates";
import { getDropPhase } from "./dropPhase";

/**
 * HW3-08 — Mock Claim API
 *
 * Simulates:
 * - Network latency.
 * - Server-side stock validation.
 * - Successful claim.
 * - HTTP 409 Conflict.
 *
 * This is an in-memory mock, NOT a real HTTP server.
 */

export interface ClaimResponse {
  crateId: string;
  remainingStock: number;
}

// Simulated authoritative inventory for this browser tab.
const serverStock = new Map<string, number>(
  mockCrates.map((crate) => [
    crate.id,
    crate.remainingStock,
  ])
);

// An error that behaves like an HTTP error response.
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

// Simulate an 800ms network request.
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Simulated claim endpoint.
 *
 * simulateConflict=true forces a 409 rejection
 * without consuming inventory.
 */
export async function requestClaim(
  crateId: string,
  simulateConflict = false
): Promise<ClaimResponse> {
  await delay(800);

  const stock = serverStock.get(crateId);

  if (stock === undefined) {
    throw new Error("Crate does not exist.");
  }

  // Deterministic 409 test case.
  if (simulateConflict) {
    throw new MockHttpError(
      409,
      "Conflict: simulated competing claim.",
      stock
    );
  }

  const originalCrate = mockCrates.find(
    (crate) => crate.id === crateId
  );

  if (!originalCrate) {
    throw new Error("Crate configuration not found.");
  }

  // Validate against authoritative stock and time.
  const phase = getDropPhase(
    {
      ...originalCrate,
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
   * Atomic within this JavaScript execution context:
   * there is no await between checking and
   * updating the server stock.
   */
  const updatedStock = stock - 1;
  serverStock.set(crateId, updatedStock);

  return {
    crateId,
    remainingStock: updatedStock,
  };
}
