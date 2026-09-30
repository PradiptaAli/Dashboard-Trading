import React from 'react';
import { Trade } from '../../types/trade';
import { generateTradingDNA } from '../../utils/calculations';

interface TradingDNAViewProps {
  trades: Trade[];
}

export const TradingDNAView: React.FC<TradingDNAViewProps> = ({ trades }) => {
  const dna = generateTradingDNA(trades);

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* 1. Header */}
      <div className="pb-4 border-b border-[#181a22]">
        <h2 className="text-xl font-semibold text-[#f4f5f7] tracking-tight font-mono">
          Trader Profile & Behavioral Traits
        </h2>
        <p className="text-xs text-[#696f7e] mt-0.5">
          Empirical behavioral patterns and statistical tendencies extracted from {trades.length} executions
        </p>
      </div>

      {/* 2. Core Statistical Attributes Row */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 font-mono text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#181a22]">
          <div className="pt-2 sm:pt-0 sm:pr-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Optimal Session</span>
            <div className="mt-1.5 text-base font-semibold text-[#10b981]">
              {dna.bestSession}
            </div>
            <span className="text-[11px] text-[#555a66] mt-0.5 block">Highest win consistency</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">A+ Setup Model</span>
            <div className="mt-1.5 text-base font-semibold text-[#10b981] truncate">
              {dna.bestSetup}
            </div>
            <span className="text-[11px] text-[#555a66] mt-0.5 block">Empirical primary edge</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Primary Timeframe</span>
            <div className="mt-1.5 text-base font-semibold text-[#10b981]">
              {dna.bestTimeframe}
            </div>
            <span className="text-[11px] text-[#555a66] mt-0.5 block">Cleanest confirmation</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Avg Holding Time</span>
            <div className="mt-1.5 text-base font-semibold text-[#f0f2f5] tabular-nums">
              {dna.avgHoldingTime}
            </div>
            <span className="text-[11px] text-[#555a66] mt-0.5 block">Trade maturation cycle</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:pl-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Average Risk</span>
            <div className="mt-1.5 text-base font-semibold text-[#f0f2f5] tabular-nums">
              {dna.avgRiskPercent}
            </div>
            <span className="text-[11px] text-[#555a66] mt-0.5 block">Account equity commit</span>
          </div>
        </div>
      </div>

      {/* 3. Behavioral Archetype & Execution Discipline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Execution Traits */}
        <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 font-mono text-xs space-y-4">
          <div className="pb-3 border-b border-[#181a22]">
            <h3 className="font-medium uppercase tracking-wider text-[#9ea3b0]">
              Execution Discipline Metrics
            </h3>
            <p className="text-[11px] text-[#555a66] font-sans">Adherence to technical rules and trade management</p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[#8c92a2]">Plan Compliance Score</span>
                <span className="font-semibold text-[#10b981] tabular-nums">{dna.disciplineScore} / 10</span>
              </div>
              <div className="h-1.5 w-full bg-[#181b22] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10b981] transition-all"
                  style={{ width: `${Math.min(100, dna.disciplineScore * 10)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#15171e]">
              <span className="text-[#8c92a2]">Trading Archetype</span>
              <span className="font-semibold text-[#e4e7ec]">{dna.scalpingVsSwing}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#15171e]">
              <span className="text-[#8c92a2]">Risk Tolerance Profile</span>
              <span className="font-semibold text-[#e4e7ec]">{dna.riskTakingScore}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#15171e]">
              <span className="text-[#8c92a2]">Overtrading Propensity</span>
              <span className="font-semibold text-[#e4e7ec]">{dna.overtradingRisk}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-[#8c92a2]">Dominant Emotional Tendency</span>
              <span className="font-semibold text-[#f0f2f5]">{dna.topEmotion}</span>
            </div>
          </div>
        </div>

        {/* Behavioral Recommendations */}
        <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 font-mono text-xs space-y-4">
          <div className="pb-3 border-b border-[#181a22]">
            <h3 className="font-medium uppercase tracking-wider text-[#9ea3b0]">
              Empirical Edge Guidelines
            </h3>
            <p className="text-[11px] text-[#555a66] font-sans">Prescriptive rules derived from trade history</p>
          </div>

          <div className="space-y-3 font-sans text-xs text-[#a0a6b5] leading-relaxed">
            <div className="p-3 rounded-md bg-[#101217] border border-[#181b22]">
              <span className="font-mono text-[11px] font-semibold text-[#10b981] block mb-1">
                SESSION CONFINEMENT
              </span>
              Limit primary capital allocations to the {dna.bestSession} session where your win rate and risk-to-reward ratio demonstrate statistically verified edge.
            </div>

            <div className="p-3 rounded-md bg-[#101217] border border-[#181b22]">
              <span className="font-mono text-[11px] font-semibold text-[#10b981] block mb-1">
                SETUP FOCUS
              </span>
              Prioritize &ldquo;{dna.bestSetup}&rdquo; on the {dna.bestTimeframe} timeframe. Filter out low-probability experimental setups during drawdown phases.
            </div>

            <div className="p-3 rounded-md bg-[#101217] border border-[#181b22]">
              <span className="font-mono text-[11px] font-semibold text-[#10b981] block mb-1">
                POSITION SIZING
              </span>
              Maintain disciplined sizing around {dna.avgRiskPercent} of total balance. Never adjust stop losses wider once an execution is in progress.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
