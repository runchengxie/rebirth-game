import type { FocusAction, MarketTheme } from "../types";

export interface FocusPresentation {
  label: string;
  short: string;
  detail: string;
}

const MONTH_TASKS = [
  "技术冲击的单位经济性",
  "企业部署和付费意愿",
  "政策到订单的传导",
  "财报验证与关税压力",
  "消费刺激的节奏差",
  "芯片导入和量产良率",
  "算力与应用的景气分层",
  "中报与改革预期",
  "程序化规则变化",
  "三季报和风格轮动",
  "跨年配置与外部风险",
  "年度档案和未来假设",
] as const;

export function focusPresentation(
  focus: FocusAction,
  theme: MarketTheme,
  monthIndex: number,
): FocusPresentation {
  const task = MONTH_TASKS[monthIndex % MONTH_TASKS.length] ?? theme.title;
  if (focus.id === "deep_research") {
    return {
      label: "补齐证据链",
      short: "研究更完整，疲劳上升",
      detail: `把今晚留给「${task}」：补模型、找反例并写清验证时点。质量会上升，状态会被消耗。`,
    };
  }
  if (focus.id === "team_collab") {
    return {
      label: "交叉验证会",
      short: "团队信任上升，结论更可复核",
      detail: `拉同事一起拆「${task}」，让基本面、量价和风控互相找漏洞。个人深挖时间会减少。`,
    };
  }
  return {
    label: "守住判断状态",
    short: "恢复精力，研究进度放缓",
    detail: `停止继续堆信息，给「${theme.title}」留一个睡醒后重新判断的机会。短期产出减少，长期失误概率下降。`,
  };
}
