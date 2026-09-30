import React, { useState } from 'react';
import { Trade, StrategyDefinition } from '../../types/trade';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface StrategiesViewProps {
  strategies: StrategyDefinition[];
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
}

export const StrategiesView: React.FC<StrategiesViewProps> = ({
  strategies,
  trades,
  onSelectTrade,
}) => {
  const [selectedStrategyName, setSelectedStrategyName] = useState<string | null>(null);

  const strategyStats = strategies.map(strat => {
    const stratTrades = trades.filter(t => t.strategy === strat.name);
    let wins = 0;
    let losses = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let totalPnl = 0;
    let totalR = 0;
    let totalHolding = 0;

    stratTrades.forEach(t => {
      totalPnl += t.pnl;
      totalR += t.rMultiple;
      totalHolding += t.holdingTimeMinutes || 30;
      if (t.pnl > 0) {
        wins++;
        grossProfit += t.pnl;
      } else if (t.pnl < 0) {
        losses++;
        grossLoss += Math.abs(t.pnl);
      }
    });

    const totalTrades = stratTrades.length;
    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
    const expectancy = totalTrades > 0 ? totalR / totalTrades : 0;
    const avgR = totalTrades > 0 ? totalR / totalTrades : 0;
    const avgHoldingTime = totalTrades > 0 ? Math.round(totalHolding / totalTrades) : 0;

    return {
      definition: strat,
      trades: stratTrades,
      totalTrades,
      winRate: Number(winRate.toFixed(1)),
      profitFactor: Number(profitFactor.toFixed(2)),
      expectancy: Number(expectancy.toFixed(2)),
      totalPnl: Math.round(totalPnl),
      totalR: Number(totalR.toFixed(1)),
      avgR: Number(avgR.toFixed(2)),
      avgHoldingTime,
    };
  });

  const activeStrategy = strategyStats.find(s => s.definition.name === selectedStrategyName);

  if (activeStrategy) {
    return (
      <div className="space-y-6 max-w-[1300px]">
        <div className="flex items-center justify-between border-b border-[#181a22] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedStrategyName(null)}
              className="flex items-center gap-1.5 rounded-md border border-[#1e222c] bg-[#0c0e13] px-2.5 py-1.5 text-xs text-[#a0a6b5] hover:text-[#f4f5f7] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Playbooks</span>
            </button>
            <h2 className="text-sm font-semibold font-mono text-[#f4f5f7]">
              {activeStrategy.definition.name} ({activeStrategy.totalTrades} Executions)
            </h2>
          </div>
        </div>

        {/* Strategy Summary Bar */}
        <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-4 font-mono text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            <div>
              <span className="text-[#646a78] text-[10.5px] uppercase block">Win Rate</span>
              <span className="text-base font-semibold text-[#f0f2f5] tabular-nums">{activeStrategy.winRate}%</span>
            </div>
            <div>
              <span className="text-[#646a78] text-[10.5px] uppercase block">Total R</span>
              <span className="text-base font-semibold text-[#10b981] tabular-nums">+{activeStrategy.totalR}R</span>
            </div>
            <div>
              <span className="text-[#646a78] text-[10.5px] uppercase block">Expectancy</span>
              <span className="text-base font-semibold text-[#10b981] tabular-nums">+{activeStrategy.expectancy}R</span>
            </div>
            <div>
              <span className="text-[#646a78] text-[10.5px] uppercase block">Profit Factor</span>
              <span className="text-base font-semibold text-[#f0f2f5] tabular-nums">{activeStrategy.profitFactor}</span>
            </div>
            <div>
              <span className="text-[#646a78] text-[10.5px] uppercase block">Total P&L</span>
              <span className="text-base font-semibold text-[#10b981] tabular-nums">+${activeStrategy.totalPnl.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[#646a78] text-[10.5px] uppercase block">Avg Hold</span>
              <span className="text-base font-semibold text-[#f0f2f5] tabular-nums">{activeStrategy.avgHoldingTime} min</span>
            </div>
          </div>
        </div>

        {/* Matching Trades List */}
        <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#181a22] bg-[#0f1117] text-[10.5px] uppercase tracking-wider text-[#696f7e]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3">Setup</th>
                <th className="py-2.5 px-3 text-right">Entry</th>
                <th className="py-2.5 px-3 text-right">Exit</th>
                <th className="py-2.5 px-3 text-right">Net P&L</th>
                <th className="py-2.5 px-3 text-right">R</th>
                <th className="py-2.5 px-3 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15171e]">
              {activeStrategy.trades.map(trade => (
                <tr
                  key={trade.id}
                  onClick={() => onSelectTrade(trade)}
                  className="hover:bg-[#12151c] cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 text-[#696f7e] tabular-nums">{trade.date}</td>
                  <td className="py-2.5 px-3 font-medium text-[#e4e7ec]">{trade.instrument}</td>
                  <td className="py-2.5 px-3">
                    <span className={trade.direction === 'LONG' ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                      {trade.direction}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#8c92a2]">{trade.setup}</td>
                  <td className="py-2.5 px-3 text-right text-[#a0a6b5] tabular-nums">{trade.entryPrice}</td>
                  <td className="py-2.5 px-3 text-right text-[#a0a6b5] tabular-nums">{trade.exitPrice}</td>
                  <td className={`py-2.5 px-3 text-right font-medium tabular-nums ${trade.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </td>
                  <td className={`py-2.5 px-3 text-right tabular-nums ${trade.rMultiple >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${trade.pnl > 0 ? 'text-[#10b981] bg-[#10b981]/10' : trade.pnl < 0 ? 'text-[#ef4444] bg-[#ef4444]/10' : 'text-[#6e7484] bg-[#1a1d25]'}`}>
                      {trade.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1300px]">
      <div className="pb-4 border-b border-[#181a22]">
        <h2 className="text-xl font-semibold text-[#f4f5f7] tracking-tight font-mono">
          Playbook Strategies
        </h2>
        <p className="text-xs text-[#696f7e] mt-0.5">
          Quantified trading methodology backed by empirical execution journal performance
        </p>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategyStats.map(item => {
          const s = item.definition;

          return (
            <div
              key={s.id}
              className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-4 flex flex-col justify-between hover:border-[#262a36] transition-colors"
            >
              <div>
                <div className="flex items-start justify-between border-b border-[#181a22] pb-3 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold font-mono text-[#f4f5f7]">{s.name}</h3>
                    <p className="text-xs text-[#696f7e] mt-1 font-sans leading-relaxed">{s.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStrategyName(s.name)}
                    className="flex items-center gap-1 text-xs font-mono text-[#a0a6b5] hover:text-[#f4f5f7] shrink-0 ml-3"
                  >
                    <span>{item.totalTrades} Trades</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs font-mono py-1">
                  <div>
                    <span className="text-[#646a78] text-[10px] uppercase block">Win %</span>
                    <span className="font-semibold text-[#e4e7ec] tabular-nums mt-0.5 block">{item.winRate}%</span>
                  </div>
                  <div>
                    <span className="text-[#646a78] text-[10px] uppercase block">Total R</span>
                    <span className="font-semibold text-[#10b981] tabular-nums mt-0.5 block">+{item.totalR}R</span>
                  </div>
                  <div>
                    <span className="text-[#646a78] text-[10px] uppercase block">Expectancy</span>
                    <span className="font-semibold text-[#10b981] tabular-nums mt-0.5 block">+{item.expectancy}R</span>
                  </div>
                  <div>
                    <span className="text-[#646a78] text-[10px] uppercase block">Net P&L</span>
                    <span className="font-semibold text-[#10b981] tabular-nums mt-0.5 block">+${item.totalPnl.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {s.setups && s.setups.length > 0 && (
                <div className="pt-3 mt-3 border-t border-[#181a22]">
                  <span className="text-[10px] font-mono uppercase text-[#555a66] block mb-1">Setups:</span>
                  <div className="flex flex-wrap gap-2 text-xs text-[#8c92a2] font-mono">
                    {s.setups.map((su: { name: string; description?: string }, idx: number) => (
                      <span key={idx} className="text-[11px] text-[#6e7484]">
                        {su.name}{idx < (s.setups?.length || 0) - 1 ? ' ·' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
