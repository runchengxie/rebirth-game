#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_all(path: str, replacements: list[tuple[str, str]]) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    for old, new in replacements:
        if old not in text:
            raise RuntimeError(f"{path} 缺少待替换片段：{old!r}")
        text = text.replace(old, new)
    target.write_text(text, encoding="utf-8")


replace_all(
    "src/game/rebirth.test.ts",
    [
        (
            'import type { ResearchDecision, RoundResult } from "../types";',
            'import type { GameState, ResearchDecision, RoundResult } from "../types";',
        ),
        (
            '  readRebirthMeta,\n} from "./rebirth";',
            '  readRebirthMeta,\n  type RebirthMetaState,\n} from "./rebirth";',
        ),
        ('    let meta = {\n', '    let meta: RebirthMetaState = {\n'),
        ('      memoryKeys: ["causal_gap"] as const,', '      memoryKeys: ["causal_gap"],'),
        (
            '      memoryKeys: ["sample_pollution", "opportunity_cost"] as const,',
            '      memoryKeys: ["sample_pollution", "opportunity_cost"],',
        ),
        (
            '      shortcuts: ["zhao_factor_pipeline"] as const,',
            '      shortcuts: ["zhao_factor_pipeline"],',
        ),
        (
            '    const withShortcut = {\n',
            '    const withShortcut: RebirthMetaState = {\n',
        ),
        (
            '    let state = {\n      ...stateAtMonth(11),',
            '    let state: GameState = {\n      ...stateAtMonth(11),',
        ),
        (
            '      memoryKeys: ["causal_gap", "sample_pollution", "body_memory"] as const,',
            '      memoryKeys: ["causal_gap", "sample_pollution", "body_memory"],',
        ),
    ],
)

replace_all(
    "src/game/rebirthOffice.test.ts",
    [
        (
            'import { createRebirthMeta } from "./rebirth";',
            'import { createRebirthMeta, type RebirthMetaState } from "./rebirth";',
        ),
        (
            '    const meta = {\n      ...createRebirthMeta("2025"),\n      shortcuts: ["zhao_factor_pipeline"] as const,\n    };',
            '    const meta: RebirthMetaState = {\n      ...createRebirthMeta("2025"),\n      shortcuts: ["zhao_factor_pipeline"],\n    };',
        ),
    ],
)

print("rebirth v2 test types fixed")
