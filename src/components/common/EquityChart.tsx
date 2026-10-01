import React, { useState, useMemo, useRef } from 'react';
import { Trade } from '../../types/trade';
import { buildEquityCurve } from '../../utils/calculations';

interface EquityChartProps {
  trades: Trade[];
  initialBalance?: number;
}

export const EquityChart: React.FC<EquityChartProps> = ({
  trades,
  initialBalance = 50000,
}) => {
  const [metric, setMetric] = useState<'pnl' | 'r' | 'equity'>('equity');
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const points = useMemo(() => {
    return buildEquityCurve(trades, initialBalance, metric, timeframe);
  }, [trades, initialBalance, metric, timeframe]);

  // Compute SVG dimensions and scale
  const width = 800;
  const height = 280;
  const padding = { top: 24, right: 28, bottom: 32, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { minVal, maxVal, pathD, areaD, coords, zeroY } = useMemo(() => {
    if (points.length === 0) {
      return { minVal: 0, maxVal: 1, pathD: '', areaD: '', coords: [], zeroY: height / 2 };
    }

    let min = Math.min(...points.map(p => p.value));
    let max = Math.max(...points.map(p => p.value));

    if (min === max) {
      min -= 10;
      max += 10;
    }
    const valRange = max - min;
    const paddedMin = min - valRange * 0.05;
    const paddedMax = max + valRange * 0.05;
    const totalRange = paddedMax - paddedMin || 1;

    const coords = points.map((p, idx) => {
      const x = padding.left + (idx / Math.max(1, points.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((p.value - paddedMin) / totalRange) * chartHeight;
      return { x, y, point: p };
    });

    const pathD = coords.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');

    const zeroY = padding.top + chartHeight - ((0 - paddedMin) / totalRange) * chartHeight;
    const baselineY = Math.min(Math.max(zeroY, padding.top), padding.top + chartHeight);

    const firstX = coords[0]?.x || padding.left;
    const lastX = coords[coords.length - 1]?.x || padding.left + chartWidth;
    const areaD = `${pathD} L ${lastX} ${padding.top + chartHeight} L ${firstX} ${padding.top + chartHeight} Z`;

    return {
      minVal: paddedMin,
      maxVal: paddedMax,
      pathD,
      areaD,
      coords,
      zeroY: baselineY,
    };
  }, [points, chartWidth, chartHeight]);

  const activePoint = hoveredIndex !== null && coords[hoveredIndex] ? coords[hoveredIndex] : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || coords.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relativeX = (mouseX / rect.width) * width;

    let nearestIdx = 0;
    let minDistance = Infinity;
    coords.forEach((c, idx) => {
      const dist = Math.abs(c.x - relativeX);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = idx;
      }
    });
    setHoveredIndex(nearestIdx);
  };

  const formatYAxis = (val: number) => {
    if (metric === 'r') return `${val >= 0 ? '+' : ''}${val.toFixed(1)}R`;
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${Math.round(val)}`;
  };

  return (
    <div className="relative select-none" ref={containerRef}>
      {/* Chart Controls: Clean minimal segmented bars (Liquid Glass) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        {/* Metric Switcher */}
        <div className="flex items-center gap-1 rounded-xl liquid-glass-pill p-1 text-xs">
          <button
            onClick={() => setMetric('equity')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              metric === 'equity'
                ? 'segment-active font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Equity Curve
          </button>
          <button
            onClick={() => setMetric('pnl')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              metric === 'pnl'
                ? 'segment-active font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Net Realized P&L
          </button>
          <button
            onClick={() => setMetric('r')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              metric === 'r'
                ? 'segment-active font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            R-Multiple (Risk)
          </button>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-1 rounded-xl liquid-glass-pill p-1 text-xs">
          {(['7D', '30D', '3M', '6M', '1Y', 'ALL'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-[11px] rounded-lg transition-all font-mono font-medium ${
                timeframe === tf
                  ? 'segment-active font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Rendering */}
      <div className="relative pt-3">
        {points.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01]">
            <div className="text-slate-300 text-xs font-semibold">
              Baseline Capital: ${initialBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-slate-500 text-xs mt-1">
              No executions logged yet. The equity trajectory will render once trades are logged.
            </div>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-64 md:h-72 overflow-visible cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="restrainedEquityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5A1F" stopOpacity="0.32" />
                <stop offset="60%" stopColor="#FF5A1F" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#FF5A1F" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="emberEquityStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF9A66" />
                <stop offset="50%" stopColor="#FF5A1F" />
                <stop offset="100%" stopColor="#FF3D00" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding.top + chartHeight * ratio;
              const val = maxVal - (maxVal - minVal) * ratio;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] font-mono tabular-nums"
                  >
                    {formatYAxis(val)}
                  </text>
                </g>
              );
            })}

            {/* Baseline 0 for PnL / R */}
            {(metric === 'pnl' || metric === 'r') && zeroY >= padding.top && zeroY <= padding.top + chartHeight && (
              <line
                x1={padding.left}
                y1={zeroY}
                x2={width - padding.right}
                y2={zeroY}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            )}

            {/* Area fill */}
            {areaD && <path d={areaD} fill="url(#restrainedEquityFill)" />}

            {/* Equity line */}
            {pathD && (
              <>
                {/* Crisp core stroke */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#emberEquityStroke)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Hover Crosshair & Point */}
            {activePoint && (
              <g>
                <line
                  x1={activePoint.x}
                  y1={padding.top}
                  x2={activePoint.x}
                  y2={padding.top + chartHeight}
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="5"
                  className="fill-[#FF5A1F] stroke-[#050505] stroke-2 shadow-lg"
                />
              </g>
            )}

            {/* X-axis labels */}
            {points.length > 0 && (
              <>
                <text
                  x={padding.left}
                  y={height - 8}
                  className="fill-slate-500 font-mono text-[10px]"
                >
                  {points[0].date}
                </text>
                {points.length > 1 && (
                  <text
                    x={width - padding.right}
                    y={height - 8}
                    textAnchor="end"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {points[points.length - 1].date}
                  </text>
                )}
              </>
            )}
          </svg>
        )}

        {/* Clean Hover Tooltip */}
        {activePoint && (
          <div className="pointer-events-none absolute top-4 right-4 rounded-2xl border border-white/[0.12] bg-[#0A0A0C]/95 p-3.5 text-xs font-mono shadow-2xl backdrop-blur-xl">
            <div className="text-slate-400 text-[10px] flex items-center justify-between gap-6 pb-1.5 border-b border-white/[0.06]">
              <span>{activePoint.point.date} {activePoint.point.time}</span>
              <span className="font-semibold text-slate-300">Trade #{activePoint.point.tradeIndex}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-6">
              <span className="text-white font-bold">{activePoint.point.instrument}</span>
              <span
                className={`font-bold tabular-nums text-sm ${
                  activePoint.point.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {activePoint.point.pnl >= 0 ? '+' : ''}${activePoint.point.pnl.toFixed(2)} ({activePoint.point.r >= 0 ? '+' : ''}{activePoint.point.r}R)
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex justify-between gap-6">
              <span>Account Equity</span>
              <span className="text-slate-200 font-bold tabular-nums">
                ${activePoint.point.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
