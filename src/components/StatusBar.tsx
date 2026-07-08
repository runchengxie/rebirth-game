import { GAME_DATA } from "../data/gameData";
import { formatMoney, totalAffection } from "../game/engine";
import type { GameState } from "../types";

export function StatusBar({ state }: { state: GameState }) {
  const data = GAME_DATA[state.year];
  const total = data.months.length;
  return (
    <section className="status-band" aria-label="角色状态">
      <div className="stat">
        <span>当前话数</span>
        <strong>
          {state.monthIndex + 1}/{total}
        </strong>
      </div>
      <div className="stat">
        <span>小金库余额</span>
        <strong>{formatMoney(state.capital)}</strong>
      </div>
      <div className="stat">
        <span>总好感</span>
        <strong>{totalAffection(state)}/300</strong>
      </div>
      <div className="stat">
        <span>疲劳值</span>
        <strong>{state.fatigue}/100</strong>
      </div>
    </section>
  );
}
