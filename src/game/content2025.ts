// 2025 内容层：正式内容统一由 version 2 JSON 提供，并叠加已核验的月度事件锚点。

import raw from "./content/2025.json";
import type { MarketTheme, ResearchDecision } from "../types";
import { validateYearContent } from "./content/schema";
import { completeDecisionSemantics, completeYearThemes } from "./narrativeSemantics";
import { applyVerified2025Timeline } from "./verified2025";

const CONTENT_2025 = validateYearContent(raw);

const MIXED_TERMS = [
  "DeepSeek-R1",
  "AI Agent",
  "AI+",
  "SaaS",
  "ARR",
  "ToC",
  "ToB",
  "Barra",
  "Alpha",
  "IPO",
  "AI",
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function polishMixedText(text: string): string {
  let polished = text;
  for (const term of MIXED_TERMS) {
    const escaped = escapeRegExp(term);
    polished = polished
      .replace(new RegExp(`([\\u3400-\\u9fff])(${escaped})`, "g"), "$1 $2")
      .replace(new RegExp(`(${escaped})([\\u3400-\\u9fff])`, "g"), "$1 $2");
  }
  return polished.replace(/[ \t]{2,}/g, " ");
}

function polishTheme(theme: MarketTheme): MarketTheme {
  const polished: MarketTheme = {
    ...theme,
    title: polishMixedText(theme.title),
    publicContext: polishMixedText(theme.publicContext),
    protagonistMemory: polishMixedText(theme.protagonistMemory),
    gameHook: polishMixedText(theme.gameHook),
  };

  if (theme.historicalPrototype !== undefined) {
    polished.historicalPrototype = polishMixedText(theme.historicalPrototype);
  }
  if (theme.knownEvent !== undefined) {
    polished.knownEvent = polishMixedText(theme.knownEvent);
  }
  if (theme.businessOutcome !== undefined) {
    polished.businessOutcome = polishMixedText(theme.businessOutcome);
  }
  if (theme.competingHypotheses) {
    const hypotheses = { ...theme.competingHypotheses };
    if (hypotheses.lin !== undefined) hypotheses.lin = polishMixedText(hypotheses.lin);
    if (hypotheses.chen !== undefined) hypotheses.chen = polishMixedText(hypotheses.chen);
    if (hypotheses.zhou !== undefined) hypotheses.zhou = polishMixedText(hypotheses.zhou);
    polished.competingHypotheses = hypotheses;
  }

  return polished;
}

export const THEMES_2025: MarketTheme[] = applyVerified2025Timeline(
  completeYearThemes(CONTENT_2025.themes),
).map(polishTheme);

export function makeDecisions2025(monthIndex: number): ResearchDecision[] {
  const pool = CONTENT_2025.decisions[monthIndex % CONTENT_2025.decisions.length];
  return (pool ?? []).map(completeDecisionSemantics);
}
