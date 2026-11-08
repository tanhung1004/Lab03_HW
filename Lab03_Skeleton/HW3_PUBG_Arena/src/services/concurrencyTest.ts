
import type { PubgCrateDrop } from "../types/arena";

import {
  createMockClaimServer,
  MockHttpError,
} from "./claimService";

/**
 * HW3-09 — Concurrency & Oversell Prevention Tests
 *
 * Tests multiple simultaneous claims against
 * an isolated in-memory mock server.
 */

export interface ConcurrencyTestResult {
  name: string;
  initialStock: number;
  requests: number;
  successes: number;
  conflicts: number;
  finalStock: number;
  passed: boolean;
}

/**
 * Run concurrent requests against one crate.
 *
 * All requests begin together using Promise.allSettled.
 */
async function runScenario(
  initialStock: number,
  requestCount: number,
  name: string
): Promise<ConcurrencyTestResult> {
  const crate: PubgCrateDrop = {
    id: `test-${initialStock}-${requestCount}`,
    title: "Concurrency Test Crate",
    priceVnd: 0,
    remainingStock: initialStock,

    // The test drop is already LIVE.
    dropEpochMs: Date.now() - 60 * 1000,
  };

  // Independent mock server with short latency.
  const server = createMockClaimServer(
    [crate],
    150
  );

  // Start every claim without awaiting the previous one.
  const requests = Array.from(
    { length: requestCount },
    () => server.requestClaim(crate.id)
  );

  const results = await Promise.allSettled(requests);

  let successes = 0;
  let conflicts = 0;
  let unexpectedFailures = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      successes++;
      continue;
    }

    const error: unknown = result.reason;

    if (
      error instanceof MockHttpError &&
      error.status === 409
    ) {
      conflicts++;
    } else {
      unexpectedFailures++;
      console.error("Unexpected test failure:", error);
    }
  }

  const finalStock = server.getStock(crate.id) ?? -1;

  const expectedSuccesses = Math.min(
    initialStock,
    requestCount
  );

  const expectedConflicts =
    requestCount - expectedSuccesses;

  const expectedFinalStock =
    initialStock - expectedSuccesses;

  const passed =
    successes === expectedSuccesses &&
    conflicts === expectedConflicts &&
    finalStock === expectedFinalStock &&
    finalStock >= 0 &&
    unexpectedFailures === 0;

  return {
    name,
    initialStock,
    requests: requestCount,
    successes,
    conflicts,
    finalStock,
    passed,
  };
}

/**
 * Execute all HW3-09 test cases.
 */
export async function runConcurrencyTests():
  Promise<ConcurrencyTestResult[]> {
  const scenarios = [
    runScenario(
      1,
      10,
      "10 requests / 1 reward"
    ),

    runScenario(
      3,
      10,
      "10 requests / 3 rewards"
    ),

    runScenario(
      0,
      10,
      "10 requests / 0 rewards"
    ),

    runScenario(
      5,
      2,
      "2 requests / 5 rewards"
    ),
  ];

  return Promise.all(scenarios);
}
