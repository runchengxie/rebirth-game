#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    if old not in text:
        raise RuntimeError(f"{path} 缺少待替换片段：{old[:80]!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


def append_once(path: str, marker: str, content: str) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    if marker in text:
        return
    target.write_text(text.rstrip() + "\n" + content, encoding="utf-8")


# src/types.ts
replace_once(
    "src/types.ts",
    'export type BranchCondition =\n',
    'export interface BranchMetaContext {\n'
    '  cycle: number;\n'
    '  memoryKeys: string[];\n'
    '}\n\n'
    'export type BranchCondition =\n',
)
replace_once(
    "src/types.ts",
    '  | { kind: "month"; gte: number }\n',
    '  | { kind: "month"; gte: number }\n'
    '  | { kind: "cycle"; gte: number }\n'
    '  | { kind: "memoryKey"; key: string }\n',
)

# src/game/branching.ts
replace_once(
    "src/game/branching.ts",
    'import type { Branch, BranchCondition, GameState } from "../types";',
    'import type { Branch, BranchCondition, BranchMetaContext, GameState } from "../types";',
)
replace_once(
    "src/game/branching.ts",
    'export function evaluateBranchCondition(cond: BranchCondition, state: GameState): boolean {',
    'export function evaluateBranchCondition(\n'
    '  cond: BranchCondition,\n'
    '  state: GameState,\n'
    '  meta?: BranchMetaContext,\n'
    '): boolean {',
)
replace_once(
    "src/game/branching.ts",
    '    case "month":\n      return state.monthIndex >= cond.gte;\n'
    '    case "and":\n      return cond.of.every((child) => evaluateBranchCondition(child, state));\n'
    '    case "or":\n      return cond.of.some((child) => evaluateBranchCondition(child, state));\n'
    '    case "not":\n      return !evaluateBranchCondition(cond.of, state);',
    '    case "month":\n      return state.monthIndex >= cond.gte;\n'
    '    case "cycle":\n      return (meta?.cycle ?? 1) >= cond.gte;\n'
    '    case "memoryKey":\n      return meta?.memoryKeys.includes(cond.key) ?? false;\n'
    '    case "and":\n      return cond.of.every((child) => evaluateBranchCondition(child, state, meta));\n'
    '    case "or":\n      return cond.of.some((child) => evaluateBranchCondition(child, state, meta));\n'
    '    case "not":\n      return !evaluateBranchCondition(cond.of, state, meta);',
)
replace_once(
    "src/game/branching.ts",
    'export function activeBranches(state: GameState, branches: Branch[]): Branch[] {',
    'export function activeBranches(\n'
    '  state: GameState,\n'
    '  branches: Branch[],\n'
    '  meta?: BranchMetaContext,\n'
    '): Branch[] {',
)
replace_once(
    "src/game/branching.ts",
    '      return evaluateBranchCondition(branch.when, state);',
    '      return evaluateBranchCondition(branch.when, state, meta);',
)
replace_once(
    "src/game/branching.ts",
    '  branches: Branch[],\n): Record<string, boolean | number> {',
    '  branches: Branch[],\n  meta?: BranchMetaContext,\n): Record<string, boolean | number> {',
)
replace_once(
    "src/game/branching.ts",
    '  for (const branch of activeBranches(state, branches)) {',
    '  for (const branch of activeBranches(state, branches, meta)) {',
)

# src/game/sceneBuilders.ts
replace_once(
    "src/game/sceneBuilders.ts",
    '  Branch,\n  CharacterId,',
    '  Branch,\n  BranchMetaContext,\n  CharacterId,',
)
replace_once(
    "src/game/sceneBuilders.ts",
    'function collectBranchContributions(state?: GameState): BranchContributions {',
    'function collectBranchContributions(\n'
    '  state?: GameState,\n'
    '  branchMeta?: BranchMetaContext,\n'
    '): BranchContributions {',
)
replace_once(
    "src/game/sceneBuilders.ts",
    '  const branches = state ? activeBranches(state, BRANCHES) : [];',
    '  const branches = state ? activeBranches(state, BRANCHES, branchMeta) : [];',
)
replace_once(
    "src/game/sceneBuilders.ts",
    '  state?: GameState,\n): MonthScene {',
    '  state?: GameState,\n  branchMeta?: BranchMetaContext,\n): MonthScene {',
)
replace_once(
    "src/game/sceneBuilders.ts",
    '  const branch = collectBranchContributions(state);',
    '  const branch = collectBranchContributions(state, branchMeta);',
)

# src/game/runtime.ts
replace_once(
    "src/game/runtime.ts",
    'import type { GameDataYear, GameState, MonthScene } from "../types";',
    'import type { BranchMetaContext, GameDataYear, GameState, MonthScene } from "../types";',
)
replace_once(
    "src/game/runtime.ts",
    'function firstNodeId(year: string, monthIndex: number, state?: GameState): string {\n'
    '  return buildMonthScene(monthIndex, year, state).nodes[0]?.id ?? "";\n'
    '}',
    'function firstNodeId(\n'
    '  year: string,\n'
    '  monthIndex: number,\n'
    '  state?: GameState,\n'
    '  branchMeta?: BranchMetaContext,\n'
    '): string {\n'
    '  return buildMonthScene(monthIndex, year, state, branchMeta).nodes[0]?.id ?? "";\n'
    '}',
)
replace_once(
    "src/game/runtime.ts",
    'export function sceneForMonth(state: GameState): MonthScene {\n'
    '  return buildMonthScene(state.monthIndex, state.year, state);\n'
    '}',
    'export function sceneForMonth(\n'
    '  state: GameState,\n'
    '  branchMeta?: BranchMetaContext,\n'
    '): MonthScene {\n'
    '  return buildMonthScene(state.monthIndex, state.year, state, branchMeta);\n'
    '}',
)
replace_once(
    "src/game/runtime.ts",
    'export function currentSceneNode(state: GameState): MonthScene["nodes"][number] {\n'
    '  const scene = sceneForMonth(state);',
    'export function currentSceneNode(\n'
    '  state: GameState,\n'
    '  branchMeta?: BranchMetaContext,\n'
    '): MonthScene["nodes"][number] {\n'
    '  const scene = sceneForMonth(state, branchMeta);',
)
replace_once(
    "src/game/runtime.ts",
    'export function canAdvanceScene(state: GameState): boolean {\n'
    '  const node = currentSceneNode(state);',
    'export function canAdvanceScene(\n'
    '  state: GameState,\n'
    '  branchMeta?: BranchMetaContext,\n'
    '): boolean {\n'
    '  const node = currentSceneNode(state, branchMeta);',
)
replace_once(
    "src/game/runtime.ts",
    'export function canRewindScene(state: GameState): boolean {\n'
    '  return !state.locked && scenePosition(state) > 0;\n'
    '}',
    'export function canRewindScene(\n'
    '  state: GameState,\n'
    '  branchMeta?: BranchMetaContext,\n'
    '): boolean {\n'
    '  return !state.locked && scenePosition(state, sceneForMonth(state, branchMeta)) > 0;\n'
    '}',
)
replace_once(
    "src/game/runtime.ts",
    'export function rewindScene(state: GameState): GameState {\n'
    '  if (!canRewindScene(state)) return state;\n'
    '  const scene = sceneForMonth(state);',
    'export function rewindScene(\n'
    '  state: GameState,\n'
    '  branchMeta?: BranchMetaContext,\n'
    '): GameState {\n'
    '  if (!canRewindScene(state, branchMeta)) return state;\n'
    '  const scene = sceneForMonth(state, branchMeta);',
)
replace_once(
    "src/game/runtime.ts",
    'export function advanceScene(state: GameState, _data: GameDataYear): GameState {\n'
    '  void _data;\n'
    '  const scene = sceneForMonth(state);',
    'export function advanceScene(\n'
    '  state: GameState,\n'
    '  _data: GameDataYear,\n'
    '  branchMeta?: BranchMetaContext,\n'
    '): GameState {\n'
    '  void _data;\n'
    '  const scene = sceneForMonth(state, branchMeta);',
)
replace_once(
    "src/game/runtime.ts",
    '  return nextMonth(state);',
    '  return nextMonth(state, branchMeta);',
)
replace_once(
    "src/game/runtime.ts",
    'export function nextMonth(state: GameState): GameState {',
    'export function nextMonth(\n'
    '  state: GameState,\n'
    '  branchMeta?: BranchMetaContext,\n'
    '): GameState {',
)
replace_once(
    "src/game/runtime.ts",
    '  return { ...next, sceneNodeId: firstNodeId(state.year, monthIndex, next) };',
    '  return {\n'
    '    ...next,\n'
    '    sceneNodeId: firstNodeId(state.year, monthIndex, next, branchMeta),\n'
    '  };',
)

# src/game/engine.ts
replace_once(
    "src/game/engine.ts",
    '  CharacterId,\n  DecisionCategory,',
    '  BranchMetaContext,\n  CharacterId,\n  DecisionCategory,',
)
replace_once(
    "src/game/engine.ts",
    '  decision: ResearchDecision,\n): GameState {',
    '  decision: ResearchDecision,\n  branchMeta?: BranchMetaContext,\n): GameState {',
)
replace_once(
    "src/game/engine.ts",
    '  Object.assign(flags, branchFlagsForMonth(state, BRANCHES));',
    '  Object.assign(flags, branchFlagsForMonth(state, BRANCHES, branchMeta));',
)

# src/game/branches.ts
replace_once(
    "src/game/branches.ts",
    'import { d } from "./decisionFactory";',
    'import { d } from "./decisionFactory";\n'
    'import { REBIRTH_BRANCHES } from "./rebirthBranches";',
)
replace_once(
    "src/game/branches.ts",
    '  PEER_RESOLVE_FENCE,\n];',
    '  PEER_RESOLVE_FENCE,\n  ...REBIRTH_BRANCHES,\n];',
)

# src/app/useGameController.ts imports
replace_once(
    "src/app/useGameController.ts",
    '  completeRebirthCycle,\n',
    '  branchMetaContext,\n  completeRebirthCycle,\n',
)
replace_once(
    "src/app/useGameController.ts",
    '} from "../game/rebirth";\n',
    '} from "../game/rebirth";\n'
    'import { isSceneNodeRead, markSceneNodeRead } from "../game/rebirthFlow";\n'
    'import { inspectOfficeProp, type OfficePropId } from "../game/rebirthOffice";\n',
)
replace_once(
    "src/app/useGameController.ts",
    '  const data = GAME_DATA[state.year];\n'
    '  const scene = sceneForMonth(state);\n'
    '  const sceneNode = currentSceneNode(state);\n'
    '  const story = storyForMonth(state.monthIndex, state.year);\n'
    '  const sceneCanAdvance = canAdvanceScene(state);\n'
    '  const canGoBack = canRewindScene(state);',
    '  const data = GAME_DATA[state.year];\n'
    '  const branchMeta = branchMetaContext(rebirth);\n'
    '  const scene = sceneForMonth(state, branchMeta);\n'
    '  const sceneNode = currentSceneNode(state, branchMeta);\n'
    '  const story = storyForMonth(state.monthIndex, state.year);\n'
    '  const sceneCanAdvance = canAdvanceScene(state, branchMeta);\n'
    '  const canGoBack = canRewindScene(state, branchMeta);\n'
    '  const canSkipRead = rebirth.cycle >= 2\n'
    '    && sceneNode.type === "dialogue"\n'
    '    && !state.locked\n'
    '    && isSceneNodeRead(rebirth, state, sceneNode.id);',
)
replace_once(
    "src/app/useGameController.ts",
    '  useEffect(() => {\n'
    '    persistRebirth(rebirth);\n'
    '  }, [rebirth]);',
    '  useEffect(() => {\n'
    '    persistRebirth(rebirth);\n'
    '  }, [rebirth]);\n\n'
    '  useEffect(() => {\n'
    '    if (sceneNode.type !== "dialogue") return;\n'
    '    setRebirth((current) => markSceneNodeRead(current, state, sceneNode.id));\n'
    '  }, [sceneNode.id, sceneNode.type, state.monthIndex, state.year]);',
)
replace_once(
    "src/app/useGameController.ts",
    '    setState((current) => advanceScene(current, data));',
    '    setState((current) => advanceScene(current, data, branchMetaContext(rebirth)));',
)
replace_once(
    "src/app/useGameController.ts",
    '    setState((current) => rewindScene(current));',
    '    setState((current) => rewindScene(current, branchMetaContext(rebirth)));',
)
replace_once(
    "src/app/useGameController.ts",
    '  }, [canGoBack, resetLineVoice]);\n\n'
    '  const selectFocusWithSound',
    '  }, [canGoBack, rebirth, resetLineVoice]);\n\n'
    '  const skipReadScene = useCallback(() => {\n'
    '    if (!canSkipRead) return;\n'
    '    resetLineVoice();\n'
    '    setState((current) => {\n'
    '      let next = current;\n'
    '      const meta = branchMetaContext(rebirth);\n'
    '      for (let guard = 0; guard < 40; guard += 1) {\n'
    '        const node = currentSceneNode(next, meta);\n'
    '        if (node.type !== "dialogue" || !isSceneNodeRead(rebirth, next, node.id)) break;\n'
    '        const advanced = advanceScene(next, data, meta);\n'
    '        if (advanced === next || advanced.monthIndex !== current.monthIndex) break;\n'
    '        next = advanced;\n'
    '      }\n'
    '      return next;\n'
    '    });\n'
    '  }, [canSkipRead, data, rebirth, resetLineVoice]);\n\n'
    '  const inspectOfficeWithSound = useCallback((propId: OfficePropId) => {\n'
    '    const result = inspectOfficeProp(rebirth, state, propId);\n'
    '    if (!result.changed) return;\n'
    '    playChoice();\n'
    '    setRebirth(result.meta);\n'
    '    setState(result.state);\n'
    '  }, [playChoice, rebirth, state]);\n\n'
    '  const selectFocusWithSound',
)
replace_once(
    "src/app/useGameController.ts",
    '      return makeDecision(current, data, prepared);',
    '      return makeDecision(current, data, prepared, branchMetaContext(rebirth));',
)
replace_once(
    "src/app/useGameController.ts",
    '    canGoBack,\n    changeYear,',
    '    canGoBack,\n    canSkipRead,\n    changeYear,',
)
replace_once(
    "src/app/useGameController.ts",
    '    investigateWithSound,\n    makeDecisionWithSound,',
    '    inspectOfficeWithSound,\n    investigateWithSound,\n    makeDecisionWithSound,',
)
replace_once(
    "src/app/useGameController.ts",
    '    sceneNode,\n    selectFocusWithSound,',
    '    sceneNode,\n    selectFocusWithSound,\n    skipReadScene,',
)

# src/components/EndingPanel.tsx truth route
replace_once(
    "src/components/EndingPanel.tsx",
    'function special2025Ending(state: GameState): SpecialEnding | null {\n'
    '  if (state.year !== "2025") return null;',
    'function special2025Ending(state: GameState): SpecialEnding | null {\n'
    '  if (state.year !== "2025") return null;\n'
    '  if (state.flags.rebirth_truth_route) {\n'
    '    return {\n'
    '      leadId: "zhou_mingzhao",\n'
    '      title: "真相结局·未来也要接受审计",\n'
    '      copy: "你承认未来记忆受到事后叙事污染，也展示了全年档案、失败样本和可持续边界。你没有证明自己永远正确。你证明了知道结果的人仍愿意让记忆接受证据、反例和复算。投研部把这套审计方法写进下一年的研究流程。",\n'
    '    };\n'
    '  }',
)

# src/main.tsx stylesheet
replace_once(
    "src/main.tsx",
    'import "./rebirth.css";',
    'import "./rebirth.css";\nimport "./rebirth-v2.css";',
)

print("rebirth v2 integration patch applied")
