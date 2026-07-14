#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    if old not in text:
        raise RuntimeError(f"{path} 缺少待替换片段：{old[:120]!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "src/game/rebirthTimeline.ts",
    '''function rootBranchLabel(cycle: number, serial: number): string {
  return serial === 1 ? `第 ${cycle} 周目主线` : `第 ${cycle} 周目路线 ${serial}`;
}

function createBranch(
''',
    '''function rootBranchLabel(cycle: number, serial: number): string {
  return serial === 1 ? `第 ${cycle} 周目主线` : `第 ${cycle} 周目路线 ${serial}`;
}

function removeTimelineBranch(
  timeline: RebirthTimelineState,
  branchId: string,
): RebirthTimelineState {
  const anchorIds = new Set(
    timeline.anchors
      .filter((anchor) => anchor.branchId === branchId)
      .map((anchor) => anchor.id),
  );
  return {
    ...timeline,
    activeBranchId: timeline.activeBranchId === branchId ? null : timeline.activeBranchId,
    branches: timeline.branches.filter((branch) => branch.id !== branchId),
    anchors: timeline.anchors.filter((anchor) => anchor.branchId !== branchId),
    simulations: timeline.simulations.filter((simulation) => (
      simulation.branchId !== branchId && !anchorIds.has(simulation.anchorId)
    )),
  };
}

function trimTimelineForNewBranch(
  timeline: RebirthTimelineState,
  preferredDropId?: string | null,
): RebirthTimelineState {
  if (timeline.branches.length < TIMELINE_BRANCH_LIMIT) return timeline;
  const preferred = preferredDropId
    ? timeline.branches.find((branch) => (
        branch.id === preferredDropId && branch.status === "paused"
      ))
    : undefined;
  const paused = [...timeline.branches]
    .filter((branch) => branch.status === "paused")
    .sort((left, right) => left.sequence - right.sequence)[0];
  const completed = [...timeline.branches]
    .filter((branch) => branch.status === "completed")
    .sort((left, right) => left.sequence - right.sequence)[0];
  const removable = preferred ?? paused ?? completed;
  return removable ? removeTimelineBranch(timeline, removable.id) : timeline;
}

function createBranch(
''',
)
replace_once(
    "src/game/rebirthTimeline.ts",
    '''  if (meta.timeline.branches.length > 0 && !meta.timeline.activeBranchId) {
    return meta;
  }
  const created = createBranch(
    meta.timeline,
''',
    '''  if (meta.timeline.branches.length > 0 && !meta.timeline.activeBranchId && state.finished) {
    return meta;
  }
  const availableTimeline = trimTimelineForNewBranch(meta.timeline);
  const created = createBranch(
    availableTimeline,
''',
)
replace_once(
    "src/game/rebirthTimeline.ts",
    '''  const created = createBranch(
    meta.timeline,
    state,
    meta.investigations,
    meta.cycle,
''',
    '''  const availableTimeline = trimTimelineForNewBranch(meta.timeline);
  const created = createBranch(
    availableTimeline,
    state,
    meta.investigations,
    meta.cycle,
''',
)
replace_once(
    "src/game/rebirthTimeline.ts",
    '''  const paused = pauseCurrentBranch(meta.timeline, currentState, meta.investigations);
  const cleared: RebirthMetaState = {
    ...meta,
    lastCycleUnlocks: [],
    investigations: {},
    timeline: paused,
  };
''',
    '''  const previousBranchId = meta.timeline.activeBranchId;
  const paused = pauseCurrentBranch(meta.timeline, currentState, meta.investigations);
  const availableTimeline = trimTimelineForNewBranch(paused, previousBranchId);
  const cleared: RebirthMetaState = {
    ...meta,
    lastCycleUnlocks: [],
    investigations: {},
    timeline: availableTimeline,
  };
''',
)

replace_once(
    "docs/rebirth-system.md",
    '''- 原时间线永久保留。
''',
    '''- 原时间线会在 12 条容量范围内保留。
''',
)
replace_once(
    "docs/rebirth-system.md",
    '''- 最多保存 12 条时间线。
''',
    '''- 最多保存 12 条时间线。分叉达到上限时会被拒绝。重新开始会优先移除刚放弃的暂停路线，新周目会移除最旧的已完成路线，历次结局摘要继续保留。
''',
)

print("timeline branch limit fixed")
