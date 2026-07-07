# AGENTS

这份文件给后续维护者和自动化助手使用。

## 项目目标

这是一个 Vite + TypeScript + React + PixiJS 的静态网页游戏。源码入口在 `src/main.tsx`，主应用在 `src/App.tsx`，Pixi 舞台在 `src/components/PixiStage.tsx`，玩法逻辑在 `src/game/engine.ts`。

构建产物在 `dist/`，GitHub Pages 发布 `dist/`。运行时不要依赖本地接口或网络接口。

## 修改原则

- 优先保持构建后纯静态部署，GitHub Pages 由 `.github/workflows/pages.yml` 构建并发布 `dist/`。
- 页面运行时不要依赖 Z 盘、本地 Python 环境或网络接口。
- 新增年份时，先运行 `scripts/build_data.py`，再运行 `scripts/validate_data.py`。
- 分享包由 `scripts/package.ps1` 生成，`dist/` 目录不提交到 Git。
- 发布数据不要包含本机文件路径。
- 文档以中文为主，尽量使用中文标点。命令、文件名和参数保留行内代码格式。
- 前端新增玩法时优先改 `src/game/content.ts` 和 `src/game/engine.ts`，避免把业务逻辑塞进 React 组件。音乐逻辑在 `src/audio/bgm.ts`，不要提交授权不明的第三方音频。

## 提交前检查

```powershell
uvx ruff check .
uvx ruff format --check .
.\.venv\Scripts\python.exe -m compileall scripts
uvx basedpyright scripts
.\.venv\Scripts\python.exe scripts\validate_data.py
node scripts\validate_frontend.js
npm run lint
npm run typecheck
npm run test:run
npm run build
```

前端改动后，还需要确认 `npm run dev` 和 `npm run build` 都能正常启动/构建。

## 常见文件

- `scripts/build_data.py`：从本地行情数据生成游戏题库。
- `scripts/validate_data.py`：校验 JSON 和 `game-data.js` 是否一致。
- `scripts/validate_frontend.js`：校验 Vite/React/Pixi 源码结构和数据引用。
- `scripts/package.ps1`：生成离线分享包。
- `.github/workflows/ci.yml`：GitHub Actions 检查流程。
