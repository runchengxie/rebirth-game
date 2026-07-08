import { formatPct, primarySignalLabel, riskLabel, analysisNote } from "../game/engine";
import type { GameState, StockOption } from "../types";

export function OptionCard({
  option,
  index,
  state,
  onChoose,
}: {
  option: StockOption;
  index: number;
  state: GameState;
  onChoose: (option: StockOption) => void;
}) {
  const optionLetter = String.fromCharCode(65 + index);
  const locked = state.locked;
  const selected = state.selectedId === option.id;
  const className = [
    "option",
    locked && option.isBest ? (selected ? "correct" : "missed") : "",
    locked && selected && !option.isBest ? "wrong" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={className} disabled={locked} type="button" onClick={() => onChoose(option)}>
      <div className="option-kicker">
        <span>实战卡 {optionLetter}</span>
        <span>{primarySignalLabel(option)}</span>
      </div>
      <div className="option-top">
        <div className="stock-name">
          <strong>{option.name}</strong>
          <span>{option.tsCode}</span>
        </div>
        <span className="rank-badge">{riskLabel(option)}</span>
      </div>
      <div className="meta">
        {option.industry} · {option.market || option.board || "A 股"} · 活跃 #{option.activeRank}
      </div>
      <p className="analysis-note">{analysisNote(option, locked)}</p>
      <div className="option-bottom">
        <span className={locked ? `return ${option.returnRate >= 0 ? "up" : "down"}` : "hidden-return"}>
          {locked ? formatPct(option.returnRate) : "本话结局待揭晓"}
        </span>
        <span className="meta">{locked ? `涨幅 #${option.returnRank}` : `交易日 ${option.tradingDays}`}</span>
      </div>
    </button>
  );
}
