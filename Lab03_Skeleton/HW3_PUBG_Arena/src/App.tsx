
import { useMemo, useRef, useState } from "react";

import { mockCrates } from "./data/mockCrates";
import { mockSquads } from "./data/mockSquads";
import { useAirdropTimer } from "./hooks/useAirdropTimer";

import {
  DROP_LIVE_DURATION_MS,
  getDropPhase,
  getPhaseLabel,
} from "./services/dropPhase";

import {
  MockHttpError,
  requestClaim,
} from "./services/claimService";

import { runConcurrencyTests } from "./services/concurrencyTest";

import type { ConcurrencyTestResult } from "./services/concurrencyTest";
import type {
  DropPhase,
  PubgCrateDrop,
  PubgVnSquadStanding,
} from "./types/arena";

import "./style.css";

/**
 * HW3-10 — PUBG Vietnam Arena
 *
 * Previous features:
 * - Zero-drift countdown and visibility sync
 * - Four-state drop phase machine
 * - Optimistic claim and HTTP 409 rollback
 * - In-flight request locking
 * - Concurrency / oversell prevention tests
 *
 * New features:
 * - Leaderboard search
 * - Sort by squad name, WWCD, placement, kills, total
 * - Ascending / descending order
 * - Dynamic result count and ranking
 */

type Feedback = {
  message: string;
  tone: "info" | "success" | "error";
};

type SortField =
  | "total"
  | "wwcd"
  | "placement"
  | "kills"
  | "name";

type SortDirection = "asc" | "desc";

const phaseColors: Record<DropPhase, string> = {
  WARMUP: "#fbbf24",
  AIRDROP_LIVE: "#34d399",
  LOOTED_OUT: "#fb7185",
  EXPIRED: "#94a3b8",
};

const squadCollator = new Intl.Collator("vi", {
  sensitivity: "base",
  numeric: true,
});

function formatVnd(price: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(price)} đ`;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(
    Math.max(0, ms) / 1000
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

// Calculate total tournament points.
function getTotalPoints(
  squad: PubgVnSquadStanding
): number {
  return squad.placementPts + squad.killPts;
}

// Read the selected numeric sorting metric.
function getSortScore(
  squad: PubgVnSquadStanding,
  field: SortField
): number {
  switch (field) {
    case "total":
      return getTotalPoints(squad);

    case "wwcd":
      return squad.wwcdCount;

    case "placement":
      return squad.placementPts;

    case "kills":
      return squad.killPts;

    case "name":
      return 0;
  }
}

// =====================================
// CRATE CARD
// =====================================

interface CrateCardProps {
  crate: PubgCrateDrop;
  pending: boolean;
  forceConflict: boolean;
  feedback?: Feedback;
  onClaim: (id: string) => void;
  onConflictChange: (
    id: string,
    enabled: boolean
  ) => void;
}

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

  const liveRemainingMs = Math.max(
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
        ? formatCountdown(liveRemainingMs)
        : phase === "LOOTED_OUT"
          ? "All Rewards Claimed"
          : "Event Window Closed";

  const canClaim =
    phase === "AIRDROP_LIVE" && !pending;

  const claimText = pending
    ? "Processing Claim..."
    : phase === "AIRDROP_LIVE"
      ? "Claim Reward"
      : phase === "WARMUP"
        ? "Claim — Opens Soon"
        : phase === "LOOTED_OUT"
          ? "Sold Out"
          : "Drop Expired";

  const feedbackColor =
    feedback?.tone === "error"
      ? "#fda4af"
      : feedback?.tone === "success"
        ? "#86efac"
        : "#93c5fd";

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
        {claimText}
      </button>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 14,
          color: "#cbd5e1",
          fontSize: 13,
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
            color: feedbackColor,
            fontSize: 13,
          }}
        >
          {feedback.message}
        </p>
      )}
    </article>
  );
}

// =====================================
// HW3-09: CONCURRENCY TEST LAB
// =====================================

function ConcurrencyTestLab() {
  const [testResults, setTestResults] = useState<
    ConcurrencyTestResult[]
  >([]);

  const [isTesting, setIsTesting] =
    useState(false);

  const [testError, setTestError] =
    useState("");

  const testRunningRef = useRef(false);

  async function handleRunTests() {
    if (testRunningRef.current) return;

    testRunningRef.current = true;

    setIsTesting(true);
    setTestError("");
    setTestResults([]);

    try {
      const results =
        await runConcurrencyTests();

      setTestResults(results);

      console.table(results);
    } catch (error) {
      console.error(
        "Concurrency test failed:",
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

  const allPassed =
    testResults.length === 4 &&
    testResults.every((result) => result.passed);

  return (
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
          Run simultaneous claims against limited
          stock and verify that inventory never
          becomes negative.
        </p>

        <button
          type="button"
          disabled={isTesting}
          onClick={() => void handleRunTests()}
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
                color: allPassed
                  ? "#86efac"
                  : "#fda4af",
                fontWeight: 700,
              }}
            >
              {allPassed
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
                        fontWeight: 700,
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
            marginTop: 16,
          }}
        >
          Demo limitation: concurrency tests run
          within one JavaScript runtime, not
          across real servers.
        </p>
      </div>
    </section>
  );
}

// =====================================
// HW3-10: LEADERBOARD SEARCH & SORT
// =====================================

function SquadLeaderboard() {
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] =
    useState<SortField>("total");

  const [direction, setDirection] =
    useState<SortDirection>("desc");

  /**
   * Filtering and sorting are derived values.
   * Never mutate the imported mockSquads array.
   */
  const visibleSquads = useMemo(() => {
    const keyword = search
      .trim()
      .toLocaleLowerCase("vi");

    const filtered = mockSquads.filter(
      (squad) =>
        squad.squadName
          .toLocaleLowerCase("vi")
          .includes(keyword)
    );

    return filtered.sort((a, b) => {
      let comparison: number;

      if (sortBy === "name") {
        comparison = squadCollator.compare(
          a.squadName,
          b.squadName
        );
      } else {
        comparison =
          getSortScore(a, sortBy) -
          getSortScore(b, sortBy);
      }

      // Apply ascending or descending order.
      const ordered =
        direction === "asc"
          ? comparison
          : -comparison;

      // Stable alphabetical tie-breaker.
      return (
        ordered ||
        squadCollator.compare(
          a.squadName,
          b.squadName
        )
      );
    });
  }, [search, sortBy, direction]);

  const fieldStyle = {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 8,
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#f8fafc",
  };

  return (
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

        <p>Search and sort squad standings</p>
      </div>

      <div className="leaderboard-panel">
        {/* Search and sorting controls */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div>
            <label
              htmlFor="squad-search"
              style={{ display: "block", marginBottom: 7 }}
            >
              Search Squad
            </label>

            <input
              id="squad-search"
              type="search"
              placeholder="Search squad name..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              style={fieldStyle}
            />
          </div>

          <div>
            <label
              htmlFor="squad-sort"
              style={{ display: "block", marginBottom: 7 }}
            >
              Sort By
            </label>

            <select
              id="squad-sort"
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value as SortField
                )
              }
              style={fieldStyle}
            >
              <option value="total">
                Total Points
              </option>
              <option value="wwcd">
                WWCD
              </option>
              <option value="placement">
                Placement Points
              </option>
              <option value="kills">
                Kill Points
              </option>
              <option value="name">
                Squad Name
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="squad-direction"
              style={{ display: "block", marginBottom: 7 }}
            >
              Order
            </label>

            <select
              id="squad-direction"
              value={direction}
              onChange={(event) =>
                setDirection(
                  event.target.value as SortDirection
                )
              }
              style={fieldStyle}
            >
              <option value="desc">
                Descending
              </option>
              <option value="asc">
                Ascending
              </option>
            </select>
          </div>
        </div>

        {/* Filtered result count */}
        <p
          role="status"
          aria-live="polite"
          style={{
            color: "#94a3b8",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          Showing {visibleSquads.length} of{" "}
          {mockSquads.length} squads
        </p>

        {/* Leaderboard table */}
        <div
          className="leaderboard-scroll"
          role="region"
          aria-label="Vietnam squad standings"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Squad</th>
                <th scope="col">WWCD</th>
                <th scope="col">Placement</th>
                <th scope="col">Kills</th>
                <th scope="col">Total</th>
              </tr>
            </thead>

            <tbody>
              {visibleSquads.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      color: "#94a3b8",
                      padding: 24,
                    }}
                  >
                    No squads found.
                  </td>
                </tr>
              ) : (
                visibleSquads.map((squad, index) => (
                  <tr key={squad.squadId}>
                    <td>{index + 1}</td>

                    <th scope="row">
                      {squad.squadName}
                    </th>

                    <td>{squad.wwcdCount}</td>
                    <td>{squad.placementPts}</td>
                    <td>{squad.killPts}</td>

                    <td className="total-points">
                      {getTotalPoints(squad)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p
          style={{
            marginTop: 14,
            color: "#94a3b8",
            fontSize: 12,
          }}
        >
          Total Points = Placement Points + Kill Points.
          Rankings shown are based on the selected
          sorting order. Demo statistics are fictional.
        </p>
      </div>
    </section>
  );
}

// =====================================
// MAIN APP
// =====================================

export default function App() {
  const [crates, setCrates] = useState<
    PubgCrateDrop[]
  >(() =>
    mockCrates.map((crate) => ({ ...crate }))
  );

  const [pendingIds, setPendingIds] = useState<
    Set<string>
  >(() => new Set());

  const [conflictIds, setConflictIds] = useState<
    Set<string>
  >(() => new Set());

  const [feedbackById, setFeedbackById] = useState<
    Record<string, Feedback>
  >({});

  const inFlightIds = useRef<Set<string>>(
    new Set()
  );

  // Enable or disable forced 409 conflict.
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

  // HW3-08: Optimistic Claim + Rollback.
  async function handleClaim(crateId: string) {
    // Synchronous duplicate-request protection.
    if (inFlightIds.current.has(crateId)) {
      return;
    }

    const crate = crates.find(
      (item) => item.id === crateId
    );

    if (!crate) return;

    if (
      getDropPhase(crate, Date.now()) !==
      "AIRDROP_LIVE"
    ) {
      return;
    }

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

    // Decrease stock optimistically.
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
      const response = await requestClaim(
        crateId,
        conflictIds.has(crateId)
      );

      // Server-confirmed stock.
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
        // Rollback to authoritative mock stock.
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
        // Revert unexpected failed claim.
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
      inFlightIds.current.delete(crateId);

      setPendingIds((previous) => {
        const next = new Set(previous);
        next.delete(crateId);
        return next;
      });
    }
  }

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

      {/* Airdrop Cards */}
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
              forceConflict={
                conflictIds.has(crate.id)
              }
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

      {/* HW3-09: Previous concurrency tests */}
      <ConcurrencyTestLab />

      {/* HW3-10: Searchable, sortable leaderboard */}
      <SquadLeaderboard />

      {/* Footer */}
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
