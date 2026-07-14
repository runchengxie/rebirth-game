#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

path = Path(__file__).resolve().parents[2] / "src/game/rebirthTimelineState.ts"
text = path.read_text(encoding="utf-8")
old = '''function restoreEvent(value: unknown): TimelineEvent | null {
  if (!isObject(value)) return null;
  if (typeof value.id !== "string" || typeof value.branchId !== "string") return null;
  return {
    id: value.id,
    sequence: typeof value.sequence === "number" ? value.sequence : 0,
    branchId: value.branchId,
    cycle: typeof value.cycle === "number" ? value.cycle : 1,
    monthIndex: typeof value.monthIndex === "number" ? value.monthIndex : 0,
    monthKey: typeof value.monthKey === "string" ? value.monthKey : "",
    type: typeof value.type === "string" ? value.type as TimelineEventType : "rewind",
    label: typeof value.label === "string" ? value.label : "时间线事件",
    payload: isObject(value.payload)
      ? Object.fromEntries(Object.entries(value.payload).filter(([, item]) => (
          typeof item === "string" || typeof item === "number" || typeof item === "boolean"
        )))
      : {},
  };
}
'''
new = '''function restorePayload(value: unknown): Record<string, string | number | boolean> {
  if (!isObject(value)) return {};
  const payload: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      payload[key] = item;
    }
  }
  return payload;
}

function restoreEvent(value: unknown): TimelineEvent | null {
  if (!isObject(value)) return null;
  if (typeof value.id !== "string" || typeof value.branchId !== "string") return null;
  return {
    id: value.id,
    sequence: typeof value.sequence === "number" ? value.sequence : 0,
    branchId: value.branchId,
    cycle: typeof value.cycle === "number" ? value.cycle : 1,
    monthIndex: typeof value.monthIndex === "number" ? value.monthIndex : 0,
    monthKey: typeof value.monthKey === "string" ? value.monthKey : "",
    type: typeof value.type === "string" ? value.type as TimelineEventType : "rewind",
    label: typeof value.label === "string" ? value.label : "时间线事件",
    payload: restorePayload(value.payload),
  };
}
'''
if old not in text:
    raise RuntimeError("rebirthTimelineState.ts 缺少事件恢复片段")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("timeline typecheck fix applied")
