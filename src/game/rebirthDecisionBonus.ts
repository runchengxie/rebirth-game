import type { DecisionMethod } from "../types";

export interface DecisionBonus {
  evidence: number;
  clarity: number;
  risk: number;
  reflection: number;
  fatigue: number;
}

interface DecisionBonusRule extends Partial<DecisionBonus> {
  clueId: string;
  methods?: DecisionMethod[];
}

const DECISION_BONUS_RULES: DecisionBonusRule[] = [
  { clueId: "cost_drop", evidence: 1 },
  {
    clueId: "margin_gap",
    methods: ["fundamental_research", "field_research", "quantitative_research"],
    evidence: 2,
    clarity: 2,
  },
  {
    clueId: "payment_split",
    methods: ["fundamental_research", "field_research", "communication"],
    evidence: 2,
  },
  {
    clueId: "crowding_signal",
    methods: ["quantitative_research", "risk_management"],
    risk: 3,
  },
  { clueId: "competition_risk", risk: 2 },
  { clueId: "clear_head", reflection: 2, fatigue: -2 },
  { clueId: "unit_economics", evidence: 2, clarity: 2 },
  {
    clueId: "raw_factor_sample",
    methods: ["quantitative_research"],
    evidence: 2,
    risk: 2,
  },
  {
    clueId: "staged_entry",
    methods: ["risk_management", "committee_process"],
    clarity: 2,
    risk: 2,
  },

  { clueId: "apr_income_claim", evidence: 1 },
  {
    clueId: "apr_quality_verified",
    methods: ["fundamental_research", "field_research", "committee_process"],
    evidence: 3,
    clarity: 2,
  },
  { clueId: "apr_tariff_exposure", risk: 2 },
  {
    clueId: "apr_price_reaction",
    methods: ["quantitative_research", "communication"],
    evidence: 2,
  },
  { clueId: "apr_hindsight_gap", clarity: 2, reflection: 3 },

  { clueId: "jul_upstream_profit", evidence: 2 },
  {
    clueId: "jul_fund_flow_divergence",
    methods: ["quantitative_research", "fundamental_research"],
    evidence: 2,
    risk: 1,
  },
  { clueId: "jul_chain_heatmap", evidence: 2, clarity: 3 },
  { clueId: "jul_failed_app_sample", evidence: 2, risk: 2, reflection: 1 },
  {
    clueId: "jul_rebalance_plan",
    methods: ["risk_management", "committee_process"],
    clarity: 2,
    risk: 3,
  },

  { clueId: "sep_rule_change", clarity: 1, risk: 1 },
  {
    clueId: "sep_factor_decay",
    methods: ["quantitative_research", "risk_management"],
    evidence: 3,
    risk: 2,
  },
  { clueId: "sep_access_channel", evidence: 1, clarity: 1 },
  {
    clueId: "sep_recalibration_protocol",
    methods: ["collaboration", "quantitative_research", "committee_process"],
    evidence: 2,
    clarity: 3,
    reflection: 1,
  },
  { clueId: "sep_microstructure_risk", risk: 3 },

  { clueId: "dec_full_year_errors", evidence: 2, reflection: 2 },
  { clueId: "dec_memory_provenance", clarity: 2, reflection: 3 },
  { clueId: "dec_counterfactual", evidence: 2, risk: 2, reflection: 2 },
  { clueId: "dec_sustainable_framework", risk: 1, reflection: 2, fatigue: -1 },
  { clueId: "dec_truth_hypothesis", evidence: 3, clarity: 3, risk: 3, reflection: 3 },
];

export function investigationDecisionBonus(
  clueIds: string[],
  method: DecisionMethod,
): DecisionBonus {
  const clues = new Set(clueIds);
  return DECISION_BONUS_RULES.reduce<DecisionBonus>((bonus, rule) => {
    if (!clues.has(rule.clueId)) return bonus;
    if (rule.methods && !rule.methods.includes(method)) return bonus;
    return {
      evidence: bonus.evidence + (rule.evidence ?? 0),
      clarity: bonus.clarity + (rule.clarity ?? 0),
      risk: bonus.risk + (rule.risk ?? 0),
      reflection: bonus.reflection + (rule.reflection ?? 0),
      fatigue: bonus.fatigue + (rule.fatigue ?? 0),
    };
  }, { evidence: 0, clarity: 0, risk: 0, reflection: 0, fatigue: 0 });
}
