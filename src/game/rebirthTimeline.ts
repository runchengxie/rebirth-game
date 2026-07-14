import type { GameState } from "../types";
import { getTheme } from "./content";
import type { RebirthMetaState } from "./rebirth";
import {
  TIMELINE_BRANCH_LIMIT,
  TIMELINE_KEY_MONTHS,
  cloneTimelineInvestigations,
  cloneTimelineStateSnapshot,
  type RebirthTimelineState,
  type TimelineAnchor,
  type TimelineBranch,
  type TimelineEventType,
} from "./rebirthTimelineState";

export interface TimelineTransition {
  meta: RebirthMetaState;
  state: GameState;
  changed: boolean;
  reason: string | null;
}

function monthKey(state: GameState): string {
  return `${state.year}-${String(state.monthIndex + 1).padStart(2, "0")}`;
}

function isKeyMonth(monthIndex: number): boolean {
  return TIMELINE_KEY_MONTHS.includes(monthIndex as (typeof TIMELINE_KEY_MONTHS)[number]);
}

function nextSequence(timeline: RebirthTimelineState): number {
  return timeline.sequence + 1;
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function activeBranch(timeline: RebirthTimelineState): TimelineBranch | null {
  return timeline.branches.find((branch) => branch.id === timeline.activeBranchId) ?? null;
}

function replaceBranch(
  timeline: RebirthTimelineState,
  branch: TimelineBranch,
): RebirthTimelineState {
  return {
    ...timeline,
    branches: timeline.branches.map((candidate) => (
      candidate.id === branch.id ? branch : candidate
    )),
  };
}

function rootBranchLabel(cycle: number, serial: number): string {
  return serial === 1 ? `第 ${cycle} 周目主线` : `第 ${cycle} 周目路线 ${serial}`;
}

function createBranch(
  timeline: RebirthTimelineState,
  state: GameState,
  investigations: RebirthMetaState["investigations"],
  cycle: number,
  parentBranchId: string | null,
  forkAnchorId: string | null,
  label?: string,
): { timeline: RebirthTimelineState; branch: TimelineBranch } {
  const serial = timeline.nextBranchSerial;
  const id = `timeline-b${serial}`;
  const sequence = nextSequence(timeline);
  const branch: TimelineBranch = {
    id,
    label: label ?? rootBranchLabel(cycle, serial),
    cycle,
    status: "active",
    parentBranchId,
    forkAnchorId,
    headState: cloneTimelineStateSnapshot(state),
    investigations: cloneTimelineInvestigations(investigations),
    anchorIds: [],
    events: [],
    endingId: null,
    sequence,
  };
  return {
    branch,
    timeline: {
      ...timeline,
      activeBranchId: id,
      nextBranchSerial: serial + 1,
      sequence,
      branches: [...timeline.branches, branch],
    },
  };
}

function pauseCurrentBranch(
  timeline: RebirthTimelineState,
  state: GameState,
  investigations: RebirthMetaState["investigations"],
): RebirthTimelineState {
  const branch = activeBranch(timeline);
  if (!branch) return timeline;
  const paused: TimelineBranch = {
    ...branch,
    status: branch.status === "completed" ? "completed" : "paused",
    headState: cloneTimelineStateSnapshot(state),
    investigations: cloneTimelineInvestigations(investigations),
  };
  return {
    ...replaceBranch(timeline, paused),
    activeBranchId: null,
  };
}

function captureAnchorOnInitialized(
  meta: RebirthMetaState,
  state: GameState,
): RebirthMetaState {
  if (!isKeyMonth(state.monthIndex) || state.locked || state.finished) return meta;
  if (state.history.some((result) => result.month === monthKey(state))) return meta;
  const branch = activeBranch(meta.timeline);
  if (!branch) return meta;
  const existing = meta.timeline.anchors.find((anchor) => (
    anchor.branchId === branch.id && anchor.monthIndex === state.monthIndex
  ));
  if (existing) return meta;

  const sequence = nextSequence(meta.timeline);
  const id = `${branch.id}-anchor-${state.monthIndex + 1}`;
  const theme = getTheme(state.year, state.monthIndex);
  const anchor: TimelineAnchor = {
    id,
    branchId: branch.id,
    cycle: branch.cycle,
    monthIndex: state.monthIndex,
    monthKey: monthKey(state),
    label: `${state.monthIndex + 1}月 · ${theme.title}`,
    contentRevision: state.contentRevision,
    state: cloneTimelineStateSnapshot(state),
    investigations: cloneTimelineInvestigations(meta.investigations),
    sourceMemoryKeys: [...meta.memoryKeys],
    sourceShortcuts: [...meta.shortcuts],
    sourceContradictions: [...meta.contradictions],
    sequence,
  };
  const updatedBranch: TimelineBranch = {
    ...branch,
    anchorIds: [...branch.anchorIds, id],
  };
  return {
    ...meta,
    timeline: {
      ...replaceBranch(meta.timeline, updatedBranch),
      sequence,
      anchors: [...meta.timeline.anchors, anchor],
    },
  };
}

export function ensureTimelineInitialized(
  meta: RebirthMetaState,
  state: GameState,
): RebirthMetaState {
  if (meta.timeline.branches.length > 0 && meta.timeline.activeBranchId) {
    return captureTimelineAnchor(syncActiveTimelineBranch(meta, state), state);
  }
  if (meta.timeline.branches.length > 0 && !meta.timeline.activeBranchId) {
    return meta;
  }
  const created = createBranch(
    meta.timeline,
    state,
    meta.investigations,
    meta.cycle,
    null,
    null,
  );
  return captureAnchorOnInitialized({ ...meta, timeline: created.timeline }, state);
}

export function syncActiveTimelineBranch(
  meta: RebirthMetaState,
  state: GameState,
): RebirthMetaState {
  const branch = activeBranch(meta.timeline);
  if (!branch) return meta;
  const stateChanged = !sameJson(branch.headState, state);
  const investigationsChanged = !sameJson(branch.investigations, meta.investigations);
  if (!stateChanged && !investigationsChanged) return meta;
  return {
    ...meta,
    timeline: replaceBranch(meta.timeline, {
      ...branch,
      headState: cloneTimelineStateSnapshot(state),
      investigations: cloneTimelineInvestigations(meta.investigations),
    }),
  };
}

export function captureTimelineAnchor(
  meta: RebirthMetaState,
  state: GameState,
): RebirthMetaState {
  const initialized = meta.timeline.branches.length > 0
    ? syncActiveTimelineBranch(meta, state)
    : ensureTimelineInitialized(meta, state);
  return captureAnchorOnInitialized(initialized, state);
}

export function recordTimelineEvent(
  meta: RebirthMetaState,
  state: GameState,
  type: TimelineEventType,
  label: string,
  payload: Record<string, string | number | boolean> = {},
): RebirthMetaState {
  const captured = captureTimelineAnchor(meta, state);
  const branch = activeBranch(captured.timeline);
  if (!branch) return captured;
  const serial = captured.timeline.nextEventSerial;
  const sequence = nextSequence(captured.timeline);
  const event = {
    id: `timeline-e${serial}`,
    sequence,
    branchId: branch.id,
    cycle: branch.cycle,
    monthIndex: state.monthIndex,
    monthKey: monthKey(state),
    type,
    label,
    payload,
  } as const;
  const updatedBranch: TimelineBranch = {
    ...branch,
    headState: cloneTimelineStateSnapshot(state),
    investigations: cloneTimelineInvestigations(captured.investigations),
    events: [...branch.events, event],
  };
  return {
    ...captured,
    timeline: {
      ...replaceBranch(captured.timeline, updatedBranch),
      nextEventSerial: serial + 1,
      sequence,
    },
  };
}

export function completeActiveTimelineBranch(
  meta: RebirthMetaState,
  state: GameState,
  endingId: string,
): RebirthMetaState {
  const synced = syncActiveTimelineBranch(meta, state);
  const branch = activeBranch(synced.timeline);
  if (!branch) return synced;
  const completed: TimelineBranch = {
    ...branch,
    status: "completed",
    endingId,
    headState: cloneTimelineStateSnapshot(state),
    investigations: cloneTimelineInvestigations(synced.investigations),
  };
  return {
    ...synced,
    timeline: {
      ...replaceBranch(synced.timeline, completed),
      activeBranchId: null,
    },
  };
}

export function startTimelineCycle(
  meta: RebirthMetaState,
  state: GameState,
): RebirthMetaState {
  if (meta.timeline.activeBranchId) return captureTimelineAnchor(meta, state);
  const created = createBranch(
    meta.timeline,
    state,
    meta.investigations,
    meta.cycle,
    null,
    null,
  );
  return captureAnchorOnInitialized({ ...meta, timeline: created.timeline }, state);
}

export function restartTimelineRun(
  meta: RebirthMetaState,
  currentState: GameState,
  nextState: GameState,
): RebirthMetaState {
  const paused = pauseCurrentBranch(meta.timeline, currentState, meta.investigations);
  const cleared: RebirthMetaState = {
    ...meta,
    lastCycleUnlocks: [],
    investigations: {},
    timeline: paused,
  };
  const created = createBranch(
    cleared.timeline,
    nextState,
    {},
    cleared.cycle,
    null,
    null,
    `第 ${cleared.cycle} 周目 · 重新开始`,
  );
  return captureAnchorOnInitialized({ ...cleared, timeline: created.timeline }, nextState);
}

function forkEligibilityReason(
  meta: RebirthMetaState,
  currentState: GameState,
  anchor: TimelineAnchor | undefined,
): string | null {
  if (!anchor) return "回溯锚点不存在";
  const sourceBranch = meta.timeline.branches.find((branch) => branch.id === anchor.branchId);
  if (!sourceBranch || sourceBranch.status !== "completed") return "完成该时间线的结局后才能分叉";
  if (meta.completedCycles.length === 0 && meta.cycle < 2) return "完成首个结局后才能改写时间线";
  if (meta.timeline.branches.length >= TIMELINE_BRANCH_LIMIT) return "时间线数量已达到上限";
  if (anchor.contentRevision !== currentState.contentRevision) return "剧情版本已变化，只能观看旧锚点";
  return null;
}

export function forkTimelineAtAnchor(
  meta: RebirthMetaState,
  currentState: GameState,
  anchorId: string,
): TimelineTransition {
  const anchor = meta.timeline.anchors.find((candidate) => candidate.id === anchorId);
  const reason = forkEligibilityReason(meta, currentState, anchor);
  if (!anchor || reason) return { meta, state: currentState, changed: false, reason };

  const pausedTimeline = pauseCurrentBranch(
    meta.timeline,
    currentState,
    meta.investigations,
  );
  const restoredState: GameState = {
    ...cloneTimelineStateSnapshot(anchor.state),
    locked: false,
    finished: false,
    selectedId: null,
    flags: {
      ...anchor.state.flags,
      timeline_forked: true,
      timeline_source_cycle: anchor.cycle,
      timeline_source_month: anchor.monthIndex + 1,
    },
  };
  const branchLabel = `分支 ${pausedTimeline.nextBranchSerial} · ${anchor.monthIndex + 1}月回溯`;
  const created = createBranch(
    pausedTimeline,
    restoredState,
    anchor.investigations,
    meta.cycle,
    anchor.branchId,
    anchor.id,
    branchLabel,
  );
  let nextMeta: RebirthMetaState = {
    ...meta,
    investigations: cloneTimelineInvestigations(anchor.investigations),
    timeline: created.timeline,
  };
  nextMeta = recordTimelineEvent(nextMeta, restoredState, "rewind", `从${anchor.label}创建分支`, {
    sourceCycle: anchor.cycle,
    sourceMonth: anchor.monthIndex + 1,
  });
  nextMeta = captureTimelineAnchor(nextMeta, restoredState);
  return { meta: nextMeta, state: restoredState, changed: true, reason: null };
}

export function resumeTimelineBranch(
  meta: RebirthMetaState,
  currentState: GameState,
  branchId: string,
): TimelineTransition {
  const target = meta.timeline.branches.find((branch) => branch.id === branchId);
  if (!target) return { meta, state: currentState, changed: false, reason: "时间线不存在" };
  if (target.status !== "paused") {
    return { meta, state: currentState, changed: false, reason: "只能继续尚未完成的暂停时间线" };
  }
  if (target.headState.contentRevision !== currentState.contentRevision) {
    return { meta, state: currentState, changed: false, reason: "剧情版本已变化，只能观看该时间线" };
  }

  const paused = pauseCurrentBranch(meta.timeline, currentState, meta.investigations);
  const active: TimelineBranch = { ...target, status: "active" };
  const nextTimeline: RebirthTimelineState = {
    ...replaceBranch(paused, active),
    activeBranchId: active.id,
  };
  const restoredState = cloneTimelineStateSnapshot(active.headState);
  return {
    meta: {
      ...meta,
      investigations: cloneTimelineInvestigations(active.investigations),
      timeline: nextTimeline,
    },
    state: restoredState,
    changed: true,
    reason: null,
  };
}

export function timelineAnchorById(
  meta: RebirthMetaState,
  anchorId: string,
): TimelineAnchor | null {
  return meta.timeline.anchors.find((anchor) => anchor.id === anchorId) ?? null;
}

export function timelineBranchById(
  meta: RebirthMetaState,
  branchId: string,
): TimelineBranch | null {
  return meta.timeline.branches.find((branch) => branch.id === branchId) ?? null;
}

export function canForkTimelineAnchor(
  meta: RebirthMetaState,
  state: GameState,
  anchorId: string,
): string | null {
  return forkEligibilityReason(
    meta,
    state,
    meta.timeline.anchors.find((anchor) => anchor.id === anchorId),
  );
}
