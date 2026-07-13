import { describe, expect, it } from "vitest";
import { buildMonthScene } from "./content";
import { makeDecision } from "./engine";
import { createInitialState } from "./runtime";
import type { GameDataYear, GameState } from "../types";

function emptyYear(): GameDataYear {
  return {
    year: 2025,
    currency: "CNY",
    generatedAt: new Date().toISOString(),
    source: {
      dailyDataset: "test",
      dailyDatasetVersion: "1",
      instrumentDataset: "test",
      priceColumn: "adj_close",
    },
    rules: {},
    benchmarks: [],
    scenes: [],
  };
}

function stateAt(monthIndex: number, patch: Partial<GameState> = {}): GameState {
  const base = createInitialState("2025");
  return {
    ...base,
    monthIndex,
    sceneNodeIndex: 0,
    sceneNodeId: "",
    locked: false,
    selectedId: null,
    ...patch,
    flags: { ...base.flags, ...(patch.flags ?? {}) },
    relations: { ...base.relations, ...(patch.relations ?? {}) },
  };
}

describe("林若宁 2025 专属关系弧", () => {
  it("只给 2025 周目写入路线开关", () => {
    expect(createInitialState("2025").flags.year_2025).toBe(true);
    expect(createInitialState("2024").flags.year_2025).toBeUndefined();
  });

  it("二月允许回应心动，也允许快攻造成压力", () => {
    const scene = buildMonthScene(1, "2025", stateAt(1));
    const decisions = scene.nodes.find((node) => node.type === "decision")?.decisions ?? [];
    expect(decisions.map((decision) => decision.id)).toContain("lin-early-reciprocate");
    expect(decisions.map((decision) => decision.id)).toContain("lin-early-rush");

    const rush = decisions.find((decision) => decision.id === "lin-early-rush")!;
    const before = stateAt(1);
    const after = makeDecision(before, emptyYear(), rush);
    expect(after.flags.lin_rushed_intimacy).toBe(true);
    expect(after.relations.lin_ruoning).toBeLessThan(before.relations.lin_ruoning);
  });

  it("兑现承诺和诚实面对证据才能进入关系确认", () => {
    const healthy = stateAt(9, {
      relations: { lin_ruoning: 72 } as GameState["relations"],
      lifeBalance: 66,
      fatigue: 42,
      flags: {
        lin_kept_promise: true,
        lin_admitted_uncertainty: true,
        "seen_lin-2025-early-spark": true,
        "seen_lin-2025-health-warning": true,
        "seen_lin-2025-promise-kept": true,
        "seen_lin-2025-truth-conflict": true,
      },
    });
    const scene = buildMonthScene(9, "2025", healthy);
    expect(scene.nodes.some((node) => node.id === "lin-2025-relationship-confirm")).toBe(true);
    const ids = scene.nodes.find((node) => node.type === "decision")?.decisions?.map((decision) => decision.id) ?? [];
    expect(ids).toContain("lin-commit-next-year");
  });

  it("高好感也会因失约或拿结果替代证据进入白月光线", () => {
    const regret = stateAt(9, {
      relations: { lin_ruoning: 78 } as GameState["relations"],
      flags: {
        lin_broke_promise: true,
        lin_used_hindsight_as_proof: true,
        "seen_lin-2025-early-spark": true,
        "seen_lin-2025-health-warning": true,
        "seen_lin-2025-promise-broken": true,
        "seen_lin-2025-truth-conflict": true,
      },
    });
    const scene = buildMonthScene(9, "2025", regret);
    expect(scene.nodes.some((node) => node.id === "lin-2025-white-moon")).toBe(true);
    expect(scene.nodes.some((node) => node.id === "lin-2025-relationship-confirm")).toBe(false);
  });
});
