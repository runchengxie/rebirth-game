import { describe, expect, it } from "vitest";
import type { ResearchDecision } from "../types";
import { createRebirthMeta } from "./rebirth";
import { createInitialState } from "./runtime";
import { gameSessionReducer, type GameSessionSnapshot } from "./sessionMachine";

const PRESSURE_DECISION: ResearchDecision = {
  id: "pressure-test",
  label: "承担高压研究",
  category: "deep_research",
  method: "fundamental_research",
  quality: "sound",
  outcomeAlignment: "supports",
  description: "同一个选择在两种体验中应有不同的职业压力处理。",
  effects: {
    researchCredibility: 5,
    committeeAdoption: 2,
    portfolioNav: 0,
    viewAccuracy: 2,
    clientFeedback: 1,
    teamTrust: 1,
    fatigue: 10,
    lifeBalance: -6,
    characterRelations: [{ characterId: "lin_ruoning", value: 5 }],
  },
  evidenceLevel: 11,
  clarityLevel: 10,
  riskAwareness: 8,
  reflectionValue: 5,
};

function snapshot(mode: "romance" | "career"): GameSessionSnapshot {
  return {
    state: createInitialState("2025", mode),
    rebirth: createRebirthMeta("2025", mode),
  };
}

describe("会话体验模式", () => {
  it("剧情模式在 reducer 内应用辅助承诺和中性日程", () => {
    const initial = snapshot("romance");
    const next = gameSessionReducer(initial, {
      type: "make-decision",
      decision: PRESSURE_DECISION,
    });

    expect(next.state.history[0]?.focus.id).toBe("romance_pace");
    expect(next.state.history[0]?.selected.setsFlags).toMatchObject({
      commitment_fully_reviewed: true,
    });
    expect(next.state.fatigue).toBeLessThanOrEqual(initial.state.fatigue);
    expect(next.state.lifeBalance).toBeGreaterThanOrEqual(initial.state.lifeBalance);
  });

  it("职业模式保留高压选择与玩家未填写的承诺", () => {
    const initial = snapshot("career");
    const next = gameSessionReducer(initial, {
      type: "make-decision",
      decision: PRESSURE_DECISION,
    });

    expect(next.state.history[0]?.focus.id).toBe("deep_research");
    expect(next.state.history[0]?.selected.setsFlags).toBeUndefined();
    expect(next.state.fatigue).toBeGreaterThan(initial.state.fatigue);
    expect(next.state.lifeBalance).toBeLessThan(initial.state.lifeBalance);
  });

  it("重新开始只重置本周目，不会改变已选择的体验模式", () => {
    const played = gameSessionReducer(snapshot("romance"), {
      type: "make-decision",
      decision: PRESSURE_DECISION,
    });
    const restarted = gameSessionReducer(played, { type: "restart" });

    expect(restarted.rebirth.experienceMode).toBe("romance");
    expect(restarted.state.history).toEqual([]);
    expect(restarted.state.focusId).toBe("team_collab");
  });
});
