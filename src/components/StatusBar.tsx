import { GAME_DATA } from "../data/gameData";
import type { GameState } from "../types";

export function StatusBar({ state }: { state: GameState }) {
  const data = GAME_DATA[state.year];
  const total = data.scenes.length;
  return (
    <section className="status-band" aria-label="角色状态">
      <div className="stat">
        <span>当前话数</span>
        <strong>
          {state.monthIndex + 1}/{total}
        </strong>
      </div>
      <div className="stat">
        <span>研究可信度</span>
        <strong>{state.researchCredibility}/100</strong>
      </div>
      <div className="stat">
        <span>团队信任</span>
        <strong>{state.teamTrust}/100</strong>
      </div>
      <div className="stat">
        <span>生活平衡</span>
        <strong>{state.lifeBalance}/100</strong>
      </div>
    </section>
  );
}
