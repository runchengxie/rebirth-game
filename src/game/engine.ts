import { FOCUS_ACTIONS, GRADE_REVIEWS, SCENE_SCRIPTS, SIGNAL_TYPES, STORY_ARCS, YEAR_STORY_OVERRIDES, generateClues } from "./content";
import type {
  CharacterId,
  FocusAction,
  GameDataYear,
  GameState,
  RoundOutcome,
  SceneNode,
  SceneScript,
  ScoreBreakdown,
  StockClue,
  StockOption,
  StoryArc,
} from "../types";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function compactDate(raw: string): string {
  if (!raw || raw.length !== 8) return raw || "";
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "--";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 100000000) return `${sign}¥${(abs / 100000000).toFixed(2)}亿`;
  if (abs >= 10000) return `${sign}¥${(abs / 10000).toFixed(2)}万`;
  return `${sign}¥${abs.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;
}

export function formatMoneyFull(value: number): string {
  return `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;
}

export function formatPct(rate: number): string {
  if (!Number.isFinite(rate)) return "--";
  const pct = rate * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatDelta(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}`;
}

export function storyForMonth(index: number, year?: string): StoryArc {
  const base = STORY_ARCS[index % STORY_ARCS.length];
  const override = year ? YEAR_STORY_OVERRIDES[year]?.[index] : undefined;
  if (!override) return base;
  return {
    ...base,
    ...override,
    event: {
      ...base.event,
      ...override.event,
    },
  };
}

export function sceneForMonth(index: number, year?: string): SceneScript {
  const explicitScene = SCENE_SCRIPTS.find((scene) => scene.monthIndex === index && (!scene.year || scene.year === year));
  if (explicitScene) return explicitScene;

  const story = storyForMonth(index, year);
  return {
    id: `${year || "default"}-month-${index + 1}`,
    year,
    monthIndex: index,
    title: story.title,
    defaultCharacterId: story.characterId,
    nodes: [
      {
        type: "line",
        characterId: story.characterId,
        speaker: "内心独白",
        role: "只有你知道",
        mood: "判断",
        text: story.event.protagonistMemory,
        prompt: "点击继续，把未来记忆整理成当下说得通的研究假设。",
        voiceCue: "silent",
      },
      {
        type: "line",
        characterId: story.characterId,
        speaker: story.speaker,
        role: story.role,
        mood: story.mood,
        text: `${story.line} ${story.event.publicContext}`,
        prompt: "点击继续，进入本月实战会。",
        voiceCue: "key",
      },
      {
        type: "stockRound",
        prompt: story.mission,
        bg: "briefing-room",
        briefTitle: `${story.event.period}：${story.event.title}`,
        briefs: [
          {
            characterId: "rina",
            label: "事件背景",
            text: story.event.publicContext,
          },
          {
            characterId: "misaki",
            label: "实战入口",
            text: story.event.gameHook,
          },
          {
            characterId: "mei",
            label: "剧情边界",
            text: "女主们只依据公开信息和当下数据判断。男主需要把未来记忆转成可验证假设。",
          },
        ],
      },
    ],
  };
}

export function currentSceneNode(state: GameState): SceneNode {
  const scene = sceneForMonth(state.monthIndex, state.year);
  return scene.nodes[state.sceneNodeIndex] || scene.nodes[scene.nodes.length - 1];
}

export function focusById(id: string): FocusAction {
  return FOCUS_ACTIONS.find((item) => item.id === id) || FOCUS_ACTIONS[0];
}

export function signalType(option: StockOption): string {
  // Keep original hash-based signalType for backward compatibility
  const source = `${option.tsCode || ""}${option.industry || ""}`;
  const total = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return SIGNAL_TYPES[total % SIGNAL_TYPES.length];
}

export function optionClues(option: StockOption): StockClue[] {
  if (option.clues && option.clues.length > 0) return option.clues;
  // Fallback: generate clues on-the-fly from tsCode/industry/activeRank
  const generated = generateClues(option.tsCode, option.name, option.industry || "未知行业", option.activeRank);
  return generated.map((c) => ({
    ...c,
    text: c.text,
  })) as StockClue[];
}

export function clueForCharacter(option: StockOption, characterId: CharacterId): StockClue | undefined {
  return optionClues(option).find((c) => c.characterId === characterId);
}

export function primarySignalLabel(option: StockOption): string {
  const clues = optionClues(option);
  const rinaClue = clues.find((c) => c.characterId === "rina");
  if (rinaClue) return rinaClue.dimension === "fundamental" ? "基本面线索" : "风险线索";
  const misakiClue = clues.find((c) => c.characterId === "misaki");
  if (misakiClue) return misakiClue.dimension === "fund_flow" ? "资金面线索" : "交易线索";
  return "研究线索";
}

export function riskLabel(option: StockOption): string {
  if (option.returnRank <= 10) return "参考路线";
  if (option.activeRank <= 50) return "热门线";
  if (option.returnRate < 0) return "会扣血";
  return "观察中";
}

export function analysisNote(option: StockOption, revealed = false): string {
  const clues = optionClues(option);
  const rinaClue = clues.find((c) => c.characterId === "rina");
  const misakiClue = clues.find((c) => c.characterId === "misaki");
  const meiClue = clues.find((c) => c.characterId === "mei");

  const liquidity =
    option.activeRank <= 50
      ? "成交活跃度极高，资金关注度很高"
      : option.activeRank <= 200
        ? "成交活跃度靠前，说明当月已经被资金反复确认"
        : "成交活跃度仍在题库前列，但需要更重视逻辑兑现";

  if (!revealed) {
    const clueLines = [
      rinaClue ? `璃奈：${rinaClue.text}` : "",
      misakiClue ? `美咲：${misakiClue.text}` : "",
      meiClue ? `芽衣：${meiClue.text}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return `研究线索\n${clueLines}`;
  }

  const header = `${option.industry || "未知行业"} · ${signalType(option)}。${liquidity}`;
  const review =
    option.returnRate >= 0.2
      ? "复盘结果显示这条线索兑现得很充分"
      : option.returnRate >= 0
        ? "复盘结果偏稳，强度低于主线"
        : "复盘结果为负，说明当时的风险释放快于逻辑兑现";
  return `角色复盘：${header}，涨幅排名 #${option.returnRank}。${review}。`;
}

export function createInitialState(year: string, data: GameDataYear, initialCapital?: number): GameState {
  const capital = initialCapital && initialCapital > 0 ? initialCapital : data.initialCapital || 10000;
  return {
    year,
    initialCapital: capital,
    capital,
    monthIndex: 0,
    focusId: "research",
    selectedId: null,
    sceneNodeIndex: 0,
    locked: false,
    finished: false,
    reputation: 18,
    fatigue: 34,
    affection: {
      rina: 24,
      misaki: 18,
      mei: 16,
    },
    history: [],
  };
}

export function buildOutcome(
  option: StockOption,
  story: StoryArc,
  before: number,
  after: number,
  focus: FocusAction,
): RoundOutcome {
  const focusText = focus.returnBonus === 0 ? "本话没有收益修正" : `日程修正 ${formatPct(focus.returnBonus)}`;
  if (option.isBest) {
    return {
      title: "实战路线命中",
      dialogue: `${story.speaker}开心地合上笔记本：答对啦！这条路线把事件和资金连起来了，今天给你加一颗小星星。`,
      detail: `小金库 ${formatMoneyFull(before)} → ${formatMoneyFull(after)}，${focusText}。`,
      reputationDelta: 10,
      fatigueDelta: -6,
      affectionDelta: 5,
    };
  }
  if (option.returnRate >= 0.2) {
    return {
      title: "支线也有收益",
      dialogue: `${story.speaker}看了一眼涨幅，露出笑容：这条支线也有不错收益，选得很细心。`,
      detail: `小金库 ${formatMoneyFull(before)} → ${formatMoneyFull(after)}，${focusText}。`,
      reputationDelta: 5,
      fatigueDelta: 2,
      affectionDelta: 2,
    };
  }
  if (option.returnRate >= 0) {
    return {
      title: "普通支线通过",
      dialogue: `${story.speaker}提醒你：能小赚已经很棒了，想进好结局，下次可以再大胆一点。`,
      detail: `小金库 ${formatMoneyFull(before)} → ${formatMoneyFull(after)}，${focusText}。`,
      reputationDelta: 2,
      fatigueDelta: 5,
      affectionDelta: 1,
    };
  }
  return {
    title: "风险复盘",
    dialogue: `${story.speaker}没有责怪你，只把复盘模板发了过来：没关系，失败记录也会变成经验值。`,
    detail: `小金库 ${formatMoneyFull(before)} → ${formatMoneyFull(after)}，${focusText}。`,
    reputationDelta: -6,
    fatigueDelta: 12,
    affectionDelta: -1,
  };
}

export function scoreRound(
  option: StockOption,
  story: StoryArc,
  focus: FocusAction,
): ScoreBreakdown {
  const rate = option.returnRate;

  // ── Return score (0-40): based on actual return rate ──
  let returnScore: number;
  if (rate >= 0.3) returnScore = 40;
  else if (rate >= 0.2) returnScore = 35;
  else if (rate >= 0.1) returnScore = 28;
  else if (rate >= 0.05) returnScore = 22;
  else if (rate >= 0) returnScore = 16;
  else if (rate >= -0.05) returnScore = 10;
  else if (rate >= -0.1) returnScore = 5;
  else returnScore = 0;

  // ── Logic score (0-20): does the stock theme match the event? ──
  let logicScore = 8;
  const focusLabel = focus.id;
  const hasClues = option.clues && option.clues.length > 0;
  if (option.isBest) {
    logicScore = 20;
  } else if (rate >= 0.05) {
    logicScore = 14;
  } else if (hasClues && option.activeRank <= 200) {
    // Clues exist and stock is active enough to reason about
    logicScore = 12;
  }

  // ── Risk score (0-15): lower active rank → more liquid → lower risk → higher score ──
  let riskScore: number;
  if (option.activeRank <= 50) riskScore = 15;
  else if (option.activeRank <= 100) riskScore = 12;
  else if (option.activeRank <= 200) riskScore = 9;
  else if (option.activeRank <= 300) riskScore = 6;
  else riskScore = 3;

  // Penalize negative return
  if (rate < 0) riskScore = Math.max(0, riskScore - 4);

  // ── Discipline score (0-10): does focus choice match the stock's profile? ──
  let disciplineScore: number;
  if (focusLabel === "risk" && rate >= 0.05) disciplineScore = 10;
  else if (focusLabel === "research" && rate >= 0.1) disciplineScore = 9;
  else if (focusLabel === "date") disciplineScore = 7;
  else if (focusLabel === "research" && rate < 0) disciplineScore = 3;
  else disciplineScore = 5;

  // ── Character score (0-15): does the choice fit this month's character's methodology? ──
  let characterScore = 6;
  const characterId = story.characterId;
  if (characterId === "rina") {
    // Rina values fundamental analysis → moderate activity, not extreme
    characterScore = option.activeRank >= 50 && option.activeRank <= 300 ? 12 : 7;
    if (rate > 0) characterScore = Math.min(15, characterScore + 3);
  } else if (characterId === "misaki") {
    // Misaki values fund flow signals → high activity = good
    characterScore = option.activeRank <= 150 ? 13 : 7;
    if (option.tradingDays >= 18) characterScore = Math.min(15, characterScore + 2);
  } else if (characterId === "mei") {
    // Mei values risk control → higher activity rank (safer zone)
    characterScore = option.activeRank >= 100 ? 12 : 7;
    if (rate >= -0.05) characterScore = Math.min(15, characterScore + 3);
  }

  const total = Math.min(100, returnScore + logicScore + riskScore + disciplineScore + characterScore);

  let grade = "D";
  if (total >= 90) grade = "S";
  else if (total >= 75) grade = "A";
  else if (total >= 60) grade = "B";
  else if (total >= 40) grade = "C";

  return { returnScore, logicScore, riskScore, disciplineScore, characterScore, total, grade };
}

export function selectFocus(state: GameState, focusId: string): GameState {
  if (state.locked || state.finished) return state;
  return { ...state, focusId };
}

// ── Character-focus synergy ──

function getSynergyAffection(characterId: CharacterId, focusId: string): number {
  if (characterId === "rina" && focusId === "research") return 3;
  if (characterId === "misaki" && focusId === "date") return 3;
  if (characterId === "mei" && focusId === "risk") return 3;
  return 0;
}

function getSynergyFatigue(characterId: CharacterId, focusId: string): number {
  if (characterId === "rina" && focusId === "research") return -1;
  return 0;
}

export function chooseOption(state: GameState, data: GameDataYear, option: StockOption): GameState {
  if (state.locked || state.finished) return state;
  const month = data.months[state.monthIndex];
  const story = storyForMonth(state.monthIndex, state.year);
  const focus = focusById(state.focusId);
  const before = state.capital;
  const finalRate = Math.max(-0.95, option.returnRate + focus.returnBonus);
  const after = before * (1 + finalRate);
  const outcome = buildOutcome(option, story, before, after, focus);
  const characterId = story.characterId;

  // ── Character-focus synergy bonuses ──
  const synergyAffection = getSynergyAffection(characterId, focus.id);
  const synergyFatigue = getSynergyFatigue(characterId, focus.id);

  // ── High fatigue penalty ──
  let fatiguePenalty = 0;
  let reputationPenalty = 0;
  if (state.fatigue > 80 && focus.id === "research") {
    fatiguePenalty = 3;
    reputationPenalty = -2;
  }
  // 连续两月熬夜研报且疲劳 > 60
  const lastTwoFocuses = state.history.slice(-2).map((r) => r.focus.id);
  if (focus.id === "research" && state.fatigue > 60 && lastTwoFocuses.length === 2 && lastTwoFocuses.every((f) => f === "research")) {
    fatiguePenalty += 2;
  }

  const nextReputation = clamp(
    state.reputation + outcome.reputationDelta + focus.reputationDelta + reputationPenalty,
  );
  const nextFatigue = clamp(
    state.fatigue + outcome.fatigueDelta + focus.fatigueDelta + synergyFatigue + fatiguePenalty,
  );
  const nextAffection = clamp(
    state.affection[characterId] + outcome.affectionDelta + focus.affectionDelta + synergyAffection,
  );

  return {
    ...state,
    capital: after,
    locked: true,
    selectedId: option.id,
    reputation: nextReputation,
    fatigue: nextFatigue,
    affection: {
      ...state.affection,
      [characterId]: nextAffection,
    },
    finished: state.monthIndex >= data.months.length - 1,
    history: [
      ...state.history,
      {
        month: month.month,
        label: month.label,
        story,
        characterId,
        selected: option,
        best: month.best,
        focus,
        before,
        marketRate: option.returnRate,
        executionRate: focus.returnBonus,
        finalRate,
        after,
        hit: Boolean(option.isBest),
        outcome,
        reputationAfter: nextReputation,
        fatigueAfter: nextFatigue,
        affectionAfter: nextAffection,
        score: scoreRound(option, story, focus),
      },
    ],
  };
}

export function nextMonth(state: GameState, data: GameDataYear): GameState {
  if (state.finished) return createInitialState(state.year, data, state.initialCapital);
  if (!state.locked) return state;
  return {
    ...state,
    monthIndex: Math.min(state.monthIndex + 1, data.months.length - 1),
    selectedId: null,
    sceneNodeIndex: 0,
    locked: false,
    focusId: "research",
  };
}

export function canAdvanceScene(state: GameState): boolean {
  const node = currentSceneNode(state);
  return node.type === "line" || state.locked;
}

export function advanceScene(state: GameState, data: GameDataYear): GameState {
  const scene = sceneForMonth(state.monthIndex, state.year);
  const node = currentSceneNode(state);
  if (node.type === "stockRound" && !state.locked) return state;
  if (state.sceneNodeIndex < scene.nodes.length - 1) {
    return {
      ...state,
      sceneNodeIndex: state.sceneNodeIndex + 1,
    };
  }
  return nextMonth(state, data);
}

export function totalAffection(state: GameState): number {
  return Object.values(state.affection).reduce((sum, value) => sum + value, 0);
}

export function gradeReviewText(characterId: CharacterId, grade: string): string {
  const reviews = GRADE_REVIEWS[characterId]?.[grade];
  if (!reviews || reviews.length === 0) return "";
  const seed = Array.from(grade).reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return reviews[seed % reviews.length];
}

export function postMortem(
  selected: StockOption,
  best: StockOption,
  monthLabel: string,
): string {
  if (selected.isBest) {
    return `${monthLabel} 你选中的 ${selected.name} 是本月参考路线。${selected.industry} 的涨幅达到 ${formatPct(selected.returnRate)}，事件和资金形成了共振。`;
  }
  if (selected.returnRate >= 0) {
    const gap = selected.returnRate - best.returnRate;
    return `${monthLabel} ${selected.name}(${formatPct(selected.returnRate)}) 有正收益，但与参考路线 ${best.name}(${formatPct(best.returnRate)}) 相差 ${formatPct(gap)}。差距在于 ${best.industry} 的事件共振更强。`;
  }
  return `${monthLabel} ${selected.name} 录得 ${formatPct(selected.returnRate)}。参考路线 ${best.name} 同期上涨 ${formatPct(best.returnRate)}。这次风险释放快于逻辑兑现，复盘重点是找出假设在哪一层先断裂。`;
}

export function bestRoute(state: GameState): CharacterId {
  const sorted = (Object.entries(state.affection) as Array<[CharacterId, number]>).sort(
    (a, b) => b[1] - a[1],
  );
  return sorted[0]?.[0] || "rina";
}
