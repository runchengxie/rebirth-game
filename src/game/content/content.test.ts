import { describe, expect, it } from "vitest";
import raw from "./2025.json";
import { ContentValidationError, validateYearContent } from "./schema";
import { THEMES_2025, makeDecisions2025 } from "../content2025";

describe("2025 content layer", () => {
  it("validates and loads 12 months / 12 themes / 72 decisions", () => {
    const content = validateYearContent(raw);
    expect(content.themes).toHaveLength(12);
    expect(content.decisions).toHaveLength(12);
    expect(content.decisions.flat()).toHaveLength(72);
    expect(content.year).toBe("2025");
  });

  it("rejects malformed content instead of silently breaking", () => {
    expect(() =>
      validateYearContent({ year: "2025", themes: [], decisions: [] }),
    ).toThrow(ContentValidationError);
  });

  it("rejects an unknown decision category", () => {
    const bad = {
      year: "2025",
      themes: raw.themes,
      decisions: [
        [
          {
            id: "x",
            label: "l",
            category: "not_a_category",
            description: "d",
            effects: { researchCredibility: 0, committeeAdoption: 0, portfolioNav: 0, viewAccuracy: 0, clientFeedback: 0, teamTrust: 0, fatigue: 0, lifeBalance: 0, characterRelations: [] },
            evidenceLevel: 0,
            clarityLevel: 0,
            riskAwareness: 0,
            reflectionValue: 0,
          },
        ],
      ],
    };
    expect(() => validateYearContent(bad)).toThrow(ContentValidationError);
  });

  it("exposes the same shape content.ts consumes", () => {
    expect(THEMES_2025).toHaveLength(12);
    expect(makeDecisions2025(0)).toHaveLength(6);
    expect(makeDecisions2025(0)[0].id).toBe("2025jan-chain");
    // month index wraps like the old implementation
    expect(makeDecisions2025(12)).toHaveLength(6);
  });
});
