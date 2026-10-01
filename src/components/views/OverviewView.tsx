import React, { useMemo } from 'react';
import { Trade } from '../../types/trade';
import { PerformanceStats } from '../../utils/calculations';
import { EquityChart } from '../common/EquityChart';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ShieldCheck,
  Target,
  Sparkles,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';

interface OverviewViewProps {
  trades: Trade[];
  stats: PerformanceStats;
  onSelectTrade: (trade: Trade) => void;
  onViewAllTrades: () => void;
}

// 1. High-Tech Circular Gauge (Umber Style - Image 2)
interface CircularGaugeProps {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  color?: string;
  displayValue?: string;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  max = 100,
  label,
  sublabel,
  color = '#10B981',
  displayValue,
}) => {
  const radius = 38;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-between p-3.5 rounded-2xl liquid-glass-card group">
      <div className="relative flex items-center justify-center my-1">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          {/* Subtle track */}
          <circle
            stroke="rgba(255, 255, 255, 0.08)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Neon progress arc */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold font-mono text-white tabular-nums tracking-tight">
            {displayValue || `${value.toFixed(1)}%`}
          </span>
        </div>
      </div>
      <span className="mt-1 text-xs font-semibold text-slate-200 tracking-tight group-hover:text-white transition-colors">
        {label}
      </span>
      {sublabel && (
        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{sublabel}</span>
      )}
    </div>
  );
};

// 2. Mini Ticker Sparkline Card (Tradervue & Umber Style - Images 2 & 3)
interface TickerCardProps {
  symbol: string;
  tradesCount: number;
  winRate: number;
  totalPnl: number;
  points: number[];
}

const TickerCard: React.FC<TickerCardProps> = ({
  symbol,
  tradesCount,
  winRate,
  totalPnl,
  points,
}) => {
  const isPositive = totalPnl >= 0;
  const strokeColor = isPositive ? '#10B981' : '#F43F5E';

  // SVG mini sparkline path builder
  const width = 80;
  const height = 30;
  const pathD = useMemo(() => {
    if (!points || points.length === 0) return '';
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    return points.reduce((acc, val, i) => {
      const x = (i / Math.max(1, points.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [points]);

  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-card group">
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white font-mono tracking-tight">{symbol}</span>
          <span className="text-[10px] text-slate-400 font-mono">({tradesCount} trades)</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`font-mono text-xs font-semibold tabular-nums ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? '+' : ''}${totalPnl.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {winRate.toFixed(0)}% WR
          </span>
        </div>
      </div>

      <div className="flex items-center">
        {pathD ? (
          <svg width={width} height={height} className="overflow-visible">
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div className="h-6 w-12 rounded bg-white/[0.04] flex items-center justify-center text-[10px] text-slate-600 font-mono">
            -
          </div>
        )}
      </div>
    </div>
  );
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  trades,
  stats,
  onSelectTrade,
  onViewAllTrades,
}) => {
  const recentTrades = useMemo(() => {
    return [...trades]
      .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime())
      .slice(0, 8);
  }, [trades]);

  const netPnlPercent = stats.initialBalance > 0
    ? (stats.totalPnl / stats.initialBalance) * 100
    : 0;

  // 1. Weekly Calendar Strip data (Tradervue Style - Image 3)
  const weeklyStrip = useMemo(() => {
    // Generate dates for current week or recent 7 calendar days
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('en-US', { day: '2-digit' });

      const dayTrades = trades.filter(t => t.date === dateStr);
      const dayPnl = dayTrades.reduce((acc, curr) => acc + curr.pnl, 0);

      days.push({
        dateStr,
        dayName,
        dayNum,
        tradesCount: dayTrades.length,
        pnl: dayPnl,
        isToday: i === 0,
      });
    }
    return days;
  }, [trades]);

  // 2. Traded Tickers Aggregation (Top 4 traded assets)
  const tickerStats = useMemo(() => {
    const map: Record<string, { trades: Trade[]; pnl: number; wins: number; points: number[] }> = {};
    const sortedChronological = [...trades].sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

    sortedChronological.forEach(t => {
      const sym = t.instrument.toUpperCase();
      if (!map[sym]) {
        map[sym] = { trades: [], pnl: 0, wins: 0, points: [0] };
      }
      map[sym].trades.push(t);
      map[sym].pnl += t.pnl;
      if (t.pnl > 0) map[sym].wins++;
      const lastVal = map[sym].points[map[sym].points.length - 1];
      map[sym].points.push(lastVal + t.pnl);
    });

    return Object.entries(map)
      .map(([sym, item]) => ({
        symbol: sym,
        tradesCount: item.trades.length,
        winRate: item.trades.length > 0 ? (item.wins / item.trades.length) * 100 : 0,
        totalPnl: item.pnl,
        points: item.points,
      }))
      .sort((a, b) => b.tradesCount - a.tradesCount)
      .slice(0, 4);
  }, [trades]);

  return (
    <div className="space-y-6 max-w-[1500px]">
      {/* 1. TOP HERO: Portfolio & Net Equity Header (Liquid Glass) */}
      <section className="p-6 rounded-2xl liquid-glass-card relative overflow-hidden shadow-2xl">
        {/* Subtle Ambient Backlight Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/[0.05] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Equity Callout */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Total Portfolio Capital
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-4">
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white font-mono tabular-nums">
                ${stats.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl liquid-glass-pill">
                {stats.totalPnl >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-rose-400" />
                )}
                <span
                  className={`font-mono font-bold text-xs tabular-nums ${
                    stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
                </span>
                <span className={`text-[11px] font-mono font-semibold ${stats.totalPnl >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>
                  ({stats.totalPnl >= 0 ? '+' : ''}{netPnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar (Liquid Glass Pills) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs font-mono">
            <div className="p-3.5 rounded-xl liquid-glass-pill">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Today's P&L</div>
              <div
                className={`text-sm font-bold tabular-nums mt-1 ${
                  stats.todayPnl > 0
                    ? 'text-emerald-400'
                    : stats.todayPnl < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {stats.todayPnl >= 0 ? '+' : ''}${stats.todayPnl.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl liquid-glass-pill">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Monthly P&L</div>
              <div
                className={`text-sm font-bold tabular-nums mt-1 ${
                  stats.monthlyPnl > 0
                    ? 'text-emerald-400'
                    : stats.monthlyPnl < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {stats.monthlyPnl >= 0 ? '+' : ''}${stats.monthlyPnl.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl liquid-glass-pill">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Initial Base</div>
              <div className="text-sm font-bold tabular-nums text-slate-100 mt-1">
                ${stats.initialBalance.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl liquid-glass-pill">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Executions</div>
              <div className="text-sm font-bold tabular-nums text-slate-100 mt-1">
                {stats.totalTrades} Logged
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. RECENT 7-DAYS CALENDAR STRIP (Tradervue Style - Image 3) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-300 tracking-tight">Recent Daily P&L Rhythm</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Last 7 Trading Sessions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {weeklyStrip.map(day => {
            const hasTrades = day.tradesCount > 0;
            const isProfit = day.pnl > 0;
            const isLoss = day.pnl < 0;

            return (
              <div
                key={day.dateStr}
                className={`p-3 rounded-xl transition-all ${
                  day.isToday
                    ? 'liquid-glass-pill border-emerald-500/40'
                    : 'liquid-glass-pill hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-slate-300">{day.dayName}</span>
                  <span className="text-[10px] text-slate-500">{day.dayNum}</span>
                </div>
                <div className="mt-2">
                  <div
                    className={`font-mono text-xs font-bold tabular-nums ${
                      isProfit
                        ? 'text-emerald-400'
                        : isLoss
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {hasTrades ? (
                      <>
                        {isProfit ? '+' : ''}${day.pnl.toFixed(2)}
                      </>
                    ) : (
                      '$0.00'
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {day.tradesCount} {day.tradesCount === 1 ? 'trade' : 'trades'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. CIRCULAR GAUGES & TICKER SPARKLINES (Liquid Glass Containers) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 4 Circular Dials (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl liquid-glass-card shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Execution Quality Gauges
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Algorithm V2.4
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CircularGauge
              value={stats.winRate}
              label="Win Rate"
              sublabel={`${stats.winCount}W / ${stats.lossCount}L`}
              color="#FF5A1F"
              displayValue={`${stats.winRate.toFixed(1)}%`}
            />

            <CircularGauge
              value={Math.min(100, (stats.profitFactor / 3) * 100)}
              max={100}
              label="Profit Factor"
              sublabel={stats.profitFactor >= 2 ? 'Elite Edge' : 'Stable'}
              color="#FF7A29"
              displayValue={stats.profitFactor.toFixed(2)}
            />

            <CircularGauge
              value={Math.min(100, Math.max(0, (stats.expectancy + 1) * 35))}
              max={100}
              label="Expectancy"
              sublabel="R / Trade"
              color="#FF9A66"
              displayValue={`${stats.expectancy >= 0 ? '+' : ''}${stats.expectancy}R`}
            />

            <CircularGauge
              value={Math.max(0, 100 - stats.maxDrawdownPercent * 4)}
              max={100}
              label="Risk Health"
              sublabel={`-${stats.maxDrawdownPercent.toFixed(1)}% DD`}
              color={stats.maxDrawdownPercent < 5 ? '#FF5A1F' : '#F59E0B'}
              displayValue={`${Math.max(0, Math.round(100 - stats.maxDrawdownPercent * 4))}%`}
            />
          </div>
        </div>

        {/* Right: Traded Asset Ticker Sparklines (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl liquid-glass-card shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Core Traded Assets
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Performance by Ticker</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tickerStats.length > 0 ? (
              tickerStats.map(item => (
                <TickerCard
                  key={item.symbol}
                  symbol={item.symbol}
                  tradesCount={item.tradesCount}
                  winRate={item.winRate}
                  totalPnl={item.totalPnl}
                  points={item.points}
                />
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-xs text-slate-500 font-mono">
                Log trades to view ticker breakdown & sparklines.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. PRIMARY EQUITY PERFORMANCE CURVE */}
      <section className="p-5 rounded-2xl liquid-glass-card shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-1 bg-white/70 rounded-full" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Equity & Trajectory Dynamics
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Compounded realized account trajectory
          </span>
        </div>
        <EquityChart trades={trades} initialBalance={stats.initialBalance} />
      </section>

      {/* 5. SUMMARY METRICS ROW */}
      <section className="p-4 rounded-2xl liquid-glass-card shadow-xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs font-mono divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
          <div className="pt-2 sm:pt-0 sm:pr-4">
            <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">Win Rate</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white tabular-nums">
                {stats.winRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400">
                ({stats.winCount}W/{stats.lossCount}L)
              </span>
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">Profit Factor</span>
            <div className="mt-1 text-base font-bold text-white tabular-nums">
              {stats.profitFactor.toFixed(2)}
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">Expectancy</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-base font-bold tabular-nums ${stats.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.expectancy >= 0 ? '+' : ''}{stats.expectancy}R
              </span>
              <span className="text-[10px] text-slate-400">/ trade</span>
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">Average R:R</span>
            <div className="mt-1 text-base font-bold text-white tabular-nums">
              1:{stats.avgRR.toFixed(2)}
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">Max Drawdown</span>
            <div className="mt-1 text-base font-bold text-rose-400 tabular-nums">
              -{stats.maxDrawdownPercent.toFixed(1)}%
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:pl-4">
            <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">Avg Hold Time</span>
            <div className="mt-1 text-base font-bold text-white tabular-nums">
              {stats.avgHoldingTimeMinutes} min
            </div>
          </div>
        </div>
      </section>

      {/* 6. RECENT EXECUTIONS & PERFORMANCE EXTREMES (Two-Column) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Recent Executions (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl liquid-glass-card shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Recent Journal Executions
              </h3>
              <p className="text-[11px] text-slate-400">Latest recorded trades with verified execution</p>
            </div>
            <button
              onClick={onViewAllTrades}
              className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-400">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Side</th>
                  <th className="py-2.5 px-3">Setup</th>
                  <th className="py-2.5 px-3 text-right">Entry</th>
                  <th className="py-2.5 px-3 text-right">Exit</th>
                  <th className="py-2.5 px-3 text-right">P&L</th>
                  <th className="py-2.5 px-3 text-right">R</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {recentTrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                      No executions logged. Click &ldquo;Record Trade&rdquo; to start.
                    </td>
                  </tr>
                ) : (
                  recentTrades.map(trade => {
                    const isWin = trade.pnl > 0;
                    const isLoss = trade.pnl < 0;
                    return (
                      <tr
                        key={trade.id}
                        onClick={() => onSelectTrade(trade)}
                        className="hover:bg-white/[0.03] cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-3 text-slate-400 tabular-nums whitespace-nowrap">
                          {trade.date}
                        </td>
                        <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                          {trade.instrument}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              trade.direction === 'LONG'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {trade.direction}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 max-w-[160px] truncate">
                          {trade.setup}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                          {trade.entryPrice}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                          {trade.exitPrice}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-bold tabular-nums ${
                            isWin
                              ? 'text-emerald-400'
                              : isLoss
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-semibold tabular-nums ${
                            trade.rMultiple >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Extremes & Records (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl liquid-glass-card shadow-xl">
          <div className="pb-3 border-b border-white/[0.06] mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Performance Extremes
            </h3>
            <p className="text-[11px] text-slate-400">Statistical boundaries and streaks</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">Best Trade</span>
              <div className="text-right">
                {stats.bestTrade.pnl > 0 ? (
                  <div>
                    <span className="font-bold text-emerald-400 tabular-nums">
                      +${stats.bestTrade.pnl.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                      {stats.bestTrade.instrument} (+{stats.bestTrade.r}R)
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">Worst Trade</span>
              <div className="text-right">
                {stats.worstTrade.pnl < 0 ? (
                  <div>
                    <span className="font-bold text-rose-400 tabular-nums">
                      -${Math.abs(stats.worstTrade.pnl).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                      {stats.worstTrade.instrument} ({stats.worstTrade.r}R)
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">Best Day</span>
              <div className="text-right">
                {stats.bestDay.pnl > 0 ? (
                  <div>
                    <span className="font-bold text-emerald-400 tabular-nums">
                      +${stats.bestDay.pnl.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">{stats.bestDay.date}</span>
                  </div>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">Worst Day</span>
              <div className="text-right">
                {stats.worstDay.pnl < 0 ? (
                  <div>
                    <span className="font-bold text-rose-400 tabular-nums">
                      -${Math.abs(stats.worstDay.pnl).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">{stats.worstDay.date}</span>
                  </div>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">Average Win</span>
              <div className="text-right">
                <span className="font-bold text-emerald-400 tabular-nums">
                  {stats.winCount > 0 ? `+$${stats.avgWin.toFixed(2)}` : '$0.00'}
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({stats.winCount} wins)</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">Average Loss</span>
              <div className="text-right">
                <span className="font-bold text-rose-400 tabular-nums">
                  {stats.lossCount > 0 ? `-$${stats.avgLoss.toFixed(2)}` : '$0.00'}
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({stats.lossCount} losses)</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Current Streak</span>
              <span
                className={`font-bold tabular-nums ${
                  stats.currentStreak.type === 'WIN'
                    ? 'text-emerald-400'
                    : stats.currentStreak.type === 'LOSS'
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {stats.currentStreak.count} {stats.currentStreak.type}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
