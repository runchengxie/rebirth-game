import { describe, expect, it } from "vitest";
import {
  COMMUNITY_CASE_MAX_DECISIONS,
  COMMUNITY_PACK_MAX_BYTES,
  COMMUNITY_PACK_MAX_CASES,
  createStarterCommunityPack,
  parseCommunityPack,
  validateCommunityPack,
} from "./communityContent";

describe("社区内容包边界", () => {
  it("接受内置示例包", () => {
    const pack = createStarterCommunityPack();
    expect(validateCommunityPack(pack)).toEqual({ valid: true, errors: [] });
    expect(parseCommunityPack(JSON.stringify(pack))).toEqual(pack);
  });

  it("拒绝重复案例和重复研究方案编号", () => {
    const pack = createStarterCommunityPack();
    const duplicateCase = structuredClone(pack.cases[0]);
    pack.cases.push(duplicateCase);
    pack.cases[0].decisions[1].id = pack.cases[0].decisions[0].id;

    const result = validateCommunityPack(pack);
    expect(result.valid).toBe(false);
    expect(result.errors.join("\n")).toMatch(/重复 id/);
  });

  it("限制案例数和单案例研究方案数", () => {
    const pack = createStarterCommunityPack();
    const template = pack.cases[0];
    pack.cases = Array.from({ length: COMMUNITY_PACK_MAX_CASES + 1 }, (_, index) => ({
      ...structuredClone(template),
      id: `case-${index}`,
      decisions: Array.from({ length: COMMUNITY_CASE_MAX_DECISIONS + 1 }, (_item, decisionIndex) => ({
        ...structuredClone(template.decisions[decisionIndex % template.decisions.length]),
        id: `case-${index}-decision-${decisionIndex}`,
      })),
    }));

    const result = validateCommunityPack(pack);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(`内容包最多允许 ${COMMUNITY_PACK_MAX_CASES} 个案例。`);
    expect(result.errors.some((error) => error.includes(`最多允许 ${COMMUNITY_CASE_MAX_DECISIONS} 个方案`))).toBe(true);
  });

  it("拒绝超长字段和无效更新时间", () => {
    const pack = createStarterCommunityPack();
    pack.title = "研".repeat(121);
    pack.updatedAt = "not-a-date";

    const result = validateCommunityPack(pack);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("title 不能超过 120 个字符。");
    expect(result.errors).toContain("updatedAt 必须是有效的日期时间。");
  });

  it("在解析 JSON 前拒绝超过体积预算的内容包", () => {
    const oversized = "x".repeat(COMMUNITY_PACK_MAX_BYTES + 1);
    expect(() => parseCommunityPack(oversized)).toThrow(/不能超过 256 KiB/);
  });
});
