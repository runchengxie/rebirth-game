# AGENTS

这份文件给后续维护者和自动化助手使用。

## 项目目标

这是一个 Vite + TypeScript + React + PixiJS 的静态网页游戏。源码入口在 `src/main.tsx`，主应用在 `src/App.tsx`，Pixi 舞台在 `src/components/PixiStage.tsx`，玩法逻辑在 `src/game/engine.ts`。

构建产物在 `dist/`，GitHub Pages 发布 `dist/`。运行时不要依赖本地接口或网络接口。

Python 工具链通过 `uv` 管理（`pyproject.toml` 的 `[dependency-groups] dev`），首次使用运行 `uv sync --only-dev`。

## 修改原则

- 优先保持构建后纯静态部署，GitHub Pages 由 `.github/workflows/pages.yml` 构建并发布 `dist/`。
- 页面运行时不要依赖 Z 盘、本地 Python 环境或网络接口。
- 新增年份时，先运行 `uv run python scripts/build_data.py`，再运行 `uv run python scripts/validate_data.py`。
- 分享包由 `scripts/package.ps1` 生成，`dist/` 目录不提交到 Git。
- 发布数据不要包含本机文件路径。
- 文档以中文为主，尽量使用中文标点。命令、文件名和参数保留行内代码格式。
- 前端新增玩法时优先改 `src/game/content.ts` 和 `src/game/engine.ts`，避免把业务逻辑塞进 React 组件。音乐逻辑在 `src/audio/bgm.ts`，不要提交授权不明的第三方音频。

## 提交前检查

```bash
uv run ruff check .
uv run ruff format --check .
uv run python -m compileall scripts
uv run pytest scripts/ -v
uv run basedpyright scripts
uv run ty check scripts
uv run python scripts/validate_data.py
node scripts/validate_frontend.js
npm run lint
npm run typecheck
npm run test:run
npm run build
```

或一键运行：

```bash
uv run python scripts/check.py          # 阻塞检查
uv run python scripts/check.py --all     # 含非阻塞类型检查
```

前端改动后，还需要确认 `npm run dev` 和 `npm run build` 都能正常启动/构建。

## 常见文件

- `scripts/build_data.py`：从本地行情数据生成游戏题库。
- `scripts/validate_data.py`：校验 JSON 和 `game-data.js` 是否一致。
- `scripts/validate_frontend.js`：校验 Vite/React/Pixi 源码结构和数据引用。
- `scripts/test_build_data.py`：pytest 单元测试，覆盖纯函数和参数解析。
- `scripts/check.py`：统一检查入口，支持 `--python` / `--frontend` / `--all`。
- `scripts/package.ps1`：生成离线分享包。
- `.github/workflows/ci.yml`：GitHub Actions 检查流程。
