import type { CharacterId, GameState } from "../types";
import {
  addContradiction,
  type RebirthMetaState,
  type RebirthTransition,
} from "./rebirth";

export type OfficePropId =
  | "postits"
  | "whiteboard"
  | "coffee"
  | "archive"
  | "shortcuts";

export interface OfficePropView {
  id: OfficePropId;
  label: string;
  countLabel: string;
  summary: string;
  actionLabel: string;
  completed: boolean;
  lockedReason: string | null;
  discovery: string | null;
}

const DISCOVERY_COPY: Record<string, string> = {
  postit_commitment: "便签上的修改痕迹记录了谁替你补过缺口，也记录了哪些承诺仍未兑现。",
  whiteboard_framework: "白板上的箭头把几个月的假设连成一张空间地图，错误并没有消失，只是被挪到了下一层。",
  coffee_limit: "咖啡杯的数量比疲劳条更诚实。你关掉一块屏幕，承认判断力也有容量上限。",
  archive_thread: "把月度档案按假设而非涨跌排序后，同一类推导缺口开始反复出现。",
  shortcut_board: "联系人、回测管线和风险模板被钉在同一块板上。关系第一次变成了可见的研究基础设施。",
  whiteboard_residue: "白板角落留下了本应随重生消失的字迹：调用量涨得比利润快。",
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function flagFor(id: OfficePropId): string {
  return `office_${id}_reviewed`;
}

function flagIsSet(state: GameState, key: string): boolean {
  const value = state.flags[key];
  return value !== undefined && value !== false && value !== 0;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function discoveryFor(id: OfficePropId, meta: RebirthMetaState): string | null {
  const baseId = id === "postits"
    ? "postit_commitment"
    : id === "whiteboard"
      ? "whiteboard_framework"
      : id === "coffee"
        ? "coffee_limit"
        : id === "archive"
          ? "archive_thread"
          : "shortcut_board";
  if (!meta.officeDiscoveries.includes(baseId)) return null;
  const copies = [DISCOVERY_COPY[baseId]];
  if (id === "whiteboard" && meta.officeDiscoveries.includes("whiteboard_residue")) {
    copies.push(DISCOVERY_COPY.whiteboard_residue);
  }
  return copies.join(" ");
}

export function officeDiscoveryEntries(meta: RebirthMetaState) {
  return meta.officeDiscoveries.map((id) => ({
    id,
    label: id === "whiteboard_residue" ? "未重置的白板" : "研究室发现",
    description: DISCOVERY_COPY[id] ?? "这条研究室记录还没有完成解释。",
  }));
}

export function officePropViews(
  meta: RebirthMetaState,
  state: GameState,
): OfficePropView[] {
  const definitions: Array<Omit<OfficePropView, "completed" | "discovery">> = [
    {
      id: "postits",
      label: "便签墙",
      countLabel: `${state.office.postIts} 张便签`,
      summary: "回看同事留下的修改、承诺和未补完的证据缺口。",
      actionLabel: "整理便签",
      lockedReason: state.office.postIts > 0 ? null : "做过协作或基本面研究后才会留下便签",
    },
    {
      id: "whiteboard",
      label: "白板",
      countLabel: `${state.office.whiteboardMarkers} 组框架`,
      summary: "把分散在不同月份的假设与反例连成一张研究地图。",
      actionLabel: "重画框架",
      lockedReason: state.office.whiteboardMarkers > 0 ? null : "完成一次框架型研究后才能回看",
    },
    {
      id: "coffee",
      label: "咖啡杯",
      countLabel: `${state.office.coffeeCups} 只杯子`,
      summary: "检查这一年的研究能力是否建立在持续透支上。",
      actionLabel: "关掉一块屏幕",
      lockedReason: state.office.coffeeCups >= 2 ? null : "深夜工作留下更多痕迹后才能检查",
    },
    {
      id: "archive",
      label: "研究档案柜",
      countLabel: `${state.history.length} 个月复盘`,
      summary: "按假设、反例与业务结果重新排列月度记录，为十二月审计做准备。",
      actionLabel: "重排档案",
      lockedReason: state.history.length >= 3 ? null : "至少完成三个月研究后才能形成档案线索",
    },
    {
      id: "shortcuts",
      label: "研究捷径板",
      countLabel: `${meta.shortcuts.length} 条捷径`,
      summary: "查看关系如何转化为联系人、回测管线和风险模板。",
      actionLabel: "固定工作流",
      lockedReason: meta.shortcuts.length > 0 ? null : "下一周目带回研究捷径后开放",
    },
  ];

  return definitions.map((definition) => ({
    ...definition,
    completed: flagIsSet(state, flagFor(definition.id)),
    discovery: discoveryFor(definition.id, meta),
  }));
}

function addRelation(
  relations: Record<CharacterId, number>,
  characterId: CharacterId,
  delta: number,
): Record<CharacterId, number> {
  return { ...relations, [characterId]: clamp((relations[characterId] ?? 0) + delta) };
}

function discoveryId(id: OfficePropId): string {
  if (id === "postits") return "postit_commitment";
  if (id === "whiteboard") return "whiteboard_framework";
  if (id === "coffee") return "coffee_limit";
  if (id === "archive") return "archive_thread";
  return "shortcut_board";
}

export function inspectOfficeProp(
  meta: RebirthMetaState,
  state: GameState,
  id: OfficePropId,
): RebirthTransition {
  const view = officePropViews(meta, state).find((entry) => entry.id === id);
  if (!view || view.completed || view.lockedReason) return { meta, state, changed: false };

  const flags = { ...state.flags, [flagFor(id)]: true };
  let nextState: GameState = { ...state, flags };
  if (id === "postits") {
    nextState = {
      ...nextState,
      teamTrust: clamp(nextState.teamTrust + 1),
      relations: addRelation(nextState.relations, "lin_ruoning", 1),
    };
  }
  if (id === "whiteboard") {
    nextState = {
      ...nextState,
      researchCredibility: clamp(nextState.researchCredibility + 1),
    };
  }
  if (id === "coffee") {
    nextState = {
      ...nextState,
      fatigue: clamp(nextState.fatigue - 3),
      lifeBalance: clamp(nextState.lifeBalance + 3),
    };
  }
  if (id === "archive") {
    nextState = {
      ...nextState,
      researchCredibility: clamp(nextState.researchCredibility + 1),
      flags: { ...nextState.flags, office_archive_reviewed: true },
    };
  }
  if (id === "shortcuts") {
    nextState = { ...nextState, teamTrust: clamp(nextState.teamTrust + 1) };
  }

  const baseDiscovery = discoveryId(id);
  let nextMeta: RebirthMetaState = {
    ...meta,
    officeDiscoveries: unique([...meta.officeDiscoveries, baseDiscovery]),
  };
  if (id === "whiteboard" && meta.cycle >= 2) {
    nextMeta = {
      ...addContradiction(nextMeta, "office_residue"),
      officeDiscoveries: unique([...nextMeta.officeDiscoveries, "whiteboard_residue"]),
    };
  }

  return { meta: nextMeta, state: nextState, changed: true };
}
