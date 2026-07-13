#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    if old not in text:
        raise RuntimeError(f"{path} 缺少待替换片段：{old[:100]!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "src/app/useGameController.ts",
    'import { isSceneNodeRead, markSceneNodeRead } from "../game/rebirthFlow";',
    'import {\n'
    '  isSceneNodeRead,\n'
    '  markSceneNodeRead,\n'
    '  skipReadSceneNodes,\n'
    '} from "../game/rebirthFlow";',
)
replace_once(
    "src/app/useGameController.ts",
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
    '    });',
    '    setState((current) => skipReadSceneNodes(\n'
    '      rebirth,\n'
    '      current,\n'
    '      data,\n'
    '      branchMetaContext(rebirth),\n'
    '    ));',
)

print("read skip helper patch applied")
