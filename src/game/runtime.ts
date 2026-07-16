// Visual-novel runtime: dynamic scene assembly plus stable-node progression.

import { buildMonthScene } from "./content";
import { CONTENT_REVISION } from "./narrativeSemantics";
import type {
  BranchMetaContext,
  ExperienceMode,
  GameDataYear,
  GameState,
  MonthScene,
} from "../types";

function firstNodeId(
  year: string,
  monthIndex: number,
  state?: GameState,
  branchMeta?: BranchMetaContext,
): string {
  return buildMonthScene(monthIndex, year, state, branchMeta).nodes[0]?.id ?? "";
}

export function createInitialState(
  year: string,
  experienceMode: ExperienceMode = "career",
): GameState {
  return {
    year,
    monthIndex: 0,
    focusId: experienceMode === "romance" ? "team_collab" : "deep_research",
    selectedId: null,
    sceneNodeIndex: 0,
    sceneNodeId: firstNodeId(year, 0),
    contentRevision: CONTENT_REVISION,
    locked: false,
    finished: false,
    researchCredibility: 14,
    committeeAdoption: 10,
    portfolioNav: 1.0,
    viewAccuracy: 12,
    clientFeedback: 10,
    teamTrust: 20,
    fatigue: 22,
    lifeBalance: 52,
    relations: {
      lin_ruoning: 18,
      chen_xinghe: 14,
      zhou_mingzhao: 12,
      zhao_chengyu: 10,
    },
    flags: year === "2025" ? { year_2025: true } : {},
    categoryCounts: {},
    methodCounts: {},
    milestone: null,
    history: [],
    knowledgeCards: [],
    office: { postIts: 0, whiteboardMarkers: 0, coffeeCups: 0, monthsElapsed: 0 },
  };
}

export function sceneForMonth(
  state: GameState,
  branchMeta?: BranchMetaContext,
): MonthScene {
  return buildMonthScene(state.monthIndex, state.year, state, branchMeta);
}

export function scenePosition(
  state: GameState,
  scene: MonthScene = sceneForMonth(state),
): number {
  const idIndex = state.sceneNodeId
    ? scene.nodes.findIndex((node) => node.id === state.sceneNodeId)
    : -1;
  if (idIndex >= 0) return idIndex;
  return Math.max(0, Math.min(state.sceneNodeIndex, scene.nodes.length - 1));
}

export function currentSceneNode(
  state: GameState,
  branchMeta?: BranchMetaContext,
): MonthScene["nodes"][number] {
  const scene = sceneForMonth(state, branchMeta);
  return scene.nodes[scenePosition(state, scene)] ?? scene.nodes[scene.nodes.length - 1];
}

export function canAdvanceScene(
  state: GameState,
  branchMeta?: BranchMetaContext,
): boolean {
  const node = currentSceneNode(state, branchMeta);
  return node.type === "dialogue" || state.locked;
}

export function canRewindScene(
  state: GameState,
  branchMeta?: BranchMetaContext,
): boolean {
  return !state.locked && scenePosition(state, sceneForMonth(state, branchMeta)) > 0;
}

export function rewindScene(
  state: GameState,
  branchMeta?: BranchMetaContext,
): GameState {
  if (!canRewindScene(state, branchMeta)) return state;
  const scene = sceneForMonth(state, branchMeta);
  const nextIndex = scenePosition(state, scene) - 1;
  return {
    ...state,
    sceneNodeIndex: nextIndex,
    sceneNodeId: scene.nodes[nextIndex]?.id ?? state.sceneNodeId,
  };
}

export function advanceScene(
  state: GameState,
  _data: GameDataYear,
  branchMeta?: BranchMetaContext,
): GameState {
  void _data;
  const scene = sceneForMonth(state, branchMeta);
  const currentIndex = scenePosition(state, scene);
  const node = scene.nodes[currentIndex];
  if (node.type === "decision" && !state.locked) return state;
  if (currentIndex < scene.nodes.length - 1) {
    const nextIndex = currentIndex + 1;
    return {
      ...state,
      sceneNodeIndex: nextIndex,
      sceneNodeId: scene.nodes[nextIndex]?.id ?? state.sceneNodeId,
    };
  }
  return nextMonth(state, branchMeta);
}

export function nextMonth(
  state: GameState,
  branchMeta?: BranchMetaContext,
): GameState {
  if (state.finished) {
    return createInitialState(state.year, branchMeta?.experienceMode ?? "career");
  }
  if (!state.locked) return state;
  const monthIndex = Math.min(state.monthIndex + 1, 11);
  const next: GameState = {
    ...state,
    monthIndex,
    selectedId: null,
    sceneNodeIndex: 0,
    sceneNodeId: "",
    contentRevision: CONTENT_REVISION,
    locked: false,
    focusId: branchMeta?.experienceMode === "romance" ? "team_collab" : "deep_research",
    milestone: null,
  };
  return {
    ...next,
    sceneNodeId: firstNodeId(state.year, monthIndex, next, branchMeta),
  };
}
