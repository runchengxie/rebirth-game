import { CHARACTERS } from "../game/content";
import { formatDelta, formatMoneyFull, formatPct, signalType } from "../game/engine";
import type { RoundResult } from "../types";

export function HistoryPanel({ history }: { history: RoundResult[] }) {
  if (history.length === 0) return null;
  return (
    <section className="history-panel">
      <div className="history-head">
        <h2>存档回放</h2>
        <span className="meta">{history.length} / 12</span>
      </div>
      <div className="history-table-wrap">
        <table>
          <thead>
            <tr>
              <th>章节</th>
              <th>实战选择</th>
              <th>市场与执行</th>
              <th>参考路线</th>
              <th>结算</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.month}>
                <td>
                  {item.label}
                  <br />
                  <span className="meta">{item.story.title}</span>
                </td>
                <td>
                  {item.selected.name}
                  <br />
                  <span className="meta">
                    {CHARACTERS[item.characterId].name}路线 · {signalType(item.selected)} · {item.selected.tsCode}
                  </span>
                </td>
                <td>
                  <span className={`return ${item.marketRate >= 0 ? "up" : "down"}`}>{formatPct(item.marketRate)}</span>
                  <br />
                  <span className="meta">
                    {item.focus.label} {formatPct(item.executionRate)}
                  </span>
                </td>
                <td>
                  {item.best.name}
                  <br />
                  <span className="meta">{formatPct(item.best.returnRate)}</span>
                </td>
                <td>
                  {formatMoneyFull(item.after)}
                  <br />
                  <span className="meta">
                    闪耀 {formatDelta(item.outcome.reputationDelta)} · 疲劳 {formatDelta(item.outcome.fatigueDelta)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
