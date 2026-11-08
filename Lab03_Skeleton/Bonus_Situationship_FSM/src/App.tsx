import { useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import EffortLog from "./components/EffortLog";
import RelationshipStatus from "./components/RelationshipStatus";
import { deriveEffortMetrics } from "./domain/effortAnalysis";
import { EFFORT_WEIGHTS, PHASE_LABELS } from "./domain/relationshipMachine";
import { REPLY_TIMEOUT_MS, useRelationshipMachine } from "./hooks/useRelationshipMachine";
import type { EffortActor } from "./types/relationship";

/** Bonus exercise entry point, per the slide's <SituationshipAnalyzer /> contract. */
function SituationshipAnalyzer() {
  const {
    state,
    remainingMs,
    startDating,
    commit,
    exit,
    switchToOther,
    reset,
    loadDemo,
    logEffort,
    sendMessage,
    receiveReply,
    ignoreMessage,
  } = useRelationshipMachine();

  const actorInputId = useId();
  const stepsInputId = useId();
  const [actor, setActor] = useState<EffortActor>("EM");
  const [steps, setSteps] = useState("100");
  const [formMessage, setFormMessage] = useState("");

  const metrics = useMemo(
    () => deriveEffortMetrics(state.efforts, state.message.status),
    [state.efforts, state.message.status]
  );

  const canInteract = state.phase === "DATING_NO_LOVE" || state.phase === "COMMITTED";
  const isWaiting = state.message.status === "WAITING";
  const warningText = metrics.redFlags.length > 0
    ? metrics.redFlags.join(" ")
    : state.notice;

  function submitEffort(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(steps);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
      setFormMessage("Nhập số nguyên từ 1 đến 1000.");
      return;
    }
    if (!canInteract) {
      setFormMessage("Hãy bắt đầu hẹn hò trước khi ghi nỗ lực.");
      return;
    }
    logEffort(actor, parsed);
    setFormMessage(`Đã lưu ${parsed} lượt của ${actor === "EM" ? "Em" : "Ai Đó"}.`);
  }

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progress = isWaiting ? (remainingMs / REPLY_TIMEOUT_MS) * 100 : 0;

  return (
    <main className="app-shell">
      <div className="topbar">
        <a className="logo" href="#top" aria-label="Về đầu trang">
          <span className="logo-icon" aria-hidden="true">♡</span>
          <span>LAB 03 <span className="logo-soft">/ BONUS</span></span>
        </a>
        <div className="topbar-meta"><span className="top-dot" /> INTERACTIVE FSM EXPERIMENT</div>
      </div>

      <header className="hero" id="top">
        <div className="hero-text">
          <span className="eyebrow"><span className="eyebrow-line" /> RELATIONSHIP STATE MACHINE · REACT 19</span>
          <h1>Hẹn hò<br /><span>nhưng không yêu.</span></h1>
          <p className="hero-description">Một phòng thí nghiệm nhỏ để giải mã mối quan hệ mập mờ — bằng <strong>Finite State Machine</strong>, bất đối xứng nỗ lực và bộ đếm “Seen không rep”.</p>
          <div className="hero-actions">
            <button className="button button--primary" type="button" onClick={loadDemo}>✦ Thử kịch bản 100 vs 1</button>
            <span className="hero-caption">Pure reducer · Immutable logs · AbortController</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-glow" />
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-center"><span>♡</span><small>it's complicated</small></div>
          <div className="visual-note visual-note-top">?? <span>no labels</span></div>
          <div className="visual-note visual-note-bottom">100× <span>effort</span></div>
        </div>
      </header>

      <div className="status-strip" aria-label="Tổng quan phiên phân tích">
        <div><span>TRẠNG THÁI</span><strong>{PHASE_LABELS[state.phase]}</strong></div>
        <div><span>EFFORT SIGNALS</span><strong>{state.efforts.length.toString().padStart(2, "0")}</strong></div>
        <div><span>WEIGHTED SCORE</span><strong>{metrics.totalScore.toFixed(1)}</strong></div>
        <div><span>TIN NHẮN</span><strong>{state.message.status.replaceAll("_", " ")}</strong></div>
      </div>

      <div className="dashboard-grid">
        <RelationshipStatus
          phase={state.phase}
          onStartDating={startDating}
          onCommit={commit}
          onExit={exit}
          onReset={reset}
        />

        <section className="panel effort-panel" aria-labelledby="effort-title">
          <div className="panel-heading">
            <span className="kicker">02 / ASYMMETRIC EFFORT</span>
            <h2 id="effort-title">Cố trăm lần, có bằng một phần?</h2>
            <p>Điểm được tính thuần từ lịch sử hành động, không lưu giá trị tổng dư thừa.</p>
          </div>

          <div className="score-duo">
            <div className="score-box score-box--me"><span>EM</span><strong>{metrics.emScore.toFixed(1)}</strong><small>{metrics.emSteps} lần × {EFFORT_WEIGHTS.EM}</small></div>
            <div className="score-versus">VS</div>
            <div className="score-box score-box--other"><span>AI ĐÓ</span><strong>{metrics.otherScore.toFixed(1)}</strong><small>{metrics.otherSteps} lần × {EFFORT_WEIGHTS.AI_DO}</small></div>
          </div>
          <div className="effort-bars" aria-label="Tỉ lệ điểm nỗ lực có trọng số">
            <div className="bar-heading"><span>WEIGHTED SHARE</span><span>{metrics.emPercent.toFixed(0)}% / {metrics.otherPercent.toFixed(0)}%</span></div>
            <div className="bar-track" role="img" aria-label={`Em ${metrics.emPercent.toFixed(0)} phần trăm; Ai Đó ${metrics.otherPercent.toFixed(0)} phần trăm`}>
              <div className="bar-em" style={{ width: `${metrics.emPercent}%` }} />
              <div className="bar-other" style={{ width: `${metrics.otherPercent}%` }} />
            </div>
            <p className="formula-note">Ví dụ: 100 × 0.1 = <strong>10</strong> &nbsp;vs&nbsp; 1 × 50 = <strong>50</strong></p>
          </div>

          <form className="effort-form" onSubmit={submitEffort} noValidate>
            <div className="field-row">
              <div className="field">
                <label htmlFor={actorInputId}>AI ĐÃ CỐ GẮNG?</label>
                <select id={actorInputId} value={actor} onChange={(event) => setActor(event.target.value as EffortActor)} disabled={!canInteract}>
                  <option value="EM">Em — hệ số ×0.1</option>
                  <option value="AI_DO">Ai Đó — hệ số ×50</option>
                </select>
              </div>
              <div className="field field--number">
                <label htmlFor={stepsInputId}>BAO NHIÊU LẦN?</label>
                <input id={stepsInputId} type="number" min={1} max={1000} step={1} value={steps} onChange={(event) => setSteps(event.target.value)} disabled={!canInteract} />
              </div>
            </div>
            <button type="submit" className="button button--outline button--full" disabled={!canInteract}>+ Ghi nhận effort</button>
            <p className="form-message" role="status" aria-live="polite">{formMessage || "Các tín hiệu được thêm vào danh sách bất biến."}</p>
          </form>
        </section>

        <section className="panel ghost-panel" aria-labelledby="ghost-title">
          <div className="panel-heading">
            <span className="kicker">03 / ABORTABLE ASYNC TIMER</span>
            <h2 id="ghost-title">Seen không rep.</h2>
            <p>Gửi tin nhắn sẽ kích hoạt timer 5 giây. Rep, bỏ qua hoặc chuyển trạng thái sẽ hủy Promise.</p>
          </div>
          <div className={`phone-card ${isWaiting ? "phone-card--active" : ""}`}>
            <div className="phone-top"><span className="avatar">A</span><div><strong>Ai Đó</strong><span>{isWaiting ? "đang online..." : "Messenger simulator"}</span></div><span className="phone-dots" aria-hidden="true">•••</span></div>
            <div className="bubble-area">
              <span className="chat-bubble">Hôm nay chúng mình là gì vậy? ♡</span>
              <span className="chat-seen">{state.message.status === "IDLE" ? "Chưa gửi" : state.message.status === "REPLIED" ? "Đã trả lời ✓" : state.message.status === "WAITING" ? "Seen · đang chờ..." : state.message.status === "IGNORED" ? "Ignored" : "Seen · không phản hồi"}</span>
            </div>
            <div className="timer-topline"><span>REPLY WINDOW</span><strong>{isWaiting ? `${remainingSeconds}s` : "—"}</strong></div>
            <div className="timer-progress" role="progressbar" aria-label="Thời gian chờ phản hồi" aria-valuemin={0} aria-valuemax={5} aria-valuenow={isWaiting ? remainingSeconds : 0}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="ghost-actions">
            <button type="button" className="button button--primary button--full" onClick={sendMessage} disabled={!canInteract || isWaiting}>Gửi tin nhắn ↗</button>
            <button type="button" className="button button--outline" onClick={receiveReply} disabled={!isWaiting}>✓ Đã rep</button>
            <button type="button" className="button button--danger" onClick={ignoreMessage} disabled={!isWaiting}>Seen & bỏ qua</button>
            <button type="button" className="button button--muted button--full" onClick={switchToOther} disabled={!canInteract}>Chuyển sang “Ai Đó” → hủy chờ</button>
          </div>
        </section>
      </div>

      <section className={`alert-panel ${metrics.redFlags.length > 0 ? "alert-panel--warning" : ""}`} aria-labelledby="alert-title">
        <div className="alert-icon" aria-hidden="true">{metrics.redFlags.length ? "!" : "♡"}</div>
        <div>
          <span className="kicker">LIVE ACCESSIBLE FEEDBACK</span>
          <h2 id="alert-title">{metrics.redFlags.length ? "Red flag detected" : "Signal Monitor"}</h2>
          <output role="status" aria-live="polite" aria-atomic="true">{warningText}</output>
          {metrics.redFlags.length > 0 && <p className="alert-footnote">Đây là cảnh báo theo quy tắc demo, không phải đánh giá thực tế về con người hay mối quan hệ.</p>}
        </div>
      </section>

      <EffortLog efforts={state.efforts} history={state.history} metrics={metrics} />

      <footer className="footer">
        <span>LAB 03 · BONUS SITUATIONSHIP FSM</span>
        <span>TypeScript · useReducer · useEffect · AbortController · useId</span>
        <span>Academic demo · Không phải công cụ tư vấn tâm lý.</span>
      </footer>
    </main>
  );
}

export default function App() {
  return <SituationshipAnalyzer />;
}
