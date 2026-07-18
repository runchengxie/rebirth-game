import { describe, expect, it } from "vitest";
import {
  completedReviewCount,
  createSteadyResearchCommitment,
} from "./researchCommitment";

describe("研究承诺稳健模板", () => {
  it("一次生成基准置信度和完整自检", () => {
    const commitment = createSteadyResearchCommitment("risk");

    expect(commitment).toEqual({
      confidence: 70,
      falsifier: "risk",
      reviewChecks: {
        evidence: true,
        counterexample: true,
        exit: true,
      },
    });
    expect(completedReviewCount(commitment)).toBe(3);
  });

  it("未指定失效信号时使用业务数据", () => {
    expect(createSteadyResearchCommitment().falsifier).toBe("business");
  });
});
