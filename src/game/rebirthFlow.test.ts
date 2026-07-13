import { describe, expect, it } from "vitest";
import { GAME_DATA } from "../data/gameData";
import { branchMetaContext, createRebirthMeta } from "./rebirth";
import {
  flowMapEntries,
  markSceneNodeRead,
  skipReadSceneNodes,
} from "./rebirthFlow";
import { createInitialState, currentSceneNode, sceneForMonth } from "./runtime";

describe("年度流程图与已读跳过", () => {
  it("流程图标记关键月份和当前月份", () => {
    const meta = createRebirthMeta("2025");
    const state = { ...createInitialState("2025"), monthIndex: 3 };
    const entries = flowMapEntries(meta, state);

    expect(entries).toHaveLength(12);
    expect(entries[3]?.status).toBe("current");
    expect(entries[3]?.investigationLabel).toBe("事后正确偏差");
    expect(entries[6]?.keyMonth).toBe(true);
    expect(entries[8]?.keyMonth).toBe(true);
    expect(entries[11]?.keyMonth).toBe(true);
  });

  it("二周目只跳过已经读过的连续对白，并停在首个新节点", () => {
    const state = createInitialState("2025");
    const baseMeta = { ...createRebirthMeta("2025"), cycle: 2 };
    const scene = sceneForMonth(state, branchMetaContext(baseMeta));
    const firstTwo = scene.nodes.slice(0, 2);
    const meta = firstTwo.reduce(
      (current, node) => markSceneNodeRead(current, state, node.id),
      baseMeta,
    );

    const skipped = skipReadSceneNodes(
      meta,
      state,
      GAME_DATA["2025"],
      branchMetaContext(meta),
    );

    expect(skipped.sceneNodeIndex).toBe(2);
    expect(currentSceneNode(skipped, branchMetaContext(meta)).id).toBe(scene.nodes[2]?.id);
  });

  it("即使整段对白都已读，也不会跨过未结算研究选择", () => {
    const state = createInitialState("2025");
    const baseMeta = { ...createRebirthMeta("2025"), cycle: 2 };
    const scene = sceneForMonth(state, branchMetaContext(baseMeta));
    const meta = scene.nodes
      .filter((node) => node.type === "dialogue")
      .reduce(
        (current, node) => markSceneNodeRead(current, state, node.id),
        baseMeta,
      );

    const skipped = skipReadSceneNodes(
      meta,
      state,
      GAME_DATA["2025"],
      branchMetaContext(meta),
    );

    expect(skipped.monthIndex).toBe(0);
    expect(currentSceneNode(skipped, branchMetaContext(meta)).type).toBe("decision");
  });
});
