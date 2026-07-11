import type { GameDataMap, GameDataYear, MarketSnapshot } from "../types";
import { buildMonthScene } from "../game/content";

// Build 12-month scene data for each year
function buildYearData(year: string): GameDataYear {
  const scenes = [];
  const benchmarks: MarketSnapshot[] = [];
  for (let i = 0; i < 12; i++) {
    const scene = buildMonthScene(i, year);
    scenes.push(scene);
    // 轻量叙事快照：由当月场景的 publicContext 派生，供复盘面板使用。
    // 注意：scripts/build_data.py 产出的市场复盘数据（data/*.json + game-data.js）
    // 走独立的 Python 校验链路（validate_data.py），目前并未接入运行时——本
    // benchmarks 与它是两套东西，勿混淆。
    benchmarks.push({
      month: scene.month,
      label: scene.label,
      marketStart: `${year}0101`,
      marketEnd: `${year}1231`,
      themeIndex: "000300.SH",
      themeReturn: 0,
      sectorRotation: [],
      styleFactorReturns: [],
      eventSummary: scene.theme.publicContext,
    });
  }

  return {
    year,
    currency: "CNY",
    generatedAt: new Date().toISOString(),
    source: {
      dailyDataset: "a_share_daily_clean",
      dailyDatasetVersion: "20260701",
      instrumentDataset: "a_share_instruments",
      priceColumn: "adj_close",
    },
    rules: {
      activePool: 500,
      excludeST: true,
      excludeSuspended: true,
    },
    benchmarks,
    scenes,
  };
}

export const GAME_DATA: GameDataMap = {
  "2023": buildYearData("2023"),
  "2024": buildYearData("2024"),
  "2025": buildYearData("2025"),
  "demo": buildYearData("demo"),
};

// 年份选择器只列正式年份；demo 是示范章节，藏起来只留 ?year=demo 深链。
export const GAME_YEARS = ["2023", "2024", "2025"];
