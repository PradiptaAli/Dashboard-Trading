import React, { useState, useMemo } from 'react';
import { Trade } from '../../types/trade';
import { groupTradesByCategory, CategoryStat } from '../../utils/calculations';

interface AnalyticsViewProps {
  trades: Trade[];
}

type AnalyticsTab =
  | 'performance'
  | 'instrument'
  | 'setup'
  | 'session'
  | 'timeframe'
  | 'psychology';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ trades }) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('setup');
  const [chartMetric, setChartMetric] = useState<'winRate' | 'expectancy' | 'totalR' | 'totalPnl'>('expectancy');

  const statsList: CategoryStat[] = useMemo(() => {
    switch (activeTab) {
      case 'performance':
        return groupTradesByCategory(trades, t => t.direction);
      case 'instrument':
        return groupTradesByCategory(trades, t => t.instrument);
      case 'setup':
        return groupTradesByCategory(trades, t => t.setup);
      case 'session':
        return groupTradesByCategory(trades, t => t.session);
      case 'timeframe':
        return groupTradesByCategory(trades, t => t.timeframe);
      case 'psychology':
        return groupTradesByCategory(trades, t => t.emotion);
      default:
        return [];
    }
  }, [trades, activeTab]);

  const maxVal = useMemo(() => {
    if (statsList.length === 0) return 1;
    if (chartMetric === 'winRate') return 100;
    const values = statsList.map(s => Math.abs(s[chartMetric]));
    return Math.max(...values, 1);
  }, [statsList, chartMetric]);

  const tabs: { id: AnalyticsTab; label: string }[] = [
    { id: 'setup', label: 'Setup' },
    { id: 'instrument', label: 'Instrument' },
    { id: 'session', label: 'Session' },
    { id: 'timeframe', label: 'Timeframe' },
    { id: 'psychology', label: 'Psychology' },
    { id: 'performance', label: 'Performance' },
  ];

  return (
    <div className="space-y-6 max-w-[1300px]">
      {/* 1. Research Terminal Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#181a22]">
        <div className="flex items-center gap-1 rounded bg-[#0c0e13] p-0.5 text-xs font-mono border border-[#1e222c]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#1b1f28] text-[#f4f5f7] font-medium'
                  : 'text-[#6e7484] hover:text-[#d0d4dc]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <span className="text-[#555a66] mr-1 hidden sm:inline">Sort Metric:</span>
          {(['expectancy', 'winRate', 'totalR', 'totalPnl'] as const).map(m => (
            <button
              key={m}
              onClick={() => setChartMetric(m)}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                chartMetric === m
                  ? 'bg-[#1b1f28] text-[#10b981] font-medium'
                  : 'text-[#6e7484] hover:text-[#a0a6b5]'
              }`}
            >
              {m === 'expectancy' ? 'Expectancy' : m === 'winRate' ? 'Win %' : m === 'totalR' ? 'Total R' : 'Net P&L'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Analytical Research Breakdown */}
      {statsList.length === 0 ? (
        <div className="py-20 text-center text-[#555a66] text-xs font-mono rounded-lg border border-[#181a22] bg-[#0c0e13]">
          No data recorded yet for {activeTab}. Log executions to generate comparative analytics.
        </div>
      ) : (
        <div className="space-y-4">
          {statsList.map((stat, idx) => {
            const metricValue = stat[chartMetric];
            const pctBar = Math.min(100, Math.max(5, (Math.abs(metricValue) / maxVal) * 100));

            return (
              <div
                key={stat.name || idx}
                className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-4 font-mono text-xs space-y-3"
              >
                {/* Title & Key Statistics Headline */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 border-b border-[#15171e]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-[#f4f5f7] tracking-tight">
                      {stat.name || 'Unspecified'}
                    </span>
                    <span className="text-[11px] text-[#555a66]">
                      {stat.totalTrades} executions ({stat.wins}W / {stat.losses}L)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-4 sm:gap-6 text-xs tabular-nums">
                    <div>
                      <span className="text-[#555a66] text-[10px] uppercase block">Win Rate</span>
                      <span className="font-semibold text-[#e4e7ec]">{stat.winRate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-[#555a66] text-[10px] uppercase block">Expectancy</span>
                      <span
                        className={`font-semibold ${
                          stat.expectancy >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                        }`}
                      >
                        {stat.expectancy >= 0 ? '+' : ''}{stat.expectancy.toFixed(2)}R
                      </span>
                    </div>
                    <div>
                      <span className="text-[#555a66] text-[10px] uppercase block">Total Edge</span>
                      <span
                        className={`font-semibold ${
                          stat.totalR >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                        }`}
                      >
                        {stat.totalR >= 0 ? '+' : ''}{stat.totalR.toFixed(1)}R
                      </span>
                    </div>
                    <div>
                      <span className="text-[#555a66] text-[10px] uppercase block">Net P&L</span>
                      <span
                        className={`font-semibold ${
                          stat.totalPnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                        }`}
                      >
                        {stat.totalPnl >= 0 ? '+' : ''}${stat.totalPnl.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#555a66] text-[10px] uppercase block">Profit Factor</span>
                      <span className="font-semibold text-[#e4e7ec]">{stat.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Restrained Distribution Bar */}
                <div>
                  <div className="h-1.5 w-full bg-[#151820] rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        stat.totalR >= 0 ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                      }`}
                      style={{ width: `${pctBar}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] text-[#555a66] mt-1.5">
                    <span>Average Win: +${stat.avgWin.toFixed(2)}</span>
                    <span>Average Loss: -${stat.avgLoss.toFixed(2)}</span>
                    <span>Average R:R: 1:{stat.avgRR.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
