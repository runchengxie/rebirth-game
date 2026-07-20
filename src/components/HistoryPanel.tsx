import { CHARACTERS } from "../game/content";
import { formatNav, formatPct } from "../game/engine";
import type { RoundResult } from "../types";

export function HistoryPanel({ history }: { history: RoundResult[] }) {
  if (history.length === 0) return null;
  return (
    <section className="history-panel">
      <div className="history-head">
        <h2>研究札记</h2>
        <span className="meta">{history.length} / 12</span>
      </div>
      <div className="history-table-wrap">
        <table>
          <thead>
            <tr>
              <th>月份</th>
              <th>选择</th>
              <th>主题</th>
              <th>沪深300</th>
              <th>净值</th>
              <th>可信度</th>
              <th>团队</th>
              <th>生活</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.month}>
                <td>
                  {item.label}
                  <br />
                  <span className="meta">{item.sceneTitle}</span>
                </td>
                <td>
                  {item.selected.label}
                  <br />
                  <span className="meta">
                    {CHARACTERS[item.characterId].name}路线 · {item.selected.category}
                  </span>
                </td>
                <td>
                  <span className="meta">{item.marketTheme}</span>
                </td>
                <td>
                  <span className={item.marketReturn >= 0 ? "return-up" : "return-down"}>
                    {item.marketReturn === 0 ? "--" : formatPct(item.marketReturn)}
                  </span>
                </td>
                <td>
                  <strong>{formatNav(item.portfolioNavAfter)}</strong>
                </td>
                <td>
                  <strong>{item.researchCredibilityAfter}</strong>
                </td>
                <td>
                  <strong>{item.teamTrustAfter}</strong>
                </td>
                <td>
                  <strong>{item.lifeBalanceAfter}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
