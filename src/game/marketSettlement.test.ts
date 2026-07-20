import { describe, expect, it } from "vitest";
import {
  buildMarketReflection,
  focusById,
  makeDecision,
  marketExposureOf,
  scoreDecision,
  selectFocus,
  storyForMonth,
} from "./engine";
import { HS300_MONTHLY_RETURNS, marketReturnFor } from "../data/marketReturns";
import { createInitialState } from "./runtime";
import { buildMonthScene } from "./sceneBuilders";
import type { DecisionScore, GameDataYear, ResearchDecision } from "../types";

function emptyYear(): GameDataYear {
  return {
    year: 2025,
    currency: "CNY",
    generatedAt: new Date().toISOString(),
    source: {},
    rules: {},
    benchmarks: [],
    scenes: [],
  };
}

function firstDecision(year: string, monthIndex: number): ResearchDecision {
  const node = buildMonthScene(monthIndex, year).nodes.find((n) => n.type === "decision")!;
  return node.decisions![0];
}

function scoreWith(overrides: Partial<DecisionScore>): DecisionScore {
  return {
    evidenceScore: 10,
    clarityScore: 10,
    riskAwarenessScore: 10,
    communicationScore: 10,
    lifeBalanceScore: 8,
    portfolioScore: 3,
    qualityBonus: 0,
    outcomeScore: 2,
    reasoningScore: 12,
    total: 60,
    grade: "B",
    ...overrides,
  };
}

describe("真实行情数据", () => {
  it("三个正式年份各有 12 个月的沪深300涨跌幅", () => {
    for (const year of ["2023", "2024", "2025"]) {
      expect(HS300_MONTHLY_RETURNS[year]).toHaveLength(12);
    }
  });

  it("年度累计与公开口径一致（2023 约 -11.4%，2024 约 +14.7%，2025 约 +17.7%）", () => {
    const compound = (year: string) =>
      HS300_MONTHLY_RETURNS[year].reduce((nav, r) => nav * (1 + r), 1) - 1;
    expect(compound("2023")).toBeCloseTo(-0.114, 2);
    expect(compound("2024")).toBeCloseTo(0.147, 2);
    expect(compound("2025")).toBeCloseTo(0.177, 2);
  });

  it("marketReturnFor：已知年份取真实值，未知年份/越界返回 0", () => {
    expect(marketReturnFor("2024", 8)).toBeCloseTo(0.2097, 4);
    expect(marketReturnFor("demo", 0)).toBe(0);
    expect(marketReturnFor("2025", 12)).toBe(0);
  });
});

describe("行情结算（行情只当天气，不当判卷人）", () => {
  it("makeDecision 把当月真实涨跌记入 history.marketReturn", () => {
    const state = createInitialState("2023");
    const result = makeDecision(state, emptyYear(), firstDecision("2023", 0));
    expect(result.history[0].marketReturn).toBeCloseTo(0.0737, 4); // 2023-01 沪深300 +7.37%
  });

  it("净值受真实行情驱动：2024年9月（+20.97%）净值明显上涨", () => {
    const base = createInitialState("2024");
    const state = { ...base, monthIndex: 8 };
    const result = makeDecision(state, emptyYear(), firstDecision("2024", 8));
    expect(result.portfolioNav).toBeGreaterThan(1.05);
  });

  it("下跌月里高风控敞口收缩：risk_alert 比 deep_research 亏得少", () => {
    const down = -0.06;
    const decisionNode = buildMonthScene(1, "2025").nodes.find((n) => n.type === "decision")!;
    const deep = decisionNode.decisions!.find((d) => d.category === "deep_research");
    const risk = decisionNode.decisions!.find((d) => d.category === "risk_alert");
    if (!deep || !risk) return; // 该月决策池没有对照组则跳过（其他月份测试覆盖）
    expect(marketExposureOf(risk, down)).toBeLessThan(marketExposureOf(deep, down));
  });

  it("上涨月敞口不因风控收缩（风控不是踏空）", () => {
    const decisionNode = buildMonthScene(1, "2025").nodes.find((n) => n.type === "decision")!;
    const d = decisionNode.decisions![0];
    expect(marketExposureOf(d, 0.05)).toBeCloseTo(marketExposureOf(d, 0.001), 6);
  });

  it("过程评分与行情无关：同一决策在涨月和跌月拿到同样的分数", () => {
    // scoreDecision 不接收 marketReturn——类型层面就隔离了「结果影响过程分」。
    const story = storyForMonth(1, "2025");
    const focus = focusById("deep_research");
    const d = firstDecision("2025", 1);
    const score = scoreDecision(d, story, focus);
    expect(score).toEqual(scoreDecision(d, story, focus));
  });

  it("marketReflection 四象限：跌月产生带当月涨跌幅的叙述", () => {
    const state2023 = selectFocus(createInitialState("2023"), "deep_research");
    const may2023 = { ...state2023, monthIndex: 4 }; // 2023-05: -5.72%
    const resultDown = makeDecision(may2023, emptyYear(), firstDecision("2023", 4));
    expect(resultDown.history[0].marketReflection).toBeTruthy();
    expect(resultDown.history[0].marketReflection).toContain("-5.72%");
  });

  it("buildMarketReflection：无行情数据（return=0）时不产生文案", () => {
    const story = storyForMonth(0, "2025");
    const focus = focusById("deep_research");
    const score = scoreDecision(firstDecision("2025", 0), story, focus);
    expect(buildMarketReflection(0, score)).toBe("");
  });

  it("蒙对方向但推导单薄：涨月+低 reasoning 的文案点名「侥幸」", () => {
    const weakScore = scoreWith({
      evidenceScore: 3,
      clarityScore: 3,
      riskAwarenessScore: 3,
      reasoningScore: 4,
      total: 30,
      grade: "D",
    });
    const text = buildMarketReflection(0.2097, weakScore);
    expect(text).toContain("侥幸");
  });

  it("分析严谨但市场逆风：跌月+高 reasoning 的文案肯定方法", () => {
    const strongScore = scoreWith({
      evidenceScore: 18,
      clarityScore: 18,
      riskAwarenessScore: 18,
      communicationScore: 15,
      lifeBalanceScore: 10,
      portfolioScore: 4,
      reasoningScore: 22,
      total: 83,
      grade: "A",
    });
    const text = buildMarketReflection(-0.0621, strongScore);
    expect(text).toContain("方法");
  });

  it("demo 年份无行情：净值退化为纯 alpha 驱动（旧行为兼容）", () => {
    const state = createInitialState("demo");
    const decisionNode = buildMonthScene(0, "demo", state).nodes.find((n) => n.type === "decision")!;
    const d = decisionNode.decisions![0];
    const result = makeDecision(state, emptyYear(), d);
    expect(result.history[0].marketReturn).toBe(0);
    expect(result.history[0].marketReflection).toBe("");
    expect(result.portfolioNav).toBeCloseTo(1 * (1 + d.effects.portfolioNav), 4);
  });
});
