import type {
  BranchMetaContext,
  GameDataYear,
  GameState,
} from "../types";
import { getTheme } from "./content";
import type { RebirthMetaState } from "./rebirth";
import { advanceScene, currentSceneNode } from "./runtime";

export type FlowMonthStatus = "completed" | "current" | "locked";

export interface RebirthFlowEntry {
  monthIndex: number;
  monthKey: string;
  label: string;
  title: string;
  status: FlowMonthStatus;
  keyMonth: boolean;
  investigationLabel: string | null;
  investigationProgress: string | null;
  decisionLabel: string | null;
  grade: string | null;
  tags: string[];
}

const KEY_MONTH_LABELS: Partial<Record<number, string>> = {
  0: "记忆可靠性",
  3: "事后正确偏差",
  6: "基本面与资金分化",
  8: "组织权限",
  11: "真相路线",
};

function monthKey(year: string, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function sceneReadKey(state: GameState, nodeId: string): string {
  return `${state.year}:${state.monthIndex}:${nodeId}`;
}

export function isSceneNodeRead(
  meta: RebirthMetaState,
  state: GameState,
  nodeId: string,
): boolean {
  return meta.readSceneNodeIds.includes(sceneReadKey(state, nodeId));
}

export function markSceneNodeRead(
  meta: RebirthMetaState,
  state: GameState,
  nodeId: string,
): RebirthMetaState {
  const key = sceneReadKey(state, nodeId);
  if (meta.readSceneNodeIds.includes(key)) return meta;
  return { ...meta, readSceneNodeIds: [...meta.readSceneNodeIds, key] };
}

export function skipReadSceneNodes(
  meta: RebirthMetaState,
  state: GameState,
  data: GameDataYear,
  branchMeta: BranchMetaContext,
): GameState {
  if (meta.cycle < 2 || state.locked) return state;
  let next = state;
  for (let guard = 0; guard < 40; guard += 1) {
    const node = currentSceneNode(next, branchMeta);
    if (node.type !== "dialogue" || !isSceneNodeRead(meta, next, node.id)) break;
    const advanced = advanceScene(next, data, branchMeta);
    if (advanced === next || advanced.monthIndex !== state.monthIndex) break;
    next = advanced;
  }
  return next;
}

function resultTags(
  method: string | undefined,
  isParachuted: boolean | undefined,
): string[] {
  const tags: string[] = [];
  if (method) tags.push(method);
  if (isParachuted) tags.push("空降结论");
  return tags;
}

export function flowMapEntries(
  meta: RebirthMetaState,
  state: GameState,
): RebirthFlowEntry[] {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const key = monthKey(state.year, monthIndex);
    const result = state.history.find((item) => item.month === key);
    const progress = meta.investigations[key];
    const status: FlowMonthStatus = result
      ? "completed"
      : monthIndex === state.monthIndex && !state.finished
        ? "current"
        : "locked";
    const theme = getTheme(state.year, monthIndex);
    const keyLabel = KEY_MONTH_LABELS[monthIndex];
    return {
      monthIndex,
      monthKey: key,
      label: `${monthIndex + 1}月`,
      title: theme.title,
      status,
      keyMonth: Boolean(keyLabel),
      investigationLabel: keyLabel ?? null,
      investigationProgress: progress
        ? `${progress.completedNodeIds.length} 条路径 · ${progress.clueIds.length} 条线索`
        : null,
      decisionLabel: result?.selected.label ?? null,
      grade: result?.score?.grade ?? null,
      tags: resultTags(result?.method, result?.isParachuted),
    };
  });
}

export function readSceneCount(meta: RebirthMetaState, year: string): number {
  return meta.readSceneNodeIds.filter((key) => key.startsWith(`${year}:`)).length;
}
