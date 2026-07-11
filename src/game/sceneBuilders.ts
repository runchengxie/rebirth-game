import type {
  Branch,
  CharacterId,
  DecisionCategory,
  GameState,
  KnowledgeCard,
  MarketTheme,
  MentorId,
  MonthScene,
  ResearchDecision,
  SceneNode,
} from "../types";
import { activeBranches } from "./branching";
import { CHARACTERS, AFFINITY_GATE } from "./characters";
import {
  STORY_ARCS,
  YEAR_ARC_LINES,
  YEAR_ARC_MISSIONS,
  MENTOR_LENS,
  getTheme,
  type StoryArc,
} from "./storyArcs";
import { BRANCHES } from "./branches";
import { makeDecisions2025 } from "./content2025";
import { makeDecisions2023 } from "./content2023";
import { makeDecisions2024 } from "./content2024";
import { buildDemoChapter, makeDecisionsDemo } from "./contentDemo";

// ═══════════════════════════════════════════════════════════
// Knowledge cards — the "platform" payoff
//
// Every meaningful choice leaves the player a little sharper, not just a little
// higher-scored. The teaching is delivered *in the colleague's own voice*, not
// as a pop-up textbook — so what the player learns is "how 林若宁 thinks",
// not "the factor-crowding entry". Archived into the research notebook.
// ═══════════════════════════════════════════════════════════

// In-voice teaching lines, keyed by mentor (the framework this choice engaged)
// and by the decision category. Concise on purpose — these read as a colleague
// leaning over your desk, not a lecture.
type Teaching = { concept: string; line: string; cfaRef: string };

export const MENTOR_TEACHINGS: Record<MentorId, Record<DecisionCategory, Teaching>> = {
  lin_ruoning: {
    deep_research: { concept: "产业链交叉验证", line: "别只看一个点。把上游、中游、下游的节奏差拆开，超额收益藏在断层里。", cfaRef: "CFA · 权益估值与产业链验证" },
    expert_interview: { concept: "一线验证", line: "研报会说漂亮话，但经销商的库存、厂长的语气不会。去一线，比看十篇纪要都值钱。", cfaRef: "CFA · 尽职调查与一手信息" },
    roadshow: { concept: "框架翻译", line: "把复杂逻辑讲成人能听懂的故事，是研究员的基本功。客户追问的那两个问题，就是你框架的漏洞。", cfaRef: "CFA · 投资沟通" },
    risk_alert: { concept: "反身性", line: "当所有人都觉得「这回不一样」，就是风险最大的时候。提醒冷静不是泼冷水，是替团队守住边界。", cfaRef: "CFA · 行为金融与反身性" },
    self_care: { concept: "判断节奏", line: "脑子不清亮的时候，任何判断都打折。先把自己救回来，研究不会跑。", cfaRef: "CFA · 决策卫生" },
    help_colleague: { concept: "模型直觉", line: "帮人改模型，也是在练自己的手感。你今天搭的每一根假设，明天都会长回你自己的框架里。", cfaRef: "CFA · 财务建模" },
    committee_defense: { concept: "假设可视化", line: "投委会要的不是结论，是你怎么想的。把概率和赔率都摆出来，比喊方向有用。", cfaRef: "CFA · 投资论述" },
    data_deep_dive: { concept: "数据诚实", line: "数据不会替你下结论，但会揭穿你的偷懒。先问「这数怎么来的」，再问「说明什么」。", cfaRef: "CFA · 量化与数据质量" },
  },
  chen_xinghe: {
    deep_research: { concept: "量价背离", line: "价格会骗人，成交量不会。量在价先，结构比方向诚实。", cfaRef: "CFA · 市场微观结构" },
    expert_interview: { concept: "信号交叉", line: "一手信息能校准你的因子。别只信回测，去问圈内人信号变没变。", cfaRef: "CFA · 另类数据与调研" },
    roadshow: { concept: "信号翻译", line: "把因子讲成人话，是量化员的修行。客户听得懂，才会信你的 Alpha。", cfaRef: "CFA · 投资沟通" },
    risk_alert: { concept: "因子拥挤度", line: "所有人都挤一个方向时，风险溢价趋近零。这时候还冲，是在给前人接盘。", cfaRef: "CFA · 因子投资与拥挤度" },
    self_care: { concept: "噪声 vs 信号", line: "连轴转的时候信噪比会塌。休息不是偷懒，是给模型留干净输入。", cfaRef: "CFA · 决策卫生" },
    help_colleague: { concept: "交叉验证", line: "量化和基本面打架时，真理通常在中间。你帮我校准的那一下，我也学会了怎么读生意。", cfaRef: "CFA · 多因子融合" },
    committee_defense: { concept: "因子正交", line: "把动量因子的干扰拆掉，你的净 Alpha 才纯。混着讲，等于什么都没说。", cfaRef: "CFA · Barra 归因" },
    data_deep_dive: { concept: "Barra 归因", line: "收益里多少是因子、多少是能力？归因拆不开的，都是运气。", cfaRef: "CFA · 绩效归因" },
  },
  zhou_mingzhao: {
    deep_research: { concept: "估值分位", line: "别只看方向，看你在第几层估值分位上出手。赔率比胜率更长久。", cfaRef: "CFA · 估值与安全边际" },
    expert_interview: { concept: "政策传导", line: "政策到订单之间隔着三层时滞。问清楚「什么时候见效」，比问「好不好」重要。", cfaRef: "CFA · 宏观与政策传导" },
    roadshow: { concept: "拐点思维", line: "我看拐点不看趋势。最拥挤的地方，往往离拐点最近。", cfaRef: "CFA · 周期与拐点" },
    risk_alert: { concept: "安全边际", line: "先想清楚错了怎么办，再想对了赚多少。边界划不清，再对的判断也是赌。", cfaRef: "CFA · 风险管理" },
    self_care: { concept: "长跑节奏", line: "研究是马拉松。把自己熬没了，再好的框架也没人跑。", cfaRef: "CFA · 决策卫生" },
    help_colleague: { concept: "情景框架", line: "把外生冲击嵌进宏观模型，是教科书学不到的。你帮我补的变量，让我的情景更真了。", cfaRef: "CFA · 情景分析" },
    committee_defense: { concept: "概率与赔率", line: "我只认一件事：你把概率和赔率都写出来了。这比喊方向专业。", cfaRef: "CFA · 预期收益框架" },
    data_deep_dive: { concept: "微观结构", line: "制度一变，价格发现机制就变。尊重规则变化，规则才不会惩罚你。", cfaRef: "CFA · 市场微观结构" },
  },
};

function frameworkOfLocal(decision: ResearchDecision, story: StoryArc): CharacterId {
  if (decision.framework) return decision.framework;
  return decision.effects.characterRelations[0]?.characterId ?? story.characterId;
}

// Resolve the knowledge card a decision teaches. Prefers an explicit
// `teaches` on the decision; otherwise derives one from the engaged framework
// and the decision category, so every choice — even legacy JSON — teaches.
export function pickKnowledgeCard(decision: ResearchDecision, story: StoryArc): KnowledgeCard {
  if (decision.teaches) return decision.teaches;
  const mentor = frameworkOfLocal(decision, story);
  const t = MENTOR_TEACHINGS[mentor as MentorId]?.[decision.category];
  if (!t) {
    return {
      id: `generic_${decision.category}`,
      concept: "研究方法",
      mentorId: mentor,
      mentorLine: "每一次选择都是一次练习。复盘时问自己：我这次为什么这么想？",
      tier: 1,
    };
  }
  return {
    id: `kc_${mentor}_${decision.category}`,
    concept: t.concept,
    mentorId: mentor,
    mentorLine: t.line,
    cfaRef: t.cfaRef,
    tier: 1,
  };
}

// ═══════════════════════════════════════════════════════════
// Monthly Decision Pool — 每月5-6个工作/生活选择
// ═══════════════════════════════════════════════════════════

// 决策工厂已抽离到 ./decisionFactory（各年份决策池从此处取用）。

function makeResearchDecisions(year: string, monthIndex: number): ResearchDecision[] {
  // Route to year-specific decision pools
  if (year === "demo") {
    return makeDecisionsDemo(monthIndex);
  }
  if (year === "2025") {
    return makeDecisions2025(monthIndex);
  }
  if (year === "2023") {
    return makeDecisions2023(monthIndex);
  }
  // 2024 决策池已从 TS 抽到 content/2024.json，经 schema 校验加载（与 2023/2025 一致）
  if (year === "2024") {
    return makeDecisions2024(monthIndex);
  }
  // 已知年份都已路由，未知年份返回空池。
  return [];
}

// The three colleagues each form a defensible hypothesis from the same future
// memory. Showing them side by side is the core "plural truths" beat — there is
// no single correct answer, only frameworks you choose to stand behind.
function buildCompetingNode(story: StoryArc, theme: MarketTheme, monthIndex: number): SceneNode {
  const ch = theme.competingHypotheses;
  const parts: string[] = [];
  if (ch?.lin) parts.push(`林若宁的基本面说：${ch.lin}`);
  if (ch?.chen) parts.push(`陈星禾的量价说：${ch.chen}`);
  if (ch?.zhou) parts.push(`周明昭的风控说：${ch.zhou}`);
  const body = parts.length > 0
    ? `${parts.join("，")}。没有哪个是标准答案，你站哪边，哪边就认你，哪边也会在后面盯着你。`
    : "三种框架摆在你面前，没有哪个是标准答案，你站哪边，哪边就认你，哪边也会在后面盯着你。";
  return {
    id: `m${monthIndex}-competing`,
    type: "dialogue",
    characterId: story.characterId,
    speaker: story.speaker,
    role: story.role,
    mood: "认真",
    text: body,
    prompt: "点击继续，进入本月研究选择。",
    pose: "thinking",
    bg: "research-room",
    bgm: "morning-loop",
    voiceCue: "key",
  };
}

export function buildMonthScene(
  monthIndex: number,
  year?: string,
  state?: GameState,
): MonthScene {
  const actualYear = year || "2025";
  if (actualYear === "demo") return buildDemoChapter(monthIndex, state);
  const story = STORY_ARCS[monthIndex % STORY_ARCS.length];
  // 同事寒暄按年份轮换：2023/2025 取各自专属 line，其余年份（含 2024）回退到 STORY_ARCS 原 line。
  const arcLine = YEAR_ARC_LINES[actualYear]?.[monthIndex] ?? story.line;
  // 决策提示同样按年份轮换：2023/2025 取各自专属 mission，其余年份回退到 STORY_ARCS 原 mission。
  const arcMission = YEAR_ARC_MISSIONS[actualYear]?.[monthIndex] ?? story.mission;
  const monthNum = monthIndex + 1;
  const month = `${actualYear}-${String(monthNum).padStart(2, "0")}`;
  const label = `${actualYear}年${monthNum}月`;
  const theme = getTheme(actualYear, monthIndex);

  if (actualYear === "2025" && monthIndex === 0) {
    return build2025Prologue(month, label, theme);
  }

  // Affinity gate: if the month's arc character has crossed the relationship
  // threshold, inject a "relationship moment" node. Now reads the live state.
  const affinityNode: SceneNode | null =
    state && (state.relations[story.characterId] ?? 0) >= AFFINITY_GATE
      ? buildAffinityMoment(story, monthIndex)
      : null;

  // Evaluate route branches against the live state.
  const branches = state ? activeBranches(state, BRANCHES) : [];
  const branchNodesAfterMemory: SceneNode[] = [];
  const branchNodesBeforeDecision: SceneNode[] = [];
  const extraDecisions: ResearchDecision[] = [];
  let decisionOverride: Branch["contribute"]["overrideDecision"] | undefined;
  for (const b of branches) {
    const at = b.injectAt ?? "before-decision";
    if (at === "after-memory") branchNodesAfterMemory.push(...(b.contribute.nodes ?? []));
    else branchNodesBeforeDecision.push(...(b.contribute.nodes ?? []));
    extraDecisions.push(...(b.contribute.decisions ?? []));
    if (b.contribute.overrideDecision) {
      decisionOverride = { ...decisionOverride, ...b.contribute.overrideDecision };
    }
  }

  // Default scene for non-prologue months
  const decisions = makeResearchDecisions(actualYear, monthIndex);

  const memoryNode: SceneNode = {
    id: `m${monthIndex}-memory`,
    type: "dialogue",
    characterId: story.characterId,
    speaker: "内心独白",
    role: "只有你知道",
    mood: "判断",
    text: theme.protagonistMemory,
    prompt: "点击继续，把未来记忆整理成当下说得通的研究假设。",
    pose: "thinking",
    bg: "research-room",
    bgm: "morning-loop",
    voiceCue: "silent",
  };

  const colleagueNode: SceneNode = {
    id: `m${monthIndex}-colleague`,
    type: "dialogue",
    characterId: story.characterId,
    speaker: story.speaker,
    role: story.role,
    mood: story.mood,
    text: `${arcLine} ${theme.publicContext}`,
    prompt: "点击继续，进入本月研究选择。",
    pose: "soft",
    bg: "research-room",
    bgm: "morning-loop",
    voiceCue: "key",
  };

  const decisionNode: SceneNode = {
    id: `m${monthIndex}-decision`,
    type: "decision",
    characterId: story.characterId,
    speaker: story.speaker,
    role: story.role,
    mood: story.mood,
    text: `先安排本话日程，然后选择一个你愿意负责到底的研究方向。`,
    prompt: arcMission,
    pose: "smile",
    bg: "briefing-room",
    bgm: "morning-loop",
    voiceCue: "key",
    decisions: [...decisions, ...extraDecisions],
    decisionPrompt: arcMission,
    briefTitle: `${theme.period}：${theme.title}`,
    briefs: [
      { characterId: "lin_ruoning", label: "基本面视角", text: theme.publicContext.split("。")[0] + "。" },
      { characterId: "chen_xinghe", label: "量化信号", text: MENTOR_LENS[monthIndex % MENTOR_LENS.length].chen },
      { characterId: "zhou_mingzhao", label: "宏观风控", text: MENTOR_LENS[monthIndex % MENTOR_LENS.length].zhou },
    ],
  };

  if (decisionOverride) {
    Object.assign(decisionNode, decisionOverride);
  }

  const competingNode: SceneNode | null =
    state && monthIndex >= 1 && theme.competingHypotheses
      ? buildCompetingNode(story, theme, monthIndex)
      : null;

  const nodes: SceneNode[] = [
    memoryNode,
    ...(competingNode ? [competingNode] : []),
    ...branchNodesAfterMemory,
    ...(affinityNode ? [affinityNode] : []),
    colleagueNode,
    ...branchNodesBeforeDecision,
    decisionNode,
  ];

  return { id: `${year || "default"}-m${monthIndex}`, year, monthIndex, month, label, theme, nodes };
}

function buildAffinityMoment(story: StoryArc, monthIndex: number): SceneNode {
  const name = CHARACTERS[story.characterId].name;
  return {
    id: `m${monthIndex}-affinity`,
    type: "dialogue",
    characterId: story.characterId,
    speaker: story.speaker,
    role: story.role,
    mood: "心动",
    text: `${name}的声音放轻了些：你最近总在我卡住的时候，递来那条对的线索。这种默契，比任何一份研报都难得。`,
    prompt: "点击继续。",
    pose: "soft",
    bg: "research-room",
    bgm: "morning-loop",
    voiceCue: "key",
  };
}

function build2025Prologue(month: string, label: string, theme: MarketTheme): MonthScene {
  const decisions = makeResearchDecisions("2025", 0);
  const nodes: SceneNode[] = [
    {
      id: "2025p-memory",
      type: "dialogue",
      characterId: "lin_ruoning",
      speaker: "内心独白",
      role: "只有你知道",
      mood: "警觉",
      text: `我知道一个具体的事实：${theme.knownEvent ?? "有些事会真的发生，但不是以价格告诉我的方式。"}
但我不能直接喊方向，我得把它翻译成当下能验证的研究假设，再选一个框架去落地。`,
      prompt: "点击继续，把未来记忆压成可以说出口的研究假设。",
      pose: "thinking",
      bg: "research-room",
      bgm: "morning-loop",
      voiceCue: "silent",
    },
    {
      id: "2025p-lin-1",
      type: "dialogue",
      characterId: "lin_ruoning",
      speaker: "林若宁",
      role: "投研部前辈",
      mood: "温柔",
      text: "林若宁站在你桌边，把一张便签贴到显示器边缘：你今天来得好早。AI 这条线，你昨晚又看到凌晨了吗？",
      pose: "soft",
      bg: "research-room",
      bgm: "morning-loop",
      voiceCue: "key",
    },
    {
      id: "2025p-lin-2",
      type: "dialogue",
      characterId: "lin_ruoning",
      speaker: "林若宁",
      role: "基本面研究员",
      mood: "认真",
      text: "她把一杯热咖啡推到你手边：如果你想说服大家，预感还不够。低成本推理、应用扩散、算力适配，至少要拆成三条可验证假设。我给你一个框架：先看产业链上下游谁先受益，再看业绩验证的节奏差。",
      pose: "thinking",
      bg: "research-room",
      bgm: "morning-loop",
    },
    {
      id: "2025p-chen-1",
      type: "dialogue",
      characterId: "chen_xinghe",
      speaker: "陈星禾",
      role: "量化/资金信号研究员",
      mood: "俏皮",
      text: "陈星禾抱着平板冲进会议室：早盘Barra归因跑完了！AI应用方向的收益里，动量因子贡献了超过六成，基本面因子的贡献还不到两成。换句话说，现在涨的更多是情绪溢价和拥挤交易，不是业绩验证。你们的基本面故事还没被市场真正定价。",
      pose: "excited",
      bg: "research-room",
      bgm: "morning-loop",
      voiceCue: "key",
    },
    {
      id: "2025p-chen-2",
      type: "dialogue",
      characterId: "chen_xinghe",
      speaker: "陈星禾",
      role: "资金信号研究员",
      mood: "高涨",
      text: "她点开大单流向分布：我只信成交量和订单簿。AI方向的盘口厚度在收窄但大单净买还在流入，这是典型的「量在价先、但供给也在积聚」的信号。短期内动量还能跑，但Alpha衰减速度比上周快了一倍。如果你要做研究推荐，最好等成交结构重新确认。",
      pose: "focused",
      bg: "research-room",
      bgm: "morning-loop",
    },
    {
      id: "2025p-zhou-1",
      type: "dialogue",
      characterId: "zhou_mingzhao",
      speaker: "周明昭",
      role: "宏观策略师",
      mood: "沉着",
      text: "周明昭在会议室白板上圈出两个日期：技术突破和交易方向之间隔着三层东西：风险偏好能不能持续、估值有没有安全边际、兑现节奏会不会被流动性打断。你们现在讨论的都是「事件是不是利好」，但真正的问题是「这个利好已经被定价了多少」。",
      pose: "serious",
      bg: "briefing-room",
      bgm: "morning-loop",
      voiceCue: "key",
    },
    {
      id: "2025p-zhou-2",
      type: "dialogue",
      characterId: "zhou_mingzhao",
      speaker: "周明昭",
      role: "宏观策略师",
      mood: "观察",
      text: "她补上一行小字：公开信息只能证明事件发生了，不能证明交易方向。如果你要提前布局，就要解释这次热度能持续多久，以及如果持续不了，回撤的风险边界在哪里。",
      pose: "neutral",
      bg: "briefing-room",
      bgm: "morning-loop",
    },
    {
      id: "2025p-lin-3",
      type: "dialogue",
      characterId: "lin_ruoning",
      speaker: "林若宁",
      role: "基本面研究员",
      mood: "认真",
      text: "林若宁翻开笔记：好，三个框架都摆出来了。我的基本面验证、陈星禾的量化信号、周明昭的风控。没有哪个框架是完美的，但三个框架重叠的地方就是你最该出手的方向。",
      pose: "thinking",
      bg: "briefing-room",
      bgm: "morning-loop",
    },
    {
      id: "2025p-chen-3",
      type: "dialogue",
      characterId: "chen_xinghe",
      speaker: "陈星禾",
      role: "资金信号研究员",
      mood: "俏皮",
      text: "陈星禾把平板转向你：我负责盯信号。大单流向、因子拥挤度、Alpha衰减速度，这三个指标如果同时变脸，我就拉警报。在那之前，你只管做你的研究。量比价诚实，信我。",
      pose: "excited",
      bg: "briefing-room",
      bgm: "morning-loop",
    },
    {
      id: "2025p-zhou-3",
      type: "dialogue",
      characterId: "zhou_mingzhao",
      speaker: "周明昭",
      role: "宏观策略师",
      mood: "沉着",
      text: "周明昭轻轻敲了敲杯沿：我负责风控边界。别只盯着收益率，想想你的研究推荐如果错了，错在哪一层：是假设错了、变量漏了、还是反身性没算进去。把错误的位置标出来，比把方向猜对更重要。",
      pose: "serious",
      bg: "briefing-room",
      bgm: "morning-loop",
    },
    {
      id: "2025p-decision",
      type: "decision",
      characterId: "lin_ruoning",
      speaker: "林若宁",
      role: "投研部前辈",
      mood: "温柔",
      text: "林若宁把研究选项排成一列：先决定今天怎么安排日程，再选一个你愿意负责到底的方向。结果会结算，研究札记也会留下。",
      prompt: "安排本话日程，然后选择一个研究方向。",
      pose: "smile",
      bg: "briefing-room",
      bgm: "morning-loop",
      voiceCue: "key",
      decisions,
      decisionPrompt: "安排本话日程，然后选择一个研究方向。",
      briefTitle: "第一次研究会议：三个框架，四条路径",
      briefs: [
        { characterId: "lin_ruoning", label: "基本面", text: "先把产业链拆成三层：硬件、平台、应用。每层有自己的受益逻辑和验证节奏。不要被概念带走。" },
        { characterId: "chen_xinghe", label: "量化信号", text: "Barra归因显示动量因子主导。大单流向还在净买，但盘口厚度在收窄。量比价诚实，但信号在衰减。" },
        { characterId: "zhou_mingzhao", label: "宏观风控", text: "三个框架重叠的地方最安全。如果事件只是脉冲而没有业绩接力，估值和拥挤度会在月末反噬。" },
      ],
    },
  ];

  return { id: "2025-scene-prologue", year: "2025", monthIndex: 0, month, label, theme, nodes };
}

// ═══════════════════════════════════════════════════════════
// Year-specific scene overrides
// ═══════════════════════════════════════════════════════════

export const YEAR_SCENE_BUILDERS: Record<string, (monthIndex: number) => MonthScene> = {
  "2023": (monthIndex: number) => buildMonthScene(monthIndex, "2023"),
  "2024": (monthIndex: number) => buildMonthScene(monthIndex, "2024"),
  "2025": (monthIndex: number) => buildMonthScene(monthIndex, "2025"),
};
