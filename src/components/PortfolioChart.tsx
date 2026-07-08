import { GAME_DATA } from "../data/gameData";
import type { GameState } from "../types";

export function PortfolioChart({ state }: { state: GameState }) {
  const data = GAME_DATA[state.year];
  const selectedPath = [1.0, ...state.history.map((item) => item.portfolioNavAfter)];

  // Build benchmark path from real market data (沪深300 cumulative)
  const benchPath = [1.0];
  for (let i = 0; i < state.history.length; i++) {
    const prev = benchPath[benchPath.length - 1];
    const monthlyReturn = data.benchmarks[i]?.themeReturn || 0;
    benchPath.push(prev * (1 + monthlyReturn));
  }

  // Annual target: benchmark end × 1.2 (跑赢基准 20%)
  const benchFinal = benchPath[benchPath.length - 1] || 1.0;
  const targetLine = Math.max(1.05, benchFinal * 1.2);

  const values = [...selectedPath, ...benchPath, targetLine].filter((v) => v > 0);
  const minV = Math.min(...values) * 0.9;
  const maxV = Math.max(...values) * 1.1;
  const range = maxV - minV || 1;
  const width = 720;
  const height = 260;
  const pad = { left: 48, right: 20, top: 18, bottom: 32 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const maxSteps = data.scenes.length;

  const x = (index: number) => pad.left + (chartW * index) / maxSteps;
  const y = (value: number) => pad.top + chartH - ((value - minV) / range) * chartH;
  const path = (items: number[]) => items.map((value, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(value)}`).join(" ");

  return (
    <svg className="capital-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="研究推荐净值曲线">
      {[0, 1, 2, 3, 4].map((item) => {
        const yy = pad.top + (chartH * item) / 4;
        return <line className="chart-grid-line" key={item} x1={pad.left} x2={width - pad.right} y1={yy} y2={yy} />;
      })}
      <text className="chart-label" x={pad.left - 8} y={y(1.0)} textAnchor="end">
        1.000
      </text>
      <text className="chart-label" x={pad.left - 8} y={y(targetLine)} textAnchor="end">
        {targetLine.toFixed(3)}
      </text>
      <line className="chart-target" x1={pad.left} x2={width - pad.right} y1={y(targetLine)} y2={y(targetLine)} />
      <path className="chart-best" d={path(benchPath)} />
      <path className="chart-current" d={path(selectedPath)} />
      {selectedPath.map((value, index) => (
        <circle className="chart-point current" key={`s-${index}`} cx={x(index)} cy={y(value)} r="4" />
      ))}
      {benchPath.map((value, index) => (
        <circle className="chart-point best" key={`b-${index}`} cx={x(index)} cy={y(value)} r="3" />
      ))}
    </svg>
  );
}
