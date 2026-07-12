import { CHARACTERS, AFFINITY_GATE, AFFINITY_TRUE, MENTOR_TEACHINGS } from "../game/content";
import { bestRoute, formatNav, isBestPartner } from "../game/engine";
import type { CharacterId, CharacterProfile, GameState, MentorId } from "../types";

type EndingCopy = { title: string; copy: string };
type EndingContext = {
  state: GameState;
  lead: CharacterProfile;
  leadId: CharacterId;
  leadRelation: number;
  partner: boolean;
};
type EndingResolver = (context: EndingContext) => EndingCopy | null;

const DEFAULT_ENDING: EndingCopy = {
  title: "普通结局：可靠研究员线",
  copy: "你还没有解锁最高评价，但每一次复盘都在让下一周目更接近好结局。",
};

function partnerEnding({ partner }: EndingContext): EndingCopy | null {
  if (!partner) return null;
  return {
    title: "最佳搭档线：框架与数据的好拍档",
    copy: "你没和谁谈恋爱。你和赵承宇是投研部里最合拍的一对好搭档——一个把假设钉进框架，一个把框架接进数据和回测。平时互相兜底、出手一起扛，这一年组合里回撤最可控、落地最稳的几笔，都写着你们俩的名字。",
  };
}

function relationshipEnding({ state, lead, leadRelation }: EndingContext): EndingCopy | null {
  const trueEnding =
    leadRelation >= AFFINITY_TRUE && state.researchCredibility >= 80 && state.teamTrust >= 70;
  if (trueEnding) {
    return {
      title: `真结局·心动线：${lead.name}的认可`,
      copy: `你不仅把研究可信度推到行业前沿，和${lead.name}的关系也走到了最深处。这一年的研究札记里，最值得存档的不是研报，是你们一起验证过的信任。`,
    };
  }

  const goodEnding =
    leadRelation >= AFFINITY_GATE &&
    state.researchCredibility >= 60 &&
    state.lifeBalance >= 50;
  if (!goodEnding) return null;
  return {
    title: `好结局·默契线：${lead.name}的并肩`,
    copy: `你和${lead.name}的研究默契被这一年反复验证。即便没打出真结局，也已经是最稳的搭档。`,
  };
}

function careerEnding({ state, lead }: EndingContext): EndingCopy | null {
  if (state.researchCredibility >= 80 && state.teamTrust >= 70) {
    return {
      title: `真结局：${lead.name}认可的研究员`,
      copy: `一年时间，你把研究可信度推到行业前沿。${lead.name}说，你的研究札记值得存档。`,
    };
  }
  if (state.researchCredibility >= 60 && state.lifeBalance >= 50) {
    return {
      title: `好结局：${lead.name}的闪耀研究员线`,
      copy: `研究可信度和生活平衡同时在线，${lead.name}开始把你的名字和主线研究放在一起。`,
    };
  }
  return null;
}

function routeEnding({ state, lead, leadRelation }: EndingContext): EndingCopy | null {
  if (state.flags.route_research && state.researchCredibility >= 70) {
    return {
      title: "研究宗师线：深度即壁垒",
      copy: "这一年你几乎把所有夜晚都押在了深度研究上。圈内开始用你的框架命名现象——当研究本身成了招牌，捷径反而成了最远的路。",
    };
  }
  if (state.flags.route_relation && leadRelation >= AFFINITY_GATE) {
    return {
      title: `圈子线：自己人·${lead.name}的人脉网`,
      copy: "你不是单打独斗的研究员。那些顺手帮的忙、那些闭门路演的席位，最终织成了一张只属于「自己人」的网。",
    };
  }
  if (state.flags.route_balanced && state.lifeBalance >= 60) {
    return {
      title: "清醒线：不透支的研究者",
      copy: "你守住了生活，也守住了判断力。别人在熬夜里把信号熬成了噪声，你却在下午茶里看穿了缝。",
    };
  }
  if (state.flags.route_burnout && state.fatigue >= 80) {
    return {
      title: "透支警示线：研究还在，人快没了",
      copy: "你一次次把休息推到明天。研究札记很漂亮，体检报告很难看。下一周目，先把人留住。",
    };
  }
  return null;
}

function fallbackEnding({ state }: EndingContext): EndingCopy | null {
  if (state.fatigue >= 85) {
    return {
      title: "疲劳结局：深夜复盘线",
      copy: "你完成了很多研究，也把自己逼到极限。下一周目前，先让疲劳值降下来。",
    };
  }
  if (state.committeeAdoption >= 50) {
    return {
      title: "成长结局：投委会入场线",
      copy: "你还没有打出真结局，但终于进入同事们愿意认真期待的主线。",
    };
  }
  return null;
}

const ENDING_RESOLVERS: EndingResolver[] = [
  partnerEnding,
  relationshipEnding,
  careerEnding,
  routeEnding,
  fallbackEnding,
];

function resolveEnding(context: EndingContext): EndingCopy {
  for (const resolver of ENDING_RESOLVERS) {
    const ending = resolver(context);
    if (ending) return ending;
  }
  return DEFAULT_ENDING;
}

export function EndingPanel({ state }: { state: GameState }) {
  if (!state.finished || state.history.length === 0) return null;

  const partner = isBestPartner(state);
  const leadId = partner ? "zhao_chengyu" : bestRoute(state);
  const lead = CHARACTERS[leadId];
  const leadRelation = state.relations[leadId];
  const { title, copy } = resolveEnding({ state, lead, leadId, leadRelation, partner });

  const mentorIds: MentorId[] = ["lin_ruoning", "chen_xinghe", "zhou_mingzhao"];
  const ledger = mentorIds.map((id) => {
    const collected = state.knowledgeCards.filter((card) => card.mentorId === id);
    const total = Object.keys(MENTOR_TEACHINGS[id]).length;
    return { id, name: CHARACTERS[id].name, collected, total };
  });

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
          <dt>推荐跟踪净值</dt>
          <dd>{formatNav(state.portfolioNav)}</dd>
        </div>
        <div>
          <dt>本线关系（{lead.name}）</dt>
          <dd>{state.relations[leadId]}/100</dd>
        </div>
        <div>
          <dt>林若宁、陈星禾、周明昭</dt>
          <dd>
            {state.relations.lin_ruoning}、{state.relations.chen_xinghe}、{state.relations.zhou_mingzhao}
          </dd>
        </div>
        <div>
          <dt>研究图鉴</dt>
          <dd>
            {ledger.map((row) => (
              <div key={row.id} className="ledger-row">
                <span className="ledger-name">{row.name}</span>
                <span className="ledger-count">{row.collected.length}/{row.total}</span>
                <span className="ledger-chips">
                  {row.collected.length === 0
                    ? <span className="ledger-empty">这一遍还没从 TA 那学到手艺</span>
                    : row.collected.map((card) => (
                        <span key={card.id} className="ledger-chip" title={card.concept}>{card.concept}</span>
                      ))}
                </span>
              </div>
            ))}
          </dd>
        </div>
      </dl>
    </section>
  );
}
