
import { useCallback, useRef, useState } from "react";

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

import type {
  DropPhase,
  PubgCrateDrop,
} from "./types/arena";

import "./style.css";

/**
 * HW3-08 — Optimistic Claim & Conflict Rollback
 *
 * - Update inventory immediately on Claim.
 * - Simulate successful/failed API requests.
 * - Handle mock HTTP 409 Conflict.
 * - Roll back optimistic inventory.
 * - Prevent duplicate in-flight requests.
 */

type ClaimFeedback = {
  message: string;
  tone: "success" | "error" | "info";
};

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

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

interface CrateCardProps {
  crate: PubgCrateDrop;
  isPending: boolean;
  simulateConflict: boolean;
  feedback?: ClaimFeedback;
  onClaim: (crateId: string) => void;
  onToggleConflict: (
    crateId: string,
    enabled: boolean
  ) => void;
}

function CrateCard({
  crate,
  isPending,
  simulateConflict,
  feedback,
  onClaim,
  onToggleConflict,
}: CrateCardProps) {
  const { remainingMs, nowMs } =
    useAirdropTimer(crate.dropEpochMs);

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
  let claimText = "Claim — Unavailable";

  switch (phase) {
    case "WARMUP":
      timerTitle = "Drop Starts In";
      timerText = formatCountdown(remainingMs);
      claimText = "Claim — Opens Soon";
      break;

    case "AIRDROP_LIVE":
      timerTitle = "Drop Ends In";
      timerText = formatCountdown(liveRemainingMs);
      claimText = "Claim Reward";
      break;

    case "LOOTED_OUT":
      timerText = "All Rewards Claimed";
      claimText = "Sold Out";
      break;

    case "EXPIRED":
      timerText = "Event Window Closed";
      claimText = "Drop Expired";
      break;
  }

  if (isPending) {
    claimText = "Processing Claim...";
  }

  const canClaim =
    phase === "AIRDROP_LIVE" && !isPending;

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
            aria-label={`${phaseLabel}: ${timerText}`}
          >
            {timerText}
          </strong>
        </p>
      </div>

      {/* Claim button */}
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
          fontWeight: 700,
        }}
      >
        {claimText}
      </button>

      {/* Force a 409 response to test rollback */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 14,
          fontSize: 13,
          color: "#cbd5e1",
          cursor: isPending ? "not-allowed" : "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={simulateConflict}
          disabled={isPending}
          onChange={(event) =>
            onToggleConflict(
              crate.id,
              event.target.checked
            )
          }
        />

        Simulate HTTP 409 (Demo)
      </label>

      {/* Result message */}
      {feedback && (
        <p
          role={
            feedback.tone === "error"
              ? "alert"
              : "status"
          }
          style={{
            color: feedbackColor,
            fontSize: 13,
            lineHeight: 1.5,
            marginTop: 12,
          }}
        >
          {feedback.message}
        </p>
      )}
    </article>
  );
}

export default function App() {
  // Local optimistic inventory.
  const [crates, setCrates] = useState<PubgCrateDrop[]>(
    () => mockCrates.map((crate) => ({ ...crate }))
  );

  // Pending requests, one per crate.
  const [pendingIds, setPendingIds] = useState<Set<string>>(
    () => new Set()
  );

  // Conflict testing switch, one per crate.
  const [conflictIds, setConflictIds] = useState<Set<string>>(
    () => new Set()
  );

  // Claim status messages.
  const [feedbackById, setFeedbackById] = useState<
    Record<string, ClaimFeedback>
  >({});

  // Synchronous in-flight locking.
  const inFlightIds = useRef<Set<string>>(new Set());

  // Enable or disable forced 409 for a crate.
  const handleToggleConflict = useCallback(
    (crateId: string, enabled: boolean) => {
      setConflictIds((previous) => {
        const next = new Set(previous);

        if (enabled) {
          next.add(crateId);
        } else {
          next.delete(crateId);
        }

        return next;
      });
    },
    []
  );

  /**
   * HW3-08: Optimistic claim with rollback.
   */
  const handleClaim = useCallback(
    async (crateId: string) => {
      // Block repeated clicks before React rerenders.
      if (inFlightIds.current.has(crateId)) {
        return;
      }

      const currentCrate = crates.find(
        (crate) => crate.id === crateId
      );

      if (!currentCrate) return;

      // Validate current client time and stock.
      const phase = getDropPhase(
        currentCrate,
        Date.now()
      );

      if (
        phase !== "AIRDROP_LIVE" ||
        currentCrate.remainingStock <= 0
      ) {
        return;
      }

      const shouldSimulate409 =
        conflictIds.has(crateId);

      // Lock synchronously.
      inFlightIds.current.add(crateId);

      setPendingIds((previous) => {
        const next = new Set(previous);
        next.add(crateId);
        return next;
      });

      setFeedbackById((previous) => ({
        ...previous,
        [crateId]: {
          message: "Sending claim request...",
          tone: "info",
        },
      }));

      /**
       * Optimistic update:
       * inventory decreases before server response.
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
        // Simulated server request.
        const result = await requestClaim(
          crateId,
          shouldSimulate409
        );

        /**
         * Success:
         * synchronize local inventory with
         * the mock server's authoritative stock.
         */
        setCrates((previous) =>
          previous.map((crate) =>
            crate.id === crateId
              ? {
                  ...crate,
                  remainingStock: result.remainingStock,
                }
              : crate
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
      } catch (error) {
        if (error instanceof MockHttpError) {
          /**
           * HTTP 409 rollback:
           * restore authoritative server inventory.
           *
           * If stock really sold out, server stock may
           * be 0 rather than the old optimistic value.
           */
          setCrates((previous) =>
            previous.map((crate) =>
              crate.id === crateId
                ? {
                    ...crate,
                    remainingStock:
                      error.remainingStock,
                  }
                : crate
            )
          );

          setFeedbackById((previous) => ({
            ...previous,
            [crateId]: {
              message:
                `HTTP ${error.status} Conflict — ` +
                `claim rejected. Inventory synchronized.`,
              tone: "error",
            },
          }));

          console.warn(
            "Mock claim conflict:",
            error.message
          );
        } else {
          /**
           * Unexpected failure:
           * revert this request's optimistic decrement.
           */
          setCrates((previous) =>
            previous.map((crate) =>
              crate.id === crateId
                ? {
                    ...crate,
                    remainingStock:
                      crate.remainingStock + 1,
                  }
                : crate
            )
          );

          setFeedbackById((previous) => ({
            ...previous,
            [crateId]: {
              message:
                "Claim failed. Optimistic stock reverted.",
              tone: "error",
            },
          }));

          console.error(
            "Unexpected claim error:",
            error
          );
        }
      } finally {
        // Always release the request lock.
        inFlightIds.current.delete(crateId);

        setPendingIds((previous) => {
          const next = new Set(previous);
          next.delete(crateId);
          return next;
        });
      }
    },
    [crates, conflictIds]
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
              simulateConflict={
                conflictIds.has(crate.id)
              }
              feedback={feedbackById[crate.id]}
              onClaim={(id) => {
                void handleClaim(id);
              }}
              onToggleConflict={
                handleToggleConflict
              }
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
