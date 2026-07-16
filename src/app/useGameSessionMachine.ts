import { useCallback, useEffect, useReducer } from "react";
import { GAME_DATA, GAME_YEARS } from "../data/gameData";
import { focusById, storyForMonth } from "../game/engine";
import {
  branchMetaContext,
  createRebirthMeta,
  persistRebirthMeta,
  readRebirthMeta,
  restoreRebirthMeta,
} from "../game/rebirth";
import { experienceModeFromSearch } from "../game/experienceMode";
import { isSceneNodeRead } from "../game/rebirthFlow";
import { ensureTimelineInitialized } from "../game/rebirthTimeline";
import type { TimelineSimulationProfileId } from "../game/rebirthTimelineState";
import {
  canAdvanceScene,
  canRewindScene,
  createInitialState,
  currentSceneNode,
  sceneForMonth,
} from "../game/runtime";
import {
  persistStoredState,
  readStoredState,
  restoreStoredState,
} from "../game/saveState";
import { readSessionEnvelope, writeSessionEnvelope } from "../game/sessionEnvelope";
import {
  gameSessionReducer,
  type GameSessionSnapshot,
} from "../game/sessionMachine";
import { narrativeFrameFor } from "../game/narrativeMachine";
import type { ResearchDecision } from "../types";
import type { ResearchCommitment } from "../game/researchCommitment";
import type { GameAudio } from "./useGameController";
import type { OfficePropId } from "../game/rebirthOffice";

function bestInitialYear(): string {
  return GAME_YEARS.includes("2025")
    ? "2025"
    : GAME_YEARS[GAME_YEARS.length - 1] || "2025";
}

function yearFromUrl(): string | null {
  const year = new URLSearchParams(window.location.search).get("year");
  return year && year in GAME_DATA ? year : null;
}

function newRunRequested(): boolean {
  return new URLSearchParams(window.location.search).get("new") === "1";
}

function consumeNewRunRequest(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("new")) return;
  url.searchParams.delete("new");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function readSnapshot(year: string, forceNew = false): GameSessionSnapshot {
  const requestedExperience = experienceModeFromSearch(window.location.search) ?? "career";
  if (forceNew) {
    const state = createInitialState(year, requestedExperience);
    const rebirth = ensureTimelineInitialized(
      createRebirthMeta(year, requestedExperience),
      state,
    );
    return { state, rebirth };
  }

  const envelope = readSessionEnvelope(localStorage, year);
  const storedState = envelope
    ? readStoredStateFromEnvelope(year, envelope.state)
    : null;
  const legacyState = storedState ? null : readStoredState(localStorage, year);
  const state = storedState
    ?? legacyState
    ?? createInitialState(year, requestedExperience);
  const hasStoredState = Boolean(storedState ?? legacyState);
  const storedMeta = envelope
    ? restoreRebirthMeta(year, envelope.rebirth, requestedExperience)
    : hasStoredState
      ? readRebirthMeta(localStorage, year)
      : createRebirthMeta(year, requestedExperience);
  const rebirth = ensureTimelineInitialized(storedMeta, state);
  return { state, rebirth };
}

function readStoredStateFromEnvelope(year: string, value: unknown) {
  return restoreStoredState(year, value);
}

function initialSnapshot(): GameSessionSnapshot {
  const forceNew = newRunRequested();
  const snapshot = readSnapshot(yearFromUrl() ?? bestInitialYear(), forceNew);
  if (forceNew) consumeNewRunRequest();
  return snapshot;
}

function persistSnapshot(snapshot: GameSessionSnapshot): void {
  try {
    persistStoredState(localStorage, snapshot.state);
    persistRebirthMeta(localStorage, snapshot.rebirth);
    writeSessionEnvelope(localStorage, snapshot.state, snapshot.rebirth);
  } catch {
    // The interface exposes export and cloud sync when persistent browser storage is unavailable.
  }
}

function replaceYearInUrl(year: string): void {
  const url = new URL(window.location.href);
  if (year === "2025") url.searchParams.delete("year");
  else url.searchParams.set("year", year);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function useGameSessionMachine(audio: GameAudio) {
  const [snapshot, dispatch] = useReducer(gameSessionReducer, undefined, initialSnapshot);
  const { state, rebirth } = snapshot;
  const data = GAME_DATA[state.year];
  const branchMeta = branchMetaContext(rebirth);
  const scene = sceneForMonth(state, branchMeta);
  const sceneNode = currentSceneNode(state, branchMeta);
  const story = storyForMonth(state.monthIndex, state.year);
  const frame = narrativeFrameFor(state, scene, sceneNode);
  const sceneCanAdvance = canAdvanceScene(state, branchMeta);
  const canGoBack = canRewindScene(state, branchMeta);
  const canSkipRead = rebirth.cycle >= 2
    && sceneNode.type === "dialogue"
    && !state.locked
    && isSceneNodeRead(rebirth, state, sceneNode.id);

  useEffect(() => {
    persistSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    const key = sceneNode.type === "dialogue"
      && frame.phase !== "debate"
      && sceneNode.voiceCue !== "silent"
      ? `${state.year}-${state.monthIndex}-${sceneNode.id}`
      : "";
    audio.playLineVoice(key, sceneNode);
  }, [audio, frame.phase, sceneNode, state.monthIndex, state.year]);

  const changeYear = useCallback((year: string) => {
    audio.resetLineVoice();
    replaceYearInUrl(year);
    dispatch({ type: "replace", snapshot: readSnapshot(year) });
  }, [audio]);

  const restart = useCallback(() => {
    audio.resetLineVoice();
    dispatch({ type: "restart" });
  }, [audio]);

  const advanceCurrentScene = useCallback(() => {
    if (!sceneCanAdvance) return;
    audio.playAdvance();
    dispatch({ type: "advance" });
  }, [audio, sceneCanAdvance]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    audio.resetLineVoice();
    dispatch({ type: "rewind" });
  }, [audio, canGoBack]);

  const skipReadScene = useCallback(() => {
    if (!canSkipRead) return;
    audio.resetLineVoice();
    dispatch({ type: "skip-read" });
  }, [audio, canSkipRead]);

  const inspectOfficeWithSound = useCallback((propId: OfficePropId) => {
    audio.playChoice();
    dispatch({ type: "inspect-office", propId });
  }, [audio]);

  const selectFocusWithSound = useCallback((focusId: string) => {
    audio.playChoice();
    dispatch({ type: "select-focus", focusId });
  }, [audio]);

  const investigateWithSound = useCallback((nodeId: string) => {
    audio.playChoice();
    dispatch({ type: "investigate", nodeId });
  }, [audio]);

  const makeDecisionWithSound = useCallback((
    decision: ResearchDecision,
    commitment?: ResearchCommitment,
  ) => {
    audio.playChoice();
    dispatch({ type: "make-decision", decision, commitment });
  }, [audio]);

  const forkTimelineWithSound = useCallback((anchorId: string) => {
    audio.playChoice();
    audio.resetLineVoice();
    dispatch({ type: "fork-timeline", anchorId });
  }, [audio]);

  const resumeTimelineWithSound = useCallback((branchId: string) => {
    audio.playChoice();
    audio.resetLineVoice();
    dispatch({ type: "resume-timeline", branchId });
  }, [audio]);

  const simulateTimeline = useCallback((
    anchorId: string,
    profileId: TimelineSimulationProfileId,
  ) => {
    audio.playChoice();
    dispatch({ type: "simulate-timeline", anchorId, profileId });
  }, [audio]);

  return {
    advanceCurrentScene,
    canGoBack,
    canSkipRead,
    changeYear,
    data,
    forkTimelineWithSound,
    frame,
    goBack,
    inspectOfficeWithSound,
    investigateWithSound,
    makeDecisionWithSound,
    rebirth,
    restart,
    resumeTimelineWithSound,
    scene,
    sceneCanAdvance,
    sceneNode,
    selectFocusWithSound,
    simulateTimeline,
    skipReadScene,
    state,
    story,
    activeFocus: focusById(state.focusId),
  };
}

export type MachineGameSession = ReturnType<typeof useGameSessionMachine>;
