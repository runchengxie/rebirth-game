# 重生选股游戏

这是一个纯静态网页游戏。玩家从 1 万元开始，每个月在 4 个标的里选 1 个，系统按该股票当月真实涨跌幅复利结算，最后看一年结束能到多少钱。

在线试玩：<https://runchengxie.github.io/rebirth-game/>

## 功能

- 支持 2023、2024、2025 三个年份。
- 支持自定义初始本金。
- 支持浅色模式和暗色模式，主题选择会保存在浏览器本地。
- 选择后显示当月真实涨跌幅、最优标的和账户变化。
- 展示资金曲线和月度流水。
- 可生成离线分享包，朋友解压后直接打开 `index.html` 即可游玩。

## 玩法规则

- 每个月先过滤 ST、停牌、新上市未满 120 天、月初或月末不可交易的股票。
- 用月初第一个交易日和月末最后一个交易日的价格计算涨跌幅。
- 默认使用 `adj_close` 计算收益，减少除权分红对收益的影响。需要改用原始收盘价时，可在生成数据时传入 `--price-column close`。
- 在当月成交额最高的 500 只股票里找涨幅第一名，作为正确答案。
- 干扰项从涨幅排名约前 10% 到 30% 的股票中抽 3 只，让题目保持一定迷惑性。

## 项目结构

```text
rebirth-game/
├── index.html
├── styles.css
├── app.js
├── data/
│   ├── 2023.json
│   ├── 2024.json
│   ├── 2025.json
│   ├── game-data.js
│   └── manifest.json
├── scripts/
│   ├── build_data.py
│   ├── package.ps1
│   ├── validate_data.py
│   └── validate_frontend.js
├── docs/
│   └── maintenance.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── AGENTS.md
├── pyproject.toml
└── requirements.txt
```

运行网页只需要 `index.html`、`styles.css`、`app.js` 和 `data/` 目录。项目没有前端构建步骤。

## 数据来源

数据生成脚本默认读取本机 market-data-platform 的 A 股清洗数据：

- `a_share_daily_clean`
- `a_share_instruments`

具体本机路径在 `scripts/build_data.py` 的默认参数里。也可以通过 `--daily-clean-dir` 和 `--instruments` 覆盖。

发布后的 JSON 只保留数据集名称、数据版本和生成规则，不包含本机文件路径。

## 重新生成数据

```powershell
cd C:\Users\gbyha\code\rebirth-game
uv venv
uv pip install -r requirements.txt
.\.venv\Scripts\python.exe scripts\build_data.py
```

默认会生成 2023、2024、2025 三个年份：

- `data/2023.json`
- `data/2024.json`
- `data/2025.json`
- `data/game-data.js`
- `data/manifest.json`

常用参数：

```powershell
.\.venv\Scripts\python.exe scripts\build_data.py `
  --years 2023 2024 2025 `
  --initial-capital 10000 `
  --active-pool 500 `
  --min-listed-days 120 `
  --price-column adj_close
```

## 生成离线分享包

```powershell
cd C:\Users\gbyha\code\rebirth-game
.\scripts\package.ps1
```

生成结果：

```text
dist/rebirth-game-share.zip
```

`package.ps1` 会读取 `data/manifest.json`。以后新增年份后，重新生成数据再运行打包脚本即可。

压缩包会包含网页、题库数据、文档和维护脚本。游玩入口是根目录的 `index.html`。

## 本地验证

```powershell
uvx ruff check .
uvx ruff format --check .
.\.venv\Scripts\python.exe -m compileall scripts
uvx basedpyright scripts
.\.venv\Scripts\python.exe scripts\validate_data.py
node scripts\validate_frontend.js
```

GitHub Actions 会在 push 和 pull request 时运行同一组检查。

更多维护说明见 `docs/maintenance.md`。

## 注意

这个项目只用于游戏和复盘，不构成投资建议。
