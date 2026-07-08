import { FOCUS_ACTIONS, GRADE_REVIEWS, STORY_ARCS, buildMonthScene } from "./content";
import type {
  CharacterId,
  DecisionScore,
  FocusAction,
  GameDataYear,
  GameState,
  MonthScene,
  ResearchDecision,
  RoundOutcome,
  StoryArc,
} from "../types";

// ═══════════════════════════════════════════════════════════
// Clamp & format helpers
// ═══════════════════════════════════════════════════════════

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function compactDate(raw: string): string {
  if (!raw || raw.length !== 8) return raw || "";
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

export function formatPct(rate: number): string {
  if (!Number.isFinite(rate)) return "--";
  const pct = rate * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatNav(value: number): string {
  return value.toFixed(4);
}

export function formatDelta(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}`;
}

// ═══════════════════════════════════════════════════════════
// Story / scene lookup
// ═══════════════════════════════════════════════════════════

export function storyForMonth(index: number): StoryArc {
  return STORY_ARCS[index % STORY_ARCS.length];
}

export function sceneForMonth(index: number, year?: string): MonthScene {
  if (year === "2025") {
    return buildMonthScene(index, "2025");
  }
  return buildMonthScene(index);
}

export function currentSceneNode(state: GameState): MonthScene["nodes"][number] {
  const scene = sceneForMonth(state.monthIndex, state.year);
  return scene.nodes[state.sceneNodeIndex] || scene.nodes[scene.nodes.length - 1];
}

// ═══════════════════════════════════════════════════════════
// Focus actions
// ═══════════════════════════════════════════════════════════

export function focusById(id: string): FocusAction {
  return FOCUS_ACTIONS.find((item) => item.id === id) || FOCUS_ACTIONS[0];
}

// ═══════════════════════════════════════════════════════════
// Initial state
// ═══════════════════════════════════════════════════════════

export function createInitialState(year: string): GameState {
  return {
    year,
    monthIndex: 0,
    focusId: "deep_research",
    selectedId: null,
    sceneNodeIndex: 0,
    locked: false,
    finished: false,
    researchCredibility: 20,
    committeeAdoption: 15,
    portfolioNav: 1.0,
    viewAccuracy: 15,
    clientFeedback: 15,
    teamTrust: 25,
    fatigue: 30,
    lifeBalance: 50,
    relations: {
      lin_ruoning: 25,
      chen_xinghe: 18,
      zhou_mingzhao: 16,
    },
    history: [],
  };
}

// ═══════════════════════════════════════════════════════════
// Decision outcome builder
// ═══════════════════════════════════════════════════════════

export function buildOutcome(
  decision: ResearchDecision,
  story: StoryArc,
  focus: FocusAction,
): RoundOutcome {
  const categoryText: Record<string, string> = {
    research: "深入研究了这个问题",
    communication: "选择了沟通协作的方式",
    risk: "选择了保守策略",
    life: "优先照顾了生活",
  };

  const focusText: Record<string, string> = {
    deep_research: "深度研报让研究更扎实",
    team_collab: "团队协作让观点更全面",
    self_care: "生活优先让你保持了状态",
  };

  return {
    title: `${story.speaker}对你的选择做出了评价`,
    dialogue: `${story.speaker}看了看你的选择：${categoryText[decision.category] || "做了选择"}。${focusText[focus.id] || ""}`,
    detail: decision.backgroundNote || "",
  };
}

// ═══════════════════════════════════════════════════════════
// Decision scoring
// ═══════════════════════════════════════════════════════════

export function scoreDecision(
  decision: ResearchDecision,
  story: StoryArc,
  focus: FocusAction,
): DecisionScore {
  // Logic score (0-30): based on decision category + focus synergy
  let logicScore = 12;
  if (decision.category === "research") {
    logicScore = focus.id === "deep_research" ? 28 : 22;
  } else if (decision.category === "communication") {
    logicScore = focus.id === "team_collab" ? 26 : 18;
  } else if (decision.category === "risk") {
    logicScore = 10;
  } else if (decision.category === "life") {
    logicScore = 8;
  }

  // Risk score (0-25): inverse of risk category
  let riskScore = 15;
  if (decision.category === "risk") riskScore = 8;
  else if (decision.category === "research") riskScore = 20;
  else if (decision.category === "life") riskScore = 22;

  // Communication score (0-25)
  let communicationScore = 12;
  if (decision.category === "communication") communicationScore = 22;
  else if (decision.category === "life") communicationScore = 14;
  else if (focus.id === "team_collab") communicationScore = Math.max(communicationScore, 18);

  // Life score (0-20)
  let lifeScore = 8;
  if (decision.category === "life") lifeScore = 18;
  else if (focus.id === "self_care") lifeScore = 14;
  else if (decision.category === "research" && focus.id === "deep_research") lifeScore = 4;

  // Character synergy
  let characterBonus = 4;
  const characterId = story.characterId;
  if (characterId === "lin_ruoning" && decision.category === "research") characterBonus = 8;
  else if (characterId === "chen_xinghe" && decision.category === "communication") characterBonus = 8;
  else if (characterId === "zhou_mingzhao" && (decision.category === "risk" || decision.category === "research")) characterBonus = 7;

  logicScore = Math.min(30, logicScore + Math.floor(characterBonus / 2));
  communicationScore = Math.min(25, communicationScore + Math.floor(characterBonus / 2));

  const total = Math.min(100, logicScore + riskScore + communicationScore + lifeScore);

  let grade = "D";
  if (total >= 90) grade = "S";
  else if (total >= 75) grade = "A";
  else if (total >= 60) grade = "B";
  else if (total >= 40) grade = "C";

  return { logicScore, riskScore, communicationScore, lifeScore, total, grade };
}

// ═══════════════════════════════════════════════════════════
// Grade review text
// ═══════════════════════════════════════════════════════════

export function gradeReviewText(characterId: CharacterId, grade: string): string {
  const reviews = GRADE_REVIEWS[characterId]?.[grade];
  if (!reviews || reviews.length === 0) return "";
  const seed = Array.from(grade).reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return reviews[seed % reviews.length];
}

// ═══════════════════════════════════════════════════════════
// State transitions
// ═══════════════════════════════════════════════════════════

export function selectFocus(state: GameState, focusId: string): GameState {
  if (state.locked || state.finished) return state;
  return { ...state, focusId };
}

export function makeDecision(state: GameState, _data: GameDataYear, decision: ResearchDecision): GameState {
  if (state.locked || state.finished) return state;
  const story = storyForMonth(state.monthIndex);
  const focus = focusById(state.focusId);
  const outcome = buildOutcome(decision, story, focus);
  const characterId = story.characterId;
  const eff = decision.effects;

  // Apply focus bonuses
  const researchBonus = focus.researchCredibilityBonus;
  const fatigueFromFocus = focus.fatigueDelta;
  const lifeBalanceFromFocus = focus.lifeBalanceDelta;
  const teamTrustFromFocus = focus.teamTrustBonus;

  // Character relation: apply decision effects + find the specific character delta
  const charRelationDelta = eff.characterRelations.find((r) => r.characterId === characterId)?.value || 0;

  const nextResearchCredibility = clamp(state.researchCredibility + eff.researchCredibility + researchBonus);
  const nextCommitteeAdoption = clamp(state.committeeAdoption + eff.committeeAdoption);
  const nextPortfolioNav = Math.max(0.001, state.portfolioNav * (1 + eff.portfolioNav));
  const nextViewAccuracy = clamp(state.viewAccuracy + eff.viewAccuracy);
  const nextClientFeedback = clamp(state.clientFeedback + eff.clientFeedback);
  const nextTeamTrust = clamp(state.teamTrust + eff.teamTrust + teamTrustFromFocus);
  const nextFatigue = clamp(state.fatigue + eff.fatigue + fatigueFromFocus);
  const nextLifeBalance = clamp(state.lifeBalance + eff.lifeBalance + lifeBalanceFromFocus);

  const nextRelations: Record<CharacterId, number> = { ...state.relations };
  eff.characterRelations.forEach((rel) => {
    nextRelations[rel.characterId] = clamp((nextRelations[rel.characterId] || 0) + rel.value);
  });
  // Also apply subtle relation change for current character
  nextRelations[characterId] = clamp((nextRelations[characterId] || 0) + charRelationDelta + Math.floor(teamTrustFromFocus / 3));

  const score = scoreDecision(decision, story, focus);

  return {
    ...state,
    locked: true,
    selectedId: decision.id,
    researchCredibility: nextResearchCredibility,
    committeeAdoption: nextCommitteeAdoption,
    portfolioNav: Math.round(nextPortfolioNav * 10000) / 10000,
    viewAccuracy: nextViewAccuracy,
    clientFeedback: nextClientFeedback,
    teamTrust: nextTeamTrust,
    fatigue: nextFatigue,
    lifeBalance: nextLifeBalance,
    relations: nextRelations,
    finished: state.monthIndex >= 11, // 12 months (0-11)
    history: [
      ...state.history,
      {
        month: `${state.year}-${String(state.monthIndex + 1).padStart(2, "0")}`,
        label: `${state.year}年${state.monthIndex + 1}月`,
        characterId,
        sceneTitle: story.title,
        selected: decision,
        focus,
        outcome,
        researchCredibilityAfter: nextResearchCredibility,
        committeeAdoptionAfter: nextCommitteeAdoption,
        portfolioNavAfter: nextPortfolioNav,
        viewAccuracyAfter: nextViewAccuracy,
        clientFeedbackAfter: nextClientFeedback,
        teamTrustAfter: nextTeamTrust,
        fatigueAfter: nextFatigue,
        lifeBalanceAfter: nextLifeBalance,
        relationsAfter: { ...nextRelations },
        marketTheme: story.theme.title,
        marketReturn: 0, // Will be filled from data if available
        score,
      },
    ],
  };
}

export function nextMonth(state: GameState): GameState {
  if (state.finished) return createInitialState(state.year);
  if (!state.locked) return state;
  return {
    ...state,
    monthIndex: Math.min(state.monthIndex + 1, 11),
    selectedId: null,
    sceneNodeIndex: 0,
    locked: false,
    focusId: "deep_research",
  };
}

// ═══════════════════════════════════════════════════════════
// Scene advancement
// ═══════════════════════════════════════════════════════════

export function canAdvanceScene(state: GameState): boolean {
  const node = currentSceneNode(state);
  return node.type === "dialogue" || state.locked;
}

export function advanceScene(state: GameState, _data: GameDataYear): GameState {
  void _data; // Keep signature for callers but unused in body
  const scene = sceneForMonth(state.monthIndex, state.year);
  const node = currentSceneNode(state);
  if (node.type === "decision" && !state.locked) return state;
  if (state.sceneNodeIndex < scene.nodes.length - 1) {
    return {
      ...state,
      sceneNodeIndex: state.sceneNodeIndex + 1,
    };
  }
  return nextMonth(state);
}

// ═══════════════════════════════════════════════════════════
// Post-mortem text
// ═══════════════════════════════════════════════════════════

export function postMortem(
  decision: ResearchDecision,
  monthLabel: string,
): string {
  const categoryText: Record<string, string> = {
    research: "你选择了深入研究",
    communication: "你选择了沟通协作",
    risk: "你选择了保守路线",
    life: "你优先照顾了生活",
  };
  return `${monthLabel} ${categoryText[decision.category] || "做了选择"}。${decision.backgroundNote || ""}`;
}

// ═══════════════════════════════════════════════════════════
// Best route (highest relation)
// ═══════════════════════════════════════════════════════════

export function bestRoute(state: GameState): CharacterId {
  const sorted = (Object.entries(state.relations) as Array<[CharacterId, number]>).sort(
    (a, b) => b[1] - a[1],
  );
  return sorted[0]?.[0] || "lin_ruoning";
}

export function totalRelations(state: GameState): number {
  return Object.values(state.relations).reduce((sum, v) => sum + v, 0);
}
