
import { useCallback, useRef, useState } from "react";

import { mockCrates } from "./data/mockCrates";
import { mockSquads } from "./data/mockSquads";

import { useAirdropTimer } from "./hooks/useAirdropTimer";

import {
  DROP_LIVE_DURATION_MS,
  getDropPhase,
  getPhaseLabel,
} from "./services/dropPhase";

import type {
  DropPhase,
  PubgCrateDrop,
} from "./types/arena";

import "./style.css";

/**
 * HW3-07 — Optimistic Claim & Inventory Update
 *
 * - Claim only during AIRDROP_LIVE.
 * - Decrease stock immediately.
 * - Simulate asynchronous confirmation.
 * - Block duplicate requests while pending.
 * - Keep separate inventory for each crate.
 *
 * HTTP 409 simulation and conflict handling
 * will be added in HW3-08.
 */

// Format Vietnamese currency.
function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

// Format milliseconds as HH:MM:SS.
function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.ceil(
    Math.max(0, milliseconds) / 1000
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

const phaseColors: Record<DropPhase, string> = {
  WARMUP: "#fbbf24",
  AIRDROP_LIVE: "#34d399",
  LOOTED_OUT: "#fb7185",
  EXPIRED: "#94a3b8",
};

// Simulate a successful server response after 800ms.
// This is NOT a real API request.
function simulateClaimRequest(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 800);
  });
}

interface CrateCardProps {
  crate: PubgCrateDrop;
  isPending: boolean;
  feedback: string;
  onClaim: (crateId: string) => void;
}

function CrateCard({
  crate,
  isPending,
  feedback,
  onClaim,
}: CrateCardProps) {
  const { remainingMs, nowMs } =
    useAirdropTimer(crate.dropEpochMs);

  // Derive current phase using local inventory.
  const phase = getDropPhase(crate, nowMs);
  const phaseLabel = getPhaseLabel(phase);

  const closesAt =
    crate.dropEpochMs + DROP_LIVE_DURATION_MS;

  const liveRemainingMs = Math.max(
    0,
    closesAt - nowMs
  );

  let timerTitle = "Drop Status";
  let timerText = "";

  switch (phase) {
    case "WARMUP":
      timerTitle = "Drop Starts In";
      timerText = formatCountdown(remainingMs);
      break;

    case "AIRDROP_LIVE":
      timerTitle = "Drop Ends In";
      timerText = formatCountdown(liveRemainingMs);
      break;

    case "LOOTED_OUT":
      timerText = "All Rewards Claimed";
      break;

    case "EXPIRED":
      timerText = "Event Window Closed";
      break;
  }

  // A claim is valid only while the drop is live.
  const canClaim =
    phase === "AIRDROP_LIVE" && !isPending;

  let claimText = "Claim — Unavailable";

  if (isPending) {
    claimText = "Processing Claim...";
  } else {
    switch (phase) {
      case "WARMUP":
        claimText = "Claim — Opens Soon";
        break;

      case "AIRDROP_LIVE":
        claimText = "Claim Reward";
        break;

      case "LOOTED_OUT":
        claimText = "Sold Out";
        break;

      case "EXPIRED":
        claimText = "Drop Expired";
        break;
    }
  }

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
            aria-label={`${phaseLabel}: ${timerText}`}
          >
            {timerText}
          </strong>
        </p>
      </div>

      {/* Optimistic Claim */}
      <button
        type="button"
        className="claim-button"
        disabled={!canClaim}
        onClick={() => onClaim(crate.id)}
        style={{
          backgroundColor: canClaim
            ? "#fbbf24"
            : "#475569",
          color: canClaim ? "#0f172a" : "#e2e8f0",
          cursor: canClaim ? "pointer" : "not-allowed",
          opacity: isPending ? 0.7 : 1,
          fontWeight: 700,
        }}
      >
        {claimText}
      </button>

      {/* Claim result */}
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          style={{
            marginTop: 12,
            fontSize: 13,
            color: "#86efac",
          }}
        >
          {feedback}
        </p>
      )}
    </article>
  );
}

export default function App() {
  /**
   * Store a local copy of inventory.
   * Do not mutate imported mockCrates directly.
   */
  const [crates, setCrates] = useState<PubgCrateDrop[]>(
    () => mockCrates.map((crate) => ({ ...crate }))
  );

  // Track pending requests for button rendering.
  const [pendingIds, setPendingIds] = useState<Set<string>>(
    () => new Set()
  );

  // Store per-crate feedback messages.
  const [feedbackById, setFeedbackById] = useState<
    Record<string, string>
  >({});

  /**
   * Synchronous lock:
   * prevents repeated clicks before React rerenders.
   */
  const inFlightIds = useRef<Set<string>>(new Set());

  // Handle optimistic claim.
  const handleClaim = useCallback(
    async (crateId: string) => {
      // Prevent duplicate in-flight requests.
      if (inFlightIds.current.has(crateId)) {
        return;
      }

      const currentCrate = crates.find(
        (crate) => crate.id === crateId
      );

      // Reject nonexistent crates.
      if (!currentCrate) {
        return;
      }

      // Recheck real time and inventory at click time.
      const currentPhase = getDropPhase(
        currentCrate,
        Date.now()
      );

      if (currentPhase !== "AIRDROP_LIVE") {
        return;
      }

      if (currentCrate.remainingStock <= 0) {
        return;
      }

      // Lock synchronously BEFORE updating React state.
      inFlightIds.current.add(crateId);

      setPendingIds((previous) => {
        const next = new Set(previous);
        next.add(crateId);
        return next;
      });

      setFeedbackById((previous) => ({
        ...previous,
        [crateId]: "Sending claim request...",
      }));

      /**
       * Optimistic inventory update:
       * decrease stock immediately, without waiting.
       */
      setCrates((previous) =>
        previous.map((crate) =>
          crate.id === crateId
            ? {
                ...crate,
                remainingStock:
                  Math.max(0, crate.remainingStock - 1),
              }
            : crate
        )
      );

      try {
        // Simulate a successful asynchronous response.
        await simulateClaimRequest();

        setFeedbackById((previous) => ({
          ...previous,
          [crateId]: "Claim confirmed! (Demo)",
        }));
      } finally {
        // Always release the in-flight lock.
        inFlightIds.current.delete(crateId);

        setPendingIds((previous) => {
          const next = new Set(previous);
          next.delete(crateId);
          return next;
        });
      }
    },
    [crates]
  );

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
            Vietnam Championship
            <span> Airdrop Arena</span>
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
              isPending={pendingIds.has(crate.id)}
              feedback={feedbackById[crate.id] ?? ""}
              onClaim={(id) => {
                void handleClaim(id);
              }}
            />
          ))}
        </div>
      </section>

      {/* Vietnam Squad Leaderboard */}
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
                {mockSquads.map((squad) => {
                  const total =
                    squad.placementPts +
                    squad.killPts;

                  return (
                    <tr key={squad.squadId}>
                      <th scope="row">
                        {squad.squadName}
                      </th>

                      <td>{squad.wwcdCount}</td>
                      <td>{squad.placementPts}</td>
                      <td>{squad.killPts}</td>

                      <td className="total-points">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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
