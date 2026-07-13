import { describe, expect, it } from "vitest";
import { LEGACY_AFFINITY_BEATS } from "./affinityBeats";
import { buildMonthScene } from "./content";
import { dialogueParagraphs } from "./dialogueText";
import { RELATIONSHIP_DIALOGUE } from "./relationshipDialogue";
import { createInitialState } from "./runtime";

describe("关系升温节点", () => {
  it("2025 年只使用专属行为分支，不再生成通用亲密模板", () => {
    const base = createInitialState("2025");
    const state = {
      ...base,
      relations: {
        ...base.relations,
        lin_ruoning: 100,
        chen_xinghe: 100,
        zhou_mingzhao: 100,
      },
    };
    const texts = Array.from({ length: 12 }, (_, monthIndex) =>
      buildMonthScene(monthIndex, "2025", { ...state, monthIndex }).nodes.map((node) => node.text),
    ).flat();

    expect(texts.some((text) => text.includes("声音放轻了些"))).toBe(false);
    expect(texts.some((text) => text.includes("这种默契，比任何一份研报都难得"))).toBe(false);
    expect(texts.some((text) => text.includes("你最近总在我卡住的时候"))).toBe(false);
  });

  it("往年关系节点只在指定月份出现，并使用角色专属内容", () => {
    const state2023 = createInitialState("2023");
    const linScene = buildMonthScene(5, "2023", {
      ...state2023,
      monthIndex: 5,
      relations: { ...state2023.relations, lin_ruoning: 60 },
    });
    expect(linScene.nodes.some((node) => node.id === "affinity-2023-lin_ruoning-5")).toBe(true);

    const nextScene = buildMonthScene(6, "2023", {
      ...state2023,
      monthIndex: 6,
      relations: { ...state2023.relations, lin_ruoning: 60 },
    });
    expect(nextScene.nodes.some((node) => node.id === "affinity-2023-lin_ruoning-5")).toBe(false);
  });

  it("每段往年关系内容都不同，并按动作和对白分段", () => {
    expect(new Set(LEGACY_AFFINITY_BEATS.map((beat) => beat.text)).size).toBe(
      LEGACY_AFFINITY_BEATS.length,
    );
    for (const beat of LEGACY_AFFINITY_BEATS) {
      expect(dialogueParagraphs(beat.text).length).toBeGreaterThanOrEqual(2);
      expect(beat.text).not.toMatch(/[“”]/);
      expect(beat.text).not.toMatch(/（[^）]+）/);
    }
  });

  it("2025 关系路线也使用独立动作段和对白段", () => {
    for (const text of Object.values(RELATIONSHIP_DIALOGUE)) {
      expect(dialogueParagraphs(text).length).toBeGreaterThanOrEqual(2);
      expect(text).not.toMatch(/[“”]/);
      expect(text).not.toMatch(/（[^）]+）/);
    }
  });
});
