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
    "src/app/useGameController.ts",
    '  readRebirthMeta,\n'
    '  resetRebirthRun,\n',
    '  readRebirthMeta,\n',
)
replace_once(
    "src/app/useGameController.ts",
    '  useEffect(() => {\n'
    '    setRebirth((current) => captureTimelineAnchor(\n'
    '      syncActiveTimelineBranch(current, state),\n'
    '      state,\n'
    '    ));\n'
    '  }, [state]);\n\n',
    '',
)
replace_once(
    "src/app/useGameController.ts",
    '  const changeYear = useCallback((year: string) => {\n'
    '    resetLineVoice();\n'
    '    setState(readStoredState(year) ?? createInitialState(year));\n'
    '    setRebirth(readStoredRebirth(year));\n'
    '  }, [resetLineVoice]);\n',
    '  const changeYear = useCallback((year: string) => {\n'
    '    resetLineVoice();\n'
    '    const nextSession = createSessionState(year);\n'
    '    setState(nextSession.state);\n'
    '    setRebirth(nextSession.rebirth);\n'
    '  }, [resetLineVoice]);\n',
)
replace_once(
    "src/app/useGameController.ts",
    '    nextMeta = syncActiveTimelineBranch(nextMeta, nextState);\n',
    '    nextMeta = captureTimelineAnchor(\n'
    '      syncActiveTimelineBranch(nextMeta, nextState),\n'
    '      nextState,\n'
    '    );\n',
)

replace_once(
    "src/components/RebirthTimelinePanel.tsx",
    'import { useEffect, useMemo, useState } from "react";\n',
    'import { useMemo, useState } from "react";\n',
)
replace_once(
    "src/components/RebirthTimelinePanel.tsx",
    '  useEffect(() => {\n'
    '    if (branches.some((branch) => branch.id === selectedBranchId)) return;\n'
    '    setSelectedBranchId(meta.timeline.activeBranchId ?? branches[0]?.id ?? "");\n'
    '    setSelectedAnchorId(null);\n'
    '  }, [branches, meta.timeline.activeBranchId, selectedBranchId]);\n\n'
    '  const selectedBranch = useMemo(\n'
    '    () => branches.find((branch) => branch.id === selectedBranchId) ?? null,\n'
    '    [branches, selectedBranchId],\n'
    '  );\n'
    '  const selectedEvents = meta.timeline.branches\n'
    '    .find((branch) => branch.id === selectedBranchId)?.events.slice(-8) ?? [];\n',
    '  const resolvedBranchId = branches.some((branch) => branch.id === selectedBranchId)\n'
    '    ? selectedBranchId\n'
    '    : defaultBranchId;\n'
    '  const selectedBranch = useMemo(\n'
    '    () => branches.find((branch) => branch.id === resolvedBranchId) ?? null,\n'
    '    [branches, resolvedBranchId],\n'
    '  );\n'
    '  const selectedEvents = meta.timeline.branches\n'
    '    .find((branch) => branch.id === resolvedBranchId)?.events.slice(-8) ?? [];\n',
)
replace_once(
    "src/components/RebirthTimelinePanel.tsx",
    '        selectedBranchId={selectedBranchId}\n',
    '        selectedBranchId={resolvedBranchId}\n',
)

replace_once(
    "src/game/rebirthTimelineState.ts",
    'function restoreSimulation(value: unknown): TimelineSimulation | null {\n',
    'function restoreProjection(value: unknown): TimelineProjection {\n'
    '  const projection = isObject(value) ? value : {};\n'
    '  return {\n'
    '    researchCredibility: typeof projection.researchCredibility === "number"\n'
    '      ? projection.researchCredibility\n'
    '      : 0,\n'
    '    committeeAdoption: typeof projection.committeeAdoption === "number"\n'
    '      ? projection.committeeAdoption\n'
    '      : 0,\n'
    '    teamTrust: typeof projection.teamTrust === "number" ? projection.teamTrust : 0,\n'
    '    fatigue: typeof projection.fatigue === "number" ? projection.fatigue : 0,\n'
    '    lifeBalance: typeof projection.lifeBalance === "number" ? projection.lifeBalance : 0,\n'
    '  };\n'
    '}\n\n'
    'function restoreSimulation(value: unknown): TimelineSimulation | null {\n',
)
replace_once(
    "src/game/rebirthTimelineState.ts",
    '  const projection = isObject(value.projection) ? value.projection : {};\n'
    '  return {\n',
    '  return {\n',
)
old_projection = '''    projection: {
      researchCredibility: typeof projection.researchCredibility === "number"
        ? projection.researchCredibility
        : 0,
      committeeAdoption: typeof projection.committeeAdoption === "number"
        ? projection.committeeAdoption
        : 0,
      teamTrust: typeof projection.teamTrust === "number" ? projection.teamTrust : 0,
      fatigue: typeof projection.fatigue === "number" ? projection.fatigue : 0,
      lifeBalance: typeof projection.lifeBalance === "number" ? projection.lifeBalance : 0,
    },
'''
replace_once(
    "src/game/rebirthTimelineState.ts",
    old_projection,
    '    projection: restoreProjection(value.projection),\n',
)

print("timeline lint fixes applied")
