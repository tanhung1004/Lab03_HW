
import { mockCrates } from "./data/mockCrates";
import { mockSquads } from "./data/mockSquads";
import { useAirdropTimer } from "./hooks/useAirdropTimer";
import "./style.css";

// Format Vietnamese currency.
const formatVnd = (amount: number): string => {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
};

// Countdown component for each crate.
interface CrateCountdownProps {
  targetEpochMs: number;
}

function CrateCountdown({
  targetEpochMs,
}: CrateCountdownProps) {
  const { remainingMs, isLive } =
    useAirdropTimer(targetEpochMs);

  const totalSeconds = Math.ceil(remainingMs / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const timeText = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");

  return (
    <strong
      className="crate-countdown"
      role="timer"
      aria-label={
        isLive
          ? "Drop time reached"
          : `Time remaining: ${hours} hours, ${minutes} minutes, ${seconds} seconds`
      }
    >
      {isLive ? "DROP TIME REACHED" : timeText}
    </strong>
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

      {/* Airdrop & Ticket Cards */}
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
            <article
              key={crate.id}
              className="crate-card"
            >
              <div className="crate-top">
                <span
                  className="crate-icon"
                  aria-hidden="true"
                >
                  🎁
                </span>

                <span className="crate-status">
                  SCHEDULED
                </span>
              </div>

              <h3>{crate.title}</h3>

              <p className="crate-price">
                {formatVnd(crate.priceVnd)}
              </p>

              <div className="crate-details">
                <p>
                  <span>Remaining Stock</span>

                  <strong>
                    {crate.remainingStock}
                  </strong>
                </p>

                <p>
                  <span>Drop Starts In</span>

                  <CrateCountdown
                    targetEpochMs={crate.dropEpochMs}
                  />
                </p>
              </div>

              <button
                type="button"
                className="claim-button"
                disabled
              >
                Claim — Coming Soon
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Vietnam Leaderboard */}
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

                      <td>
                        {squad.wwcdCount}
                      </td>

                      <td>
                        {squad.placementPts}
                      </td>

                      <td>
                        {squad.killPts}
                      </td>

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
