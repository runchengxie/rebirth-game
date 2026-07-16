import type {
  ExperienceMode,
  FocusAction,
  ResearchDecision,
} from "../types";
import {
  applyResearchCommitment,
  createAssistedResearchCommitment,
  type ResearchCommitment,
} from "./researchCommitment";

export interface ExperiencePolicy {
  id: ExperienceMode;
  label: string;
  short: string;
  showCareerMetrics: boolean;
  showInvestigation: boolean;
  showResearchBriefs: boolean;
  showResearchCommitment: boolean;
  showSchedule: boolean;
}

export const EXPERIENCE_POLICIES: Record<ExperienceMode, ExperiencePolicy> = {
  romance: {
    id: "romance",
    label: "剧情模式",
    short: "我就想谈恋爱",
    showCareerMetrics: false,
    showInvestigation: false,
    showResearchBriefs: false,
    showResearchCommitment: false,
    showSchedule: false,
  },
  career: {
    id: "career",
    label: "职业模式",
    short: "完整投研与回溯系统",
    showCareerMetrics: true,
    showInvestigation: true,
    showResearchBriefs: true,
    showResearchCommitment: true,
    showSchedule: true,
  },
};

export const ROMANCE_FOCUS: FocusAction = {
  id: "romance_pace",
  label: "从容相处",
  icon: "♡",
  short: "职业细节由系统协助整理",
  detail: "把注意力留给人物、承诺和关系中的边界。",
  researchCredibilityBonus: 0,
  fatigueDelta: 0,
  lifeBalanceDelta: 2,
  teamTrustBonus: 2,
};

export function isExperienceMode(value: unknown): value is ExperienceMode {
  return value === "romance" || value === "career";
}

export function experienceModeFromSearch(search: string): ExperienceMode | null {
  const value = new URLSearchParams(search).get("play");
  return isExperienceMode(value) ? value : null;
}

export function experiencePolicy(mode: ExperienceMode): ExperiencePolicy {
  return EXPERIENCE_POLICIES[mode];
}

const ROMANCE_LEADS = ["lin_ruoning", "chen_xinghe", "zhou_mingzhao"] as const;

function leadRelationEffect(decision: ResearchDecision) {
  return decision.effects.characterRelations
    .filter((effect) => effect.characterId !== "zhao_chengyu")
    .sort((left, right) => right.value - left.value)[0] ?? null;
}

function romanceTieBreak(decision: ResearchDecision): number {
  if (decision.category === "help_colleague") return 2;
  if (decision.category === "self_care") return 1;
  return 0;
}

export function romanceDecisionOptions(
  decisions: ResearchDecision[],
): ResearchDecision[] {
  if (decisions.length <= 3) return decisions;

  const selected = new Map<string, { decision: ResearchDecision; relation: number }>();
  for (const decision of decisions) {
    const effect = leadRelationEffect(decision);
    if (!effect || !ROMANCE_LEADS.includes(effect.characterId as typeof ROMANCE_LEADS[number])) {
      continue;
    }
    const current = selected.get(effect.characterId);
    const shouldReplace = !current
      || effect.value > current.relation
      || (effect.value === current.relation
        && romanceTieBreak(decision) > romanceTieBreak(current.decision));
    if (shouldReplace) selected.set(effect.characterId, { decision, relation: effect.value });
  }

  if (selected.size < 2) return decisions;
  return ROMANCE_LEADS.flatMap((leadId) => {
    const option = selected.get(leadId);
    return option ? [option.decision] : [];
  });
}

function softenHiddenCareerEffects(decision: ResearchDecision): ResearchDecision {
  return {
    ...decision,
    effects: {
      ...decision.effects,
      fatigue: Math.min(0, decision.effects.fatigue),
      lifeBalance: Math.max(0, decision.effects.lifeBalance),
      characterRelations: [...decision.effects.characterRelations],
    },
  };
}

export function prepareDecisionForExperience(
  mode: ExperienceMode,
  decision: ResearchDecision,
  commitment?: ResearchCommitment,
): ResearchDecision {
  if (mode === "romance") {
    const assisted = applyResearchCommitment(
      decision,
      createAssistedResearchCommitment(decision),
    );
    return softenHiddenCareerEffects(assisted);
  }
  return commitment ? applyResearchCommitment(decision, commitment) : decision;
}
