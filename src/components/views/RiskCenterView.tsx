import React, { useState } from 'react';
import { Trade, TradingPlan } from '../../types/trade';
import { PerformanceStats } from '../../utils/calculations';
import { Calculator, ArrowRight } from 'lucide-react';

interface RiskCenterViewProps {
  trades: Trade[];
  stats: PerformanceStats;
  tradingPlan: TradingPlan;
  onOpenNewTradeWithParams?: (params: { instrument: string; entry: number; sl: number; size: number; riskAmt: number }) => void;
}

export const RiskCenterView: React.FC<RiskCenterViewProps> = ({
  trades,
  stats,
  tradingPlan,
  onOpenNewTradeWithParams,
}) => {
  const [calcInstrument, setCalcInstrument] = useState('BTCUSDT');
  const [calcBalance, setCalcBalance] = useState<number>(stats.accountBalance);
  const [calcRiskPct, setCalcRiskPct] = useState<number>(tradingPlan.riskPerTradePercent || 1.0);
  const [calcEntryPrice, setCalcEntryPrice] = useState<number>(64000.0);
  const [calcStopLoss, setCalcStopLoss] = useState<number>(63400.0);

  const todayLosses = Math.abs(Math.min(0, stats.todayPnl));
  const dailyLimitDollars = Math.round(stats.initialBalance * (tradingPlan.maxDailyLossPercent / 100));
  const dailyLossUsedPct = dailyLimitDollars > 0 ? (todayLosses / dailyLimitDollars) * 100 : 0;

  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
  const recentTrades = trades.filter(t => t.date >= fiveDaysAgo);
  const weeklyPnl = recentTrades.reduce((acc, t) => acc + t.pnl, 0);
  const weeklyLosses = Math.abs(Math.min(0, weeklyPnl));
  const weeklyLimitDollars = Math.round(stats.initialBalance * (tradingPlan.maxWeeklyLossPercent / 100));
  const weeklyLossUsedPct = weeklyLimitDollars > 0 ? (weeklyLosses / weeklyLimitDollars) * 100 : 0;

  // Subtle Status determination
  let statusBadge = { label: 'NORMAL', color: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20' };
  if (dailyLossUsedPct >= 100 || weeklyLossUsedPct >= 100 || stats.maxDrawdownPercent >= 10) {
    statusBadge = { label: 'LIMIT EXCEEDED', color: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20' };
  } else if (dailyLossUsedPct >= 70 || weeklyLossUsedPct >= 70 || (stats.currentStreak.type === 'LOSS' && stats.currentStreak.count >= 2)) {
    statusBadge = { label: 'APPROACHING LIMIT', color: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20' };
  }

  const stopDistance = Math.abs(calcEntryPrice - calcStopLoss);
  const calculatedRiskAmount = Number((calcBalance * (calcRiskPct / 100)).toFixed(2));
  const suggestedPositionSize = stopDistance > 0
    ? Number((calcInstrument.includes('USDT') ? (calculatedRiskAmount / (stopDistance / calcEntryPrice)) : calculatedRiskAmount / stopDistance).toFixed(2))
    : 0;

  return (
    <div className="space-y-6 max-w-[1300px]">
      {/* 1. Header with Subtle Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#181a22]">
        <div>
          <h2 className="text-xl font-semibold text-[#f4f5f7] tracking-tight font-mono">
            Risk & Capital Preservation
          </h2>
          <p className="text-xs text-[#696f7e] mt-0.5">
            Strict algorithmic exposure monitoring and loss limit governance
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#555a66]">System Status:</span>
          <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* 2. Primary Drawdown Callout & Core Gauges */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 font-mono">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main Drawdown Metric (Most important) */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#181a22] pb-5 md:pb-0 md:pr-6">
            <span className="text-[11px] uppercase tracking-wider text-[#696f7e] block">
              Current Peak-to-Trough Drawdown
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-4xl font-semibold tabular-nums tracking-tight ${
                  stats.maxDrawdownPercent > 5 ? 'text-[#ef4444]' : 'text-[#f4f5f7]'
                }`}
              >
                -{stats.maxDrawdownPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-[#ef4444] tabular-nums">
                (-${stats.maxDrawdownAmount.toFixed(2)})
              </span>
            </div>
            <p className="text-[11px] text-[#555a66] mt-2 font-sans">
              Hard threshold capped at {tradingPlan.maxDailyLossPercent * 3}% before emergency execution lockout.
            </p>
          </div>

          {/* Secondary Core Gauges */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#696f7e] block text-[10.5px] uppercase">Risk / Trade</span>
              <span className="text-lg font-semibold text-[#f0f2f5] tabular-nums mt-1 block">
                {tradingPlan.riskPerTradePercent}%
              </span>
              <span className="text-[11px] text-[#555a66]">
                ${(stats.accountBalance * (tradingPlan.riskPerTradePercent / 100)).toFixed(2)} / 1R
              </span>
            </div>

            <div>
              <span className="text-[#696f7e] block text-[10.5px] uppercase">Daily Risk Used</span>
              <span
                className={`text-lg font-semibold tabular-nums mt-1 block ${
                  dailyLossUsedPct >= 100 ? 'text-[#ef4444]' : 'text-[#f0f2f5]'
                }`}
              >
                ${todayLosses.toFixed(2)}
              </span>
              <span className="text-[11px] text-[#555a66]">
                Limit: ${dailyLimitDollars} ({dailyLossUsedPct.toFixed(0)}%)
              </span>
            </div>

            <div>
              <span className="text-[#696f7e] block text-[10.5px] uppercase">Weekly Risk Used</span>
              <span
                className={`text-lg font-semibold tabular-nums mt-1 block ${
                  weeklyLossUsedPct >= 100 ? 'text-[#ef4444]' : 'text-[#f0f2f5]'
                }`}
              >
                ${weeklyLosses.toFixed(2)}
              </span>
              <span className="text-[11px] text-[#555a66]">
                Limit: ${weeklyLimitDollars} ({weeklyLossUsedPct.toFixed(0)}%)
              </span>
            </div>

            <div>
              <span className="text-[#696f7e] block text-[10.5px] uppercase">Consecutive Losses</span>
              <span
                className={`text-lg font-semibold tabular-nums mt-1 block ${
                  stats.currentStreak.type === 'LOSS' && stats.currentStreak.count >= 2 ? 'text-[#ef4444]' : 'text-[#f0f2f5]'
                }`}
              >
                {stats.currentStreak.type === 'LOSS' ? stats.currentStreak.count : 0}
              </span>
              <span className="text-[11px] text-[#555a66]">
                {stats.currentStreak.type === 'LOSS' && stats.currentStreak.count >= 2 ? 'Drawdown cycle' : 'Stable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Position Size Calculator (Clean, functional) */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 font-mono">
        <div className="pb-3 border-b border-[#181a22] mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#8c92a2]" />
            <h3 className="text-xs font-medium uppercase tracking-wider text-[#9ea3b0]">
              Pre-Trade Position Size Calculator
            </h3>
          </div>
          <span className="text-[11px] text-[#555a66]">Strict 1R sizing compliance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="text-[#696f7e] block mb-1">Instrument</label>
            <input
              type="text"
              value={calcInstrument}
              onChange={e => setCalcInstrument(e.target.value.toUpperCase())}
              className="w-full h-8 rounded-md border border-[#1e222c] bg-[#11131a] px-2.5 text-xs text-[#e4e7ec] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[#696f7e] block mb-1">Account Balance ($)</label>
            <input
              type="number"
              value={calcBalance}
              onChange={e => setCalcBalance(parseFloat(e.target.value) || 0)}
              className="w-full h-8 rounded-md border border-[#1e222c] bg-[#11131a] px-2.5 text-xs text-[#e4e7ec] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[#696f7e] block mb-1">Risk Percentage (%)</label>
            <input
              type="number"
              step="0.1"
              value={calcRiskPct}
              onChange={e => setCalcRiskPct(parseFloat(e.target.value) || 1)}
              className="w-full h-8 rounded-md border border-[#1e222c] bg-[#11131a] px-2.5 text-xs text-[#e4e7ec] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[#696f7e] block mb-1">Entry Price</label>
            <input
              type="number"
              step="any"
              value={calcEntryPrice}
              onChange={e => setCalcEntryPrice(parseFloat(e.target.value) || 0)}
              className="w-full h-8 rounded-md border border-[#1e222c] bg-[#11131a] px-2.5 text-xs text-[#e4e7ec] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[#696f7e] block mb-1">Stop Loss</label>
            <input
              type="number"
              step="any"
              value={calcStopLoss}
              onChange={e => setCalcStopLoss(parseFloat(e.target.value) || 0)}
              className="w-full h-8 rounded-md border border-[#1e222c] bg-[#11131a] px-2.5 text-xs text-[#e4e7ec] focus:outline-none"
            />
          </div>
        </div>

        {/* Calculated Result */}
        <div className="mt-4 pt-3 border-t border-[#181a22] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[#696f7e] text-[10.5px]">Stop Distance:</span>
              <span className="text-[#e4e7ec] font-semibold ml-1.5 tabular-nums">
                {stopDistance.toFixed(calcEntryPrice < 1 ? 6 : 2)} pts
              </span>
            </div>
            <div>
              <span className="text-[#696f7e] text-[10.5px]">Exact Loss at SL:</span>
              <span className="text-[#ef4444] font-semibold ml-1.5 tabular-nums">
                -${calculatedRiskAmount.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[#696f7e] text-[10.5px]">Recommended Sizing:</span>
              <span className="text-[#10b981] font-bold ml-1.5 tabular-nums">
                {suggestedPositionSize} {calcInstrument.includes('USDT') ? 'USDT' : 'Lots'}
              </span>
            </div>
          </div>

          {onOpenNewTradeWithParams && (
            <button
              onClick={() => {
                onOpenNewTradeWithParams({
                  instrument: calcInstrument,
                  entry: calcEntryPrice,
                  sl: calcStopLoss,
                  size: suggestedPositionSize,
                  riskAmt: calculatedRiskAmount,
                });
              }}
              className="flex items-center gap-1.5 rounded-md bg-[#161820] hover:bg-[#1f232e] border border-[#262a36] px-3 py-1.5 font-medium text-[#f0f2f5] transition-colors"
            >
              <span>Apply to New Trade</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
