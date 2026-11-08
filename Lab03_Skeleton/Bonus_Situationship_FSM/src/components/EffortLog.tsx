import type { EffortMetrics } from "../domain/effortAnalysis";
import type { EffortSignal, HistoryEntry } from "../types/relationship";

interface Props {
  efforts: readonly EffortSignal[];
  history: readonly HistoryEntry[];
  metrics: EffortMetrics;
}

export default function EffortLog({ efforts, history, metrics }: Props) {
  return (
    <section className="panel log-panel" aria-labelledby="log-title">
      <div className="panel-heading panel-heading--inline">
        <div>
          <span className="kicker">04 / IMMUTABLE ACTION LOG</span>
          <h2 id="log-title">Nhật ký tín hiệu</h2>
        </div>
        <span className="pill">{efforts.length} tín hiệu</span>
      </div>

      <div className="log-columns">
        <div>
          <h3>Effort Signals</h3>
          {efforts.length === 0 ? (
            <p className="empty-state">Chưa có nỗ lực nào. Thử nạp ví dụ 100 vs 1.</p>
          ) : (
            <div className="table-scroll" role="region" aria-label="Bảng lịch sử nỗ lực" tabIndex={0}>
              <table className="data-table">
                <thead><tr><th scope="col">Người</th><th scope="col">Lần</th><th scope="col">Hệ số</th><th scope="col">Điểm</th></tr></thead>
                <tbody>
                  {efforts.map((signal) => (
                    <tr key={signal.id}>
                      <th scope="row">{signal.actor === "EM" ? "Em" : "Ai Đó"}</th>
                      <td>{signal.steps}</td>
                      <td>×{signal.multiplier}</td>
                      <td>{(signal.steps * signal.multiplier).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><th scope="row">Tổng</th><td>{metrics.emSteps + metrics.otherSteps}</td><td>—</td><td>{metrics.totalScore.toFixed(1)}</td></tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        <div>
          <h3>Activity Timeline</h3>
          {history.length === 0 ? (
            <p className="empty-state">Các chuyển trạng thái và sự kiện sẽ xuất hiện tại đây.</p>
          ) : (
            <ol className="timeline">
              {history.map((entry) => (
                <li key={entry.id}>
                  <time dateTime={new Date(entry.timestamp).toISOString()}>
                    {new Date(entry.timestamp).toLocaleTimeString("vi-VN", { hour12: false })}
                  </time>
                  <span>{entry.description}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
