# 心动 K 线：重生投研部

一个 Vite + TypeScript + React + PixiJS 的中文剧情网页游戏。主角重生回到过去，成为投研部的一名研究员。游戏以 slice of life 的方式展开研究员的日常：撰写研报、参加晨会、和同事争论市场方向，也在深夜咖啡馆里聊起各自的生活。每个月的选择会影响研究产出、个人状态和同事关系，系统按真实 A 股月度涨跌幅结算结果。金融知识通过人物对话、事件冲突和复盘自然出现。

在线试玩：<https://runchengxie.github.io/rebirth-research/>

## 功能

- 支持 2023、2024、2025 三个年份。
- 支持浅色模式和暗色模式，主题选择保存在浏览器本地。
- 使用 PixiJS 绘制剧情舞台、场景背景和角色立绘，React 渲染章节标题、角色对话框、月度选择和存档回放。
- 主线以投研部日常展开，金融知识通过人物对话、事件冲突和结算复盘自然出现。
- 女主只依据公开信息和当下数据判断。男主知道一部分历史走向，但只能把这些记忆整理成能说出口的研究假设。
- 第一话内置逐句推进的剧情脚本，围绕 2025 年 1 月 DeepSeek-R1 和 AI 叙事变化展开。
- 每月可选择 `熬夜研报`、`茶歇复盘`、`仓位纪律` 或 `团队协作`、`生活优先` 等日程，改变研究可信度、疲劳、生活和团队信任。
- 背景音乐和轻音效由浏览器音频接口生成，当前版本不依赖外部版权音频。后续可替换为授权循环音频和离线关键句语音。
- 每月选择后显示当月真实涨跌幅、参考路线和角色反馈。
- 选择结果会影响闪耀度、疲劳值和角色好感，年度结束后给出最高好感路线结局。
- 展示资金曲线和月度流水。
- 可生成离线分享包，解压后直接打开 `index.html` 即可游玩。

## 数据生成

`scripts/build_data.py` 从本地 market-data-platform 的 A 股清洗数据中提取每月的市场复盘指标，生成 JSON 供前端使用：

- 沪深 300 代理指数（成交额前 300 只等权平均）
- 中证 500 代理指数（成交额 301-800 只等权平均）
- 行业轮动（月度成交额加权行业收益，取前 5 和后 5）
- 风格因子近似（规模溢价、动量溢价）

数据来源：

- `a_share_daily_clean`：日线清洗数据
- `a_share_instruments`：股票基础信息

具体本机路径在脚本默认参数里，也可通过命令行覆盖。发布后的 JSON 只保留数据集名称和生成规则，不包含本机文件路径。

```bash
uv run python scripts/build_data.py
```

默认生成 2023、2024、2025 三个年份：

- `data/market-review-2023.json`
- `data/market-review-2024.json`
- `data/market-review-2025.json`
- `data/market-review-manifest.json`

常用参数：

```bash
uv run python scripts/build_data.py \
  --years 2023 2024 2025 \
  --daily-clean-dir /path/to/a_share_daily_clean \
  --instruments /path/to/a_share_instruments_latest.parquet \
  --out-dir data \
  --price-column adj_close \
  --seed 20240706
```

## 项目结构

```text
rebirth-research/
├── assets/
│   ├── galgame-key-art.png
│   └── vn/
│       ├── backgrounds/
│       │   ├── briefing-room.png
│       │   ├── night-cafe.png
│       │   └── research-room.png
│       └── characters/
│           ├── mei-neutral.png
│           ├── mei-serious.png
│           ├── mei-soft.png
│           ├── misaki-excited.png
│           ├── misaki-focused.png
│           ├── misaki-neutral.png
│           ├── rina-smile.png
│           ├── rina-soft.png
│           └── rina-thinking.png
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── types.ts
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── PixiStage.tsx
│   │   ├── DecisionCard.tsx
│   │   ├── HistoryPanel.tsx
│   │   ├── EndingPanel.tsx
│   │   ├── PortfolioChart.tsx
│   │   ├── StatusBar.tsx
│   │   └── FocusSelector.tsx
│   ├── audio/
│   │   ├── bgm.ts
│   │   └── sfx.ts
│   ├── data/
│   │   └── gameData.ts
│   └── game/
│       ├── content.ts
│       ├── engine.ts
│       └── engine.test.ts
├── data/
│   ├── 2023.json
│   ├── 2024.json
│   ├── 2025.json
│   ├── game-data.js
│   └── manifest.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── eslint.config.mjs
├── package.json
├── package-lock.json
├── scripts/
│   ├── build_data.py
│   ├── check.py
│   ├── test_build_data.py
│   ├── validate_data.py
│   ├── validate_frontend.js
│   └── package.ps1
├── docs/
│   └── maintenance.md
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── pages.yml
├── AGENTS.md
├── pyproject.toml
└── uv.lock
```

源码需要 Node 构建。运行 `npm run build` 后会生成纯静态 `dist/`，GitHub Pages 发布的就是这个目录。

## 本地开发

```bash
npm ci
npm run dev
```

生产构建：

```bash
npm run build
```

Python 工具链通过 `uv` 管理（`pyproject.toml` 的 `[dependency-groups] dev`），首次使用运行：

```bash
uv sync --only-dev
```

## 生成离线分享包

```powershell
.\scripts\package.ps1
```

生成结果：

```text
dist/rebirth-research-share.zip
```

`package.ps1` 会先运行 `npm run build`，再把 `dist/` 构建产物打包。新增年份后，重新生成数据再运行打包脚本即可。

压缩包包含构建后的网页资源，游玩入口是根目录的 `index.html`。

## 本地验证

```bash
uv run ruff check .
uv run ruff format --check .
uv run python -m compileall scripts
uv run basedpyright scripts
uv run ty check scripts
uv run pytest scripts/ -v
uv run python scripts/validate_data.py
node scripts/validate_frontend.js
npm run lint
npm run typecheck
npm run test:run
npm run build
```

也可以一键运行：

```bash
uv run python scripts/check.py          # 阻塞检查
uv run python scripts/check.py --all     # 含非阻塞类型检查
```

## 音频策略

当前背景音乐和轻音效由浏览器音频接口生成，仓库不提交第三方音频文件，避免授权风险。角色对白默认不播放电子拟声，点击推进、月度选择和结算时会播放轻量提示音。后续如果替换为音频素材，只接受自制、CC0、公有领域或明确允许商用分发的循环音频和关键句语音文件，并在 README 中记录来源和授权。

GitHub Actions 会在推送代码和创建拉取请求时运行同一组检查。

更多维护说明见 `docs/maintenance.md`。

## 注意

这个项目只用于游戏和复盘，不构成投资建议。
