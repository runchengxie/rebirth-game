// ═══════════════════════════════════════════════════════════
// Content layer — 2025 年（样例）
// ═══════════════════════════════════════════════════════════
//
// 2025 年的剧情内容已从代码迁移到数据文件 ./content/2025.json，并在加载时
// 由 schema（./content/schema.ts）校验。这样「内容」（MarketTheme /
// ResearchDecision）与「模拟逻辑」彻底解耦：编剧只改 JSON，引擎逻辑不动。
//
// 本文件是内容层加载器：读取 JSON → 校验 → 暴露 content.ts 期望的
// THEMES_2025 与 makeDecisions2025 两个出口，对 content.ts 完全透明。

import raw from "./content/2025.json";
import type { MarketTheme, ResearchDecision } from "../types";
import { validateYearContent } from "./content/schema";

const CONTENT_2025 = validateYearContent(raw);

export const THEMES_2025: MarketTheme[] = CONTENT_2025.themes;

export function makeDecisions2025(monthIndex: number): ResearchDecision[] {
  const pool = CONTENT_2025.decisions[monthIndex % CONTENT_2025.decisions.length];
  return pool ?? [];
}
