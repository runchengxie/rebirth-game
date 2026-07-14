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
    "docs/ux.md",
    "因果回溯标签先显示时间线列表，再显示所选路线的十二个月图。",
    "因果回溯标签先显示父子分支树。主时间线是树干，从关键月建立的路线作为子节点展开。选择一条分支后，界面默认只显示关键月和当前月，也可以切换为全部十二个月。",
)
replace_once(
    "docs/ux.md",
    "研究室物件会根据本周目积累开放。已经整理的物件会保留发现内容，不允许重复领取状态变化。",
    "研究室物件会根据本周目积累开放。已经整理的物件会保留发现内容，不允许重复领取状态变化。\n\n档案抽屉不进入首屏 JavaScript。鼠标移入或键盘聚焦 `记录与档案` 时会预加载抽屉，真正打开后才下载档案代码。因果回溯面板和时间线样式继续单独按需加载。",
)

replace_once(
    "docs/rebirth-system.md",
    "玩家可以查看每条时间线的十二个月状态、关键月锚点、调查路径、行动日志、实际研究判断和月度结果。观看不会修改游戏状态。",
    "玩家先通过树状图查看主时间线和回溯分支。父子连接表示分支从哪条旧路线产生，节点会显示周目、完成月份、结局和分叉月份。选择一条路线后，可以查看十二个月状态、关键月锚点、调查路径、行动日志、实际研究判断和月度结果。观看不会修改游戏状态。",
)
replace_once(
    "docs/rebirth-system.md",
    "- `src/components/RebirthPanel.tsx`：调查、研究室和跨周目档案界面。\n- `src/components/RebirthTimelinePanel.tsx`：观看、分叉和推演界面。\n- `src/rebirth.css`、`src/rebirth-v2.css` 和 `src/timeline.css`：重生与回溯界面样式。",
    "- `src/components/InvestigationPanel.tsx`：首屏需要的关键月调查界面。\n- `src/components/ArchiveDrawer.tsx`：按需加载的记录、档案和研究室抽屉。\n- `src/components/RebirthPanel.tsx`：研究室和跨周目档案界面。\n- `src/components/RebirthTimelinePanel.tsx`：按需加载的树状时间线、观看、分叉和推演界面。\n- `src/rebirth.css` 与 `src/rebirth-v2.css`：首屏重生界面样式。`src/timeline.css` 随回溯面板异步加载。",
)

replace_once(
    "docs/gameplay.md",
    "因果回溯会在五个关键月保存月初锚点。首周目只能观看。完成年度结局后，玩家可以从已完成路线的锚点创建新分支，原路线和错误记录继续保留。暂停路线可以恢复，反事实推演不会修改当前存档。",
    "因果回溯会在五个关键月保存月初锚点，并用树状图展示主路线与子分支。首周目只能观看。完成年度结局后，玩家可以从已完成路线的锚点创建新分支，原路线和错误记录继续保留。暂停路线可以恢复，反事实推演不会修改当前存档。",
)

replace_once(
    "docs/architecture.md",
    "- `src/app/ImmersiveGameScreen.tsx`：单视口舞台、对白、观点卡、研究选择和档案抽屉\n- `src/immersive.css`：主流程布局和响应式约束",
    "- `src/app/ImmersiveGameScreen.tsx`：单视口舞台、对白、观点卡和研究选择，按需加载档案抽屉\n- `src/components/ArchiveDrawer.tsx`：记录、研究档案、研究室和异步回溯入口\n- `src/components/RebirthTimelinePanel.tsx`：树状时间线、关键月详情和反事实推演\n- `src/immersive.css`：主流程布局和响应式约束",
)
replace_once(
    "docs/architecture.md",
    "单周目 `GameState` 和跨周目 `RebirthMetaState` 分别持久化。重新开始会暂停当前路线并创建新路线。完成年度结局会封存当前路线并创建下一周目路线。",
    "单周目 `GameState` 和跨周目 `RebirthMetaState` 分别持久化。重新开始会暂停当前路线并创建新路线。完成年度结局会封存当前路线并创建下一周目路线。\n\n### 构建拆包\n\n`vite.config.ts` 把 React 运行库拆成稳定的 `react-vendor` 缓存块。档案抽屉通过动态导入加载，因果回溯面板在抽屉内再次动态导入。`src/timeline.css` 由回溯组件导入，因此不会进入首屏 CSS。\n\n`scripts/validate_bundle_size.mjs` 在生产构建后检查：单个 JavaScript chunk 不超过 500000 bytes、首屏入口不超过 150000 bytes、档案和回溯异步面板各不超过 25000 bytes、时间线异步样式不超过 20000 bytes。",
)

replace_once(
    "docs/maintenance.md",
    "- `npm run validate:frontend`\n- `npm run build`",
    "- `npm run validate:frontend`\n- `npm run validate:brand`\n- `npm run build`\n- `npm run validate:bundle`",
)
replace_once(
    "docs/maintenance.md",
    "### 联合检查",
    "`npm run validate:bundle` 读取 `dist/assets`，检查首屏入口、异步档案、回溯面板和时间线样式的体积预算。它必须在生产构建之后运行。\n\n### 联合检查",
)

replace_once(
    "AGENTS.md",
    "- `src/app/ImmersiveGameScreen.tsx`：主游戏的单视口页面和档案抽屉",
    "- `src/app/ImmersiveGameScreen.tsx`：主游戏的单视口页面，档案抽屉通过动态导入加载\n- `src/components/ArchiveDrawer.tsx`：按需加载的档案和研究室入口\n- `src/components/RebirthTimelinePanel.tsx`：按需加载的树状因果回溯界面",
)
replace_once(
    "AGENTS.md",
    "npm run build",
    "npm run build\nnpm run validate:bundle",
)

print("performance documentation updated")
