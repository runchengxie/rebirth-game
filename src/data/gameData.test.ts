import { describe, expect, it } from "vitest";
import { GAME_DATA, GAME_YEARS } from "./gameData";

// 不变量守卫：demo 是示范章节，藏在 ?year=demo 深链里，绝不能漏回年份选择器。
// 锁死两条约束，防止以后有人手滑把 GAME_YEARS 改回 Object.keys(GAME_DATA)，
// 导致 demo 重新出现在选择器、又把「只留深链」的设计打破了。
describe("GAME_YEARS / GAME_DATA 不变量", () => {
  it("demo 在 GAME_DATA 里（数据还在，深链可用）", () => {
    expect("demo" in GAME_DATA).toBe(true);
  });

  it("demo 不在 GAME_YEARS 里（不进年份选择器）", () => {
    expect(GAME_YEARS).not.toContain("demo");
  });

  it("选择器里的每个年份都在 GAME_DATA 里有对应数据", () => {
    for (const year of GAME_YEARS) {
      expect(year in GAME_DATA).toBe(true);
    }
  });
});
