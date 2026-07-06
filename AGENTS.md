# AGENTS

这份文件给后续维护者和自动化助手使用。

## 项目目标

这是一个纯静态网页游戏。核心文件是 `index.html`、`styles.css`、`app.js` 和 `data/game-data.js`。

保持项目轻量，不引入前端构建工具。只有数据生成和校验脚本需要 Python 或 Node。

## 修改原则

- 优先保持纯静态部署，GitHub Pages 直接发布仓库根目录。
- 页面运行时不要依赖 Z 盘、本地 Python 环境或网络接口。
- 新增年份时，先运行 `scripts/build_data.py`，再运行 `scripts/validate_data.py`。
- 分享包由 `scripts/package.ps1` 生成，`dist/` 目录不提交到 Git。
- 发布数据不要包含本机文件路径。
- 文档以中文为主，尽量使用中文标点。命令、文件名和参数保留行内代码格式。

## 提交前检查

```powershell
uvx ruff check .
uvx ruff format --check .
.\.venv\Scripts\python.exe -m compileall scripts
uvx basedpyright scripts
.\.venv\Scripts\python.exe scripts\validate_data.py
node scripts\validate_frontend.js
```

前端改动后，还需要确认这些文件能通过本地 HTTP 访问：

- `index.html`
- `styles.css`
- `app.js`
- `data/game-data.js`

## 常见文件

- `scripts/build_data.py`：从本地行情数据生成游戏题库。
- `scripts/validate_data.py`：校验 JSON 和 `game-data.js` 是否一致。
- `scripts/validate_frontend.js`：校验前端静态引用和脚本语法。
- `scripts/package.ps1`：生成离线分享包。
- `.github/workflows/ci.yml`：GitHub Actions 检查流程。
