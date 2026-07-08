import { CHARACTERS } from "../game/content";
import { bestRoute, formatNav } from "../game/engine";
import type { GameState } from "../types";

export function EndingPanel({ state }: { state: GameState }) {
  if (!state.finished || state.history.length === 0) return null;
  const colleague = CHARACTERS[bestRoute(state)];
  let title = "普通结局：可靠研究员线";
  let copy = "你还没有解锁最高评价，但每一次复盘都在让下一周目更接近好结局。";

  if (state.researchCredibility >= 80 && state.teamTrust >= 70) {
    title = `真结局：${colleague.name}认可的研究员`;
    copy = `一年时间，你把研究可信度推到行业前沿。${colleague.name}说，你的研究札记值得存档。`;
  } else if (state.researchCredibility >= 60 && state.lifeBalance >= 50) {
    title = `好结局：${colleague.name}的闪耀研究员线`;
    copy = `研究可信度和生活平衡同时在线，${colleague.name}开始把你的名字和主线研究放在一起。`;
  } else if (state.fatigue >= 85) {
    title = "疲劳结局：深夜复盘线";
    copy = "你完成了很多研究，也把自己逼到极限。下一周目前，先让疲劳值降下来。";
  } else if (state.committeeAdoption >= 50) {
    title = "成长结局：投委会入场线";
    copy = "你还没有打出真结局，但终于进入同事们愿意认真期待的主线。";
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
          <dt>研究可信度</dt>
          <dd>{state.researchCredibility}/100</dd>
        </div>
        <div>
          <dt>投委会采纳度</dt>
          <dd>{state.committeeAdoption}/100</dd>
        </div>
        <div>
          <dt>组合模拟净值</dt>
          <dd>{formatNav(state.portfolioNav)}</dd>
        </div>
        <div>
          <dt>林若宁、陈星禾、周明昭</dt>
          <dd>
            {state.relations.lin_ruoning}、{state.relations.chen_xinghe}、{state.relations.zhou_mingzhao}
          </dd>
        </div>
      </dl>
    </section>
  );
}
