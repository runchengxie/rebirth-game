// ═══════════════════════════════════════════════════════════
// Chapter 1 — Pixi'VN runtime spike
// ═══════════════════════════════════════════════════════════
//
// 这是一次「概念验证」(spike)，目标是验证：能否用 @drincs/pixi-vn
// （作为 npm 依赖，不 fork）接管第一话的 VN runtime，同时保留原有
// React 面板与财务模拟逻辑。
//
// 职责划分（与文章建议一致）：
//   - Pixi'VN 负责：背景画布 + 叙事状态机（narration.dialogue / choices）。
//   - React 负责：所有 UI（决策卡、状态条、日程选择），直接复用现有组件。
//   - 引擎负责：makeDecision / 评分 / 关系 / 结算（src/game/engine.ts 原样不动）。
//
// 本文件只做「叙事层」的接线，不碰任何财务逻辑。

import { Game } from "@drincs/pixi-vn";
import {
  narration,
  newLabel,
  newChoiceOption,
  type Label,
} from "@drincs/pixi-vn/narration";
import { buildMonthScene } from "../../game/content";
import type { ResearchDecision } from "../../types";

const CHAPTER1_ID = "spike-chapter1";

type ChoiceHandler = (decisionId: string) => void;

let choiceHandler: ChoiceHandler | null = null;

/** 由 React 侧注册：当玩家在 Pixi'VN 叙事里做出某个选择时回调。 */
export function setChapter1ChoiceHandler(handler: ChoiceHandler): void {
  choiceHandler = handler;
}

function month1Decisions(): ResearchDecision[] {
  const scene = buildMonthScene(0, "2025");
  const decisionNode = scene.nodes.find((node) => node.type === "decision");
  return decisionNode?.decisions ?? [];
}

// 每个选项对应一个极短的 label：被选中时把 decision id 回传给 React/引擎。
function choiceLabelFor(decisionId: string): Label {
  return newLabel(`spike-choice-${decisionId}`, [
    () => {
      choiceHandler?.(decisionId);
    },
  ]);
}

// 第一话叙事：展示一月主题的开场白，并把 6 个研究方向填入 Pixi'VN 的
// 选择状态（narration.choices）。这一状态可由 UI 消费，此处用于证明
// Pixi'VN 的叙事状态机能承载第一话内容。
export const chapter1Label = newLabel(CHAPTER1_ID, [
  () => {
    const decisions = month1Decisions();
    narration.dialogue = {
      character: "林若宁",
      text: "一月，DeepSeek-R1 震撼发布。这一年，从拆产业链三层结构开始。",
    };
    narration.choices = decisions.map((decision) =>
      newChoiceOption(decision.label, choiceLabelFor(decision.id), {}),
    );
  },
]);

let started = false;

export async function startChapter1(container: HTMLElement): Promise<void> {
  if (started) return;
  await Game.init(container, {
    width: 960,
    height: 540,
    backgroundColor: "#10101c",
  });
  await Game.start(chapter1Label, {});
  started = true;
}

export function stopChapter1(): void {
  Game.clear();
  started = false;
}
