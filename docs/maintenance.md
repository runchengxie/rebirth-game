# 维护说明

## 日常开发流程

1. 修改 `src/` 源码或数据生成脚本。
2. 需要更新市场复盘数据时，运行 `uv run python scripts/build_data.py`。
3. 运行本地验证命令。
4. 需要离线分享包时，运行 `scripts/package.ps1`。
5. 提交并推送到 `main`，GitHub Pages 会自动发布。

## 数据生成

`scripts/build_data.py` 从本地 market-data-platform 的 A 股清洗数据中提取每月市场复盘指标：

- 沪深 300 代理指数（成交额前 300 只等权平均）
- 中证 500 代理指数（成交额 301-800 只等权平均）
- 行业轮动（月度成交额加权行业收益，取前 5 和后 5 名）
- 风格因子近似（规模溢价、动量溢价）

默认命令：

```bash
uv run python scripts/build_data.py
```

默认年份为 2023、2024、2025。生成脚本会输出：

- 每年一个 `market-review-YYYY.json` 文件。
- `market-review-manifest.json`，记录生成时间和文件清单。

公开数据中的 `source` 字段只保留数据集名称和价格字段，不写入本机路径。

## 验证脚本

`scripts/validate_data.py` 会检查已发布数据文件：

- manifest 与年份 JSON 是否一致。
- 每个年份是否有 12 个月。
- 每月数据字段是否完整合法。
- 公开数据里是否出现本机路径。

`scripts/validate_frontend.js` 会检查：

- `index.html` 是否是 Vite 入口。
- `package.json` 是否包含 Vite、React、TypeScript 和 PixiJS。
- `src/` 是否包含 React 应用、Pixi 舞台、玩法引擎、程序化背景音乐、轻音效和数据入口。
- `assets/vn/` 下的场景背景和角色立绘是否存在。
- `assets/galgame-key-art.png` 是否存在。
- 内联脚本和 `game-data.js` 是否能通过基础语法检查。

`scripts/test_build_data.py` 提供 pytest 单元测试：

- `duckdb_path` 路径转换。
- `as_float` 浮点数处理（含 NaN/Inf 边界）。
- `parse_args` 命令行参数解析。

`src/game/engine.test.ts` 提供 Vitest 玩法引擎测试。

前端质量检查：

- `npm run lint`：ESLint 检查 TypeScript 与 React。
- `npm run typecheck`：TypeScript 类型检查。
- `npm run test:run`：Vitest 单元测试。
- `npm run build`：Vite 生产构建。

Python 质量检查：

- `uv run ruff check .`：Ruff 代码检查。
- `uv run ruff format --check .`：Ruff 格式检查。
- `uv run python -m compileall scripts`：Python 编译检查。
- `uv run pytest scripts/ -v`：pytest 单元测试。
- `uv run basedpyright scripts`：静态类型检查（非阻塞）。
- `uv run ty check scripts`：快速类型检查（非阻塞）。

一键运行所有检查：

```bash
uv run python scripts/check.py          # 阻塞检查
uv run python scripts/check.py --all     # 含非阻塞类型检查
```

## 文案风格

剧情和说明文档以中文为主。写新内容时优先使用自然、直接的表达，少用翻译腔和生硬术语。角色对白要像人在说话，金融知识尽量藏在事件、冲突和复盘里。

常用约定：

- 主线叫历史金融事件或主线事件。
- 每月的结果结算叫月度复盘。
- 中文段落使用中文标点。保留必要的行内代码引用，例如 `npm run check`。
- 避免堆叠强调符号、双引号、分号和长破折号。
- 遇到转折句时，直接写结论。

## 音频策略

当前背景音乐和轻音效由浏览器音频接口生成，仓库不提交第三方音频文件，避免授权风险。角色对白默认不播放电子拟声，真实角色语音处于待接入状态。后续如果替换为音频素材，只接受自制、CC0、公有领域或明确允许商用分发的循环音频和关键句语音文件，并在 README 中记录来源和授权。

## GitHub Pages

仓库通过 GitHub Pages 发布。`.github/workflows/pages.yml` 会在 `main` 分支构建 `dist/`，并上传 Pages 发布产物。

线上地址：

<https://runchengxie.github.io/rebirth-research/>

推送到 `main` 后，GitHub 会运行持续集成和 Pages 发布流程。持续集成成功后，再确认线上页面和 `dist/assets/` 静态资源返回 200。

## 离线分享包

运行：

```powershell
.\scripts\package.ps1
```

生成：

```text
dist/rebirth-research-share.zip
```

脚本会先运行 `npm run build`，再把 `dist/` 产物打包。解压后打开 `index.html` 即可游玩。
