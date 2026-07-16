import type { ExperienceMode, GameState, ResearchDecision } from "../types";
import { CHARACTERS } from "../game/content";

export function DecisionCard({
  decision,
  experienceMode = "career",
  index,
  state,
  onChoose,
}: {
  decision: ResearchDecision;
  experienceMode?: ExperienceMode;
  index: number;
  state: GameState;
  onChoose: (decision: ResearchDecision) => void;
}) {
  const optionLetter = String.fromCharCode(65 + index);
  const locked = state.locked;
  const selected = state.selectedId === decision.id;
  const romanceLead = [...decision.effects.characterRelations]
    .filter((effect) => effect.characterId !== "zhao_chengyu")
    .sort((left, right) => right.value - left.value)[0];

  const categoryColors: Record<string, string> = {
    deep_research: "#4b8fe8",
    expert_interview: "#7b5ecc",
    roadshow: "#9c78e6",
    risk_alert: "#e7a735",
    self_care: "#20a978",
    help_colleague: "#e8789a",
    committee_defense: "#e07050",
    data_deep_dive: "#4ba0d8",
  };

  const categoryIcons: Record<string, string> = {
    deep_research: "✦",
    expert_interview: "◆",
    roadshow: "♢",
    risk_alert: "◇",
    self_care: "♡",
    help_colleague: "♥",
    committee_defense: "♤",
    data_deep_dive: "♢",
  };

  const categoryLabels: Record<string, string> = {
    deep_research: "深度研究",
    expert_interview: "产业验证",
    roadshow: "路演沟通",
    risk_alert: "风险提示",
    self_care: "生活优先",
    help_colleague: "帮助同事",
    committee_defense: "投委会答辩",
    data_deep_dive: "数据分析",
  };

  const className = [
    "option",
    locked && selected ? "correct" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={className} disabled={locked} type="button" onClick={() => onChoose(decision)}>
      <div className="option-kicker">
        <span style={{ borderColor: categoryColors[decision.category] || "#aaa" }}>
          {experienceMode === "romance" ? "回应" : "选项"} {optionLetter}
        </span>
        {experienceMode === "career" ? (
          <span>{categoryIcons[decision.category]} {categoryLabels[decision.category]}</span>
        ) : (
          <span>♡ {romanceLead ? CHARACTERS[romanceLead.characterId].name : "这段关系"}会记住</span>
        )}
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
