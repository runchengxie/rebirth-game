import { describe, expect, it } from "vitest";
import { FOCUS_ACTIONS } from "./content";
import {
  advanceScene,
  bestRoute,
  chooseOption,
  clamp,
  createInitialState,
  currentSceneNode,
  formatMoney,
  formatMoneyFull,
  formatPct,
  gradeReviewText,
  nextMonth,
  optionClues,
  postMortem,
  primarySignalLabel,
  sceneForMonth,
  scoreRound,
  selectFocus,
  storyForMonth,
  totalAffection,
} from "./engine";
import type { GameDataYear, StockOption } from "../types";

const best: StockOption = {
  id: "best",
  tsCode: "000001.SZ",
  name: "闪光股份",
  industry: "甜点科技",
  market: "主板",
  activeRank: 12,
  returnRank: 1,
  returnRate: 0.2,
  tradingDays: 20,
  isBest: true,
};

const other: StockOption = {
  id: "other",
  tsCode: "000002.SZ",
  name: "支线股份",
  industry: "粉蓝制造",
  market: "主板",
  activeRank: 80,
  returnRank: 60,
  returnRate: 0.08,
  tradingDays: 20,
  isBest: false,
};

const fixture: GameDataYear = {
  year: 2025,
  initialCapital: 10000,
  targetCapital: 100000000,
  perfectCapital: 12000,
  months: [
    {
      month: "2025-01",
      label: "2025年1月",
      marketStart: "20250102",
      marketEnd: "20250131",
      candidateCount: 500,
      best,
      options: [best, other],
    },
    {
      month: "2025-02",
      label: "2025年2月",
      marketStart: "20250203",
      marketEnd: "20250228",
      candidateCount: 500,
      best,
      options: [best, other],
    },
  ],
};

describe("game engine", () => {
  it("creates the initial route state", () => {
    const state = createInitialState("2025", fixture);

    expect(state.capital).toBe(10000);
    expect(state.focusId).toBe("research");
    expect(state.affection.rina).toBeGreaterThan(state.affection.mei);
    expect(state.locked).toBe(false);
  });

  it("selects a focus before locking the round", () => {
    const state = createInitialState("2025", fixture);
    const next = selectFocus(state, "date");

    expect(next.focusId).toBe("date");
  });

  it("applies stock return, focus modifiers, and route affection", () => {
    const state = selectFocus(createInitialState("2025", fixture), "research");
    const result = chooseOption(state, fixture, best);
    const research = FOCUS_ACTIONS.find((item) => item.id === "research");

    expect(result.locked).toBe(true);
    expect(result.selectedId).toBe(best.id);
    expect(result.history).toHaveLength(1);
    expect(result.history[0].finalRate).toBeCloseTo(best.returnRate + (research?.returnBonus ?? 0));
    expect(result.capital).toBeCloseTo(12150);
    expect(result.affection.rina).toBeGreaterThan(state.affection.rina);
  });

  it("moves to the next month only after a locked round", () => {
    const state = createInitialState("2025", fixture);
    const unlocked = nextMonth(state, fixture);
    const locked = chooseOption(state, fixture, other);
    const advanced = nextMonth(locked, fixture);

    expect(unlocked.monthIndex).toBe(0);
    expect(advanced.monthIndex).toBe(1);
    expect(advanced.locked).toBe(false);
    expect(advanced.selectedId).toBeNull();
  });

  it("walks scripted dialogue into the stock round node", () => {
    const scene = sceneForMonth(0, "2025");
    const stockRoundIndex = scene.nodes.findIndex((node) => node.type === "stockRound");
    let state = createInitialState("2025", fixture);

    expect(currentSceneNode(state).type).toBe("line");
    for (let index = 0; index < stockRoundIndex; index += 1) {
      state = advanceScene(state, fixture);
    }

    expect(currentSceneNode(state).type).toBe("stockRound");
    expect(advanceScene(state, fixture).sceneNodeIndex).toBe(state.sceneNodeIndex);
  });

  it("continues post-choice dialogue before moving to the next month", () => {
    const scene = sceneForMonth(0, "2025");
    const stockRoundIndex = scene.nodes.findIndex((node) => node.type === "stockRound");
    let state = createInitialState("2025", fixture);

    for (let index = 0; index < stockRoundIndex; index += 1) {
      state = advanceScene(state, fixture);
    }

    const locked = chooseOption(state, fixture, best);
    const postChoice = advanceScene(locked, fixture);

    expect(currentSceneNode(postChoice).type).toBe("line");
    expect(postChoice.monthIndex).toBe(0);
    expect(postChoice.sceneNodeIndex).toBe(stockRoundIndex + 1);
  });
});

describe("utility functions", () => {
  it("clamp values to [0, 100]", () => {
    expect(clamp(-5)).toBe(0);
    expect(clamp(0)).toBe(0);
    expect(clamp(50)).toBe(50);
    expect(clamp(100)).toBe(100);
    expect(clamp(150)).toBe(100);
  });

  it("formatMoney handles typical values", () => {
    expect(formatMoney(0)).toBe("¥0");
    expect(formatMoney(10000)).toBe("¥1.00万");
    expect(formatMoney(100000000)).toBe("¥1.00亿");
    expect(formatMoney(-5000)).toBe("-¥5,000");
  });

  it("formatMoneyFull never shows 万/亿", () => {
    expect(formatMoneyFull(12345)).toBe("¥12,345");
  });

  it("formatPct shows signed percentage", () => {
    expect(formatPct(0.1)).toBe("+10.00%");
    expect(formatPct(-0.05)).toBe("-5.00%");
    expect(formatPct(0)).toBe("0.00%");
  });

  it("totalAffection sums all characters", () => {
    const state = createInitialState("2025", fixture);
    expect(totalAffection(state)).toBe(24 + 18 + 16);
  });

  it("bestRoute returns character with highest affection", () => {
    const state = createInitialState("2025", fixture);
    expect(bestRoute(state)).toBe("rina");
  });
});

describe("clue system", () => {
  it("generates 3 clues per option: rina, misaki, mei", () => {
    const clues = optionClues(best);
    expect(clues).toHaveLength(3);
    expect(clues.map((c) => c.characterId)).toEqual(["rina", "misaki", "mei"]);
  });

  it("primarySignalLabel returns dimension-based label", () => {
    const label = primarySignalLabel(best);
    expect(["基本面线索", "风险线索", "资金面线索", "交易线索", "研究线索"]).toContain(label);
  });
});

describe("scoring system", () => {
  it("scoreRound returns all 5 dimensions with a total and grade", () => {
    const story = storyForMonth(0, "2025");
    const focus = FOCUS_ACTIONS.find((f) => f.id === "research")!;
    const score = scoreRound(best, story, focus);

    expect(score.returnScore).toBeGreaterThanOrEqual(0);
    expect(score.returnScore).toBeLessThanOrEqual(40);
    expect(score.logicScore).toBeGreaterThanOrEqual(0);
    expect(score.logicScore).toBeLessThanOrEqual(20);
    expect(score.riskScore).toBeGreaterThanOrEqual(0);
    expect(score.riskScore).toBeLessThanOrEqual(15);
    expect(score.disciplineScore).toBeGreaterThanOrEqual(0);
    expect(score.disciplineScore).toBeLessThanOrEqual(10);
    expect(score.characterScore).toBeGreaterThanOrEqual(0);
    expect(score.characterScore).toBeLessThanOrEqual(15);
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
    expect(["S", "A", "B", "C", "D"]).toContain(score.grade);
  });

  it("best option with research focus scores high", () => {
    const story = storyForMonth(0, "2025");
    const focus = FOCUS_ACTIONS.find((f) => f.id === "research")!;
    const score = scoreRound(best, story, focus);
    expect(score.total).toBeGreaterThanOrEqual(70);
    expect(score.grade).toMatch(/^[SAB]$/);
  });

  it("losing option scores low", () => {
    const loser: StockOption = {
      id: "loser",
      tsCode: "999999.SZ",
      name: "破产股份",
      industry: "退市制造",
      activeRank: 450,
      returnRank: 450,
      returnRate: -0.3,
      tradingDays: 10,
      isBest: false,
    };
    const story = storyForMonth(0, "2025");
    const focus = FOCUS_ACTIONS.find((f) => f.id === "research")!;
    const score = scoreRound(loser, story, focus);
    expect(score.total).toBeLessThan(60);
  });

  it("chooseOption stores score in history", () => {
    const state = selectFocus(createInitialState("2025", fixture), "research");
    const result = chooseOption(state, fixture, best);
    expect(result.history[0].score).toBeDefined();
    expect(result.history[0].score!.total).toBeGreaterThan(0);
  });
});

describe("grade review", () => {
  it("returns text for valid character + grade", () => {
    const text = gradeReviewText("rina", "S");
    expect(text.length).toBeGreaterThan(0);
  });

  it("returns empty string for invalid grade", () => {
    expect(gradeReviewText("rina", "Z")).toBe("");
  });
});

describe("postMortem", () => {
  it("describes a hit", () => {
    const text = postMortem(best, best, "2025年1月");
    expect(text).toContain("参考路线");
  });

  it("describes a miss with positive return", () => {
    const text = postMortem(other, best, "2025年1月");
    expect(text).toContain("有正收益");
  });
});
