import { describe, expect, it } from "vitest";
import type { ResearchDecision } from "../types";
import {
  experienceModeFromSearch,
  experiencePolicy,
  prepareDecisionForExperience,
  romanceDecisionOptions,
} from "./experienceMode";

const DECISION: ResearchDecision = {
  id: "experience-test",
  label: "验证体验模式",
  category: "deep_research",
  method: "fundamental_research",
  quality: "sound",
  outcomeAlignment: "supports",
  description: "用于验证模式适配不会把隐藏的职业压力留给剧情玩家。",
  effects: {
    researchCredibility: 4,
    committeeAdoption: 2,
    portfolioNav: 0,
    viewAccuracy: 1,
    clientFeedback: 1,
    teamTrust: 1,
    fatigue: 8,
    lifeBalance: -5,
    characterRelations: [{ characterId: "lin_ruoning", value: 4 }],
  },
  evidenceLevel: 10,
  clarityLevel: 10,
  riskAwareness: 8,
  reflectionValue: 5,
};

describe("体验模式策略", () => {
  it("只接受明确的 play 参数", () => {
    expect(experienceModeFromSearch("?mode=story&play=romance")).toBe("romance");
    expect(experienceModeFromSearch("?mode=story&play=career")).toBe("career");
    expect(experienceModeFromSearch("?mode=story&play=unknown")).toBeNull();
  });

  it("剧情模式隐藏职业系统，职业模式保留完整玩法", () => {
    expect(experiencePolicy("romance")).toMatchObject({
      showCareerMetrics: false,
      showInvestigation: false,
      showResearchCommitment: false,
      showSchedule: false,
    });
    expect(experiencePolicy("career")).toMatchObject({
      showCareerMetrics: true,
      showInvestigation: true,
      showResearchCommitment: true,
      showSchedule: true,
    });
  });

  it("剧情模式自动完成稳健审查并消除隐藏的疲劳与生活惩罚", () => {
    const prepared = prepareDecisionForExperience("romance", DECISION);

    expect(prepared.effects.fatigue).toBe(0);
    expect(prepared.effects.lifeBalance).toBe(0);
    expect(prepared.setsFlags).toMatchObject({
      commitment_confidence_70: true,
      commitment_falsifier_business: true,
      commitment_fully_reviewed: true,
    });
  });

  it("职业模式不提供承诺时保持原判断，由玩家承担空白审查", () => {
    expect(prepareDecisionForExperience("career", DECISION)).toBe(DECISION);
  });

  it("普通月份把大选项池归并为三位角色各一个方向", () => {
    const option = (
      id: string,
      characterId: "lin_ruoning" | "chen_xinghe" | "zhou_mingzhao" | "zhao_chengyu",
      value: number,
      category: ResearchDecision["category"] = "deep_research",
    ): ResearchDecision => ({
      ...DECISION,
      id,
      category,
      effects: {
        ...DECISION.effects,
        characterRelations: [{ characterId, value }],
      },
    });
    const selected = romanceDecisionOptions([
      option("lin-low", "lin_ruoning", 3),
      option("lin-high", "lin_ruoning", 8),
      option("chen-model", "chen_xinghe", 9),
      option("chen-help", "chen_xinghe", 9, "help_colleague"),
      option("zhou", "zhou_mingzhao", 7),
      option("peer", "zhao_chengyu", 20),
    ]);

    expect(selected.map((decision) => decision.id)).toEqual([
      "lin-high",
      "chen-help",
      "zhou",
    ]);
  });
});
