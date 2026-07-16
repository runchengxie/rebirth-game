import { describe, expect, it } from "vitest";
import type { GameState, RoundResult } from "../types";
import { createRebirthMeta, restoreRebirthMeta } from "./rebirth";
import {
  captureTimelineAnchor,
  completeActiveTimelineBranch,
  ensureTimelineInitialized,
  forkTimelineAtAnchor,
  recordTimelineEvent,
  restartTimelineRun,
  resumeTimelineBranch,
} from "./rebirthTimeline";
import {
  simulateTimelineAnchor,
  simulationsForAnchor,
  timelineAnchorDetail,
  timelineBranchViews,
  timelineMonthViews,
} from "./rebirthTimelineInsights";
import { createInitialState } from "./runtime";

function stateAtMonth(monthIndex: number): GameState {
  return {
    ...createInitialState("2025"),
    monthIndex,
    sceneNodeIndex: 0,
    sceneNodeId: `test-month-${monthIndex}`,
  };
}

function resultForMonth(monthIndex: number): RoundResult {
  return {
    month: `2025-${String(monthIndex + 1).padStart(2, "0")}`,
    label: `2025年${monthIndex + 1}月`,
    characterId: "lin_ruoning",
    sceneTitle: "测试场景",
    selected: {
      id: `decision-${monthIndex}`,
      label: "测试研究判断",
      category: "deep_research",
      method: "fundamental_research",
      quality: "sound",
      outcomeAlignment: "supports",
      description: "测试时间线结果。",
      effects: {
        researchCredibility: 1,
        committeeAdoption: 1,
        portfolioNav: 0,
        viewAccuracy: 1,
        clientFeedback: 1,
        teamTrust: 1,
        fatigue: 1,
        lifeBalance: 0,
        characterRelations: [],
      },
      evidenceLevel: 10,
      clarityLevel: 10,
      riskAwareness: 10,
      reflectionValue: 5,
    },
    focus: {
      id: "deep_research",
      label: "深度研报",
      icon: "R",
      short: "测试",
      detail: "测试",
      researchCredibilityBonus: 0,
      fatigueDelta: 0,
      lifeBalanceDelta: 0,
      teamTrustBonus: 0,
    },
    outcome: { title: "测试", dialogue: "测试", detail: "测试" },
    researchCredibilityAfter: 20,
    committeeAdoptionAfter: 20,
    portfolioNavAfter: 1,
    viewAccuracyAfter: 20,
    clientFeedbackAfter: 20,
    teamTrustAfter: 20,
    fatigueAfter: 20,
    lifeBalanceAfter: 50,
    relationsAfter: {
      lin_ruoning: 20,
      chen_xinghe: 20,
      zhou_mingzhao: 20,
      zhao_chengyu: 20,
    },
    marketTheme: "测试",
    marketReturn: 0,
    score: {
      evidenceScore: 10,
      clarityScore: 10,
      riskAwarenessScore: 10,
      communicationScore: 10,
      lifeBalanceScore: 10,
      portfolioScore: 0,
      qualityBonus: 2,
      outcomeScore: 2,
      reasoningScore: 18,
      total: 72,
      grade: "A",
    },
  };
}

function completedTimeline() {
  const initial = stateAtMonth(0);
  let meta = ensureTimelineInitialized(createRebirthMeta("2025"), initial);
  const anchorId = meta.timeline.anchors[0]?.id ?? "";
  const finished: GameState = {
    ...initial,
    monthIndex: 11,
    locked: true,
    finished: true,
    history: [resultForMonth(0), resultForMonth(3), resultForMonth(6), resultForMonth(8), resultForMonth(11)],
  };
  meta = completeActiveTimelineBranch(meta, finished, "ordinary");
  meta = {
    ...meta,
    cycle: 2,
    completedCycles: [{ cycle: 1, endingId: "ordinary", averageReasoning: 18, unlocked: [] }],
  };
  return { meta, finished, anchorId };
}

describe("互动影游式回溯时间线", () => {
  it("在关键月份保存月初锚点并记录分支头", () => {
    const state = stateAtMonth(0);
    let meta = ensureTimelineInitialized(createRebirthMeta("2025"), state);
    meta = recordTimelineEvent(meta, state, "focus", "选择深度研报", { focusId: "deep_research" });

    expect(meta.timeline.branches).toHaveLength(1);
    expect(meta.timeline.activeBranchId).toBe(meta.timeline.branches[0]?.id);
    expect(meta.timeline.anchors[0]?.monthIndex).toBe(0);
    expect(meta.timeline.branches[0]?.events[0]?.label).toBe("选择深度研报");
  });

  it("只在关键月份创建锚点，并保留十二月流程摘要", () => {
    let meta = createRebirthMeta("2025");
    for (const monthIndex of [0, 1, 3, 6, 8, 11]) {
      meta = monthIndex === 0
        ? ensureTimelineInitialized(meta, stateAtMonth(monthIndex))
        : captureTimelineAnchor(meta, stateAtMonth(monthIndex));
    }

    expect(meta.timeline.anchors.map((anchor) => anchor.monthIndex))
      .toEqual([0, 3, 6, 8, 11]);
    expect(timelineMonthViews(meta, meta.timeline.activeBranchId ?? ""))
      .toHaveLength(12);
  });

  it("首周目结局前禁止分叉", () => {
    const state = stateAtMonth(0);
    const meta = ensureTimelineInitialized(createRebirthMeta("2025"), state);
    const result = forkTimelineAtAnchor(meta, state, meta.timeline.anchors[0]?.id ?? "");

    expect(result.changed).toBe(false);
    expect(result.reason).toContain("结局");
  });

  it("完成结局后从锚点创建新分支并永久保留原路线", () => {
    const { meta, finished, anchorId } = completedTimeline();
    const result = forkTimelineAtAnchor(meta, finished, anchorId);

    expect(result.changed).toBe(true);
    expect(result.state.monthIndex).toBe(0);
    expect(result.state.flags.timeline_forked).toBe(true);
    expect(result.meta.timeline.branches).toHaveLength(2);
    expect(result.meta.timeline.branches.some((branch) => branch.status === "completed"))
      .toBe(true);
    expect(result.meta.timeline.activeBranchId).not.toBeNull();
  });

  it("暂停时间线可以恢复到自己的分支头和调查状态", () => {
    const original = stateAtMonth(3);
    let meta = ensureTimelineInitialized(createRebirthMeta("2025"), original);
    meta = {
      ...meta,
      investigations: {
        "2025-04": {
          monthKey: "2025-04",
          timeBudget: 5,
          timeSpent: 2,
          completedNodeIds: ["apr_earnings_scan"],
          clueIds: ["apr_report_split"],
        },
      },
    };
    meta = recordTimelineEvent(meta, original, "investigation", "扫描一季报");
    const restarted = restartTimelineRun(meta, original, createInitialState("2025"));
    const pausedId = timelineBranchViews(restarted).find((branch) => branch.status === "paused")?.id ?? "";
    const resumed = resumeTimelineBranch(restarted, createInitialState("2025"), pausedId);

    expect(resumed.changed).toBe(true);
    expect(resumed.state.monthIndex).toBe(3);
    expect(resumed.meta.investigations["2025-04"]?.timeSpent).toBe(2);
  });

  it("记忆钥匙给旧锚点补充因果注释", () => {
    const state = stateAtMonth(0);
    const meta = ensureTimelineInitialized({
      ...createRebirthMeta("2025"),
      cycle: 2,
      memoryKeys: ["causal_gap", "sample_pollution", "body_memory", "opportunity_cost"],
    }, state);
    const detail = timelineAnchorDetail(meta, meta.timeline.anchors[0]?.id ?? "");

    expect(detail?.annotations.some((annotation) => annotation.id === "causal-gap")).toBe(true);
    expect(detail?.annotations.some((annotation) => annotation.id === "sample-pollution")).toBe(true);
    expect(detail?.annotations.some((annotation) => annotation.id === "body-memory")).toBe(true);
    expect(detail?.annotations.some((annotation) => annotation.id === "opportunity-cost")).toBe(true);
  });

  it("推演只写入反事实比较，不修改实际状态", () => {
    const state = stateAtMonth(0);
    const meta = ensureTimelineInitialized({
      ...createRebirthMeta("2025"),
      cycle: 2,
      memoryKeys: ["causal_gap"],
    }, state);
    const anchorId = meta.timeline.anchors[0]?.id ?? "";
    const nextMeta = simulateTimelineAnchor(meta, anchorId, "evidence_audit");

    expect(simulationsForAnchor(nextMeta, anchorId)).toHaveLength(1);
    expect(state.researchCredibility).toBe(14);
    expect(nextMeta.timeline.simulations[0]?.projection.researchCredibility)
      .toBeGreaterThan(state.researchCredibility);
  });

  it("读取 v2 元状态时迁移为空时间线并从当前进度继续记录", () => {
    const restored = restoreRebirthMeta("2025", {
      version: 2,
      year: "2025",
      cycle: 2,
      memoryKeys: ["causal_gap"],
      shortcuts: [],
      contradictions: [],
      seenEndingIds: [],
      completedCycles: [],
      lastCycleUnlocks: [],
      investigations: {},
      readSceneNodeIds: [],
      officeDiscoveries: [],
    });

    expect(restored.version).toBe(4);
    expect(restored.experienceMode).toBe("career");
    expect(restored.timeline.branches).toEqual([]);
    const initialized = ensureTimelineInitialized(restored, stateAtMonth(6));
    expect(initialized.timeline.anchors[0]?.monthIndex).toBe(6);
  });
});
