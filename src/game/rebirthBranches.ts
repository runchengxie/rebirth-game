import type { Branch, BranchCondition, CharacterId, SceneNode } from "../types";
import { CHARACTERS } from "./characters";

function monthIs(monthIndex: number): BranchCondition {
  return {
    kind: "and",
    of: [
      { kind: "month", gte: monthIndex },
      { kind: "not", of: { kind: "month", gte: monthIndex + 1 } },
    ],
  };
}

function node(
  id: string,
  characterId: CharacterId,
  mood: string,
  text: string,
): SceneNode {
  return {
    id,
    type: "dialogue",
    characterId,
    speaker: CHARACTERS[characterId].name,
    role: CHARACTERS[characterId].role,
    mood,
    text,
    prompt: "点击继续。",
    pose: "thinking",
    bg: "research-room",
    bgm: "morning-loop",
    voiceCue: "key",
  };
}

export const REBIRTH_BRANCHES: Branch[] = [
  {
    id: "rebirth-apr-hindsight",
    label: "第二周目·事后正确审计",
    when: {
      kind: "and",
      of: [monthIs(3), { kind: "cycle", gte: 2 }, { kind: "memoryKey", key: "causal_gap" }],
    },
    once: true,
    injectAt: "after-memory",
    contribute: {
      nodes: [
        node(
          "rebirth-apr-hindsight-node",
          "lin_ruoning",
          "认真",
          "林若宁把你一月的旧结论和新披露的一季报并排放好。\n\n这次先别告诉我你后来记得什么。把当时已经有的证据圈出来，再把后来补上的信息放到另一边。结论对，不等于当时的推导已经完整。",
        ),
      ],
      setFlags: { rebirth_apr_hindsight_seen: true },
    },
  },
  {
    id: "rebirth-jul-failure-sample",
    label: "第二周目·恢复失败应用样本",
    when: {
      kind: "and",
      of: [monthIs(6), { kind: "cycle", gte: 2 }, { kind: "memoryKey", key: "sample_pollution" }],
    },
    once: true,
    injectAt: "after-memory",
    contribute: {
      nodes: [
        node(
          "rebirth-jul-failure-sample-node",
          "chen_xinghe",
          "警觉",
          "陈星禾没有展示那条最漂亮的收益曲线。她先打开了被删掉的公司列表。\n\n上次我们只记住跑出来的样本。这次先看没跑出来的。应用端盈利拐点晚了多久，得让失败公司一起回答。",
        ),
      ],
      setFlags: { rebirth_jul_failure_sample_seen: true },
    },
  },
  {
    id: "rebirth-sep-access",
    label: "第二周目·组织权限也是研究能力",
    when: {
      kind: "and",
      of: [monthIs(8), { kind: "cycle", gte: 2 }, { kind: "memoryKey", key: "sample_pollution" }],
    },
    once: true,
    injectAt: "after-memory",
    contribute: {
      nodes: [
        node(
          "rebirth-sep-access-node",
          "zhao_chengyu",
          "认真",
          "赵承宇把闭门回测的权限申请停在确认页面。\n\n这份数据不是因为你猜对过才给你。你以前愿意把口径摊开，也替别人扛过一次复算。权限是这么攒出来的，用完以后也得让别人能复算。",
        ),
      ],
      setFlags: { rebirth_sep_access_seen: true },
    },
  },
  {
    id: "rebirth-dec-truth",
    label: "第二周目·未来记忆来源审计",
    when: {
      kind: "and",
      of: [
        monthIs(11),
        { kind: "cycle", gte: 2 },
        { kind: "memoryKey", key: "causal_gap" },
        { kind: "memoryKey", key: "sample_pollution" },
      ],
    },
    once: true,
    injectAt: "after-memory",
    contribute: {
      nodes: [
        node(
          "rebirth-dec-truth-node",
          "zhou_mingzhao",
          "观察",
          "周明昭把你的未来记忆、全年档案和失败月份排成三列。\n\n你确实知道一些后来发生的事。现在的问题是，那些细节来自亲历，来自后来反复出现的标题，还是来自你为了让过去合理而补上的解释。记忆也要接受压力测试。",
        ),
      ],
      setFlags: { rebirth_dec_truth_seen: true },
    },
  },
  {
    id: "office-postit-followup",
    label: "便签墙回调",
    when: {
      kind: "and",
      of: [monthIs(3), { kind: "flag", key: "office_postits_reviewed" }],
    },
    once: true,
    contribute: {
      nodes: [
        node(
          "office-postit-followup-node",
          "lin_ruoning",
          "温和",
          "林若宁看见你把旧便签按证据缺口重新排了一遍。\n\n你终于没把这些当成好感纪念品。便签留下来，是为了提醒下一次少跳一步。",
        ),
      ],
      setFlags: { office_postit_followup_seen: true },
    },
  },
];
