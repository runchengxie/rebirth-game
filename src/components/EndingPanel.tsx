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

type SpecialEnding = EndingCopy & { leadId: CharacterId };

function lin2025Ending(state: GameState): SpecialEnding | null {
  if (state.flags.lin_route_committed) {
    return {
      leadId: "lin_ruoning",
      title: "真结局·第一张便签：明年也一起",
      copy: "林若宁很早就喜欢上了你。真正花掉一整年的，是确认你会尊重证据、兑现承诺，也愿意好好照顾自己。她把年初的便签翻到背面：明年的研究记录和下班以后，都一起安排。",
    };
  }
  if (state.flags.lin_route_slow_burn) {
    return {
      leadId: "lin_ruoning",
      title: "好结局·慢一点也算向前",
      copy: "你们没有用一句告白替代现实生活。林若宁牵住你的手，约好先认真走完年底，再一起决定下一年。她心动得早，你终于学会不把心动当成催促。",
    };
  }
  if (!state.flags.lin_route_regret) return null;
  const boundary = state.flags.lin_pressed_after_no
    ? "你在她明确拒绝后仍想用承诺换一次机会，让最后一点温柔也变成了压力。"
    : "你接受了她的决定，也终于明白，尊重告别是这段关系里最后一次能够做对的事。";
  return {
    leadId: "lin_ruoning",
    title: "遗憾结局·留在档案里的白月光",
    copy: `你们确实彼此喜欢过。失约、透支或拿结果代替证据，让她无法再把未来交给你。${boundary}那张旧便签留在研究档案里，因为这段关系原本真的能够成功。`,
  };
}

function chen2025Ending(state: GameState): SpecialEnding | null {
  if (state.flags.chen_route_committed) {
    return {
      leadId: "chen_xinghe",
      title: "真结局·长期样本：误差也一起记录",
      copy: "陈星禾喜欢你的判断，也确认你不会为了漂亮结论删掉失败区间。你们把观察窗口从一季拉到更久，工作以外的偏离、噪声和重新归因也都算进共同样本。",
    };
  }
  if (state.flags.chen_route_slow_burn) {
    return {
      leadId: "chen_xinghe",
      title: "好结局·继续测试：关系没有过拟合",
      copy: "你们暂时没有给关系一个完美标签，却开始诚实记录每次靠近和误差。陈星禾说，能在模型跑错以后还坐在一起，比短期共振更难得。",
    };
  }
  if (!state.flags.chen_route_regret) return null;
  return {
    leadId: "chen_xinghe",
    title: "遗憾结局·被筛选过的曲线",
    copy: "你们曾经很接近。那次被美化的回测让她意识到，只看漂亮区间的关系无法长期运行。你承认错误，却不能要求信任像撤销一次提交那样立刻恢复。",
  };
}

function zhou2025Ending(state: GameState): SpecialEnding | null {
  if (state.flags.zhou_route_committed) {
    return {
      leadId: "zhou_mingzhao",
      title: "真结局·长期情景：把彼此写进假设",
      copy: "周明昭没有承诺百分之百，也没有要求你永远正确。你们约定持续复核、尊重边界，在变化出现时重新讨论。她把你的名字留在了没有截止日期的长期情景里。",
    };
  }
  if (state.flags.zhou_route_slow_burn) {
    return {
      leadId: "zhou_mingzhao",
      title: "好结局·保留余地：稳健地靠近",
      copy: "你们没有把心动写成无条件保证。周明昭愿意和你并肩走一段，也保留彼此随时表达变化的权利。稳健没有削弱感情，反而让它有地方继续。",
    };
  }
  if (!state.flags.zhou_route_regret) return null;
  return {
    leadId: "zhou_mingzhao",
    title: "遗憾结局·越过的边界",
    copy: "她确实喜欢你，却不会用喜欢替你承担一次次破例。你把那次排名压力下的越界写进风险日志，终于明白关系没有止损单，边界仍然需要被尊重。",
  };
}

function highestRelationEnding(state: GameState, endings: SpecialEnding[]): SpecialEnding | null {
  return endings.sort((left, right) =>
    state.relations[right.leadId] - state.relations[left.leadId])[0] ?? null;
}

function special2025Ending(state: GameState): SpecialEnding | null {
  if (state.year !== "2025") return null;
  const candidates = [lin2025Ending(state), chen2025Ending(state), zhou2025Ending(state)]
    .filter((ending): ending is SpecialEnding => Boolean(ending));
  const committed = candidates.filter((ending) => ending.title.startsWith("真结局"));
  if (committed.length > 0) return highestRelationEnding(state, committed);
  const slowBurn = candidates.filter((ending) => ending.title.startsWith("好结局"));
  if (slowBurn.length > 0) return highestRelationEnding(state, slowBurn);
  return highestRelationEnding(state, candidates);
}

function partnerEnding({ partner }: EndingContext): EndingCopy | null {
  if (!partner) return null;
  return {
    title: "最佳搭档线：框架与数据的好拍档",
    copy: "你没和谁谈恋爱。你和赵承宇是投研部里最合拍的一对好搭档——一个把假设钉进框架，一个把框架接进数据和回测。平时互相兜底、出手一起扛，这一年组合里回撤最可控、落地最稳的几笔，都写着你们俩的名字。",
  };
}

function relationshipEnding({ state, lead, leadRelation }: EndingContext): EndingCopy | null {
  if (state.year === "2025" && lead.id !== "zhao_chengyu") return null;
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

  const specialEnding = special2025Ending(state);
  const partner = !specialEnding && isBestPartner(state);
  const leadId = specialEnding?.leadId ?? (partner ? "zhao_chengyu" : bestRoute(state));
  const lead = CHARACTERS[leadId];
  const leadRelation = state.relations[leadId];
  const { title, copy } = specialEnding ?? resolveEnding({ state, lead, leadId, leadRelation, partner });

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
