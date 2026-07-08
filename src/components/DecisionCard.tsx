import type { GameState, ResearchDecision } from "../types";

export function DecisionCard({
  decision,
  index,
  state,
  onChoose,
}: {
  decision: ResearchDecision;
  index: number;
  state: GameState;
  onChoose: (decision: ResearchDecision) => void;
}) {
  const optionLetter = String.fromCharCode(65 + index);
  const locked = state.locked;
  const selected = state.selectedId === decision.id;

  const categoryColors: Record<string, string> = {
    research: "#4b8fe8",
    communication: "#9c78e6",
    risk: "#e7a735",
    life: "#20a978",
  };

  const categoryIcons: Record<string, string> = {
    research: "✦",
    communication: "♢",
    risk: "◇",
    life: "♡",
  };

  const categoryLabels: Record<string, string> = {
    research: "深度研究",
    communication: "沟通协作",
    risk: "保守路线",
    life: "生活优先",
  };

  const className = [
    "option",
    locked && selected ? "correct" : "",
    locked && selected && decision.category === "risk" ? "wrong" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={className} disabled={locked} type="button" onClick={() => onChoose(decision)}>
      <div className="option-kicker">
        <span style={{ borderColor: categoryColors[decision.category] || "#aaa" }}>
          选项 {optionLetter}
        </span>
        <span>{categoryIcons[decision.category]} {categoryLabels[decision.category]}</span>
      </div>
      <div className="option-top">
        <div className="stock-name">
          <strong>{decision.label}</strong>
        </div>
      </div>
      <p className="analysis-note">{decision.description}</p>
      {locked && decision.backgroundNote && (
        <p className="analysis-note" style={{ color: "var(--muted)", fontStyle: "italic" }}>
          {decision.backgroundNote}
        </p>
      )}
    </button>
  );
}
