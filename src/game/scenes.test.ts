import { describe, expect, it } from "vitest";
import { GAME_DATA } from "../data/gameData";
import { COMMITTEE_EXAMINERS } from "./committeeMode";
import {
  PROCEDURAL_SCENES,
  SCENES,
  STAGE_SCENES,
  stageSceneIdFor,
  stageSceneImageUrl,
  type ProceduralSceneId,
  type SceneId,
  type StageSceneId,
} from "./scenes";

// 路线图 R3.5：场景编号基线。新增或删除场景必须同步更新注册表，
// 否则在编译期或本测试中失败，不能静默回退后继续发布。

const STAGE_SCENE_BASELINE = [
  "research-room",
  "briefing-room",
  "night-cafe",
] as const satisfies readonly StageSceneId[];

const PROCEDURAL_SCENE_BASELINE = [
  "committee-room",
  "data-wall",
  "risk-review",
  "compliance-desk",
] as const satisfies readonly ProceduralSceneId[];

type AssertSame<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const stageExhaustive: AssertSame<StageSceneId, (typeof STAGE_SCENE_BASELINE)[number]> = true;
const proceduralExhaustive: AssertSame<
  ProceduralSceneId,
  (typeof PROCEDURAL_SCENE_BASELINE)[number]
> = true;
const sceneIdExhaustive: AssertSame<
  SceneId,
  (typeof STAGE_SCENE_BASELINE)[number] | (typeof PROCEDURAL_SCENE_BASELINE)[number]
> = true;

describe("场景注册表（路线图 R3A）", () => {
  it("类型级基线保持编译期完整覆盖", () => {
    expect(stageExhaustive).toBe(true);
    expect(proceduralExhaustive).toBe(true);
    expect(sceneIdExhaustive).toBe(true);
  });

  it("注册表键与场景编号一一对应", () => {
    expect(Object.keys(STAGE_SCENES).sort()).toEqual([...STAGE_SCENE_BASELINE].sort());
    expect(Object.keys(PROCEDURAL_SCENES).sort()).toEqual([...PROCEDURAL_SCENE_BASELINE].sort());
    expect(Object.keys(SCENES).sort()).toEqual(
      [...STAGE_SCENE_BASELINE, ...PROCEDURAL_SCENE_BASELINE].sort(),
    );
    for (const [id, definition] of Object.entries(SCENES)) {
      expect(definition.id).toBe(id);
    }
  });

  // 登记值与磁盘上真实文件的一致性由 scripts/validate_frontend.js 校验，
  // 这里只保证注册表信息完整（R3.8）且承诺不超过 500 KiB 预算（R3.9）。
  it("位图场景登记来源、生成参数、授权、尺寸与压缩信息", () => {
    for (const definition of Object.values(STAGE_SCENES)) {
      expect(definition.presentation).toBe("bitmap");
      expect(definition.asset.path).toMatch(/^assets\/vn\/backgrounds\/[a-z-]+\.webp$/);
      expect(definition.asset.source.length).toBeGreaterThan(0);
      expect(definition.asset.generation.length).toBeGreaterThan(0);
      expect(definition.asset.license.length).toBeGreaterThan(0);
      expect(definition.asset.compression).toContain("WebP");
      expect(definition.asset.width).toBeGreaterThan(0);
      expect(definition.asset.height).toBeGreaterThan(0);
      expect(definition.asset.sizeKiB).toBeGreaterThan(0);
      expect(definition.asset.sizeKiB).toBeLessThanOrEqual(500);
    }
  });

  it("位图场景的 URL 按需解析且全局只解析一次", async () => {
    const first = stageSceneImageUrl("briefing-room");
    const second = stageSceneImageUrl("briefing-room");
    expect(second).toBe(first);
    await expect(first).resolves.toContain("briefing-room");
  });

  it("年度剧情内容装配只使用已注册的舞台场景", () => {
    const registered = new Set<string>(Object.keys(STAGE_SCENES));
    for (const year of Object.values(GAME_DATA)) {
      for (const scene of year.scenes) {
        for (const node of scene.nodes) {
          if (node.bg !== undefined) {
            expect(registered.has(node.bg), `${scene.id}/${node.id} 使用了未注册背景 ${node.bg}`).toBe(true);
          }
        }
      }
    }
  });

  it("投委会答辩场景全部来自共享注册表的程序化场景", () => {
    for (const examiner of Object.values(COMMITTEE_EXAMINERS)) {
      const definition = PROCEDURAL_SCENES[examiner.scene];
      expect(definition.presentation).toBe("procedural");
      expect(definition.cssClass).toBe(`scene-${examiner.scene}`);
    }
  });

  it("未显式指定背景时对白落在研究室、研究选择落在会议简报室", () => {
    expect(stageSceneIdFor("dialogue")).toBe("research-room");
    expect(stageSceneIdFor("decision")).toBe("briefing-room");
    expect(stageSceneIdFor("dialogue", "night-cafe")).toBe("night-cafe");
  });
});
