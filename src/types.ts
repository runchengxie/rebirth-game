export type CharacterId = "lin_ruoning" | "chen_xinghe" | "zhou_mingzhao";

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  role: string;
  tag: string;
  color: "pink" | "blue" | "lavender";
  intro: string;
}

export interface CharacterRelation {
  characterId: CharacterId;
  value: number; // 0-100
}

// ── Research decisions (replacing stock options) ──

export interface ResearchDecision {
  id: string;
  label: string;           // e.g. "连夜写《低成本推理对应用软件的影响》"
  category: "research" | "life" | "communication" | "risk";
  description: string;
  effects: DecisionEffects;
  backgroundNote?: string; // market context shown after choice
}

export interface DecisionEffects {
  researchCredibility: number;   // +/- 研究可信度
  committeeAdoption: number;     // +/- 投委会采纳度
  portfolioNav: number;          // +/- 组合模拟净值变化率
  viewAccuracy: number;          // +/- 观点命中率
  clientFeedback: number;        // +/- 客户反馈
  teamTrust: number;             // +/- 团队信任
  fatigue: number;               // +/- 疲劳值
  lifeBalance: number;           // +/- 生活平衡
  characterRelations: CharacterRelation[];  // 角色关系变化
}

// ── Monthly scenario ──

export interface MarketTheme {
  id: string;
  period: string;           // e.g. "2025年1月"
  title: string;            // e.g. "AI叙事升温"
  publicContext: string;    // 公开信息层面
  protagonistMemory: string; // 男主知道的未来信息
  gameHook: string;         // 本话引导
}

export interface SceneNode {
  id: string;
  type: "dialogue" | "decision";
  characterId: CharacterId;
  speaker: string;
  role: string;
  mood: string;
  text: string;
  prompt?: string;
  pose?: string;
  bg?: string;
  bgm?: string;
  voice?: string;
  voiceCue?: "silent" | "key";
  // decision nodes
  decisions?: ResearchDecision[];
  decisionPrompt?: string;
  briefTitle?: string;
  briefs?: ResearchBrief[];
}

// Legacy alias for sfx.ts compatibility
export type DialogueNode = SceneNode;

export interface ResearchBrief {
  characterId: CharacterId;
  label: string;
  text: string;
}

// Story arc type (exported for engine.ts)
export interface StoryArc {
  characterId: CharacterId;
  title: string;
  speaker: string;
  role: string;
  mood: string;
  line: string;
  mission: string;
  theme: MarketTheme;
}

export interface MonthScene {
  id: string;
  year?: string;
  monthIndex: number;
  month: string;           // "2025-01"
  label: string;           // "2025年1月"
  theme: MarketTheme;
  nodes: SceneNode[];
}

// ── Game month data (backend market results for post-mortem) ──

export interface MarketSnapshot {
  month: string;           // "2025-01"
  label: string;
  marketStart: string;     // "20250102"
  marketEnd: string;
  themeIndex: string;      // reference index performance
  themeReturn: number;     // reference index monthly return
  eventSummary: string;    // what actually happened
}

export interface GameDataYear {
  year: number;
  currency: string;
  generatedAt: string;
  source: Record<string, string>;
  rules: Record<string, unknown>;
  benchmarks: MarketSnapshot[];
  scenes: MonthScene[];
}

export type GameDataMap = Record<string, GameDataYear>;

// ── Focus actions (daily schedule choices) ──

export interface FocusAction {
  id: string;
  label: string;
  icon: string;
  short: string;
  detail: string;
  researchCredibilityBonus: number;
  fatigueDelta: number;
  lifeBalanceDelta: number;
  teamTrustBonus: number;
}

// ── Game state ──

export interface GameState {
  year: string;
  monthIndex: number;
  focusId: string;
  selectedId: string | null;
  sceneNodeIndex: number;
  locked: boolean;
  finished: boolean;

  // Research career metrics (replacing capital)
  researchCredibility: number;   // 0-100
  committeeAdoption: number;     // 0-100
  portfolioNav: number;          // 组合模拟净值，起点 1.000
  viewAccuracy: number;          // 0-100
  clientFeedback: number;        // 0-100
  teamTrust: number;             // 0-100
  fatigue: number;               // 0-100
  lifeBalance: number;           // 0-100

  // Character relations
  relations: Record<CharacterId, number>;

  history: RoundResult[];
}

// ── Round result ──

export interface RoundOutcome {
  title: string;
  dialogue: string;
  detail: string;
}

export interface DecisionScore {
  logicScore: number;        // 0-30  研究逻辑合理性
  riskScore: number;         // 0-25  风险控制
  communicationScore: number; // 0-25 沟通协作
  lifeScore: number;         // 0-20  生活平衡
  total: number;             // 0-100
  grade: string;             // S/A/B/C/D
}

export interface RoundResult {
  month: string;
  label: string;
  characterId: CharacterId;
  sceneTitle: string;
  selected: ResearchDecision;
  focus: FocusAction;
  outcome: RoundOutcome;

  // Post-decision state
  researchCredibilityAfter: number;
  committeeAdoptionAfter: number;
  portfolioNavAfter: number;
  viewAccuracyAfter: number;
  clientFeedbackAfter: number;
  teamTrustAfter: number;
  fatigueAfter: number;
  lifeBalanceAfter: number;
  relationsAfter: Record<CharacterId, number>;

  // Market post-mortem (for flavor, not scoring)
  marketTheme: string;
  marketReturn: number;

  score?: DecisionScore;
}
