# 架构说明（ARCHITECTURE）

本文档讲清 rebirth-research（心动 K 线：重生投研部）的工程结构、双数据管线、模块依赖图，以及原型代码（spike）如何与正式路由隔离。读完应能在不翻源码的情况下判断「该改哪个文件、动了会不会牵一发动全身」。

## 1. 一句话定位

一个 **Vite + TypeScript + React + PixiJS** 的静态网页游戏，纯前端、无后端。投研部的每月选择由一套纯函数引擎按真实 A 股月度数据结算，剧情、角色、分支都从这层引擎驱动。发布产物是 `dist/`，部署到 GitHub Pages。

## 2. 目录总览

```
rebirth-research/
├─ src/                      # 前端源码（TypeScript + React + Pixi）
│  ├─ main.tsx               # 入口
│  ├─ App.tsx                # 路由与页面装配（含 ?pixivn=1 原型门控）
│  ├─ components/            # React 组件（对话框、月度选择、结局、复盘等）
│  ├─ audio/                 # 浏览器音频接口生成的 BGM / 音效
│  ├─ data/                  # gameData.ts（运行时初始数据 + 基准）
│  ├─ spike/                # 原型代码（见 §6，默认不挂载）
│  ├─ types.ts              # 全局类型唯一来源（CharacterId 等）
│  └─ game/                  # 游戏引擎层
│     ├─ engine.ts           # 结算引擎（纯函数）
│     ├─ runtime.ts          # 初始状态与存档/回放
│     ├─ branching.ts        # 分支激活条件求值
│     ├─ decisionFactory.ts  # 决策节点工厂（d）
│     ├─ characters.ts       # 角色纯数据层（拆分后）
│     ├─ storyArcs.ts        # 故事线 + 年份轮换文案（拆分后）
│     ├─ branches.ts         # 分支定义 + 单/多节点（拆分后）
│     ├─ sceneBuilders.ts    # 月度场景 / 研究决策装配（拆分后）
│     ├─ content.ts          # 薄 barrel（拆分后，仅 re-export）
│     ├─ content2023.ts / content2024.ts / content2025.ts / contentDemo.ts
│     └─ content/            # TS 侧数据管线（见 §4）
│        ├─ 2023.json / 2024.json / 2025.json
│        ├─ schema.ts        # 年份 JSON 校验（运行时可失败抛出）
│        └─ content.test.ts  # 校验 + 数据自洽测试
├─ data/                     # Python 侧数据管线（见 §4）
│  ├─ 2023.json / 2024.json / 2025.json
│  ├─ game-data.js           # 同数据打包成 window.REBIRTH_GAME_DATA
│  └─ manifest.json
├─ scripts/                  # Python 工具链（见 §4、§7）
│  ├─ build_data.py          # 从本机清洗数据生成 data/*.json
│  ├─ validate_data.py       # 校验 data/ 与 game-data.js 自洽
│  ├─ check.py               # 统一检查运行器（lint→typecheck→test→validate→build）
│  └─ validate_frontend.js   # 前端发布产物静态检查
└─ docs/                     # 设计 / 架构文档
```

## 3. 模块依赖图（TS 引擎层）

箭头表示「依赖 / 导入」。纯数据层在底部，装配层在顶部，引擎居中。

```
                    types.ts  (全局类型，被所有人 import type)
                         ▲
                         │
   characters.ts ──► storyArcs.ts ──► branches.ts ──► sceneBuilders.ts
        │                │                │                │
        └────────────────┴────────────────┴────────────────┘
                          ▲
                          │  (content.ts 仅做 export * 转发，不引入新依赖)
                     content.ts (barrel)
                          ▲
        ┌─────────────────┼─────────────────┐
   engine.ts          runtime.ts          App.tsx / components
        │                │                     │
        └──────── branching.ts ────────────────┘
                     decisionFactory.ts

   content2023/2024/2025/demo.ts  ← 年份专属决策池，被 sceneBuilders 路由调用
   content/*.json + schema.ts      ← TS 侧数据管线，被 content.test 校验
```

要点：
- **`content.ts` 现在是薄 barrel**，不再承担逻辑。它只做 `export * from "./characters" | "./storyArcs" | "./branches" | "./sceneBuilders"`。拆分前它是一个 ~1395 行的「巨型模块」，扇入扇出高度集中；拆分后 8 个依赖方（App、各组件、engine、runtime 等）的 import 路径**完全不用改**——它们仍从 `game/content` 取 `CHARACTERS / AFFINITY_GATE / AFFINITY_TRUE / MENTOR_TEACHINGS / FOCUS_ACTIONS / buildMonthScene` 等，这些名字在四个子模块里都保留着。
- **`types.ts` 是类型唯一来源**，位于 `src/types.ts`（不在 `src/game/` 下）。引擎层各模块用 `import type { ... } from "../types"` 引用，彼此之间只有数据/装配依赖，没有循环依赖。
- **年份路由**：`sceneBuilders.makeResearchDecisions(year, month)` 按 `year` 参数（`demo`/`2023`/`2024`/`2025`）分流到对应 `content*.ts` 的 `makeDecisions*`。`buildMonthScene` 是中央场景装配器，`actualYear = year || "2025"`。

## 4. 双数据管线（关键）

项目里有**两套并行但独立**的数据管线。它们互相不消费，都由 CI 校验，但服务不同目的。

### 管线 A — Python 侧（`data/` + `scripts/`）
| 产物 | 作用 | 校验方 |
|------|------|--------|
| `data/2023.json` `2024.json` `2025.json` | 每月市场复盘指标（代理指数、行业轮动、风格因子） | `scripts/validate_data.py` |
| `data/game-data.js` | 上述 JSON 打包成 `window.REBIRTH_GAME_DATA` | 同上加交叉校验 |
| `data/manifest.json` | 数据集清单 | 同上加交叉校验 |

- 由 `scripts/build_data.py` 生成。**本机路径已改为可配置**：默认回退到作者本机 Z 盘路径，但可用环境变量 `REBIRTH_DAILY_CLEAN_DIR` / `REBIRTH_INSTRUMENTS_FILE` 覆盖，避免把本机路径写死进仓库。
- `scripts/validate_data.py` 断言 `data/*.json` 与 `game-data.js` 内容一致、且不含任何本机绝对路径（发布安全）。
- 这是**发布数据管线**，CI 用它对「真实行情数据」做一致性与脱敏校验。**它不接入运行时引擎**——引擎不读 `window.REBIRTH_GAME_DATA`。

### 管线 B — TS 侧（`src/game/content/`）
| 产物 | 作用 | 校验方 |
|------|------|--------|
| `src/game/content/2023.json` 等 | 年份剧情/市场上下文数据 | `src/game/content/schema.ts` |
| `schema.ts` | 年份 JSON 的结构校验（导入失败即抛 `ContentValidationError`） | `content.test.ts` 单测 |

- 这是**剧情/配置数据管线**，被前端 `import raw from "./2025.json"` 直接消费，并由 TS schema 在构建期/测试期校验。
- `content.test.ts` 同时校验「JSON 通过 schema」与「TS 年份决策池（`content2025.ts` 的 `THEMES_2025 / makeDecisions2025`）与 JSON 自洽」。

### 为什么是两套而不是一套
管线 A 处理**真实市场数据**（体积大、来自外部清洗库、需脱敏），管线 B 处理**剧情配置数据**（随代码演进、需 TS 类型安全）。让它们各自用最合适的工具（Python 批处理 + ruff/basedpyright；TS + schema）。两者在仓库里**并存且都进 git**——`data/game-data.js`+`manifest.json` 不是死产物，而是管线 A 的校验锚点。

## 5. 结算引擎（engine.ts）

纯函数，无副作用。输入 `GameState` + 玩家选择，输出新的 `GameState` 与 `businessOutcome`（业务事实结算，非 K 线收益——真实行情/股价不仲裁对错）。关键约定：
- `relations: Record<CharacterId, number>`，取值用 `?? 0` 守护，避免未初始化角色报错。
- `buildBusinessVerdict(theme, score)`——已裁剪掉无用的 `decision / story` 参数，仅留真正参与计算的 `theme` 与 `score`。

## 6. 原型门控（spike 不进生产路由）

`src/spike/pixivn/Chapter1Spike.tsx` 是 Phase 3 的原型代码（用 `@drincs/pixi-vn` 接管第一话的 VN runtime）。

- **默认不挂载**。仅在 URL 带 `?pixivn=1` 时，由 `App.tsx` 动态 `import()` 注入：
  ```ts
  () => new URLSearchParams(window.location.search).get("pixivn") === "1"
  ```
- 因此原型代码**不会**出现在生产默认路径里，也不会拖慢正常构建（Vite 把它拆成独立 chunk `Chapter1Spike-*.js`）。这是刻意隔离，避免「原型进生产路由」带来的团队不友好。

## 7. 校验与提交约定

### 本地一键检查（推荐每次提交前跑）
```bash
npm run check
```
`check` = `lint` (eslint .) → `typecheck` (tsc -b) → `test:run` (vitest run) → `validate:frontend` (node scripts/validate_frontend.js) → `build` (tsc -b && vite build)。

Python 侧单独跑：`uv run python scripts/check.py`（内含 `validate_data.py`）。

### 规范等级
- **TS**：ESLint 已从 `recommended` 升到 `strict`，并加 `complexity` warn（max 15）、`no-explicit-any` / `no-non-null-assertion` 降为 warn（团队习惯——strict 盯住真正的浮动 Promise / 不安全操作风险，而不是逼着改几十处机械的 `!`）。`tsconfig` 已开 `noUnusedLocals` / `noUnusedParameters`。
- **Python**：ruff + basedpyright，超 PEP8 / Google 标准。

### 提交约定
- 每个里程碑改动跑完整检查（lint / typecheck / test / build）后 `git add src docs scripts` 再 commit，**不 push**。
- `.workbuddy/` 已写进 `.gitignore`，绝不进仓库。
- 周目/年份选择器隐藏 demo，仅留 `?year=demo` 深链。

## 8. 常见改动落在哪

| 你想改的东西 | 文件 |
|------|------|
| 角色属性 / 好感门槛 / 专注动作 / 评级评语 | `src/game/characters.ts` |
| 年份主题 / 故事线 / 同事闲聊轮换文案 / 导师视角短句 | `src/game/storyArcs.ts` |
| 单/多节点分支、peer 冲突与和解线 | `src/game/branches.ts` |
| 月度场景装配、研究决策路由、导师教学、prologue | `src/game/sceneBuilders.ts` |
| 某一年份专属决策池 | `content2023/2024/2025/demo.ts` |
| 结算规则 | `src/game/engine.ts` |
| 初始状态 / 存档回放 | `src/game/runtime.ts` |
| 真实市场数据刷新 | `scripts/build_data.py` → `data/` → `validate_data.py` |
| 剧情配置数据 | `src/game/content/*.json` + `schema.ts` |
