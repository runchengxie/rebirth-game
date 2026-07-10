import type { Branch, CharacterId, CharacterProfile, FocusAction, GameState, MarketTheme, MonthScene, ResearchDecision, SceneNode, StoryArc as StoryArcType } from "../types";
import { d } from "./decisionFactory";
import { activeBranches } from "./branching";
import { THEMES_2025, makeDecisions2025 } from "./content2025";
import { THEMES_2023, makeDecisions2023 } from "./content2023";
import { THEMES_2024, makeDecisions2024 } from "./content2024";
// Re-export StoryArc for engine.ts
export type StoryArc = StoryArcType;

// ═══════════════════════════════════════════════════════════
// Characters — 中国金融职场角色
// ═══════════════════════════════════════════════════════════

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  lin_ruoning: {
    id: "lin_ruoning",
    name: "林若宁",
    role: "基本面研究员",
    tag: "基本面主线",
    color: "pink",
    intro: "会把研报贴上便签，也会认真盯着你的研究逻辑。",
    methodology: "产业链上下游交叉验证，业绩与订单的节奏差是超额来源。",
  },
  chen_xinghe: {
    id: "chen_xinghe",
    name: "陈星禾",
    role: "量化/资金信号研究员",
    tag: "量化信号线",
    color: "blue",
    intro: "抱着平板冲进会议室，习惯把大单流向、因子拥挤度和波动率曲面说成心跳。",
    methodology: "Barra 因子拆解 + 订单流信号。成交结构先于价格，量比价诚实。",
  },
  zhou_mingzhao: {
    id: "zhou_mingzhao",
    name: "周明昭",
    role: "宏观策略师",
    tag: "周期策略线",
    color: "lavender",
    intro: "看起来很安静，但总能在大家慌乱前标出拐点。",
    methodology: "估值-流动性-风险偏好三角。看拐点不看趋势，看赔率不看方向。",
  },
};

export const PROTAGONIST = {
  name: "顾行之",
  role: "新手研究员",
  intro: "你是投研部的新人，刚转正不久。没人知道的是，你带着未来三年的记忆回到了这个时间线。你不能直接喊方向，只能把未来的碎片翻译成当下能被验证的研究假设。林若宁、陈星禾、周明昭三位同事各有各的方法论，你的每一次选择都在她们的注视下——是跟着基本面交叉验证，还是相信量价信号，还是在风控框架里找安全边际。",
};

// 好感度门槛：跨过 AFFINITY_GATE 的角色会解锁专属桥段与「默契线」结局；
// 跨过 AFFINITY_TRUE 则在职业达标时解锁「心动线」真结局。
export const AFFINITY_GATE = 60;
export const AFFINITY_TRUE = 80;


// ═══════════════════════════════════════════════════════════
// Year-specific theme arrays are imported from content2023.ts /
// content2024.ts / content2025.ts (each loads + validates a JSON layer)
// ═══════════════════════════════════════════════════════════

export const YEAR_THEMES: Record<string, MarketTheme[]> = {
  "2023": THEMES_2023,
  "2024": THEMES_2024,
  "2025": THEMES_2025,
};

export function getTheme(year: string, monthIndex: number): MarketTheme {
  const themes = YEAR_THEMES[year] || THEMES_2024;
  return themes[monthIndex % themes.length];
}

// ═══════════════════════════════════════════════════════════
// Story Arcs — 12 章剧情
// ═══════════════════════════════════════════════════════════

export const STORY_ARCS: StoryArc[] = [
  {
    characterId: "lin_ruoning",
    title: "序章：第一张便签",
    speaker: "林若宁",
    role: "投研部前辈",
    mood: "温柔",
    line: "你在年初的投研部工位醒来，屏幕旁贴着一张便签：这次的研究记录，由我来监督你哦。",
    mission: "林若宁把四个研究方向摆在桌上。选一个，再安排本话日程。",
    theme: THEMES_2024[0],
  },
  {
    characterId: "lin_ruoning",
    title: "第一话：房租与模型",
    speaker: "林若宁",
    role: "基本面研究员",
    mood: "认真",
    line: "房租、通勤和咖啡预算同时报警。林若宁敲了敲你的桌面：模型改对了，才有资格想房租的事。",
    mission: "本话选择会影响你的研究可信度，看你拿不拿得出可以被验证的判断。",
    theme: THEMES_2024[1],
  },
  {
    characterId: "chen_xinghe",
    title: "第二话：量比价诚实",
    speaker: "陈星禾",
    role: "量化/资金信号研究员",
    mood: "兴奋",
    line: "午休还没开始，陈星禾就把平板推过来：今天早盘的订单流结构很有意思。大单净买集中在三个方向，但盘口厚度同时也在收窄。你觉得这是真放量还是脉冲？",
    mission: "陈星禾把因子拆解和订单流摆在你面前，帮她在四个研究方向里选一个她愿意下单的方向。",
    theme: THEMES_2024[2],
  },
  {
    characterId: "lin_ruoning",
    title: "第三话：雨夜交叉验证",
    speaker: "林若宁",
    role: "基本面研究员",
    mood: "温柔",
    line: "雨点敲着玻璃，林若宁把一叠财报推到桌子中间：这份中报，毛利率回升但经营现金流在降。你觉得这个数据矛盾该怎么解释？",
    mission: "选择本月研究路径：你是去深挖上下游合同和订单，还是先跟陈星禾对照成交数据，还是相信第一印象？",
    theme: THEMES_2024[3],
  },
  {
    characterId: "zhou_mingzhao",
    title: "第四话：拥挤度的警告",
    speaker: "周明昭",
    role: "宏观策略师",
    mood: "沉着",
    line: "周明昭在白板上画了一条估值分位数曲线：当一个方向被所有人挂在嘴边的时候，它的风险溢价已经接近于零。你们看到的是机会，我看到的是拥挤度。",
    mission: "本话要你在三种分析框架之间做判断：基本面、资金面还是宏观风控。周明昭不会直接给你答案，但她的白板不会骗人。",
    theme: THEMES_2024[4],
  },
  {
    characterId: "lin_ruoning",
    title: "第五话：分歧中的假设",
    speaker: "林若宁",
    role: "基本面研究员",
    mood: "害羞",
    line: "末班车里很安静。林若宁望着窗外：你上一次怀疑自己的判断是什么时候？我在想你的分析框架有没有漏掉关键变量，而不是在怀疑结果。",
    mission: "本话会拉开分歧：你相信估值终将回归、相信资金流向不可逆、还是相信你自己亲手验证过的数据？",
    theme: THEMES_2024[5],
  },
  {
    characterId: "chen_xinghe",
    title: "第六话：因子不会撒谎",
    speaker: "陈星禾",
    role: "量化/资金信号研究员",
    mood: "兴奋",
    line: "半年过去，很多人从自信变成了沉默。陈星禾调出一张因子收益热力图：你看，这几个月动量因子和波动率因子的相关性在飙升。市场在同时追涨和避险，这是教科书级的矛盾信号。",
    mission: "用一笔选择回答她：你的判断到底是靠框架验证出来的，还是靠直觉撑过来的。",
    theme: THEMES_2024[6],
  },
  {
    characterId: "zhou_mingzhao",
    title: "第七话：投委会陈述",
    speaker: "周明昭",
    role: "宏观策略师",
    mood: "观察",
    line: "投委会的灯亮起来。周明昭把你的研究记录标上记号：这次你没有只讲方向，你把概率和赔率都写出来了。这条线，开始有说服力了。",
    mission: "选对了方向，你从边缘座位进入主线讨论。选错了，明天继续改演示稿。",
    theme: THEMES_2024[7],
  },
  {
    characterId: "lin_ruoning",
    title: "第八话：谁的框架是对的",
    speaker: "林若宁",
    role: "基本面研究员",
    mood: "在意",
    line: "电话那头停顿了很久。林若宁说：这次我不替你选。三个同事有三种框架，我的基本面、陈星禾的量化信号、周明昭的风控。你决定跟谁站在一起，就会走进谁的叙事，就会走进谁的叙事。",
    mission: "四个选项背后是四种研究路线，结果会反馈在各个维度上。",
    theme: THEMES_2024[8],
  },
  {
    characterId: "chen_xinghe",
    title: "第九话：风口上的Alpha衰减",
    speaker: "陈星禾",
    role: "量化/资金信号研究员",
    mood: "高涨",
    line: "所有群都在刷同一个方向。陈星禾把alpha衰减曲线拉出来：三天前这个信号的预测力还在，今天已经掉到噪音区间了。你还想冲进去吗？",
    mission: "在喧嚣里选择：跟随市场情绪、逆向下注、还是等信号重新确认。",
    theme: THEMES_2024[9],
  },
  {
    characterId: "zhou_mingzhao",
    title: "第十话：年末排名战",
    speaker: "周明昭",
    role: "宏观策略师",
    mood: "紧张",
    line: "年末排名倒计时。周明昭难得露出笑意：有人为了排名放弃了方法论，有人守住了框架但落后了排名。你今年的研究档案，会成为哪种人？",
    mission: "这次选择决定结局基调：闪耀研究员、可靠打工人，还是疲劳值爆表的研究机器。",
    theme: THEMES_2024[10],
  },
  {
    characterId: "lin_ruoning",
    title: "终章：收盘后的约定",
    speaker: "林若宁",
    role: "基本面研究员",
    mood: "心动",
    line: "最后一个月，城市灯光像一张温柔的走势图。林若宁看着你：不要说赚了多少，告诉我你今年学到的框架，够不够陪你走进下一年。",
    mission: "完成最后一次选择，结算研究可信度、团队信任、生活平衡和三位同事关系。",
    theme: THEMES_2024[11],
  },
];

// ═══════════════════════════════════════════════════════════
// Monthly Decision Pool — 每月5-6个工作/生活选择
// ═══════════════════════════════════════════════════════════

// 决策工厂已抽离到 ./decisionFactory（d 从此处导入，供 2024 决策池使用）。

function makeResearchDecisions(year: string, monthIndex: number): ResearchDecision[] {
  // Route to year-specific decision pools
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
  // 已知年份都已路由；未知年份返回空池。
  return [];
}

// ═══════════════════════════════════════════════════════════
// Scene Scripts
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// Conditional branching — the "real multi-route" layer
//
// Each branch is evaluated against the live GameState (affection, career
// metrics, which decision categories the player keeps favouring, story flags).
// A matched branch injects scene nodes, appends decision options, can rewrite
// the decision prompt, and marks a `route_*` flag. This sits on top of the
// affinity-gate bridge node and the affection-driven endings — together they
// make the player's accumulated choices visibly reshape the story.
// ═══════════════════════════════════════════════════════════

export const BRANCHES: Branch[] = [
  {
    id: "route-research",
    label: "研究狂热线",
    when: {
      kind: "or",
      of: [
        { kind: "categoryStreak", category: "deep_research", gte: 4 },
        { kind: "categoryStreak", category: "data_deep_dive", gte: 4 },
      ],
    },
    contribute: {
      nodes: [
        {
          id: "route-research-node",
          type: "dialogue",
          characterId: "lin_ruoning",
          speaker: "林若宁",
          role: "投研部前辈",
          mood: "认真",
          text: "林若宁把一份还冒热气的早餐推到你手边：你这一周第三次半夜把研报发我了。我不是嫌烦——我是怕你先把身体熬没了。不过…你这版框架，确实比上个月利落。",
          prompt: "点击继续。",
          pose: "soft",
          bg: "research-room",
          bgm: "morning-loop",
          voiceCue: "key",
        },
      ],
      decisions: [
        d({
          id: "research-route-confidential",
          label: "接下组里加密的专项深度课题",
          category: "deep_research",
          description: "有个不能写进公开报告的课题，点名要你。回报是研究可信度大涨，代价是更深的熬夜。",
          to: "lin_ruoning",
          val: 3,
          fx: { researchCredibility: 16, committeeAdoption: 6, portfolioNav: 0.02, viewAccuracy: 6, fatigue: 14, lifeBalance: -10 },
          ev: 18, cl: 16, rk: 10, rf: 6,
          note: "越深的课题越孤独，但也越早被大佬看见。",
        }),
      ],
      setFlags: { route_research: true },
    },
  },
  {
    id: "route-burnout",
    label: "过度透支线",
    when: { kind: "metric", key: "fatigue", gte: 75 },
    contribute: {
      nodes: [
        {
          id: "route-burnout-node",
          type: "dialogue",
          characterId: "zhou_mingzhao",
          speaker: "周明昭",
          role: "宏观策略师",
          mood: "警觉",
          text: "周明昭盯着你看了两秒：你脸色比上周的回撤还难看。研究是长跑，不是拿命填K线。我见过太多聪明人，栽在「再熬一夜就出成果」上。",
          prompt: "点击继续。",
          pose: "serious",
          bg: "research-room",
          bgm: "morning-loop",
          voiceCue: "key",
        },
      ],
      overrideDecision: {
        text: "你盯着屏幕，眼睛发酸。也许今天该先把自己救回来，再谈研究。",
        prompt: "先安排本话日程——这一次，别再无视身体。",
        decisionPrompt: "这一话，要不要给自己留一条退路？",
      },
      decisions: [
        d({
          id: "burnout-route-rest",
          label: "今天准时下班，强制休息",
          category: "self_care",
          description: "把电脑合上。明天的清醒，比今晚多敲两千字值钱。",
          fx: { lifeBalance: 14, fatigue: -18, researchCredibility: 2, teamTrust: 2 },
          ev: 4, cl: 4, rk: 8, rf: 12,
          note: "休息不是偷懒，是给判断力续命。",
        }),
      ],
      setFlags: { route_burnout: true },
    },
  },
  {
    id: "route-relation",
    label: "关系深耕线",
    when: {
      kind: "and",
      of: [
        { kind: "affinityAny", gte: AFFINITY_GATE },
        {
          kind: "or",
          of: [
            { kind: "categoryStreak", category: "help_colleague", gte: 3 },
            { kind: "categoryStreak", category: "roadshow", gte: 3 },
          ],
        },
      ],
    },
    contribute: {
      nodes: [
        {
          id: "route-relation-node",
          type: "dialogue",
          characterId: "chen_xinghe",
          speaker: "陈星禾",
          role: "量化/资金信号研究员",
          mood: "俏皮",
          text: "陈星禾压低声音：你帮我把那版模型兜底之后，我欠你一个人情。下周的闭门路演，我偷偷给你留了个席位——别声张，算是「自己人」的待遇。",
          prompt: "点击继续。",
          pose: "excited",
          bg: "research-room",
          bgm: "morning-loop",
          voiceCue: "key",
        },
      ],
      decisions: [
        d({
          id: "relation-route-insight",
          label: "赴约闭门路演，混个「自己人」",
          category: "roadshow",
          description: "不是正式路演，是圈内人的小范围交流。信息密度高，人情也重。",
          to: "chen_xinghe",
          val: 5,
          fx: { researchCredibility: 8, committeeAdoption: 4, clientFeedback: 4, teamTrust: 8, fatigue: 6, lifeBalance: -4 },
          ev: 10, cl: 10, rk: 8, rf: 8,
          note: "圈子的门，往往是被「顺手帮的忙」悄悄推开。",
        }),
      ],
      setFlags: { route_relation: true },
    },
  },
  {
    id: "route-balanced",
    label: "平衡生活线",
    when: {
      kind: "and",
      of: [
        { kind: "metric", key: "lifeBalance", gte: 60 },
        { kind: "metricAtMost", key: "fatigue", lte: 50 },
      ],
    },
    contribute: {
      nodes: [
        {
          id: "route-balanced-node",
          type: "dialogue",
          characterId: "lin_ruoning",
          speaker: "林若宁",
          role: "投研部前辈",
          mood: "温柔",
          text: "林若宁笑了笑：你最近状态不太一样，不像上个月那样绷着。下午茶的时候你突然说「其实动量因子在退潮」，我愣了一下——那是只有脑子清亮的人才看得到的缝。",
          prompt: "点击继续。",
          pose: "smile",
          bg: "research-room",
          bgm: "morning-loop",
          voiceCue: "key",
        },
      ],
      decisions: [
        d({
          id: "balanced-route-insight",
          label: "顺着清亮的脑子，写一份冷静的周度观察",
          category: "data_deep_dive",
          description: "不追热点，只把本周信号理清楚。状态好的时候，这种冷静最有杀伤力。",
          fx: { viewAccuracy: 10, researchCredibility: 8, portfolioNav: 0.015, lifeBalance: 2, fatigue: 4 },
          ev: 12, cl: 14, rk: 10, rf: 10,
          note: "生活平衡不是研究的对立面，它是判断力的底色。",
        }),
      ],
      setFlags: { route_balanced: true },
    },
  },
];

export function buildMonthScene(
  monthIndex: number,
  year?: string,
  state?: GameState,
): MonthScene {
  const actualYear = year || "2025";
  const story = STORY_ARCS[monthIndex % STORY_ARCS.length];
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
    text: `${story.line} ${theme.publicContext}`,
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
    prompt: story.mission,
    pose: "smile",
    bg: "briefing-room",
    bgm: "morning-loop",
    voiceCue: "key",
    decisions: [...decisions, ...extraDecisions],
    decisionPrompt: story.mission,
    briefTitle: `${theme.period}：${theme.title}`,
    briefs: [
      { characterId: "lin_ruoning", label: "基本面视角", text: theme.publicContext.split("。")[0] + "。" },
      { characterId: "chen_xinghe", label: "量化信号", text: "成交结构和大单流向会先于价格给出方向确认，量比价诚实。" },
      { characterId: "zhou_mingzhao", label: "宏观风控", text: "别只盯机会。能说清楚风险边界、估值分位和反身性，才有资格入场。" },
    ],
  };

  if (decisionOverride) {
    Object.assign(decisionNode, decisionOverride);
  }

  const nodes: SceneNode[] = [
    memoryNode,
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
      text: "我知道 2025 年 1 月会很不平静。某国产低成本推理模型发布后，市场会重新讨论 AI 应用、推理成本和国产算力的关系。但我不能直接说「要涨」，只能把它拆成可验证的假设。",
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

// ═══════════════════════════════════════════════════════════
// Focus Actions — 日程选择
// ═══════════════════════════════════════════════════════════

export const FOCUS_ACTIONS: FocusAction[] = [
  {
    id: "deep_research",
    label: "深度研报",
    icon: "✦",
    short: "研究可信度 +14，疲劳 +10",
    detail: "今晚加两小时班，把研究假设落实到数据和逻辑上。研究质量会提升，但疲劳值会上升。",
    researchCredibilityBonus: 14,
    fatigueDelta: 10,
    lifeBalanceDelta: -6,
    teamTrustBonus: 3,
  },
  {
    id: "team_collab",
    label: "团队协作",
    icon: "♢",
    short: "团队信任 +8，疲劳 +3",
    detail: "和同事一起讨论研究框架，交叉验证观点。协作能提升团队信任，研究深度略有不如。",
    researchCredibilityBonus: 6,
    fatigueDelta: 3,
    lifeBalanceDelta: -2,
    teamTrustBonus: 8,
  },
  {
    id: "self_care",
    label: "生活优先",
    icon: "♡",
    short: "生活平衡 +12，疲劳 -10",
    detail: "按时下班，把今晚的时间留给自己。研究进度会受影响，但你的状态会更好。",
    researchCredibilityBonus: 0,
    fatigueDelta: -10,
    lifeBalanceDelta: 12,
    teamTrustBonus: 0,
  },
];

// ═══════════════════════════════════════════════════════════
// Grade Reviews — 评分等级复盘文案
// ═══════════════════════════════════════════════════════════

export const GRADE_REVIEWS: Record<CharacterId, Record<string, string[]>> = {
  lin_ruoning: {
    S: ["这条路线把事件、数据和逻辑完整串起来了，你的研究框架经得起任何复盘。", "完美的判断。你不仅在正确的时间做了正确的选择，更重要的是你知道为什么对。"],
    A: ["逻辑扎实，证据链完整。下次可以考虑更早在分歧点入场。", "这次研究做到了交叉验证，只是还差一点超额认知。继续打磨框架。"],
    B: ["方向对了，但有几处逻辑跳跃。下次先问一句：这个变量有没有被交叉验证过。", "结果不差，但你没有把判断依据完全写清楚。研究笔记再仔细一点。"],
    C: ["勉强及格。直觉不能代替证据，下次把假设写下来再去验证。", "这次更多是靠运气。复盘的时候要诚实记录：哪些判断有数据支撑，哪些只是感觉。"],
    D: ["失败了也没关系。失败的研究笔记有时候比成功的更有价值，因为它标出了你的盲区。", "这次需要老老实实复盘。先写清楚风险从哪冒出来的，再从框架里找偏差。"],
  },
  chen_xinghe: {
    S: ["量价信号和基本面共振！这就是我一直在说的：当大单流向和产业链逻辑指向同一个方向，Alpha的持续性最强。", "你这次同时盯对了因子拥挤度和订单流结构。Barra归因不会说谎，你的判断也不会。"],
    A: ["方向对了，但信号的持续性还需要更长时间窗口来确认。Alpha衰减速度在下周会是关键。", "不错的结果！下次可以再看一眼因子正交化，排除掉那个动量因子的干扰，你的净Alpha会更纯。"],
    B: ["成交量结构看起来还行，但大单净买的分布不够集中。下次等成交结构重新收敛再下判断。", "因子暴露对了一次，但你没有把各种因子的贡献度拆开。拆开才知道是运气还是框架。"],
    C: ["这次信号的噪音比太高了。信噪比掉到接近于1的时候，任何判断都只是抛硬币。", "我信你下次会更好。这次的订单流复盘留给我，我想看看信号在哪一层走偏了。"],
    D: ["因子收益全错了，但这种「全错」的样本比侥幸正确更能训练模型。", "没关系！每一次错误都在为下一次alpha发现做数据标注。只要别犯同样的错。"],
  },
  zhou_mingzhao: {
    S: ["方向正确，风控到位，而且在最拥挤的时候保持了逆向思维的勇气。这就是职业判断的标杆。", "你不仅选对了，还守住了风险边界。能在高回报里不放弃风控框架的人，才有长期生存权。"],
    A: ["结果不错，但我更想知道：这次判断里有没有你在无意中冒险的环节。把风险日志补上。", "收益和风控还算均衡。下次试着更早判断拐点，拐点前的赔率往往最高。"],
    B: ["中规中矩。但「中规中矩」在风控上是对的，在判断上还需要更主动。", "这次偏离了你的方法论。回头看看是哪个变量让你改了主意，那个变量值得写进研究日志。"],
    C: ["风险释放比逻辑兑现快，这次你被市场推着走了。下次入场前先写好：最多承受多少判断错误。", "把今天的结果记下来，标注「被波动率反噬」。下一次波动率飙升的时候，你会感谢今天的记录。"],
    D: ["这次没有守住底线。别自责。市场不会因为你没判断对就否定你。把失误写下来，它会变成下一次的起点。", "回头看的时候你会发现，这次是某个关键假设出了问题。找到那个假设，修好它。"],
  },
};
