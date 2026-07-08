import { GAME_DATA } from "../data/gameData";
import { formatMoney } from "../game/engine";
import type { GameState } from "../types";

export function CapitalChart({ state }: { state: GameState }) {
  const data = GAME_DATA[state.year];
  const selectedPath = [state.initialCapital, ...state.history.map((item) => item.after)];
  const bestPath = [state.initialCapital];
  data.months.forEach((month, index) => {
    if (index < state.history.length) {
      const prev = bestPath[bestPath.length - 1];
      bestPath.push(prev * (1 + month.best.returnRate));
    }
  });

  const values = [...selectedPath, ...bestPath, data.targetCapital].filter((value) => value > 0);
  const minLog = Math.log10(Math.max(1, Math.min(...values) * 0.8));
  const maxLog = Math.log10(Math.max(...values) * 1.15);
  const width = 720;
  const height = 260;
  const pad = { left: 48, right: 20, top: 18, bottom: 32 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const maxSteps = data.months.length;

  const x = (index: number) => pad.left + (chartW * index) / maxSteps;
  const y = (value: number) => {
    const log = Math.log10(Math.max(1, value));
    return pad.top + chartH - ((log - minLog) / (maxLog - minLog || 1)) * chartH;
  };
  const path = (items: number[]) => items.map((value, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(value)}`).join(" ");

  return (
    <svg className="capital-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="小金库曲线">
      {[0, 1, 2, 3, 4].map((item) => {
        const yy = pad.top + (chartH * item) / 4;
        return <line className="chart-grid-line" key={item} x1={pad.left} x2={width - pad.right} y1={yy} y2={yy} />;
      })}
      <text className="chart-label" x={pad.left - 8} y={y(state.initialCapital)} textAnchor="end">
        {formatMoney(state.initialCapital)}
      </text>
      <text className="chart-label" x={pad.left - 8} y={y(data.targetCapital)} textAnchor="end">
        {formatMoney(data.targetCapital)}
      </text>
      <line className="chart-target" x1={pad.left} x2={width - pad.right} y1={y(data.targetCapital)} y2={y(data.targetCapital)} />
      <path className="chart-best" d={path(bestPath)} />
      <path className="chart-current" d={path(selectedPath)} />
      {selectedPath.map((value, index) => (
        <circle className="chart-point current" key={`s-${index}`} cx={x(index)} cy={y(value)} r="4" />
      ))}
      {bestPath.map((value, index) => (
        <circle className="chart-point best" key={`b-${index}`} cx={x(index)} cy={y(value)} r="3" />
      ))}
    </svg>
  );
}
