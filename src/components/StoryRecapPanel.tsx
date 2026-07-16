import { CHARACTERS } from "../game/content";
import { gradeReviewText, postMortem } from "../game/engine";
import type { ExperienceMode, GameState, RoundResult } from "../types";

export function StoryRecapPanel({
  experienceMode = "career",
  result,
  state,
}: {
  experienceMode?: ExperienceMode;
  result: RoundResult | undefined;
  state: GameState;
}) {
  if (!result) return null;
  const character = CHARACTERS[result.characterId];
  const gradeReview = result.score ? gradeReviewText(result.characterId, result.score.grade) : "";
  const pm = postMortem(result.selected, result.label);

  const card = result.knowledgeCardId
    ? state.knowledgeCards.find((k) => k.id === result.knowledgeCardId)
    : undefined;

  return (
    <div className={`story-recap ${character.color}`} aria-label="同事复盘">
      <span>{character.name}的复盘</span>
      <p>{experienceMode === "romance" ? result.outcome.dialogue : gradeReview}</p>
      {experienceMode === "career" ? <p className="story-recap-detail">{pm}</p> : null}
      {experienceMode === "career" && result.businessVerdict ? (
        <div className="business-verdict">
          <strong>业务事实结算</strong>
          <p>{result.businessVerdict}</p>
        </div>
      ) : null}
      {experienceMode === "career" && card ? (
        <div className={`knowledge-card ${CHARACTERS[card.mentorId].color}`}>
          <strong>本月学到 · {card.concept}</strong>
          <p>{CHARACTERS[card.mentorId].name}：{card.mentorLine}</p>
          {card.learningRef ? <small>{card.learningRef}</small> : null}
        </div>
      ) : null}
    </div>
  );
}
