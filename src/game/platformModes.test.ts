import { describe, expect, it } from "vitest";
import {
  appDestinationFromSearch,
  appDestinationUrl,
  continueGameUrl,
  hasStoredGame,
  newGameUrl,
  platformModeUrl,
  storedExperienceMode,
} from "./platformModes";

describe("平台入口解析", () => {
  it("裸 URL 与无关查询参数进入主菜单", () => {
    expect(appDestinationFromSearch("")).toBe("menu");
    expect(appDestinationFromSearch("?utm_source=bookmark")).toBe("menu");
    expect(appDestinationFromSearch("?mode=unknown")).toBe("menu");
  });

  it.each(["story", "committee", "daily", "studio"] as const)(
    "显式 mode=%s 进入对应页面",
    (mode) => {
      expect(appDestinationFromSearch(`?mode=${mode}`)).toBe(mode);
    },
  );

  it.each([
    "?year=2023",
    "?year=demo",
    "?pixivn=1",
    "?pixi=0",
    "?staticStage=1",
  ])("旧剧情深链 %s 仍然直达剧情", (search) => {
    expect(appDestinationFromSearch(search)).toBe("story");
  });

  it("显式平台模式优先于附带的旧剧情参数", () => {
    expect(appDestinationFromSearch("?mode=committee&year=2023")).toBe("committee");
  });
});

describe("平台入口 URL", () => {
  const current = "https://example.test/rebirth/?year=2023&pixivn=1&utm_source=test#main";

  it("返回主菜单时移除模式和剧情专用参数", () => {
    const result = new URL(appDestinationUrl("menu", current), current);
    expect(result.pathname).toBe("/rebirth/");
    expect(result.searchParams.get("utm_source")).toBe("test");
    expect(result.searchParams.has("mode")).toBe(false);
    expect(result.searchParams.has("year")).toBe(false);
    expect(result.searchParams.has("pixivn")).toBe(false);
    expect(result.hash).toBe("#main");
  });

  it("剧情入口总是写出显式 mode，避免重新落回主菜单", () => {
    const result = new URL(platformModeUrl("story", current), current);
    expect(result.searchParams.get("mode")).toBe("story");
    expect(result.searchParams.has("year")).toBe(false);
    expect(result.searchParams.has("pixivn")).toBe(false);
  });

  it("挑战与创作入口不会携带剧情模式状态", () => {
    for (const mode of ["committee", "daily", "studio"] as const) {
      const result = new URL(platformModeUrl(mode, current), current);
      expect(result.searchParams.get("mode")).toBe(mode);
      expect(result.searchParams.has("year")).toBe(false);
      expect(result.searchParams.has("play")).toBe(false);
    }
  });

  it.each(["romance", "career"] as const)(
    "新游戏为 %s 生成可深链的体验模式 URL",
    (experience) => {
      const result = new URL(newGameUrl(experience, current), current);
      expect(result.searchParams.get("mode")).toBe("story");
      expect(result.searchParams.get("play")).toBe(experience);
      expect(result.searchParams.get("new")).toBe("1");
      expect(result.searchParams.has("year")).toBe(false);
    },
  );

  it("继续游戏优先读取 session envelope 中的体验模式", () => {
    const storage = {
      getItem(key: string) {
        return key === "rebirthSession:v1:2025"
          ? JSON.stringify({ rebirth: { experienceMode: "romance" } })
          : null;
      },
    };
    const result = new URL(continueGameUrl(storage, current), current);
    expect(result.searchParams.get("mode")).toBe("story");
    expect(result.searchParams.get("play")).toBe("romance");
    expect(result.searchParams.has("new")).toBe(false);
  });

  it("只有可解析的会话或状态存档才显示继续入口", () => {
    const saved = {
      getItem(key: string) {
        return key === "rebirthSession:v1:2025"
          ? JSON.stringify({ state: { year: "2025" } })
          : null;
      },
    };
    expect(hasStoredGame(saved)).toBe(true);
    expect(hasStoredGame({ getItem: () => "not-json" })).toBe(false);
    expect(hasStoredGame({ getItem: () => null })).toBe(false);
  });

  it("继续游戏回退读取 meta，旧存档默认职业模式", () => {
    const metaStorage = {
      getItem(key: string) {
        return key === "rebirthMeta:v4:2025"
          ? JSON.stringify({ experienceMode: "romance" })
          : null;
      },
    };
    expect(storedExperienceMode(metaStorage)).toBe("romance");
    expect(storedExperienceMode({ getItem: () => null })).toBe("career");
  });

  it("继续往年存档时保留年份深链", () => {
    const result = new URL(
      continueGameUrl({ getItem: () => null }, current, "2023"),
      current,
    );
    expect(result.searchParams.get("mode")).toBe("story");
    expect(result.searchParams.get("play")).toBe("career");
    expect(result.searchParams.get("year")).toBe("2023");
  });
});
