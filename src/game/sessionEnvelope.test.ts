import { describe, expect, it } from "vitest";
import { createRebirthMeta, REBIRTH_META_KEY_PREFIX } from "./rebirth";
import { createInitialState } from "./runtime";
import {
  restoreSessionEnvelopeForUrl,
  writeSessionEnvelope,
} from "./sessionEnvelope";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("会话信封", () => {
  it("从信封恢复时写入包含体验模式的 v4 元状态", () => {
    const storage = new MemoryStorage();
    const state = createInitialState("2025", "romance");
    const rebirth = createRebirthMeta("2025", "romance");
    writeSessionEnvelope(storage, state, rebirth);

    expect(restoreSessionEnvelopeForUrl(storage, "?mode=story&year=2025")).toBe(true);
    const restored = JSON.parse(storage.getItem(`${REBIRTH_META_KEY_PREFIX}2025`) ?? "null");
    expect(restored.experienceMode).toBe("romance");
    expect(storage.getItem("rebirthMeta:v3:2025")).toBeNull();
  });
});
