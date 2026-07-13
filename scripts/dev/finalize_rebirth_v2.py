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
    "docs/gameplay.md",
    '''4. 触发由此前承诺、失误、关系和职业状态决定的专属剧情。
5. 在 `深度研报`、`团队协作`、`生活优先` 三种日程中选择一项。
6. 从当月研究方案和条件分支追加方案中选择一项。
7. 查看月度评分、业务事实结算、角色反馈和新获得的知识卡。
8. 进入下一话，让此前的状态、关系和事件旗标继续影响剧情。
''',
    '''4. 触发由此前承诺、失误、关系、周目和记忆钥匙决定的专属剧情。
5. 在关键月份使用有限时间块调查证据、反例和状态。
6. 在 `深度研报`、`团队协作`、`生活优先` 三种日程中选择一项。
7. 从当月研究方案和条件分支追加方案中选择一项。
8. 查看月度评分、业务事实结算、角色反馈和新获得的知识卡。
9. 进入下一话，让此前的状态、关系、事件旗标和跨周目记录继续影响剧情。
''',
)
replace_once(
    "docs/gameplay.md",
    '''- 当前月份
- 已写入的事件旗标
- 此前评分和选择留下的结果
''',
    '''- 当前月份
- 当前周目
- 已获得的记忆钥匙
- 已写入的事件旗标
- 此前评分和选择留下的结果
''',
)
replace_once(
    "docs/gameplay.md",
    '''持续满足条件的路线可以保留新增研究方案。负责首次解锁路线的对白只显示一次，避免后续月份反复出现同一句话。

## 角色路线
''',
    '''持续满足条件的路线可以保留新增研究方案。负责首次解锁路线的对白只显示一次，避免后续月份反复出现同一句话。

## 重生调查与研究室

2025 年的一月、四月、七月、九月和十二月拥有调查章节。玩家使用有限时间块选择调查路径，已验证线索会按照研究方法进入评分。第二周目可以使用记忆钥匙和研究捷径打开新的节点与专属研究方案。

记录抽屉提供年度流程和研究室。年度流程显示月份状态、关键谜题、调查进度和月度结果。研究室允许整理便签、白板、咖啡杯、档案柜和捷径板。物件整理会写入稳定旗标，并可能触发后续回调、调查前置条件或系统异常。

对白在实际推进后写入已读记录。第二周目可以连续跳过已经读过的对白，跳过会停在新对白、研究选择或月份边界。

完整规则见 [`rebirth-system.md`](rebirth-system.md)。

## 角色路线
''',
)
replace_once(
    "docs/gameplay.md",
    '''底部操作栏提供 `上一句`、`记录与档案` 和唯一的剧情推进按钮。结算前可以返回当前话的上一段对白，结算后通过记录抽屉回看，避免撤销已经写入的数值和旗标。
''',
    '''底部操作栏提供 `上一句`、`跳过已读`、`记录与档案` 和唯一的剧情推进按钮。结算前可以返回当前话的上一段对白。第二周目可以跳过已经读过的连续对白。结算后通过记录抽屉回看，避免撤销已经写入的数值和旗标。
''',
)

replace_once(
    "docs/architecture.md",
    '''每次状态变化都会写回当前年份。切换年份时优先恢复该年份存档，重新开始则创建当前年份的新状态并覆盖旧存档。

### 结算引擎
''',
    '''每次状态变化都会写回当前年份。切换年份时优先恢复该年份存档，重新开始则创建当前年份的新状态并覆盖旧存档。

### 跨周目状态

`src/game/rebirth.ts` 以 `rebirthMeta:v2:<year>` 为键保存周目编号、记忆钥匙、研究捷径、调查进度、已读节点、系统异常和研究室发现。读取时兼容 `rebirthMeta:v1:<year>`，旧的一月单调查会迁移到按月份保存的调查记录。

关键月份调查数据位于 `rebirthInvestigationData.ts`，调查解锁方案位于 `rebirthSpecialDecisions.ts`，线索评分规则位于 `rebirthDecisionBonus.ts`。年度流程和已读跳过由 `rebirthFlow.ts` 负责，研究室物件由 `rebirthOffice.ts` 负责。

单周目 `GameState` 和跨周目 `RebirthMetaState` 分别持久化。重新开始会重置本轮调查和剧情状态，保留钥匙、捷径、已读记录、异常和研究室发现。

### 结算引擎
''',
)
replace_once(
    "docs/architecture.md",
    '''条件可以读取指标上下限、角色关系、决策类别累计次数、月份、旗标，以及与、或、非组合条件。命中的分支可以插入对白、追加研究方案、改写提示语并记录路线旗标。
''',
    '''条件可以读取指标上下限、角色关系、决策类别累计次数、月份、周目、记忆钥匙、旗标，以及与、或、非组合条件。命中的分支可以插入对白、追加研究方案、改写提示语并记录路线旗标。
''',
)

replace_once(
    "scripts/validate_frontend.js",
    '''  "src/game/narrativeSemantics.test.ts",
  "src/game/runtime.ts",
''',
    '''  "src/game/narrativeSemantics.test.ts",
  "src/game/rebirth.ts",
  "src/game/rebirth.test.ts",
  "src/game/rebirthBranches.ts",
  "src/game/rebirthBranching.test.ts",
  "src/game/rebirthDecisionBonus.ts",
  "src/game/rebirthFlow.ts",
  "src/game/rebirthFlow.test.ts",
  "src/game/rebirthInvestigationData.ts",
  "src/game/rebirthOffice.ts",
  "src/game/rebirthOffice.test.ts",
  "src/game/rebirthSpecialDecisions.ts",
  "src/game/runtime.ts",
''',
)
replace_once(
    "scripts/validate_frontend.js",
    '''  "src/styles.css",
  "src/immersive.css",
''',
    '''  "src/styles.css",
  "src/immersive.css",
  "src/rebirth.css",
  "src/rebirth-v2.css",
''',
)
replace_once(
    "scripts/validate_frontend.js",
    '''  "DebatePanel",
  "PixiStage",
  "canGoBack",
  "记录与档案",
''',
    '''  "DebatePanel",
  "PixiStage",
  "RebirthFlowPanel",
  "OfficeHubPanel",
  "canGoBack",
  "跳过已读",
  "记录与档案",
''',
)
replace_once(
    "scripts/validate_frontend.js",
    '''  "persistStoredState",
  "rewindScene",
''',
    '''  "persistStoredState",
  "readRebirthMeta",
  "skipReadSceneNodes",
  "inspectOfficeProp",
  "rewindScene",
''',
)

print("rebirth v2 docs and validation finalized")
