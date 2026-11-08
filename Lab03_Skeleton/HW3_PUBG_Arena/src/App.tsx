
import { useRef, useState } from "react";
import { mockCrates } from "./data/mockCrates";
import { mockSquads } from "./data/mockSquads";
import { useAirdropTimer } from "./hooks/useAirdropTimer";
import {
  getDropPhase,
  getPhaseLabel,
  DROP_LIVE_DURATION_MS,
} from "./services/dropPhase";
import {
  requestClaim,
  MockHttpError,
} from "./services/claimService";
import { runConcurrencyTests } from "./services/concurrencyTest";
import type {
  ConcurrencyTestResult,
} from "./services/concurrencyTest";
import type {
  DropPhase,
  PubgCrateDrop,
} from "./types/arena";
import "./style.css";

/**
 * HW3-09 — PUBG Vietnam Arena
 *
 * Includes:
 * - Zero-drift Airdrop countdown
 * - Drop phase state machine
 * - Optimistic inventory updates
 * - Simulated HTTP 409 rollback
 * - Duplicate request protection
 * - Concurrency / oversell tests
 * - PUBG squad leaderboard
 */

type Feedback = {
  message: string;
  tone: "info" | "success" | "error";
};

const phaseColors: Record<DropPhase, string> = {
  WARMUP: "#fbbf24",
  AIRDROP_LIVE: "#34d399",
  LOOTED_OUT: "#fb7185",
  EXPIRED: "#94a3b8",
};

function formatVnd(price: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(price)} đ`;
}

function formatCountdown(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

// -------------------------------
// CRATE CARD
// -------------------------------

type CrateCardProps = {
  crate: PubgCrateDrop;
  pending: boolean;
  forceConflict: boolean;
  feedback?: Feedback;
  onClaim: (id: string) => void;
  onConflictChange: (
    id: string,
    enabled: boolean
  ) => void;
};

function CrateCard({
  crate,
  pending,
  forceConflict,
  feedback,
  onClaim,
  onConflictChange,
}: CrateCardProps) {
  const { nowMs, remainingMs } =
    useAirdropTimer(crate.dropEpochMs);

  const phase = getDropPhase(crate, nowMs);
  const phaseLabel = getPhaseLabel(phase);

  const liveRemaining = Math.max(
    0,
    crate.dropEpochMs +
      DROP_LIVE_DURATION_MS -
      nowMs
  );

  const timerTitle =
    phase === "WARMUP"
      ? "Drop Starts In"
      : phase === "AIRDROP_LIVE"
        ? "Drop Ends In"
        : "Drop Status";

  const timerText =
    phase === "WARMUP"
      ? formatCountdown(remainingMs)
      : phase === "AIRDROP_LIVE"
        ? formatCountdown(liveRemaining)
        : phase === "LOOTED_OUT"
          ? "All Rewards Claimed"
          : "Event Window Closed";

  const canClaim =
    phase === "AIRDROP_LIVE" && !pending;

  const claimLabel = pending
    ? "Processing Claim..."
    : phase === "AIRDROP_LIVE"
      ? "Claim Reward"
      : phase === "WARMUP"
        ? "Claim — Opens Soon"
        : phase === "LOOTED_OUT"
          ? "Sold Out"
          : "Drop Expired";

  return (
    <article className="crate-card">
      <div className="crate-top">
        <span
          className="crate-icon"
          aria-hidden="true"
        >
          🎁
        </span>

        <span
          className="crate-status"
          style={{ color: phaseColors[phase] }}
        >
          {phaseLabel}
        </span>
      </div>

      <h3>{crate.title}</h3>

      <p className="crate-price">
        {formatVnd(crate.priceVnd)}
      </p>

      <div className="crate-details">
        <p>
          <span>Remaining Stock</span>
          <strong>{crate.remainingStock}</strong>
        </p>

        <p>
          <span>{timerTitle}</span>
          <strong
            className="crate-countdown"
            style={{ color: phaseColors[phase] }}
            role="timer"
          >
            {timerText}
          </strong>
        </p>
      </div>

      <button
        type="button"
        className="claim-button"
        disabled={!canClaim}
        onClick={() => onClaim(crate.id)}
        style={{
          backgroundColor: canClaim
            ? "#fbbf24"
            : "#475569",
          color: canClaim
            ? "#0f172a"
            : "#e2e8f0",
          cursor: canClaim
            ? "pointer"
            : "not-allowed",
          fontWeight: 700,
        }}
      >
        {claimLabel}
      </button>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 14,
        }}
      >
        <input
          type="checkbox"
          checked={forceConflict}
          disabled={pending}
          onChange={(event) =>
            onConflictChange(
              crate.id,
              event.target.checked
            )
          }
        />
        Simulate HTTP 409 (Demo)
      </label>

      {feedback && (
        <p
          role={
            feedback.tone === "error"
              ? "alert"
              : "status"
          }
          style={{
            marginTop: 12,
            color:
              feedback.tone === "error"
                ? "#fda4af"
                : feedback.tone === "success"
                  ? "#86efac"
                  : "#93c5fd",
          }}
        >
          {feedback.message}
        </p>
      )}
    </article>
  );
}

// -------------------------------
// MAIN APP
// -------------------------------

export default function App() {
  // Local optimistic inventory.
  const [crates, setCrates] = useState<
    PubgCrateDrop[]
  >(() => mockCrates.map((crate) => ({ ...crate })));

  const [pendingIds, setPendingIds] = useState<
    Set<string>
  >(() => new Set());

  const [conflictIds, setConflictIds] = useState<
    Set<string>
  >(() => new Set());

  const [feedbackById, setFeedbackById] = useState<
    Record<string, Feedback>
  >({});

  // Synchronous lock for duplicate clicks.
  const inFlightIds = useRef<Set<string>>(
    new Set()
  );

  // Concurrency test state.
  const [testResults, setTestResults] = useState<
    ConcurrencyTestResult[]
  >([]);

  const [isTesting, setIsTesting] =
    useState(false);

  const [testError, setTestError] =
    useState("");

  const testRunningRef = useRef(false);

  // Toggle the simulated 409 conflict.
  function handleConflictChange(
    crateId: string,
    enabled: boolean
  ) {
    setConflictIds((previous) => {
      const next = new Set(previous);

      if (enabled) {
        next.add(crateId);
      } else {
        next.delete(crateId);
      }

      return next;
    });
  }

  // -------------------------------
  // OPTIMISTIC CLAIM + ROLLBACK
  // -------------------------------

  async function handleClaim(crateId: string) {
    // Prevent repeated requests.
    if (inFlightIds.current.has(crateId)) {
      return;
    }

    const crate = crates.find(
      (item) => item.id === crateId
    );

    if (!crate) return;

    // Validate current stock and drop phase.
    if (
      getDropPhase(crate, Date.now()) !==
      "AIRDROP_LIVE"
    ) {
      return;
    }

    // Lock synchronously.
    inFlightIds.current.add(crateId);

    setPendingIds((previous) =>
      new Set(previous).add(crateId)
    );

    setFeedbackById((previous) => ({
      ...previous,
      [crateId]: {
        message: "Sending claim request...",
        tone: "info",
      },
    }));

    // Optimistic update:
    // Decrease the inventory immediately.
    setCrates((previous) =>
      previous.map((item) =>
        item.id === crateId
          ? {
              ...item,
              remainingStock: Math.max(
                0,
                item.remainingStock - 1
              ),
            }
          : item
      )
    );

    try {
      // Simulated API call.
      const response = await requestClaim(
        crateId,
        conflictIds.has(crateId)
      );

      // Success: synchronize server stock.
      setCrates((previous) =>
        previous.map((item) =>
          item.id === crateId
            ? {
                ...item,
                remainingStock:
                  response.remainingStock,
              }
            : item
        )
      );

      setFeedbackById((previous) => ({
        ...previous,
        [crateId]: {
          message:
            "Claim confirmed! Inventory updated.",
          tone: "success",
        },
      }));
    } catch (error: unknown) {
      if (error instanceof MockHttpError) {
        // HTTP 409: rollback to server stock.
        setCrates((previous) =>
          previous.map((item) =>
            item.id === crateId
              ? {
                  ...item,
                  remainingStock:
                    error.remainingStock,
                }
              : item
          )
        );

        setFeedbackById((previous) => ({
          ...previous,
          [crateId]: {
            message:
              `HTTP ${error.status} Conflict — ` +
              "inventory synchronized.",
            tone: "error",
          },
        }));

        console.warn(
          "Mock claim conflict:",
          error.message
        );
      } else {
        // Unexpected error: undo one decrement.
        setCrates((previous) =>
          previous.map((item) =>
            item.id === crateId
              ? {
                  ...item,
                  remainingStock:
                    item.remainingStock + 1,
                }
              : item
          )
        );

        setFeedbackById((previous) => ({
          ...previous,
          [crateId]: {
            message:
              "Claim failed. Stock reverted.",
            tone: "error",
          },
        }));

        console.error("Claim failed:", error);
      }
    } finally {
      // Release the in-flight request lock.
      inFlightIds.current.delete(crateId);

      setPendingIds((previous) => {
        const next = new Set(previous);
        next.delete(crateId);
        return next;
      });
    }
  }

  // -------------------------------
  // CONCURRENCY TESTS
  // -------------------------------

  async function handleRunTests() {
    if (testRunningRef.current) return;

    testRunningRef.current = true;

    setIsTesting(true);
    setTestResults([]);
    setTestError("");

    try {
      const results =
        await runConcurrencyTests();

      setTestResults(results);
      console.table(results);
    } catch (error: unknown) {
      console.error(
        "Concurrency tests failed:",
        error
      );

      setTestError(
        "Unable to complete concurrency tests."
      );
    } finally {
      testRunningRef.current = false;
      setIsTesting(false);
    }
  }

  const allTestsPassed =
    testResults.length === 4 &&
    testResults.every((result) => result.passed);

  // -------------------------------
  // RENDER
  // -------------------------------

  return (
    <main className="arena">
      {/* Header */}
      <header className="arena-header">
        <div className="arena-brand">
          <span className="eyebrow">
            LAB 03 / HOMEWORK 03
          </span>

          <h1>PUBG Vietnam Arena</h1>

          <p>
            PVS Finals Ticket & G-Coin
            Contraband Crate Arena
          </p>
        </div>

        <span className="demo-badge">
          DEMO PLATFORM
        </span>
      </header>

      {/* Hero */}
      <section
        className="hero"
        aria-labelledby="hero-title"
      >
        <div className="hero-content">
          <span className="section-tag">
            KRAFTON × PUBG VIETNAM
          </span>

          <h2 id="hero-title">
            Vietnam Championship{" "}
            <span>Airdrop Arena</span>
          </h2>

          <p>
            Explore exclusive event tickets,
            G-Coin crates and Vietnamese esports
            squad standings.
          </p>

          <div className="hero-stats">
            <div>
              <strong>{crates.length}</strong>
              <span>Event Rewards</span>
            </div>

            <div>
              <strong>{mockSquads.length}</strong>
              <span>VN Squads</span>
            </div>
          </div>

          <small>
            Academic demo — fictional event data.
          </small>
        </div>
      </section>

      {/* Crates */}
      <section
        className="arena-section"
        aria-labelledby="drops-title"
      >
        <div className="section-heading">
          <div>
            <span className="section-tag">
              EVENT REWARDS
            </span>

            <h2 id="drops-title">
              Airdrop & VIP Tickets
            </h2>
          </div>

          <p>Scheduled demo drops</p>
        </div>

        <div className="crates-grid">
          {crates.map((crate) => (
            <CrateCard
              key={crate.id}
              crate={crate}
              pending={pendingIds.has(crate.id)}
              forceConflict={conflictIds.has(
                crate.id
              )}
              feedback={feedbackById[crate.id]}
              onClaim={(id) => {
                void handleClaim(id);
              }}
              onConflictChange={
                handleConflictChange
              }
            />
          ))}
        </div>
      </section>

      {/* Concurrency Test Lab */}
      <section
        className="arena-section"
        aria-labelledby="concurrency-title"
      >
        <div className="section-heading">
          <div>
            <span className="section-tag">
              CONCURRENCY TESTING
            </span>

            <h2 id="concurrency-title">
              Oversell Prevention Lab
            </h2>
          </div>

          <p>Isolated mock server tests</p>
        </div>

        <div className="leaderboard-panel">
          <p>
            Run simultaneous claims with limited
            stock and check for overselling.
          </p>

          <button
            type="button"
            disabled={isTesting}
            onClick={() => {
              void handleRunTests();
            }}
            style={{
              padding: "12px 20px",
              border: 0,
              borderRadius: 9,
              background: "#fbbf24",
              color: "#0f172a",
              fontWeight: 800,
              cursor: isTesting
                ? "wait"
                : "pointer",
            }}
          >
            {isTesting
              ? "Running Tests..."
              : "Run Concurrency Tests"}
          </button>

          <div role="status" aria-live="polite">
            {isTesting && (
              <p>Testing concurrent claims...</p>
            )}

            {testError && (
              <p style={{ color: "#fda4af" }}>
                {testError}
              </p>
            )}

            {testResults.length > 0 && (
              <p
                style={{
                  color: allTestsPassed
                    ? "#86efac"
                    : "#fda4af",
                  fontWeight: 700,
                }}
              >
                {allTestsPassed
                  ? "PASS — All 4 concurrency tests passed."
                  : "FAIL — Review test results."}
              </p>
            )}
          </div>

          {testResults.length > 0 && (
            <div
              className="leaderboard-scroll"
              role="region"
              aria-label="Concurrency test results"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Scenario</th>
                    <th scope="col">Stock</th>
                    <th scope="col">Requests</th>
                    <th scope="col">Success</th>
                    <th scope="col">409</th>
                    <th scope="col">Final</th>
                    <th scope="col">Result</th>
                  </tr>
                </thead>

                <tbody>
                  {testResults.map((result) => (
                    <tr key={result.name}>
                      <th scope="row">
                        {result.name}
                      </th>

                      <td>{result.initialStock}</td>
                      <td>{result.requests}</td>
                      <td>{result.successes}</td>
                      <td>{result.conflicts}</td>
                      <td>{result.finalStock}</td>

                      <td
                        style={{
                          color: result.passed
                            ? "#86efac"
                            : "#fda4af",
                        }}
                      >
                        {result.passed
                          ? "PASS"
                          : "FAIL"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p
            style={{
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Demo limitation: one JavaScript
            runtime, not a real multi-server test.
          </p>
        </div>
      </section>

      {/* Leaderboard */}
      <section
        className="arena-section"
        aria-labelledby="leaderboard-title"
      >
        <div className="section-heading">
          <div>
            <span className="section-tag">
              VIETNAM ESPORTS
            </span>

            <h2 id="leaderboard-title">
              Squad Leaderboard
            </h2>
          </div>

          <p>Sample standings</p>
        </div>

        <div className="leaderboard-panel">
          <div
            className="leaderboard-scroll"
            role="region"
            aria-label="Vietnam squad standings"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Squad</th>
                  <th scope="col">WWCD</th>
                  <th scope="col">Placement</th>
                  <th scope="col">Kills</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>

              <tbody>
                {mockSquads.map((squad) => (
                  <tr key={squad.squadId}>
                    <th scope="row">
                      {squad.squadName}
                    </th>

                    <td>{squad.wwcdCount}</td>
                    <td>{squad.placementPts}</td>
                    <td>{squad.killPts}</td>

                    <td className="total-points">
                      {squad.placementPts +
                        squad.killPts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="arena-footer">
        Lab 03 — PUBG Vietnam Arena

        <p>
          Educational demo. Not official PUBG
          tournament data.
        </p>
      </footer>
    </main>
  );
}
