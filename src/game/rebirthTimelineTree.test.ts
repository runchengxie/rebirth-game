import { describe, expect, it } from "vitest";
import type { GameState } from "../types";
import { createRebirthMeta } from "./rebirth";
import {
  completeActiveTimelineBranch,
  ensureTimelineInitialized,
  forkTimelineAtAnchor,
} from "./rebirthTimeline";
import { timelineBranchViews } from "./rebirthTimelineInsights";
import { createInitialState } from "./runtime";

function completedRootTimeline() {
  const initial = createInitialState("2025");
  let meta = ensureTimelineInitialized(createRebirthMeta("2025"), initial);
  const anchorId = meta.timeline.anchors[0]?.id ?? "";
  const finished: GameState = {
    ...initial,
    monthIndex: 11,
    locked: true,
    finished: true,
  };
  meta = completeActiveTimelineBranch(meta, finished, "ordinary");
  return {
    anchorId,
    finished,
    meta: {
      ...meta,
      cycle: 2,
      completedCycles: [
        { cycle: 1, endingId: "ordinary", averageReasoning: 0, unlocked: [] },
      ],
    },
  };
}

describe("回溯树状关系", () => {
  it("分叉路线保留父节点编号，界面可以稳定构建树", () => {
    const { meta, finished, anchorId } = completedRootTimeline();
    const result = forkTimelineAtAnchor(meta, finished, anchorId);
    const branches = timelineBranchViews(result.meta);
    const root = branches.find((branch) => branch.status === "completed");
    const child = branches.find((branch) => branch.active);

    expect(result.changed).toBe(true);
    expect(root).toBeDefined();
    expect(child?.parentBranchId).toBe(root?.id);
  });
});
