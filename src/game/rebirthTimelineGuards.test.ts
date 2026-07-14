import { describe, expect, it } from "vitest";
import { createRebirthMeta } from "./rebirth";
import {
  completeActiveTimelineBranch,
  ensureTimelineInitialized,
  forkTimelineAtAnchor,
} from "./rebirthTimeline";
import { TIMELINE_BRANCH_LIMIT } from "./rebirthTimelineState";
import { createInitialState } from "./runtime";

function completedMeta() {
  const initial = createInitialState("2025");
  let meta = ensureTimelineInitialized(createRebirthMeta("2025"), initial);
  const anchorId = meta.timeline.anchors[0]?.id ?? "";
  const finished = {
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

describe("回溯安全边界", () => {
  it("剧情内容版本变化后保留观看能力并禁止恢复旧快照", () => {
    const { meta, finished, anchorId } = completedMeta();
    const changedContent = { ...finished, contentRevision: "future-content-revision" };
    const result = forkTimelineAtAnchor(meta, changedContent, anchorId);

    expect(result.changed).toBe(false);
    expect(result.reason).toContain("剧情版本");
    expect(meta.timeline.anchors.some((anchor) => anchor.id === anchorId)).toBe(true);
  });

  it("达到时间线数量上限后不会继续复制浏览器存档", () => {
    const { meta, finished, anchorId } = completedMeta();
    const template = meta.timeline.branches[0];
    if (!template) throw new Error("测试需要一条已完成时间线");
    const branches = Array.from({ length: TIMELINE_BRANCH_LIMIT }, (_, index) => ({
      ...template,
      id: `limit-branch-${index + 1}`,
      label: `上限测试 ${index + 1}`,
      sequence: index + 1,
    }));
    branches[0] = { ...branches[0], id: template.id };
    const limited = {
      ...meta,
      timeline: {
        ...meta.timeline,
        branches,
      },
    };
    const result = forkTimelineAtAnchor(limited, finished, anchorId);

    expect(result.changed).toBe(false);
    expect(result.reason).toContain("上限");
    expect(result.meta.timeline.branches).toHaveLength(TIMELINE_BRANCH_LIMIT);
  });
});
