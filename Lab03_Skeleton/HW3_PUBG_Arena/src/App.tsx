
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
 * HW3-06 — PUBG Vietnam Arena
 * Adds a four-state Airdrop Phase State Machine.
 */

// Vietnamese currency formatter.
function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

// Display milliseconds as HH:MM:SS.
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

// Phase-specific colors.
const phaseColors: Record<DropPhase, string> = {
  WARMUP: "#fbbf24",
  AIRDROP_LIVE: "#34d399",
  LOOTED_OUT: "#fb7185",
  EXPIRED: "#94a3b8",
};

interface CrateCardProps {
  crate: PubgCrateDrop;
}

function CrateCard({ crate }: CrateCardProps) {
  const { remainingMs, nowMs } = useAirdropTimer(
    crate.dropEpochMs
  );

  // HW3-06: Derive phase from time and stock.
  const phase = getDropPhase(crate, nowMs);
  const phaseLabel = getPhaseLabel(phase);

  const closesAt =
    crate.dropEpochMs + DROP_LIVE_DURATION_MS;

  const liveRemainingMs = Math.max(
    0,
    closesAt - nowMs
  );

  // Determine what the card should display.
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

      // Claim functionality is not implemented yet.
      claimText = "Claim — Coming in HW3-07";
      break;

    case "LOOTED_OUT":
      timerTitle = "Drop Status";
      timerText = "All Rewards Claimed";
      claimText = "Sold Out";
      break;

    case "EXPIRED":
      timerTitle = "Drop Status";
      timerText = "Event Window Closed";
      claimText = "Drop Expired";
      break;
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

      {/* Claim logic belongs to a later task. */}
      <button
        type="button"
        className="claim-button"
        disabled
      >
        {claimText}
      </button>
    </article>
  );
}

export default function App() {
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
              <strong>{mockCrates.length}</strong>
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
          {mockCrates.map((crate) => (
            <CrateCard
              key={crate.id}
              crate={crate}
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
