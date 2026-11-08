import { PHASE_LABELS } from "../domain/relationshipMachine";
import type { RelationshipPhase } from "../types/relationship";

interface Props {
  phase: RelationshipPhase;
  onStartDating: () => void;
  onCommit: () => void;
  onExit: () => void;
  onReset: () => void;
}

const steps: readonly RelationshipPhase[] = [
  "STRANGERS",
  "DATING_NO_LOVE",
  "COMMITTED",
  "SELF_RESPECT_EXIT",
];

export default function RelationshipStatus({
  phase,
  onStartDating,
  onCommit,
  onExit,
  onReset,
}: Props) {
  return (
    <section className="panel phase-panel" aria-labelledby="phase-title">
      <div className="panel-heading">
        <span className="kicker">01 / FINITE STATE MACHINE</span>
        <h2 id="phase-title">Chúng ta đang là gì?</h2>
        <p>Chỉ một trạng thái tại một thời điểm. Không còn Boolean soup.</p>
      </div>
      <ol className="phase-track" aria-label="Các trạng thái của quan hệ">
        {steps.map((step, index) => (
          <li
            key={step}
            className={`phase-step ${phase === step ? "phase-step--active" : ""}`}
            aria-current={phase === step ? "step" : undefined}
          >
            <span className="phase-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="phase-name">{PHASE_LABELS[step]}</span>
            {phase === step && <span className="phase-current">ĐANG Ở ĐÂY</span>}
          </li>
        ))}
      </ol>
      <div className="action-grid">
        <button className="button button--primary" type="button" onClick={onStartDating} disabled={phase !== "STRANGERS"}>
          Bắt đầu hẹn hò
        </button>
        <button className="button button--outline" type="button" onClick={onCommit} disabled={phase !== "DATING_NO_LOVE"}>
          Cam kết rõ ràng
        </button>
        <button className="button button--danger" type="button" onClick={onExit} disabled={phase !== "DATING_NO_LOVE" && phase !== "COMMITTED"}>
          Chọn bản thân
        </button>
        <button className="button button--muted" type="button" onClick={onReset}>
          Bắt đầu lại ↺
        </button>
      </div>
    </section>
  );
}
