import { describe, expect, it } from "vitest";
import { FOCUS_ACTIONS } from "./content";
import type { ResearchDecision, RoundResult } from "../types";
import {
  careerRecap,
  decisionPresentation,
  glossaryTermsIn,
  monthlyCareerGuidance,
} from "./careerGuidance";

const DECISION: ResearchDecision = {
  id: "guidance-test",
  label: "拆解单位经济性与因子拥挤度",
  category: "deep_research",
  method: "fundamental_research",
  quality: "sound",
  outcomeAlignment: "supports",
  description: "用敏感性分析检查收入、利润和因子拥挤度。",
  effects: {
    researchCredibility: 5,
    committeeAdoption: 2,
    portfolioNav: 0,
    viewAccuracy: 1,
    clientFeedback: 0,
    teamTrust: 1,
    fatigue: 9,
    lifeBalance: -7,
    characterRelations: [{ characterId: "lin_ruoning", value: 2 }],
  },
  evidenceLevel: 18,
  clarityLevel: 15,
  riskAwareness: 11,
  reflectionValue: 8,
};

const RESULT: RoundResult = {
  month: "2025-01",
  label: "2025年1月",
  characterId: "lin_ruoning",
  sceneTitle: "未来记忆审计",
  selected: DECISION,
  focus: FOCUS_ACTIONS[0],
  outcome: { title: "复盘", dialogue: "复盘", detail: "复盘" },
  researchCredibilityAfter: 42,
  committeeAdoptionAfter: 28,
  portfolioNavAfter: 1,
  viewAccuracyAfter: 20,
  clientFeedbackAfter: 15,
  teamTrustAfter: 29,
  fatigueAfter: 48,
  lifeBalanceAfter: 35,
  relationsAfter: {
    lin_ruoning: 20,
    chen_xinghe: 14,
    zhou_mingzhao: 12,
    zhao_chengyu: 10,
  },
  marketTheme: "AI叙事重构",
  marketReturn: 0,
  score: {
    evidenceScore: 19,
    clarityScore: 16,
    riskAwarenessScore: 10,
    communicationScore: 11,
    lifeBalanceScore: 4,
    portfolioScore: 4,
    qualityBonus: 6,
    outcomeScore: 4,
    reasoningScore: 19,
    total: 74,
    grade: "B",
  },
};

describe("职业模式理解层", () => {
  it("为每个月只提供一个目标、风险和校准问题", () => {
    const january = monthlyCareerGuidance("2025", 0);
    const december = monthlyCareerGuidance("2025", 11);

    expect(january.goal).toContain("证据");
    expect(january.risk).toContain("结果");
    expect(december.question).toContain("纪律");
    expect(monthlyCareerGuidance("2024", 0).goal).toContain("研究假设");
  });

  it("把专业方案翻译成主张、押注变量、代价和推荐日程", () => {
    const presentation = decisionPresentation(DECISION);

    expect(presentation.methodLabel).toBe("基本面验证");
    expect(presentation.claim).toContain("业务兑现");
    expect(presentation.tradeoff).toContain("疲劳");
    expect(presentation.recommendedFocusId).toBe("deep_research");
  });

  it("按首次出现顺序返回当前内容实际出现的术语", () => {
    const terms = glossaryTermsIn(DECISION.label, DECISION.description);

    expect(terms.map((term) => term.id)).toEqual([
      "unit-economics",
      "factor-crowding",
      "sensitivity-analysis",
    ]);
    expect(glossaryTermsIn("普通业务描述")).toEqual([]);
  });

  it("覆盖第一话的交易术语并解释它在本话中的作用", () => {
    const terms = glossaryTermsIn(
      "Barra 归因显示动量因子主导，订单簿和盘口厚度变弱，Alpha 衰减加快。",
      "风险偏好、流动性和安全边际都要检查，也别漏掉反身性。",
    );

    expect(terms.map((term) => term.id)).toEqual([
      "barra",
      "momentum-factor",
      "order-book",
      "market-depth",
      "alpha-decay",
      "risk-appetite",
      "liquidity",
      "margin-of-safety",
      "reflexivity",
    ]);
    expect(terms.every((term) => term.relevance.length > 0)).toBe(true);
  });

  it("结算先解释优势、风险和状态后果", () => {
    const recap = careerRecap(RESULT);

    expect(recap.strength).toContain("证据");
    expect(recap.risk).toContain("工作节奏");
    expect(recap.consequence).toContain("疲劳");
  });
});
