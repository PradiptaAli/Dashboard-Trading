import React from 'react';
import { Trade } from '../../types/trade';
import { calculatePsychologyInsights } from '../../utils/calculations';

interface PsychologyViewProps {
  trades: Trade[];
}

export const PsychologyView: React.FC<PsychologyViewProps> = ({ trades }) => {
  const insights = calculatePsychologyInsights(trades);

  const avgDiscipline = (trades.reduce((acc, t) => acc + (t.discipline || 7), 0) / Math.max(1, trades.length)).toFixed(1);
  const avgConfidence = (trades.reduce((acc, t) => acc + (t.confidence || 7), 0) / Math.max(1, trades.length)).toFixed(1);

  return (
    <div className="space-y-6 max-w-[1300px]">
      {/* Header */}
      <div className="pb-4 border-b border-[#181a22]">
        <h2 className="text-xl font-semibold text-[#f4f5f7] tracking-tight font-mono">
          Behavioral Psychology & Cognitive Edge
        </h2>
        <p className="text-xs text-[#696f7e] mt-0.5">
          Empirical correlation proving the mathematical cost of emotional deviation and rule discipline
        </p>
      </div>

      {/* Psychology Highlights Row */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 font-mono text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#181a22]">
          <div className="pt-2 sm:pt-0 sm:pr-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Average Discipline</span>
            <div className="mt-1.5 text-2xl font-semibold text-[#f0f2f5] tabular-nums">
              {avgDiscipline} <span className="text-xs text-[#555a66]">/ 10</span>
            </div>
            <span className="text-[11px] text-[#555a66] mt-0.5 block">Technical plan execution</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Average Confidence</span>
            <div className="mt-1.5 text-2xl font-semibold text-[#f0f2f5] tabular-nums">
              {avgConfidence} <span className="text-xs text-[#555a66]">/ 10</span>
            </div>
            <span className="text-[11px] text-[#555a66] mt-0.5 block">Pre-execution conviction</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Impulse (FOMO) Impact</span>
            <div className="mt-1.5 text-2xl font-semibold text-[#ef4444] tabular-nums">
              {insights.fomo.totalR}R
            </div>
            <span className="text-[11px] text-[#555a66] mt-0.5 block">{insights.fomo.count} impulse executions</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:pl-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Revenge Trading Cost</span>
            <div className="mt-1.5 text-2xl font-semibold text-[#ef4444] tabular-nums">
              {insights.revenge.totalR}R
            </div>
            <span className="text-[11px] text-[#555a66] mt-0.5 block">{insights.revenge.count} retaliatory trades</span>
          </div>
        </div>
      </div>

      {/* Behavioral Insights: Discipline vs Emotion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Discipline Correlation */}
        <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 font-mono text-xs space-y-4">
          <div className="pb-3 border-b border-[#181a22]">
            <h3 className="font-medium uppercase tracking-wider text-[#9ea3b0]">
              Discipline vs Realized Edge
            </h3>
            <p className="text-[11px] text-[#555a66] font-sans">Performance spread between compliant and violated trades</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-[#101217] p-3 border border-[#1b251d]">
              <span className="text-[10px] text-[#10b981] uppercase font-semibold block mb-1">
                Disciplined (Score ≥ 7)
              </span>
              <div className="text-xl font-semibold text-[#f0f2f5] tabular-nums">
                {insights.highDiscipline.winRate}% Win
              </div>
              <div className="text-xs text-[#10b981] font-semibold tabular-nums mt-1">
                +{insights.highDiscipline.totalR}R (+${insights.highDiscipline.totalPnl.toFixed(2)})
              </div>
              <div className="text-[10px] text-[#555a66] mt-1">
                {insights.highDiscipline.count} compliant trades
              </div>
            </div>

            <div className="rounded-md bg-[#101217] p-3 border border-[#2b181c]">
              <span className="text-[10px] text-[#ef4444] uppercase font-semibold block mb-1">
                Undisciplined (Score ≤ 5)
              </span>
              <div className="text-xl font-semibold text-[#f0f2f5] tabular-nums">
                {insights.lowDiscipline.winRate}% Win
              </div>
              <div className="text-xs text-[#ef4444] font-semibold tabular-nums mt-1">
                {insights.lowDiscipline.totalR}R (${insights.lowDiscipline.totalPnl.toFixed(2)})
              </div>
              <div className="text-[10px] text-[#555a66] mt-1">
                {insights.lowDiscipline.count} rule violations
              </div>
            </div>
          </div>

          <div className="rounded-md bg-[#0f1116] p-3 text-[#a0a6b5] font-sans text-xs leading-relaxed border border-[#181b22]">
            Disciplined execution improves baseline win rate by{' '}
            <strong className="text-[#10b981] font-mono">
              +{(insights.highDiscipline.winRate - insights.lowDiscipline.winRate).toFixed(1)}%
            </strong>{' '}
            and saves <strong className="text-[#ef4444] font-mono">{Math.abs(insights.lowDiscipline.totalR)}R</strong> in emotional slippage.
          </div>
        </div>

        {/* Emotion Distribution Breakdown */}
        <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 font-mono text-xs space-y-4">
          <div className="pb-3 border-b border-[#181a22]">
            <h3 className="font-medium uppercase tracking-wider text-[#9ea3b0]">
              Performance by Emotional State
            </h3>
            <p className="text-[11px] text-[#555a66] font-sans">Empirical result distribution across mindset categories</p>
          </div>

          <div className="space-y-2">
            {insights.emotionGroups.map(grp => (
              <div key={grp.name} className="flex items-center justify-between text-xs py-1.5 border-b border-[#15171e]">
                <div className="flex items-center gap-2">
                  <span className="text-[#e4e7ec] font-medium">{grp.name}</span>
                  <span className="text-[10px] text-[#555a66]">({grp.totalTrades} trades)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#787f91]">{grp.winRate}% Win</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      grp.totalR >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                    }`}
                  >
                    {grp.totalR >= 0 ? '+' : ''}{grp.totalR}R
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Execution Mistakes Table */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] overflow-hidden font-mono text-xs">
        <div className="border-b border-[#181a22] p-4 bg-[#0f1117]">
          <h3 className="font-medium uppercase tracking-wider text-[#9ea3b0]">
            Cost of Execution Mistakes
          </h3>
          <span className="text-[11px] text-[#555a66] font-sans">
            Capital leaked through categorized execution deviations
          </span>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#181a22] bg-[#0b0d11] text-[10.5px] uppercase tracking-wider text-[#696f7e]">
              <th className="py-2.5 px-4">Mistake Classification</th>
              <th className="py-2.5 px-3 text-right">Frequency</th>
              <th className="py-2.5 px-3 text-right">R Lost</th>
              <th className="py-2.5 px-4 text-right">Dollar P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#15171e]">
            {insights.mistakesList.map(m => (
              <tr key={m.name} className="hover:bg-[#12151c] transition-colors">
                <td className="py-2.5 px-4 font-medium text-[#e4e7ec]">{m.name}</td>
                <td className="py-2.5 px-3 text-right text-[#787f91] tabular-nums">{m.count}</td>
                <td className="py-2.5 px-3 text-right text-[#ef4444] font-semibold tabular-nums">{m.totalR}R</td>
                <td className="py-2.5 px-4 text-right text-[#ef4444] font-semibold tabular-nums">
                  ${m.totalPnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
