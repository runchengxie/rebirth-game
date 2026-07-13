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


# 已读节点在用户推进时写入，避免二周目新增对白刚渲染就被当成已读。
replace_once(
    "src/app/useGameController.ts",
    '  useEffect(() => {\n'
    '    if (sceneNode.type !== "dialogue") return;\n'
    '    setRebirth((current) => markSceneNodeRead(current, state, sceneNode.id));\n'
    '  }, [sceneNode.id, sceneNode.type, state.monthIndex, state.year]);\n\n',
    '',
)
replace_once(
    "src/app/useGameController.ts",
    '    playAdvance();\n'
    '    const isCycleEnd = state.finished && state.sceneNodeIndex >= scene.nodes.length - 1;',
    '    playAdvance();\n'
    '    if (sceneNode.type === "dialogue") {\n'
    '      setRebirth((current) => markSceneNodeRead(current, state, sceneNode.id));\n'
    '    }\n'
    '    const isCycleEnd = state.finished && state.sceneNodeIndex >= scene.nodes.length - 1;',
)
replace_once(
    "src/app/useGameController.ts",
    '  }, [data, playAdvance, rebirth, resetLineVoice, scene.nodes.length, sceneCanAdvance, state]);',
    '  }, [\n'
    '    data,\n'
    '    playAdvance,\n'
    '    rebirth,\n'
    '    resetLineVoice,\n'
    '    scene.nodes.length,\n'
    '    sceneCanAdvance,\n'
    '    sceneNode,\n'
    '    state,\n'
    '  ]);',
)

# 主界面接入流程图、研究室和已读跳过。
replace_once(
    "src/app/ImmersiveGameScreen.tsx",
    'import { InvestigationPanel, RebirthArchiveSection } from "../components/RebirthPanel";',
    'import {\n'
    '  InvestigationPanel,\n'
    '  OfficeHubPanel,\n'
    '  RebirthArchiveSection,\n'
    '  RebirthFlowPanel,\n'
    '} from "../components/RebirthPanel";',
)
replace_once(
    "src/app/ImmersiveGameScreen.tsx",
    '  const [tab, setTab] = useState<"log" | "archive">("log");',
    '  const [tab, setTab] = useState<"log" | "archive" | "flow" | "office">("log");',
)
replace_once(
    "src/app/ImmersiveGameScreen.tsx",
    '          <button aria-controls="archive-tabpanel" aria-selected={tab === "log"} className={tab === "log" ? "active" : ""} role="tab" type="button" onClick={() => setTab("log")}>本话记录</button>\n'
    '          <button aria-controls="archive-tabpanel" aria-selected={tab === "archive"} className={tab === "archive" ? "active" : ""} role="tab" type="button" onClick={() => setTab("archive")}>研究档案</button>',
    '          <button aria-controls="archive-tabpanel" aria-selected={tab === "log"} className={tab === "log" ? "active" : ""} role="tab" type="button" onClick={() => setTab("log")}>本话记录</button>\n'
    '          <button aria-controls="archive-tabpanel" aria-selected={tab === "archive"} className={tab === "archive" ? "active" : ""} role="tab" type="button" onClick={() => setTab("archive")}>研究档案</button>\n'
    '          <button aria-controls="archive-tabpanel" aria-selected={tab === "flow"} className={tab === "flow" ? "active" : ""} role="tab" type="button" onClick={() => setTab("flow")}>年度流程</button>\n'
    '          <button aria-controls="archive-tabpanel" aria-selected={tab === "office"} className={tab === "office" ? "active" : ""} role="tab" type="button" onClick={() => setTab("office")}>研究室</button>',
)
replace_once(
    "src/app/ImmersiveGameScreen.tsx",
    '          {tab === "log" ? <DialogueHistory session={session} /> : <ResearchArchive session={session} />}',
    '          {tab === "log" ? <DialogueHistory session={session} /> : null}\n'
    '          {tab === "archive" ? <ResearchArchive session={session} /> : null}\n'
    '          {tab === "flow" ? (\n'
    '            <RebirthFlowPanel meta={session.rebirth} state={session.state} />\n'
    '          ) : null}\n'
    '          {tab === "office" ? (\n'
    '            <OfficeHubPanel\n'
    '              meta={session.rebirth}\n'
    '              state={session.state}\n'
    '              onInspect={session.inspectOfficeWithSound}\n'
    '            />\n'
    '          ) : null}',
)
replace_once(
    "src/app/ImmersiveGameScreen.tsx",
    '            <button className="secondary-action" type="button" onClick={() => setArchiveOpen(true)}>\n'
    '              记录与档案\n'
    '            </button>',
    '            <button\n'
    '              className="secondary-action"\n'
    '              disabled={!session.canSkipRead}\n'
    '              type="button"\n'
    '              onClick={session.skipReadScene}\n'
    '            >\n'
    '              跳过已读\n'
    '            </button>\n'
    '            <button className="secondary-action" type="button" onClick={() => setArchiveOpen(true)}>\n'
    '              记录与档案\n'
    '            </button>',
)

print("rebirth v2 UI patch applied")
