import type { CharacterId, CharacterProfile, FocusAction, MarketTheme, MonthScene, ResearchDecision, SceneNode, StoryArc as StoryArcType } from "../types";
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
  },
  chen_xinghe: {
    id: "chen_xinghe",
    name: "陈星禾",
    role: "量化/资金信号",
    tag: "量化信号线",
    color: "blue",
    intro: "拿着平板冲进会议室，最喜欢把概率说成心跳。",
  },
  zhou_mingzhao: {
    id: "zhou_mingzhao",
    name: "周明昭",
    role: "宏观策略师",
    tag: "周期策略线",
    color: "lavender",
    intro: "看起来很安静，但总能在大家慌乱前标出拐点。",
  },
};

export const PROTAGONIST = {
  name: "顾行之",
  role: "初级研究员",
  intro: "你带着未来记忆回到投研部，但不能直接说答案。你要在公开信息、合规边界、团队协作和个人生活之间做选择，把未来记忆翻译成当下能被验证的研究假设。",
};

// ═══════════════════════════════════════════════════════════
// Market Themes — 每月金融主题（化名/抽象化）
// ═══════════════════════════════════════════════════════════

export const MARKET_THEMES: MarketTheme[] = [
  {
    id: "ai-narrative",
    period: "一月",
    title: "AI 叙事升温",
    publicContext: "某国产低成本推理模型发布，市场重新讨论 AI 应用、推理成本和国产算力的关系。公开信息只能看到热度，看不到持续性。",
    protagonistMemory: "你知道低成本推理会改变行业格局，但研究判断不能只说'要涨'——要拆成可验证的假设：应用扩散、成本下降、算力适配。",
    gameHook: "把对 AI 叙事的理解变成工作决策：是熬夜写深度研报、约专家验证、跟风写快评，还是按时下班。",
  },
  {
    id: "liquidity-return",
    period: "二月",
    title: "节后流动性回流",
    publicContext: "节后成交恢复，短线题材和机构调仓同时出现，热门行业容易快速切换。",
    protagonistMemory: "你知道节后行情常常奖励最先恢复成交和关注度的方向。",
    gameHook: "判断哪些行业会最先获得资金回流，决定本周的研究重点。",
  },
  {
    id: "policy-window",
    period: "三月",
    title: "政策窗口与产业方向",
    publicContext: "产业政策、财政方向和稳增长预期成为研报核心关键词。",
    protagonistMemory: "你知道政策窗口后的兑现速度比口号本身更重要。",
    gameHook: "把政策叙事拆成研究选题，决定本月重点覆盖哪个产业链。",
  },
  {
    id: "earnings-verify",
    period: "四月",
    title: "一季报验证期",
    publicContext: "财报开始验证前期逻辑，资金会重新给业绩、订单和现金流排序。",
    protagonistMemory: "你知道一季报会把很多概念线从主线里筛出去。",
    gameHook: "同事们只看当下数据，你要把未来记忆翻译成能落到财报里的研究假设。",
  },
  {
    id: "style-rebalance",
    period: "五月",
    title: "风格再平衡",
    publicContext: "成长、周期、红利和主题资金来回拉扯，市场进入选择方向的阶段。",
    protagonistMemory: "你知道五月的错觉很多，真正重要的是资金愿意停留在哪里。",
    gameHook: "本月考验你能否在风格切换中保持研究定力。",
  },
  {
    id: "midyear-expectation",
    period: "六月",
    title: "中报预期交易",
    publicContext: "半年节点临近，市场开始提前交易中报景气和业绩弹性。",
    protagonistMemory: "你知道中报预期常常先涨后验，节奏比方向更难。",
    gameHook: "日程选择决定你是深挖基本面，还是先把生活平衡调回来。",
  },
  {
    id: "summer-diffusion",
    period: "七月",
    title: "暑期主题扩散",
    publicContext: "产业催化和政策细则让题材从龙头向支线扩散，但质量差异开始变大。",
    protagonistMemory: "你知道扩散行情里最容易把主线和补涨混在一起。",
    gameHook: "角色们先拆主题层级，你再决定本月的研究方向。",
  },
  {
    id: "earnings-review",
    period: "八月",
    title: "中报落地复盘",
    publicContext: "中报披露让市场重新审视订单、利润率和景气持续性。",
    protagonistMemory: "你知道兑现后的分歧，才是真正考验研究框架的地方。",
    gameHook: "复盘会看你的观点命中率，也会看研究假设的论证质量。",
  },
  {
    id: "q3-rotation",
    period: "九月",
    title: "三季度风格切换",
    publicContext: "资金在防守和进攻之间摇摆，成交结构会比指数更早透露方向。",
    protagonistMemory: "你知道很多行情会先在成交额里留下痕迹。",
    gameHook: "陈星禾会盯资金信号，周明昭会提醒你别忽略宏观风险。",
  },
  {
    id: "year-end-warmup",
    period: "十月",
    title: "年末排名预热",
    publicContext: "机构排名压力抬头，强势方向容易被继续抱团，弱势方向也可能反弹。",
    protagonistMemory: "你知道排名行情会放大人性，也会放大错误。",
    gameHook: "本话选择会同时影响投委会采纳度和团队对你的信任。",
  },
  {
    id: "valuation-switch",
    period: "十一月",
    title: "估值切换窗口",
    publicContext: "市场开始把视线移向下一年，估值切换和业绩展望成为主线。",
    protagonistMemory: "你知道越接近年底，越不能只看当月表现。",
    gameHook: "把明年的想象空间转成当下可验证的研究主题。",
  },
  {
    id: "year-end-review",
    period: "十二月",
    title: "年度收官与复盘",
    publicContext: "全年主线进入结算，资金在兑现、调仓和跨年预期之间选择。",
    protagonistMemory: "你知道收官会成为下一周目研究档案的开头。",
    gameHook: "最终选择会结算研究可信度、团队信任、生活平衡，决定你的研究员结局。",
  },
];

// ═══════════════════════════════════════════════════════════
// Story Arcs — 12 章剧情（实现 StoryArc 接口）
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
    theme: MARKET_THEMES[0],
  },
  {
    characterId: "lin_ruoning",
    title: "第一话：房租与咖啡预算",
    speaker: "林若宁",
    role: "投研部前辈",
    mood: "认真",
    line: "房租、通勤和咖啡预算同时报警。林若宁敲了敲你的桌面：先让研究框架站稳，再谈帅气登场吧。",
    mission: "本话选择会影响你的研究可信度，也会影响今天还能不能准时下班。",
    theme: MARKET_THEMES[1],
  },
  {
    characterId: "chen_xinghe",
    title: "第二话：午休研报会",
    speaker: "陈星禾",
    role: "买方研究员",
    mood: "俏皮",
    line: "午休的咖啡还没凉，陈星禾就把一叠数据推过来：猜对本月方向的话，我请你吃甜点。",
    mission: "四个研究方向都很诱人，真正的主线藏在数据和逻辑后面。",
    theme: MARKET_THEMES[2],
  },
  {
    characterId: "lin_ruoning",
    title: "第三话：雨夜加班图",
    speaker: "林若宁",
    role: "投研部前辈",
    mood: "温柔",
    line: "雨点敲着玻璃，林若宁把外套搭在椅背上：今晚就当是我们的秘密研究会议吧。",
    mission: "选择本月研究方向，决定你是继续补数据，还是进入林若宁的核心讨论。",
    theme: MARKET_THEMES[3],
  },
  {
    characterId: "zhou_mingzhao",
    title: "第四话：路演准备",
    speaker: "周明昭",
    role: "宏观策略师",
    mood: "沉着",
    line: "部门路演就要开始了。周明昭推了推眼镜：能把研究逻辑讲清楚的人，才配站在聚光灯下。",
    mission: "你的表现会影响大家愿不愿意听完你的观点，复盘记录也会留下。",
    theme: MARKET_THEMES[4],
  },
  {
    characterId: "lin_ruoning",
    title: "第五话：末班车约定",
    speaker: "林若宁",
    role: "投研部前辈",
    mood: "害羞",
    line: "末班车里很安静。林若宁望着窗外，小声问：如果这次研究真的能改变结果，你会记得今天的约定吗？",
    mission: "本话会拉开分歧：追热点、深挖基本面，还是相信那条心跳加速的线索。",
    theme: MARKET_THEMES[5],
  },
  {
    characterId: "chen_xinghe",
    title: "第六话：夏日中场复盘",
    speaker: "陈星禾",
    role: "买方研究员",
    mood: "兴奋",
    line: "半年过去，市场把很多人的自信晒化了。陈星禾托着下巴：所以，你靠的是提前判断，还是运气？",
    mission: "用一笔选择回答她：这条路线到底是奇迹，还是可以复盘的研究逻辑。",
    theme: MARKET_THEMES[6],
  },
  {
    characterId: "zhou_mingzhao",
    title: "第七话：投委会陈述",
    speaker: "周明昭",
    role: "宏观策略师",
    mood: "观察",
    line: "投委会的灯亮起来。周明昭把你的研究记录标上记号：这条线，开始有说服力了。",
    mission: "选对了，你从边缘座位进入主线。选错了，明天继续改演示稿。",
    theme: MARKET_THEMES[7],
  },
  {
    characterId: "lin_ruoning",
    title: "第八话：若宁的深夜电话",
    speaker: "林若宁",
    role: "投研部前辈",
    mood: "在意",
    line: "电话那头停顿很久。林若宁说：这次我不替你选，但我会看着你的答案。",
    mission: "四个选项背后是四种研究路线，结果会反馈在各个维度上。",
    theme: MARKET_THEMES[8],
  },
  {
    characterId: "chen_xinghe",
    title: "第九话：风口心跳战",
    speaker: "陈星禾",
    role: "买方研究员",
    mood: "高涨",
    line: "所有群都在刷同一个方向，所有人都觉得自己是主角。陈星禾眨了眨眼：你也要冲进这段行情吗？",
    mission: "在喧嚣里选择：跟随市场、逆向下注，还是相信数据暴露出的真相。",
    theme: MARKET_THEMES[9],
  },
  {
    characterId: "zhou_mingzhao",
    title: "第十话：年末排名战",
    speaker: "周明昭",
    role: "宏观策略师",
    mood: "紧张",
    line: "年末排名开始倒计时。周明昭难得露出笑意：有人求稳，有人激进，而你还没有解锁最终图鉴。",
    mission: "这次选择会决定结局基调：闪耀研究员、可靠打工人，还是疲劳值爆表。",
    theme: MARKET_THEMES[10],
  },
  {
    characterId: "lin_ruoning",
    title: "终章：收盘后的约定",
    speaker: "林若宁",
    role: "投研部前辈",
    mood: "心动",
    line: "最后一个月，城市灯光像一张温柔的走势图。林若宁看着你：不要只告诉我结果，也告诉我你想进入哪条结局线。",
    mission: "完成最后一次选择，结算研究可信度、团队信任、生活平衡和三位同事关系。",
    theme: MARKET_THEMES[11],
  },
];

// ═══════════════════════════════════════════════════════════
// Monthly Decision Templates — 每月4个工作/生活选择
// ═══════════════════════════════════════════════════════════

function makeResearchDecisions(monthIndex: number): ResearchDecision[] {
  // Each month has 4 decisions: research-heavy, networking, life-balance, risk-averse
  const themes: ResearchDecision[][] = [
    // 一月：AI叙事升温
    [
      {
        id: "jan-research",
        label: "连夜写《低成本推理对应用软件的影响》",
        category: "research",
        description: "深挖技术突破的产业链影响，做出第一份深度研报。",
        effects: { researchCredibility: 12, committeeAdoption: 3, portfolioNav: 0.02, viewAccuracy: 5, clientFeedback: 2, teamTrust: 5, fatigue: 12, lifeBalance: -8, characterRelations: [{ characterId: "lin_ruoning", value: 6 }] },
        backgroundNote: "某国产低成本推理模型发布后，市场对AI应用路径产生分歧。",
      },
      {
        id: "jan-expert",
        label: "约专家电话会，验证真实需求",
        category: "communication",
        description: "通过产业专家了解下游实际落地情况。",
        effects: { researchCredibility: 6, committeeAdoption: 8, portfolioNav: 0.01, viewAccuracy: 8, clientFeedback: 5, teamTrust: 3, fatigue: 4, lifeBalance: -2, characterRelations: [{ characterId: "chen_xinghe", value: 5 }] },
        backgroundNote: "产业专家提供了不同于公开信息的视角。",
      },
      {
        id: "jan-quicknote",
        label: "跟着市场热度写快评",
        category: "risk",
        description: "快速响应市场情绪，抢占信息流先机。",
        effects: { researchCredibility: -2, committeeAdoption: 5, portfolioNav: 0.005, viewAccuracy: -5, clientFeedback: 8, teamTrust: 2, fatigue: 2, lifeBalance: 0, characterRelations: [{ characterId: "zhou_mingzhao", value: -3 }] },
        backgroundNote: "快评获得了短期关注，但后续复盘发现多处逻辑跳跃。",
      },
      {
        id: "jan-balance",
        label: "按时下班，陪家人吃饭",
        category: "life",
        description: "在市场最喧嚣的时候，先守住自己的生活。",
        effects: { researchCredibility: 0, committeeAdoption: 0, portfolioNav: 0, viewAccuracy: 0, clientFeedback: 0, teamTrust: 0, fatigue: -10, lifeBalance: 12, characterRelations: [{ characterId: "lin_ruoning", value: 2 }] },
        backgroundNote: "虽然错过了早盘讨论，但你带着清晰的头脑回到了第二天的工作。",
      },
    ],
    // 二月：节后流动性回流
    [
      {
        id: "feb-flow",
        label: "做行业资金流向专题",
        category: "research",
        description: "系统化分析节后各行业资金回流情况，做成内部参考报告。",
        effects: { researchCredibility: 10, committeeAdoption: 5, portfolioNav: 0.015, viewAccuracy: 6, clientFeedback: 3, teamTrust: 6, fatigue: 10, lifeBalance: -6, characterRelations: [{ characterId: "chen_xinghe", value: 7 }] },
      },
      {
        id: "feb-roadshow",
        label: "准备客户路演材料",
        category: "communication",
        description: "把研究判断翻译成客户能理解的语言。",
        effects: { researchCredibility: 3, committeeAdoption: 7, portfolioNav: 0.01, viewAccuracy: 4, clientFeedback: 10, teamTrust: 4, fatigue: 6, lifeBalance: -3, characterRelations: [{ characterId: "lin_ruoning", value: 4 }] },
      },
      {
        id: "feb-cautious",
        label: "保持观望，多看少动",
        category: "risk",
        description: "节后行情还不清晰，先积累数据再下判断。",
        effects: { researchCredibility: 2, committeeAdoption: -2, portfolioNav: 0, viewAccuracy: 3, clientFeedback: -2, teamTrust: 1, fatigue: -2, lifeBalance: 4, characterRelations: [{ characterId: "zhou_mingzhao", value: 5 }] },
      },
      {
        id: "feb-life",
        label: "周末去健身房，调整状态",
        category: "life",
        description: "春节后综合征需要主动应对。",
        effects: { researchCredibility: 0, committeeAdoption: 0, portfolioNav: 0, viewAccuracy: 0, clientFeedback: 0, teamTrust: 1, fatigue: -12, lifeBalance: 10, characterRelations: [{ characterId: "chen_xinghe", value: 2 }] },
      },
    ],
    // 三月：政策窗口
    [
      {
        id: "mar-policy",
        label: "写产业政策深度分析",
        category: "research",
        description: "逐个拆解政策文件，找出真正受益的产业链环节。",
        effects: { researchCredibility: 12, committeeAdoption: 8, portfolioNav: 0.02, viewAccuracy: 7, clientFeedback: 4, teamTrust: 5, fatigue: 11, lifeBalance: -7, characterRelations: [{ characterId: "lin_ruoning", value: 6 }] },
      },
      {
        id: "mar-network",
        label: "参加行业论坛，拓展人脉",
        category: "communication",
        description: "在政策解读论坛上认识更多业内人士。",
        effects: { researchCredibility: 4, committeeAdoption: 6, portfolioNav: 0.005, viewAccuracy: 5, clientFeedback: 7, teamTrust: 8, fatigue: 3, lifeBalance: -2, characterRelations: [{ characterId: "zhou_mingzhao", value: 5 }] },
      },
      {
        id: "mar-hype",
        label: "追逐政策热点，快速出稿",
        category: "risk",
        description: "第一时间覆盖所有政策相关热门标的。",
        effects: { researchCredibility: -4, committeeAdoption: 4, portfolioNav: 0.01, viewAccuracy: -6, clientFeedback: 6, teamTrust: 0, fatigue: 8, lifeBalance: -4, characterRelations: [{ characterId: "lin_ruoning", value: -3 }] },
      },
      {
        id: "mar-rest",
        label: "请假一天，回家看父母",
        category: "life",
        description: "在政策窗口最紧张的时候，选择回家。",
        effects: { researchCredibility: 0, committeeAdoption: -3, portfolioNav: 0, viewAccuracy: 0, clientFeedback: 0, teamTrust: -1, fatigue: -15, lifeBalance: 15, characterRelations: [{ characterId: "lin_ruoning", value: 3 }] },
      },
    ],
    // 四月：一季报验证期
    [
      {
        id: "apr-earnings",
        label: "做一季报交叉验证分析",
        category: "research",
        description: "把财报数据与前期研究假设逐一对照。",
        effects: { researchCredibility: 14, committeeAdoption: 6, portfolioNav: 0.015, viewAccuracy: 10, clientFeedback: 3, teamTrust: 5, fatigue: 10, lifeBalance: -5, characterRelations: [{ characterId: "lin_ruoning", value: 8 }] },
      },
      {
        id: "apr-present",
        label: "在晨会上做业绩回顾",
        category: "communication",
        description: "把验证结果用简洁的方式呈现给团队。",
        effects: { researchCredibility: 5, committeeAdoption: 10, portfolioNav: 0.005, viewAccuracy: 5, clientFeedback: 5, teamTrust: 8, fatigue: 4, lifeBalance: -2, characterRelations: [{ characterId: "zhou_mingzhao", value: 4 }] },
      },
      {
        id: "apr-skip",
        label: "跳过细节，看大方向",
        category: "risk",
        description: "一季报太细碎了，先看行业趋势再说。",
        effects: { researchCredibility: -5, committeeAdoption: 2, portfolioNav: -0.005, viewAccuracy: -8, clientFeedback: 1, teamTrust: -2, fatigue: -2, lifeBalance: 3, characterRelations: [{ characterId: "lin_ruoning", value: -5 }] },
      },
      {
        id: "apr-life",
        label: "周末和朋友短途旅行",
        category: "life",
        description: "财报季压力最大的时候，给自己放个假。",
        effects: { researchCredibility: 0, committeeAdoption: -2, portfolioNav: 0, viewAccuracy: 0, clientFeedback: 0, teamTrust: -2, fatigue: -14, lifeBalance: 14, characterRelations: [{ characterId: "chen_xinghe", value: 4 }] },
      },
    ],
    // 五月：风格再平衡
    [
      {
        id: "may-style",
        label: "做风格轮动专题研究",
        category: "research",
        description: "分析成长/价值/红利之间的资金流动。",
        effects: { researchCredibility: 10, committeeAdoption: 7, portfolioNav: 0.01, viewAccuracy: 6, clientFeedback: 4, teamTrust: 5, fatigue: 9, lifeBalance: -5, characterRelations: [{ characterId: "zhou_mingzhao", value: 7 }] },
      },
      {
        id: "may-debate",
        label: "组织内部风格辩论会",
        category: "communication",
        description: "邀请不同风格的同事碰撞观点。",
        effects: { researchCredibility: 5, committeeAdoption: 8, portfolioNav: 0.005, viewAccuracy: 5, clientFeedback: 3, teamTrust: 10, fatigue: 3, lifeBalance: -1, characterRelations: [{ characterId: "chen_xinghe", value: 6 }] },
      },
      {
        id: "may-fomo",
        label: "追最强的风格，不管逻辑",
        category: "risk",
        description: "哪个风格涨得好就跟哪个。",
        effects: { researchCredibility: -6, committeeAdoption: 2, portfolioNav: 0.01, viewAccuracy: -10, clientFeedback: 2, teamTrust: -3, fatigue: 5, lifeBalance: -3, characterRelations: [{ characterId: "zhou_mingzhao", value: -5 }] },
      },
      {
        id: "may-life",
        label: "下班后去学一门新技能",
        category: "life",
        description: "在风格混乱的月份，投资自己。",
        effects: { researchCredibility: 2, committeeAdoption: 0, portfolioNav: 0, viewAccuracy: 0, clientFeedback: 0, teamTrust: 0, fatigue: -8, lifeBalance: 10, characterRelations: [{ characterId: "chen_xinghe", value: 3 }] },
      },
    ],
    // 六月-十二月：模板（按月主题微调）
    // 六月：中报预期
    [
      {
        id: "jun-preview",
        label: "做中报业绩预览模型",
        category: "research",
        description: "提前搭建中报预测框架，标注重点公司。",
        effects: { researchCredibility: 12, committeeAdoption: 7, portfolioNav: 0.015, viewAccuracy: 8, clientFeedback: 4, teamTrust: 5, fatigue: 10, lifeBalance: -6, characterRelations: [{ characterId: "lin_ruoning", value: 6 }] },
      },
      {
        id: "jun-client",
        label: "给重点客户做一对一沟通",
        category: "communication",
        description: "在中报前与客户对齐预期。",
        effects: { researchCredibility: 4, committeeAdoption: 6, portfolioNav: 0.005, viewAccuracy: 5, clientFeedback: 12, teamTrust: 6, fatigue: 5, lifeBalance: -3, characterRelations: [{ characterId: "zhou_mingzhao", value: 4 }] },
      },
      {
        id: "jun-overconfident",
        label: "过度自信，重仓押注单一方向",
        category: "risk",
        description: "觉得自己看得很准，把模拟组合集中在一个板块。",
        effects: { researchCredibility: -3, committeeAdoption: 0, portfolioNav: -0.01, viewAccuracy: -5, clientFeedback: -3, teamTrust: -4, fatigue: 6, lifeBalance: -4, characterRelations: [{ characterId: "lin_ruoning", value: -4 }] },
      },
      {
        id: "jun-life",
        label: "周末带家人去郊游",
        category: "life",
        description: "半年过去了，陪陪家人。",
        effects: { researchCredibility: 0, committeeAdoption: 0, portfolioNav: 0, viewAccuracy: 0, clientFeedback: 0, teamTrust: 0, fatigue: -12, lifeBalance: 14, characterRelations: [{ characterId: "lin_ruoning", value: 3 }] },
      },
    ],
    // 七月：暑期主题扩散
    [
      {
        id: "jul-chain",
        label: "做产业链深度拆解",
        category: "research",
        description: "从上游到下游逐层分析扩散行情的质量。",
        effects: { researchCredibility: 13, committeeAdoption: 6, portfolioNav: 0.015, viewAccuracy: 7, clientFeedback: 3, teamTrust: 5, fatigue: 10, lifeBalance: -5, characterRelations: [{ characterId: "lin_ruoning", value: 7 }] },
      },
      {
        id: "jul-share",
        label: "组织团队分享会",
        category: "communication",
        description: "让每个人分享自己覆盖的支线，交叉验证。",
        effects: { researchCredibility: 5, committeeAdoption: 5, portfolioNav: 0.005, viewAccuracy: 5, clientFeedback: 4, teamTrust: 10, fatigue: 4, lifeBalance: -1, characterRelations: [{ characterId: "chen_xinghe", value: 6 }] },
      },
      {
        id: "jul-chase",
        label: "追着涨幅最大的支线跑",
        category: "risk",
        description: "哪条支线涨得最猛就研究哪条。",
        effects: { researchCredibility: -5, committeeAdoption: 3, portfolioNav: 0.005, viewAccuracy: -7, clientFeedback: 3, teamTrust: -2, fatigue: 8, lifeBalance: -4, characterRelations: [{ characterId: "zhou_mingzhao", value: -4 }] },
      },
      {
        id: "jul-life",
        label: "暑假请年假，去海边",
        category: "life",
        description: "市场在扩散，你在度假。",
        effects: { researchCredibility: -1, committeeAdoption: -3, portfolioNav: 0, viewAccuracy: 0, clientFeedback: 0, teamTrust: -2, fatigue: -16, lifeBalance: 16, characterRelations: [{ characterId: "chen_xinghe", value: 4 }] },
      },
    ],
    // 八月：中报落地复盘
    [
      {
        id: "aug-review",
        label: "写详细的中报复盘报告",
        category: "research",
        description: "对照预期和实际，记录每一个判断偏差。",
        effects: { researchCredibility: 15, committeeAdoption: 8, portfolioNav: 0.01, viewAccuracy: 12, clientFeedback: 5, teamTrust: 6, fatigue: 8, lifeBalance: -4, characterRelations: [{ characterId: "lin_ruoning", value: 8 }] },
      },
      {
        id: "aug-present",
        label: "在投委会做复盘汇报",
        category: "communication",
        description: "把你的复盘结论呈现给决策者。",
        effects: { researchCredibility: 8, committeeAdoption: 12, portfolioNav: 0.005, viewAccuracy: 6, clientFeedback: 6, teamTrust: 7, fatigue: 4, lifeBalance: -2, characterRelations: [{ characterId: "zhou_mingzhao", value: 6 }] },
      },
      {
        id: "aug-blame",
        label: "把失误归咎于市场不可预测",
        category: "risk",
        description: "不反思自己的研究框架，把锅甩给市场。",
        effects: { researchCredibility: -8, committeeAdoption: -5, portfolioNav: -0.005, viewAccuracy: -4, clientFeedback: -5, teamTrust: -8, fatigue: 2, lifeBalance: 0, characterRelations: [{ characterId: "lin_ruoning", value: -7 }] },
      },
      {
        id: "aug-life",
        label: "下班后不再看行情，去散步",
        category: "life",
        description: "中报季结束了，给自己一个真正的休息。",
        effects: { researchCredibility: 0, committeeAdoption: 0, portfolioNav: 0, viewAccuracy: 2, clientFeedback: 0, teamTrust: 0, fatigue: -10, lifeBalance: 12, characterRelations: [{ characterId: "zhou_mingzhao", value: 3 }] },
      },
    ],
    // 九月：三季度风格切换
    [
      {
        id: "sep-structure",
        label: "做成交结构专题分析",
        category: "research",
        description: "拆解每日成交数据，找出资金真正在流向哪里。",
        effects: { researchCredibility: 11, committeeAdoption: 7, portfolioNav: 0.01, viewAccuracy: 7, clientFeedback: 4, teamTrust: 5, fatigue: 9, lifeBalance: -5, characterRelations: [{ characterId: "chen_xinghe", value: 8 }] },
      },
      {
        id: "sep-debate",
        label: "找宏观团队辩论方向",
        category: "communication",
        description: "与周明昭深入讨论宏观变量对行业的影响。",
        effects: { researchCredibility: 6, committeeAdoption: 8, portfolioNav: 0.005, viewAccuracy: 6, clientFeedback: 3, teamTrust: 9, fatigue: 3, lifeBalance: -1, characterRelations: [{ characterId: "zhou_mingzhao", value: 8 }] },
      },
      {
        id: "sep-rigid",
        label: "死守原有观点不调整",
        category: "risk",
        description: "即使成交结构已经变化，仍然坚持之前的判断。",
        effects: { researchCredibility: -7, committeeAdoption: -4, portfolioNav: -0.01, viewAccuracy: -8, clientFeedback: -4, teamTrust: -5, fatigue: -2, lifeBalance: 2, characterRelations: [{ characterId: "chen_xinghe", value: -6 }] },
      },
      {
        id: "sep-life",
        label: "周末去爬山，清空思绪",
        category: "life",
        description: "在风格混乱的节点，让自己从高空俯瞰。",
        effects: { researchCredibility: 1, committeeAdoption: 0, portfolioNav: 0, viewAccuracy: 2, clientFeedback: 0, teamTrust: 0, fatigue: -12, lifeBalance: 12, characterRelations: [{ characterId: "zhou_mingzhao", value: 3 }] },
      },
    ],
    // 十月：年末排名预热
    [
      {
        id: "oct-ranking",
        label: "做排名博弈专题研究",
        category: "research",
        description: "分析机构持仓结构和可能的排名推升方向。",
        effects: { researchCredibility: 10, committeeAdoption: 8, portfolioNav: 0.015, viewAccuracy: 6, clientFeedback: 5, teamTrust: 4, fatigue: 9, lifeBalance: -5, characterRelations: [{ characterId: "zhou_mingzhao", value: 6 }] },
      },
      {
        id: "oct-align",
        label: "与基金经理对齐年度目标",
        category: "communication",
        description: "了解投资端对年末排名的真实态度。",
        effects: { researchCredibility: 5, committeeAdoption: 10, portfolioNav: 0.005, viewAccuracy: 5, clientFeedback: 8, teamTrust: 7, fatigue: 4, lifeBalance: -2, characterRelations: [{ characterId: "lin_ruoning", value: 5 }] },
      },
      {
        id: "oct-gamble",
        label: "押注排名行情，不论对错",
        category: "risk",
        description: "为了排名好看，先冲了再说。",
        effects: { researchCredibility: -8, committeeAdoption: 2, portfolioNav: 0.01, viewAccuracy: -10, clientFeedback: -2, teamTrust: -4, fatigue: 8, lifeBalance: -5, characterRelations: [{ characterId: "zhou_mingzhao", value: -6 }] },
      },
      {
        id: "oct-life",
        label: "按时下班，保持稳定节奏",
        category: "life",
        description: "排名焦虑最大的时候，保持自己的节奏。",
        effects: { researchCredibility: 2, committeeAdoption: -1, portfolioNav: 0, viewAccuracy: 3, clientFeedback: 1, teamTrust: 3, fatigue: -8, lifeBalance: 10, characterRelations: [{ characterId: "lin_ruoning", value: 4 }] },
      },
    ],
    // 十一月：估值切换
    [
      {
        id: "nov-forward",
        label: "做下一年度展望模型",
        category: "research",
        description: "把估值切换到明年，重新定价核心标的。",
        effects: { researchCredibility: 12, committeeAdoption: 9, portfolioNav: 0.02, viewAccuracy: 7, clientFeedback: 6, teamTrust: 6, fatigue: 10, lifeBalance: -6, characterRelations: [{ characterId: "lin_ruoning", value: 7 }] },
      },
      {
        id: "nov-strategy",
        label: "给投委会写年度策略建议",
        category: "communication",
        description: "把你的研究框架写成正式的年度策略。",
        effects: { researchCredibility: 8, committeeAdoption: 14, portfolioNav: 0.01, viewAccuracy: 6, clientFeedback: 7, teamTrust: 8, fatigue: 6, lifeBalance: -3, characterRelations: [{ characterId: "zhou_mingzhao", value: 7 }] },
      },
      {
        id: "nov-extrapolate",
        label: "简单外推今年趋势",
        category: "risk",
        description: "不做深度研究，直接把今年涨幅线性外推。",
        effects: { researchCredibility: -6, committeeAdoption: -2, portfolioNav: -0.005, viewAccuracy: -8, clientFeedback: -3, teamTrust: -3, fatigue: -1, lifeBalance: 1, characterRelations: [{ characterId: "lin_ruoning", value: -5 }] },
      },
      {
        id: "nov-life",
        label: "年底前整理全年工作日志",
        category: "life",
        description: "在忙碌中留出时间，回顾自己一年的成长。",
        effects: { researchCredibility: 3, committeeAdoption: 1, portfolioNav: 0, viewAccuracy: 4, clientFeedback: 2, teamTrust: 2, fatigue: -6, lifeBalance: 10, characterRelations: [{ characterId: "lin_ruoning", value: 4 }] },
      },
    ],
    // 十二月：年度收官
    [
      {
        id: "dec-report",
        label: "写年度研究报告",
        category: "research",
        description: "把十二个月的研究札记整合成一份完整报告。",
        effects: { researchCredibility: 15, committeeAdoption: 10, portfolioNav: 0.015, viewAccuracy: 10, clientFeedback: 8, teamTrust: 8, fatigue: 8, lifeBalance: -4, characterRelations: [{ characterId: "lin_ruoning", value: 10 }] },
      },
      {
        id: "dec-annual",
        label: "在年度策略会上做主题演讲",
        category: "communication",
        description: "站在全部门面前，分享你的研究框架。",
        effects: { researchCredibility: 10, committeeAdoption: 15, portfolioNav: 0.01, viewAccuracy: 7, clientFeedback: 10, teamTrust: 10, fatigue: 5, lifeBalance: -2, characterRelations: [{ characterId: "zhou_mingzhao", value: 8 }] },
      },
      {
        id: "dec-coast",
        label: "年末摸鱼，等明年再说",
        category: "risk",
        description: "反正马上过年了，先躺平。",
        effects: { researchCredibility: -8, committeeAdoption: -8, portfolioNav: -0.005, viewAccuracy: -5, clientFeedback: -5, teamTrust: -6, fatigue: -10, lifeBalance: 5, characterRelations: [{ characterId: "lin_ruoning", value: -8 }] },
      },
      {
        id: "dec-life",
        label: "和同事们一起年末聚餐",
        category: "life",
        description: "一年结束了，和团队一起庆祝。",
        effects: { researchCredibility: 2, committeeAdoption: 3, portfolioNav: 0, viewAccuracy: 2, clientFeedback: 5, teamTrust: 15, fatigue: -8, lifeBalance: 12, characterRelations: [
          { characterId: "lin_ruoning", value: 7 },
          { characterId: "chen_xinghe", value: 7 },
          { characterId: "zhou_mingzhao", value: 7 },
        ] },
      },
    ],
  ];

  return themes[monthIndex % themes.length];
}

// ═══════════════════════════════════════════════════════════
// Scene Scripts — 2025年1月序章（化名版，移除DeepSeek）
// ═══════════════════════════════════════════════════════════

export function buildMonthScene(monthIndex: number, year?: string): MonthScene {
  const story = STORY_ARCS[monthIndex % STORY_ARCS.length];
  const monthNum = monthIndex + 1;
  const month = `${year || "2025"}-${String(monthNum).padStart(2, "0")}`;
  const label = `${year || "2025"}年${monthNum}月`;
  const theme = story.theme;

  if (year === "2025" && monthIndex === 0) {
    return build2025Prologue(month, label, theme);
  }

  // Default scene for non-2025 or non-prologue months
  const decisions = makeResearchDecisions(monthIndex);
  const nodes: SceneNode[] = [
    {
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
    },
    {
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
    },
    {
      id: `m${monthIndex}-decision`,
      type: "decision",
      characterId: story.characterId,
      speaker: story.speaker,
      role: story.role,
      mood: story.mood,
      text: `${story.line} 先决定今天怎么安排，再选择你的研究方向。`,
      prompt: story.mission,
      pose: "smile",
      bg: "briefing-room",
      bgm: "morning-loop",
      voiceCue: "key",
      decisions,
      decisionPrompt: story.mission,
      briefTitle: `${theme.period}：${theme.title}`,
      briefs: [
        { characterId: "lin_ruoning", label: "事件背景", text: theme.publicContext },
        { characterId: "chen_xinghe", label: "数据维度", text: theme.gameHook },
        { characterId: "zhou_mingzhao", label: "风险提示", text: "同事们只依据公开信息判断。男主需要把未来记忆转成可验证假设。" },
      ],
    },
  ];

  return { id: `${year || "default"}-m${monthIndex}`, year, monthIndex, month, label, theme, nodes };
}

function build2025Prologue(month: string, label: string, theme: MarketTheme): MonthScene {
  const decisions = makeResearchDecisions(0);
  const nodes: SceneNode[] = [
    {
      id: "2025p-memory",
      type: "dialogue",
      characterId: "lin_ruoning",
      speaker: "内心独白",
      role: "只有你知道",
      mood: "警觉",
      text: "我知道 2025 年 1 月会很不平静。某国产低成本推理模型发布后，市场会重新讨论 AI 应用、推理成本和国产算力的关系。但我不能直接说'要涨'，只能把它拆成可验证的假设。",
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
      text: "她把一杯热咖啡推到你手边：如果你想说服大家，预感还不够。低成本推理、应用扩散、算力适配，至少要拆成三条可验证假设。",
      pose: "thinking",
      bg: "research-room",
      bgm: "morning-loop",
    },
    {
      id: "2025p-chen-1",
      type: "dialogue",
      characterId: "chen_xinghe",
      speaker: "陈星禾",
      role: "量化/资金信号",
      mood: "俏皮",
      text: "陈星禾抱着平板冲进会议室：早盘信号来了！AI 软件、机器人、光模块都在抢注意力。你这次盯得这么早，抓到什么先行指标了吗？",
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
      text: "她点开几条线索：我只相信成交额和持续性。市场如果真的在重估 AI 叙事，资金会反复留下痕迹。",
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
      text: "周明昭在会议室白板上圈出月初和月末两个日期：不要把技术突破直接等同于研究结论。中间还隔着风险偏好、估值和兑现节奏。",
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
      text: "她补上一行小字：公开信息只能证明事件发生，不能证明交易方向。你如果想提前布局，就要解释这次热度能持续多久。",
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
      text: "林若宁翻开笔记：我们先做第一份事件纪要。你的研究档案从今天开始积累，真正重要的不是你赚了多少，而是你能说清楚多少。",
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
      text: "陈星禾把平板转向你：我负责资金信号。谁在放量，谁被市场反复确认，谁只是蹭概念，我都会标出来。",
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
      text: "周明昭轻轻敲了敲杯沿：我负责宏观和风控。别只盯机会，能说清风险边界，才有资格入场。",
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
      text: "林若宁把四个研究选项排成一列：先决定今天怎么安排，再选一个你愿意负责到底的方向。结果会结算，研究札记也会留下。",
      prompt: "下一步会进入本月研究选择。",
      pose: "smile",
      bg: "briefing-room",
      bgm: "morning-loop",
      voiceCue: "key",
      decisions,
      decisionPrompt: "安排本话日程，然后选择一个研究方向。",
      briefTitle: "第一次研究会议：AI 叙事的四条路径",
      briefs: [
        { characterId: "lin_ruoning", label: "基本面", text: "先看低成本推理能否改变应用落地和需求弹性，避免只被概念和热度带走。" },
        { characterId: "chen_xinghe", label: "资金面", text: "成交活跃度越高，越可能说明市场已经开始验证这条叙事。" },
        { characterId: "zhou_mingzhao", label: "宏观风控", text: "如果只是新闻脉冲，月末就可能被估值和拥挤度反噬。" },
      ],
    },
  ];

  return { id: "2025-scene-prologue", year: "2025", monthIndex: 0, month, label, theme, nodes };
}

// ═══════════════════════════════════════════════════════════
// Year-specific scene overrides
// ═══════════════════════════════════════════════════════════

export const YEAR_SCENE_BUILDERS: Record<string, (monthIndex: number) => MonthScene> = {
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
    S: ["这条路把事件和逻辑连起来了，研究框架完全经得起复盘。", "完美的一次判断。你提前看到了市场还没完全定价的东西。"],
    A: ["逻辑在线，下次可以考虑更早入场。", "这次研究很扎实，只是还差一点超额认知。"],
    B: ["结果不差，但下次可以先问一句：这个逻辑能持续多久。", "方向对了，但你没有完全说清楚判断依据。下次加上。"],
    C: ["只能说及格。下次不要把直觉当成研究假设，要写出证据。", "勉强过关，但这次更多是运气。复盘时要诚实。"],
    D: ["失败了也没关系。记录下这次判断在哪一层出了偏差。", "这次需要认真复盘。先写清风险从哪里来，再找下次机会。"],
  },
  chen_xinghe: {
    S: ["信号和主线共振，这就是我一直说的数据确认！", "你这次盯对了成交数据，而且逻辑也对了，太棒了。"],
    A: ["方向对了，但数据持续性还需要更多证据。继续跟踪。", "不错的结果！下次可以再关注一下量能结构。"],
    B: ["成交数据看起来还行，但逻辑没有完全串起来。", "下次先看数据有没有反复确认，再做判断。"],
    C: ["这次信号有点弱，你可能是凭感觉选的。下次多看看数据。", "我信你下次会更好。这次的数据复盘留给我吧。"],
    D: ["信号全错了，但这种失败经验比侥幸过关更有用。", "没关系！每一次错误都在为下一次正确做准备。"],
  },
  zhou_mingzhao: {
    S: ["完美的风控意识加上正确的方向，这就是职业判断。", "你在高回报里也守住了风险底线，值得记录。"],
    A: ["结果不错，但要复盘一下：这中间有没有你在冒险的环节。", "收益和风控还算均衡。下次可以试着更早判断主线。"],
    B: ["中规中矩。想进入更好结局，下次要更主动一些。", "这次的路不太像你的风格。回看一下为什么偏离了方法论。"],
    C: ["风险释放比逻辑兑现快，这次你被市场推着走。", "下次入场前先写好：最多愿意承受多少判断错误。"],
    D: ["这次没有守住底线。别自责，但要把它写进研究日志。", "市场没有否定你，只是在提醒你判断前要先想清楚风险。"],
  },
};
