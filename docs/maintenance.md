# 维护说明

## 环境准备

前端建议使用 Node.js 22，与 GitHub Pages 工作流保持一致。Python 工具要求 Python 3.11 或更高版本。

```bash
npm ci
uv sync --only-dev
```

启动开发服务器：

```bash
npm run dev
```

生产构建和本地预览：

```bash
npm run build
npm run preview
```

## 日常开发流程

1. 先确认改动属于界面、运行时、结算引擎、剧情内容、独立模式还是数据工具。
2. 修改源码或数据后，补充对应测试。
3. 运行前端静态检查和需要的浏览器回归。
4. 运行 Python 检查。
5. 核对 README、`AGENTS.md` 和相关设计文档是否仍然准确。
6. 需要离线分享包时运行 `scripts/package.ps1`。
7. 推送后确认拉取请求检查和 GitHub Pages 发布状态。

## 剧情内容维护

正式年份内容位于：

- `src/game/content/2023.json`
- `src/game/content/2024.json`
- `src/game/content/2025.json`

每份文件包含 12 个月度主题和 12 组研究方案。加载器会调用 `src/game/content/schema.ts` 校验内容。修改后至少运行：

```bash
npm run test:run
npm run typecheck
npm run build
```

`npm run dump:2023` 和 `npm run dump:2024` 会通过 Vite 加载现有内容，再重写对应 JSON。它们适合做格式整理和一致性核对。运行前先提交或备份未保存的内容，运行后检查差异。

`npm run dump:content` 会依次处理 2023 和 2024。

2025 年的 `knownEvent`、`businessOutcome` 和 `competingHypotheses` 目前在 `src/game/content2025.ts` 中补充。修改 2025 年主题时，需要同时检查该文件中的月份顺序。

## 社区内容包维护

社区内容包契约位于 `src/game/communityContent.ts`。当前限制包括：

- 单个 JSON 最多 256 KiB。
- 每个内容包最多 20 个案例。
- 每个案例允许 2 至 8 个研究方案。
- 案例 ID 和同一案例中的方案 ID 必须唯一。
- 文本字段有长度上限。
- `updatedAt` 必须是有效日期时间。

修改格式、限制或转换逻辑后，需要同步更新 `src/game/communityContent.test.ts`、内容工坊和 `docs/platform-modes.md`。版本迁移规则尚未加入，修改 `COMMUNITY_PACK_VERSION` 前必须提供旧格式迁移路径。

## 角色与分支维护

角色资料位于 `src/game/characters.ts`，角色语言规范见 `docs/characters.md`。

条件分支位于 `src/game/branches.ts`，条件判断位于 `src/game/branching.ts`。新增分支时需要检查：

- 分支条件是否会重复触发
- `once` 分支是否有稳定编号
- 决策写入的旗标是否有后续读取方
- 角色关系是否只累计一次
- 导师路线与赵承宇搭档路线是否保持分离
- 静态场景构建时是否仍能在没有状态参数的情况下运行

相关测试主要位于 `src/game/engine.test.ts`。

## 数据维护

### 运行时数据

`src/data/gameData.ts` 根据剧情内容生成运行时场景和市场快照。当前市场快照只提供叙事背景，真实涨跌幅没有接入结算。

正式年份列表由 `GAME_YEARS` 控制。`demo` 保留在 `GAME_DATA` 中，只供 `?year=demo` 深链访问。修改年份时同步更新 `src/data/gameData.test.ts`。

### 独立静态股票数据

`data/2023.json`、`data/2024.json`、`data/2025.json`、`data/game-data.js` 和 `data/manifest.json` 是一套独立静态数据。它们当前不被 React 运行时消费。

校验命令：

```bash
uv run python scripts/validate_data.py
```

校验内容包括：

- `manifest.json` 中的年份和文件清单
- 每年 12 个月是否完整并按顺序排列
- 每月是否有四个不重复选项
- 最佳选项与 `isBest` 标记是否一致
- 理论资金曲线是否可以从月度最佳收益重新计算
- `data/game-data.js` 是否与年份 JSON 完全一致
- 公开字段是否包含本机绝对路径

### 市场复盘生成器

`scripts/build_data.py` 从本地清洗行情生成 `market-review-YYYY.json` 和 `market-review-manifest.json`。输出字段为 `benchmarks`，与 `data/YYYY.json` 的 `months` 格式不同。

推荐使用单独目录：

```bash
uv run python scripts/build_data.py \
  --years 2023 2024 2025 \
  --daily-clean-dir /path/to/a_share_daily_clean \
  --instruments /path/to/a_share_instruments_latest.parquet \
  --out-dir generated/market-review \
  --price-column adj_close
```

也可以设置：

```bash
export REBIRTH_DAILY_CLEAN_DIR=/path/to/a_share_daily_clean
export REBIRTH_INSTRUMENTS_FILE=/path/to/a_share_instruments_latest.parquet
```

生成器当前不会把结果接入前端，也不会由 `scripts/validate_data.py` 校验。更新算法或输出格式时，应同步更新 `scripts/test_build_data.py` 和说明文档。

## 测试与检查

### 前端静态检查

```bash
npm run check
```

该命令包含：

- `npm run lint:ci`
- `npm run typecheck`
- `npm run test:run`
- `npm run validate:frontend`
- `npm run validate:stability`
- `npm run validate:brand`
- `npm run build`
- `npm run validate:bundle`

`npm run validate:bundle` 读取 `dist/assets`，检查首屏入口、异步档案、回溯面板和时间线样式的体积预算。它必须在生产构建之后运行。

`npm run validate:stability` 检查错误边界、跳过导航、档案焦点规则、社区内容限制、浏览器测试文件和 CI 发布门槛是否仍然存在。

### 浏览器回归

首次运行需要临时安装固定版本的 Playwright、axe 和 Chromium：

```bash
npm run e2e:prepare
```

随后运行：

```bash
npm run test:e2e
```

浏览器测试位于 `scripts/e2e/`，配置位于 `scripts/playwright.config.js`。测试运行器会启动 Vite 开发服务器，并检查：

- 年度剧情跳过导航和档案焦点恢复
- 投委会完整答辩和历史保存
- 每日挑战首次记录和练习模式
- 内容工坊与投委会案例库联动
- 模式加载失败恢复界面
- 四种模式的严重和致命 axe 问题

自动 axe 检查不包含配色对比度。人工审计范围见 `docs/stability-and-accessibility.md`。

### 联合检查

```bash
uv run python scripts/check.py
```

默认执行全部阻塞检查，其中包含 Ruff、格式化、编译、ty、Pytest、静态数据校验和前端静态完整检查。可用参数：

```bash
uv run python scripts/check.py --python
uv run python scripts/check.py --frontend
```

`--all` 作为兼容参数保留，完整检查现已默认执行。浏览器二进制不会由 Python 联合检查自动安装或运行，需要单独执行 `npm run test:e2e`。

### 测试分工

- `scripts/test_build_data.py`：市场复盘生成器的辅助函数、参数、输出结构和文件写入
- `scripts/test_validate_data.py`：静态股票数据的结构、资金计算、路径检查和 JavaScript 数据包
- `scripts/test_docs_style.py`：说明文档的中文标点和常见表达约定
- `src/game/content/content.test.ts`：三个正式年份的内容校验和加载器
- `src/game/communityContent.test.ts`：社区内容包资源、格式和唯一性边界
- `src/game/runtime.test.ts`：状态初始化、节点推进和跨月流程
- `src/game/engine.test.ts`：评分、关系、旗标、条件分支、延迟后果和结局
- `src/data/gameData.test.ts`：正式年份和隐藏示范线路
- `scripts/e2e/platform.spec.js`：关键浏览器旅程、焦点恢复、错误边界和自动无障碍检查
- `scripts/validate_frontend.js`：入口、依赖、主要模块、资源和数据文件的静态检查
- `scripts/validate_stability.js`：稳定性文件和自动化契约检查

Vitest 通过 `vitest.config.ts` 排除 `scripts/e2e/`，避免与 Playwright 重复收集测试。

## 自动化与发布

`.github/workflows/pages.yml` 在拉取请求和 `main` 更新时运行。

静态质量任务执行：

1. 安装 Node.js 22 和锁定依赖。
2. 运行 lint、类型检查和 Vitest。
3. 运行前端、稳定性和品牌契约校验。
4. 运行生产构建和包体预算。

静态质量通过后，浏览器任务执行：

1. 临时安装固定版本的 Playwright 和 axe。
2. 安装 Chromium 及系统依赖。
3. 运行浏览器旅程与自动无障碍检查。
4. 失败时上传截图、视频、trace 和 HTML 报告，保留七天。

`main` 只有在静态质量和浏览器任务同时通过后才发布 GitHub Pages。单元测试失败时保存 `vitest.log`，保留三天。

发布后检查：

- 首页可以打开
- `dist/assets/` 资源请求成功
- 2023、2024、2025 年份可以切换
- 四种模式可以通过底部导航进入
- 浅色和暗色主题可以切换
- WebGL 不可用时能看到静态舞台
- 完成一次研究选择后可以继续剧情
- 档案抽屉可以通过键盘关闭并恢复焦点

线上地址：

<https://runchengxie.github.io/rebirth-research/>

## 离线分享包

在 PowerShell 中运行：

```powershell
.\scripts\package.ps1
```

脚本会先构建项目，再把 `index.html`、`assets/` 和 README 打包到：

```text
dist/rebirth-research-share.zip
```

解压后直接打开 `index.html`。由于 Vite 的 `base` 为 `./`，静态资源可以使用相对路径加载。GitHub Gist 云同步在离线状态下不可用，其余核心模式可以离线运行。

## 文档维护

文档只描述当前实现。以下变化发生后需要同步更新说明：

- 年份、章节数、角色或结局条件变化
- 新增或移除 URL 参数和平台模式
- 运行时开始读取真实市场数据
- 存档或云同步方式变化
- 社区内容包格式和资源限制变化
- 音频方式变化
- 数据格式或生成命令变化
- 测试命令和工作流状态变化
- 目录结构或关键模块变化

中文说明尽量使用自然、直接的表达。命令、路径和字段名保留行内代码。减少英文小标题、粗体、中文双引号、分号、长破折号和成对否定转折句。
