import { useEffect, useRef } from "react";
import {
  startChapter1,
  stopChapter1,
  setChapter1ChoiceHandler,
} from "./chapter1";
import { StatusBar } from "../../components/StatusBar";
import { FocusSelector } from "../../components/FocusSelector";
import { DecisionCard } from "../../components/DecisionCard";
import { buildMonthScene } from "../../game/content";
import type { GameState, ResearchDecision } from "../../types";

// 第一话的 Pixi'VN spike 视图：
// - 背景画布与叙事状态由 @drincs/pixi-vn 驱动（chapter1.ts）。
// - 决策面板、状态条、日程选择全部复用现有 React 组件，决策仍走引擎。
// 这是为了验证「Pixi'VN 接管 VN runtime + React/引擎原样保留」是否可行。
export function Chapter1Spike({
  state,
  onDecision,
  onFocus,
}: {
  state: GameState;
  onDecision: (decision: ResearchDecision) => void;
  onFocus: (focusId: string) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    // Pixi'VN 选择回传 → 映射到第一话的 ResearchDecision → 走引擎。
    setChapter1ChoiceHandler((decisionId) => {
      const scene = buildMonthScene(0, "2025");
      const decisionNode = scene.nodes.find((node) => node.type === "decision");
      const decision = decisionNode?.decisions?.find((d) => d.id === decisionId);
      if (decision) onDecision(decision);
    });
    const element = canvasRef.current;
    startChapter1(element).catch((error) => console.error("[pixivn-spike]", error));
    return () => stopChapter1();
  }, [onDecision]);

  const scene = buildMonthScene(0, "2025");
  const decisionNode = scene.nodes.find((node) => node.type === "decision");
  const decisions = decisionNode?.decisions ?? [];

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-kicker">重生投研部 · Pixi'VN 第一话 Spike</span>
          <h1>第一话（Pixi'VN runtime 驱动）</h1>
          <p>
            背景画布与叙事状态由 @drincs/pixi-vn 驱动，决策面板与财务逻辑仍由原有
            React + 引擎负责。
          </p>
        </div>
      </header>

      <StatusBar state={state} />

      <section className="vn-stage" aria-label="Pixi'VN 舞台">
        <div
          ref={canvasRef}
          className="pixivn-canvas"
          style={{
            width: 960,
            height: 540,
            background: "#10101c",
            borderRadius: 8,
          }}
        />
      </section>

      <section className="play">
        <div className="question-panel">
          <h2>一月研究选择</h2>
          <FocusSelector state={state} onSelect={onFocus} />
          <div className="options">
            {decisions.map((decision, index) => (
              <DecisionCard
                index={index}
                key={decision.id}
                decision={decision}
                state={state}
                onChoose={onDecision}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
