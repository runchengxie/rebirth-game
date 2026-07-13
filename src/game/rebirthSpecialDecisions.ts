import type { GameState, ResearchDecision } from "../types";

function unitEconomicsDecision(): ResearchDecision {
  return {
    id: "2025jan-unit-economics-plan",
    label: "做单位经济性敏感度模型：调用量 × 单价 × 毛利",
    category: "data_deep_dive",
    method: "quantitative_research",
    quality: "sound",
    outcomeAlignment: "supports",
    behaviorTags: ["hypothesis_driven", "crowding_aware"],
    description: "把未来记忆拆成可证伪的经营模型，同时检查调用量增长能否覆盖单价下降和竞争投入。",
    effects: {
      researchCredibility: 12,
      committeeAdoption: 8,
      portfolioNav: 0.012,
      viewAccuracy: 10,
      clientFeedback: 6,
      teamTrust: 7,
      fatigue: 8,
      lifeBalance: -4,
      characterRelations: [
        { characterId: "lin_ruoning", value: 5 },
        { characterId: "chen_xinghe", value: 5 },
      ],
    },
    evidenceLevel: 18,
    clarityLevel: 18,
    riskAwareness: 14,
    reflectionValue: 9,
    backgroundNote: "调用量确实快速增长，但单位成本与竞争投入下降得更快。模型提前暴露了收入与利润的断层。",
    framework: "lin_ruoning",
    businessAngle: "单位经济性与利润传导",
  };
}

function stagedEntryDecision(): ResearchDecision {
  return {
    id: "2025jan-staged-entry-plan",
    label: "先建观察仓，按订单与利润验证分阶段增加暴露",
    category: "risk_alert",
    method: "risk_management",
    quality: "sound",
    outcomeAlignment: "supports",
    behaviorTags: ["downside_defined", "hypothesis_driven"],
    description: "把追涨和等待改成可调整路径，先用小暴露验证，再按业务数据增加权重。",
    effects: {
      researchCredibility: 9,
      committeeAdoption: 7,
      portfolioNav: 0.008,
      viewAccuracy: 8,
      clientFeedback: 5,
      teamTrust: 8,
      fatigue: 4,
      lifeBalance: -1,
      characterRelations: [{ characterId: "zhou_mingzhao", value: 8 }],
    },
    evidenceLevel: 14,
    clarityLevel: 17,
    riskAwareness: 19,
    reflectionValue: 10,
    backgroundNote: "观察仓没有吃满短期涨幅，却保留了验证空间，也避免在商业化分化时承担全部回撤。",
    framework: "zhou_mingzhao",
    businessAngle: "分阶段进入与错误边界",
  };
}

function aprilEvidenceDecision(): ResearchDecision {
  return {
    id: "2025apr-rebuild-evidence",
    label: "重写年初结论：把后来对的结果拆回事前证据",
    category: "committee_defense",
    method: "committee_process",
    quality: "sound",
    outcomeAlignment: "supports",
    behaviorTags: ["hypothesis_driven", "reflective"],
    description: "在投委会公开标记哪些证据当时可得、哪些来自一季报、哪些只是未来记忆留下的方向感。",
    effects: {
      researchCredibility: 14,
      committeeAdoption: 8,
      portfolioNav: 0.01,
      viewAccuracy: 8,
      clientFeedback: 5,
      teamTrust: 10,
      fatigue: 7,
      lifeBalance: -2,
      characterRelations: [{ characterId: "lin_ruoning", value: 8 }],
    },
    evidenceLevel: 19,
    clarityLevel: 20,
    riskAwareness: 15,
    reflectionValue: 14,
    backgroundNote: "你没有拿正确结果替代当时的证据。投委会第一次相信你能够审计自己的先见之明。",
    framework: "lin_ruoning",
    setsFlags: { apr_evidence_rebuilt: true, admitted_hindsight_gap: true },
    businessAngle: "事前证据与事后正确偏差",
  };
}

function julyHeatmapDecision(): ResearchDecision {
  return {
    id: "2025jul-chain-heatmap-plan",
    label: "用产业链热力图重排算力、平台与应用的验证周期",
    category: "deep_research",
    method: "fundamental_research",
    quality: "sound",
    outcomeAlignment: "supports",
    behaviorTags: ["hypothesis_driven", "downside_defined"],
    description: "把分部利润、资金留存和费用投入放进同一张图，分别设置兑现和退出条件。",
    effects: {
      researchCredibility: 13,
      committeeAdoption: 8,
      portfolioNav: 0.012,
      viewAccuracy: 10,
      clientFeedback: 5,
      teamTrust: 8,
      fatigue: 8,
      lifeBalance: -3,
      characterRelations: [
        { characterId: "lin_ruoning", value: 6 },
        { characterId: "zhou_mingzhao", value: 4 },
      ],
    },
    evidenceLevel: 19,
    clarityLevel: 18,
    riskAwareness: 17,
    reflectionValue: 10,
    backgroundNote: "热力图没有把整个 AI 产业链压成一个方向。上游景气、平台议价和应用盈利终于各自接受验证。",
    framework: "lin_ruoning",
    setsFlags: { jul_chain_heatmap_used: true },
    businessAngle: "产业链分化与验证周期",
  };
}

function julyHybridDecision(): ResearchDecision {
  return {
    id: "2025jul-hybrid-rebalance",
    label: "恢复失败样本后做分层再平衡，不再用单一路线解释全产业链",
    category: "risk_alert",
    method: "risk_management",
    quality: "sound",
    outcomeAlignment: "supports",
    behaviorTags: ["crowding_aware", "downside_defined", "reflective"],
    description: "保留算力景气暴露，降低未见利润拐点的应用权重，并约定资金与业务再次共振时再调整。",
    effects: {
      researchCredibility: 11,
      committeeAdoption: 9,
      portfolioNav: 0.01,
      viewAccuracy: 11,
      clientFeedback: 6,
      teamTrust: 9,
      fatigue: 5,
      lifeBalance: -1,
      characterRelations: [
        { characterId: "chen_xinghe", value: 6 },
        { characterId: "zhou_mingzhao", value: 6 },
      ],
    },
    evidenceLevel: 18,
    clarityLevel: 18,
    riskAwareness: 20,
    reflectionValue: 13,
    backgroundNote: "被删掉的失败样本改变了仓位，而没有抹掉长期判断。研究和交易终于允许拥有不同时间尺度。",
    framework: "zhou_mingzhao",
    setsFlags: { jul_hybrid_framework: true },
    businessAngle: "失败样本与分层再平衡",
  };
}

function septemberProtocolDecision(): ResearchDecision {
  return {
    id: "2025sep-shared-protocol",
    label: "提交研究、量化与风控共同校准的新规适配协议",
    category: "help_colleague",
    method: "collaboration",
    quality: "sound",
    outcomeAlignment: "supports",
    behaviorTags: ["hypothesis_driven", "crowding_aware", "reflective"],
    description: "统一样本、交易成本、失效定义和风险边界，再用共同口径判断哪些因子真的改变。",
    effects: {
      researchCredibility: 12,
      committeeAdoption: 8,
      portfolioNav: 0.008,
      viewAccuracy: 10,
      clientFeedback: 4,
      teamTrust: 14,
      fatigue: 7,
      lifeBalance: -2,
      characterRelations: [
        { characterId: "chen_xinghe", value: 7 },
        { characterId: "zhao_chengyu", value: 8 },
        { characterId: "zhou_mingzhao", value: 5 },
      ],
    },
    evidenceLevel: 18,
    clarityLevel: 19,
    riskAwareness: 18,
    reflectionValue: 11,
    backgroundNote: "闭门权限没有变成独家答案，而是变成全组都能复算的新协议。组织信用第一次直接改变了研究流程。",
    framework: "chen_xinghe",
    setsFlags: { sep_shared_protocol: true, organization_access_used_well: true },
    businessAngle: "规则变化、组织权限与共同校准",
  };
}

function decemberTruthDecision(): ResearchDecision {
  return {
    id: "2025dec-truth-audit",
    label: "在年度策略会上公开提出：未来记忆本身也需要审计",
    category: "committee_defense",
    method: "committee_process",
    quality: "sound",
    outcomeAlignment: "supports",
    behaviorTags: ["hypothesis_driven", "downside_defined", "reflective"],
    description: "展示全年档案、失败反事实和记忆来源比对，承认自己记住的未来可能被事后共识污染。",
    effects: {
      researchCredibility: 16,
      committeeAdoption: 10,
      portfolioNav: 0.006,
      viewAccuracy: 10,
      clientFeedback: 8,
      teamTrust: 14,
      fatigue: 6,
      lifeBalance: 1,
      characterRelations: [
        { characterId: "lin_ruoning", value: 6 },
        { characterId: "chen_xinghe", value: 6 },
        { characterId: "zhou_mingzhao", value: 6 },
        { characterId: "zhao_chengyu", value: 4 },
      ],
    },
    evidenceLevel: 20,
    clarityLevel: 20,
    riskAwareness: 20,
    reflectionValue: 15,
    backgroundNote: "你没有证明自己永远正确。你证明了即使知道未来，也愿意让记忆接受证据、反例和边界的审计。",
    framework: "zhou_mingzhao",
    setsFlags: {
      rebirth_truth_route: true,
      memory_source_admitted: true,
      truth_model_completed: true,
    },
    businessAngle: "未来记忆的来源审计",
  };
}

function includesAll(completed: string[], required: string[]): boolean {
  return required.every((id) => completed.includes(id));
}

export function specialDecisionsForInvestigation(
  state: GameState,
  completed: string[],
): ResearchDecision[] {
  if (state.year !== "2025" || state.locked) return [];

  if (state.monthIndex === 0) {
    return [
      ...(completed.includes("unit_economics") ? [unitEconomicsDecision()] : []),
      ...(completed.includes("staged_entry") ? [stagedEntryDecision()] : []),
    ];
  }
  if (state.monthIndex === 3 && completed.includes("apr_hindsight_audit")) {
    return [aprilEvidenceDecision()];
  }
  if (state.monthIndex === 6) {
    return [
      ...(completed.includes("jul_chain_heatmap") ? [julyHeatmapDecision()] : []),
      ...(includesAll(completed, ["jul_failure_sample", "jul_rebalance"])
        ? [julyHybridDecision()]
        : []),
    ];
  }
  if (state.monthIndex === 8 && completed.includes("sep_shared_protocol")) {
    return [septemberProtocolDecision()];
  }
  if (state.monthIndex === 11 && completed.includes("dec_truth_synthesis")) {
    return [decemberTruthDecision()];
  }
  return [];
}
