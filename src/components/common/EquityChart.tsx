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
      {/* Chart Controls: Clean minimal segmented bars */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#181b22]">
        {/* Metric Switcher */}
        <div className="flex items-center gap-1 rounded bg-[#101217] p-0.5 text-xs">
          <button
            onClick={() => setMetric('equity')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              metric === 'equity'
                ? 'bg-[#1b1f28] text-[#e8ebf0] font-medium'
                : 'text-[#6f7584] hover:text-[#b4bac8]'
            }`}
          >
            Equity
          </button>
          <button
            onClick={() => setMetric('pnl')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              metric === 'pnl'
                ? 'bg-[#1b1f28] text-[#e8ebf0] font-medium'
                : 'text-[#6f7584] hover:text-[#b4bac8]'
            }`}
          >
            Net P&L
          </button>
          <button
            onClick={() => setMetric('r')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              metric === 'r'
                ? 'bg-[#1b1f28] text-[#e8ebf0] font-medium'
                : 'text-[#6f7584] hover:text-[#b4bac8]'
            }`}
          >
            R-Multiple
          </button>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-0.5 rounded bg-[#101217] p-0.5 text-xs">
          {(['7D', '30D', '3M', '6M', '1Y', 'ALL'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 text-[11px] rounded transition-colors font-mono ${
                timeframe === tf
                  ? 'bg-[#1b1f28] text-[#e8ebf0] font-medium'
                  : 'text-[#686e7c] hover:text-[#b2b8c5]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Rendering */}
      <div className="relative pt-2">
        {points.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center rounded border border-dashed border-[#1a1d25] bg-[#0c0e13]">
            <div className="text-[#a0a5b2] text-xs font-medium">
              Baseline Capital: ${initialBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[#555a66] text-xs mt-1">
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
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
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
                    stroke="#161820"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-[#5c6170] text-[10px] font-mono tabular-nums"
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
                stroke="#2b2f3c"
                strokeWidth="1"
              />
            )}

            {/* Ultra-subtle area fill */}
            {areaD && <path d={areaD} fill="url(#restrainedEquityFill)" />}

            {/* Clean Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Hover Crosshair & Point */}
            {activePoint && (
              <g>
                <line
                  x1={activePoint.x}
                  y1={padding.top}
                  x2={activePoint.x}
                  y2={padding.top + chartHeight}
                  stroke="#383d4c"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="3.5"
                  className="fill-[#10b981] stroke-[#0c0e12] stroke-2"
                />
              </g>
            )}

            {/* X-axis labels */}
            {points.length > 0 && (
              <>
                <text
                  x={padding.left}
                  y={height - 8}
                  className="fill-[#5c6170] font-mono text-[10px]"
                >
                  {points[0].date}
                </text>
                {points.length > 1 && (
                  <text
                    x={width - padding.right}
                    y={height - 8}
                    textAnchor="end"
                    className="fill-[#5c6170] font-mono text-[10px]"
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
          <div className="pointer-events-none absolute top-3 right-3 rounded border border-[#232734] bg-[#11131a] px-3 py-2 text-xs font-mono shadow-md">
            <div className="text-[#656b78] text-[10px] flex items-center justify-between gap-5">
              <span>{activePoint.point.date} {activePoint.point.time}</span>
              <span>#{activePoint.point.tradeIndex}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-5">
              <span className="text-[#d8dce6] font-medium">{activePoint.point.instrument}</span>
              <span
                className={`font-semibold tabular-nums ${
                  activePoint.point.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}
              >
                {activePoint.point.pnl >= 0 ? '+' : ''}${activePoint.point.pnl.toFixed(2)} ({activePoint.point.r >= 0 ? '+' : ''}{activePoint.point.r}R)
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-[#787f91] flex justify-between gap-4">
              <span>Running Capital</span>
              <span className="text-[#c2c7d4] font-medium tabular-nums">
                ${activePoint.point.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
