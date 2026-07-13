import { describe, expect, it } from "vitest";
import { buildMonthScene } from "./content";
import { createInitialState } from "./runtime";
import type { GameState } from "../types";

function stateAt(
  monthIndex: number,
  character: "chen_xinghe" | "zhou_mingzhao",
  relation: number,
  flags: Record<string, boolean | number>,
): GameState {
  const base = createInitialState("2025");
  return {
    ...base,
    monthIndex,
    sceneNodeIndex: 0,
    sceneNodeId: "",
    relations: { ...base.relations, [character]: relation },
    flags: { ...base.flags, ...flags },
  };
}

describe("陈星禾和周明昭 2025 专属路线", () => {
  it("陈星禾把是否诚实展示失败回测作为关系门槛", () => {
    const opening = buildMonthScene(2, "2025", stateAt(2, "chen_xinghe", 30, {}));
    const openingIds = opening.nodes.find((node) => node.type === "decision")?.decisions?.map((decision) => decision.id) ?? [];
    expect(openingIds).toContain("chen-show-failed-run");
    expect(openingIds).toContain("chen-polish-backtest");

    const confirm = buildMonthScene(9, "2025", stateAt(9, "chen_xinghe", 70, {
      chen_shared_failed_run: true,
      chen_private_opened: true,
      "seen_chen-2025-honest-run": true,
      "seen_chen-2025-private-error": true,
    }));
    expect(confirm.nodes.some((node) => node.id === "chen-2025-confirm")).toBe(true);
  });

  it("美化回测会让陈星禾高好感仍进入遗憾", () => {
    const scene = buildMonthScene(9, "2025", stateAt(9, "chen_xinghe", 72, {
      chen_polished_backtest: true,
      "seen_chen-2025-honest-run": true,
    }));
    expect(scene.nodes.some((node) => node.id === "chen-2025-regret")).toBe(true);
    expect(scene.nodes.some((node) => node.id === "chen-2025-confirm")).toBe(false);
  });

  it("周明昭把风险边界作为亲密关系的前置条件", () => {
    const opening = buildMonthScene(4, "2025", stateAt(4, "zhou_mingzhao", 30, {}));
    const openingIds = opening.nodes.find((node) => node.type === "decision")?.decisions?.map((decision) => decision.id) ?? [];
    expect(openingIds).toContain("zhou-define-boundary");
    expect(openingIds).toContain("zhou-gamble-pressure");

    const confirm = buildMonthScene(9, "2025", {
      ...stateAt(9, "zhou_mingzhao", 70, {
        zhou_respected_boundary: true,
        zhou_private_opened: true,
        "seen_zhou-2025-boundary": true,
        "seen_zhou-2025-private-boundary": true,
      }),
      fatigue: 45,
    });
    expect(confirm.nodes.some((node) => node.id === "zhou-2025-confirm")).toBe(true);
  });

  it("排名压力下越界会让周明昭拒绝用喜欢覆盖风险", () => {
    const scene = buildMonthScene(9, "2025", stateAt(9, "zhou_mingzhao", 72, {
      zhou_gambled_under_pressure: true,
      "seen_zhou-2025-boundary": true,
    }));
    expect(scene.nodes.some((node) => node.id === "zhou-2025-regret")).toBe(true);
    expect(scene.nodes.some((node) => node.id === "zhou-2025-confirm")).toBe(false);
  });
});
