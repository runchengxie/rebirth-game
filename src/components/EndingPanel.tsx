import { GAME_DATA } from "../data/gameData";
import { CHARACTERS } from "../game/content";
import { bestRoute, formatMoneyFull } from "../game/engine";
import type { GameState } from "../types";

export function EndingPanel({ state }: { state: GameState }) {
  if (!state.finished || state.history.length === 0) return null;
  const data = GAME_DATA[state.year];
  const hits = state.history.filter((item) => item.hit).length;
  const multiple = state.capital / state.initialCapital;
  const heroine = CHARACTERS[bestRoute(state)];
  let title = "普通结局：可靠投研部员线";
  let copy = "你还没有解锁传说图鉴，但每一次复盘都在让下一周目更接近好结局。";

  if (state.capital >= data.targetCapital) {
    title = `真结局：${heroine.name}的亿级心动 K 线`;
    copy = `一年时间，你把小金库推到亿级目标。${heroine.name}说，这条路线一定要存档。`;
  } else if (multiple >= 20 && state.reputation >= 60) {
    title = `好结局：${heroine.name}的闪耀研究员线`;
    copy = `小金库曲线和闪耀度同时起飞，${heroine.name}开始把你的名字和主线剧情放在一起。`;
  } else if (state.fatigue >= 82) {
    title = "疲劳结局：深夜复盘线";
    copy = "你赚到了一些钱，也把自己逼到极限。下一周目前，先让疲劳值降下来。";
  } else if (hits >= 3 || multiple >= 5) {
    title = "成长结局：主线入场线";
    copy = "你还没有打出真结局，但终于进入女主们愿意认真期待的主线。";
  }

  return (
    <section className="ending-panel">
      <div>
        <span className="panel-kicker">结局</span>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <dl>
        <div>
          <dt>最终小金库</dt>
          <dd>{formatMoneyFull(state.capital)}</dd>
        </div>
        <div>
          <dt>参考路线</dt>
          <dd>
            {hits}/{state.history.length}
          </dd>
        </div>
        <div>
          <dt>璃奈、美咲、芽衣</dt>
          <dd>
            {state.affection.rina}、{state.affection.misaki}、{state.affection.mei}
          </dd>
        </div>
      </dl>
    </section>
  );
}
