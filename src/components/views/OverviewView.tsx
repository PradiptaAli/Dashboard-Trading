import React from 'react';
import { Trade } from '../../types/trade';
import { PerformanceStats } from '../../utils/calculations';
import { EquityChart } from '../common/EquityChart';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';

interface OverviewViewProps {
  trades: Trade[];
  stats: PerformanceStats;
  onSelectTrade: (trade: Trade) => void;
  onViewAllTrades: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  trades,
  stats,
  onSelectTrade,
  onViewAllTrades,
}) => {
  const recentTrades = [...trades]
    .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime())
    .slice(0, 8);

  const netPnlPercent = stats.initialBalance > 0
    ? (stats.totalPnl / stats.initialBalance) * 100
    : 0;

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* 1. TOP: Portfolio / Account Summary (Editorial Hierarchy) */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#181a22]">
        {/* Main Equity Callout */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#696f7e]">
            Account Balance & Equity
          </span>
          <div className="mt-1 flex items-baseline gap-4">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f4f5f7] font-mono tabular-nums">
              ${stats.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span
                className={`font-medium tabular-nums ${
                  stats.totalPnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}
              >
                {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
              </span>
              <span className={`text-[11px] ${stats.totalPnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                ({stats.totalPnl >= 0 ? '+' : ''}{netPnlPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Compact Right Summary Items */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-mono">
          <div>
            <div className="text-[11px] text-[#696f7e]">Today's P&L</div>
            <div
              className={`text-base font-semibold tabular-nums mt-0.5 ${
                stats.todayPnl > 0
                  ? 'text-[#10b981]'
                  : stats.todayPnl < 0
                  ? 'text-[#ef4444]'
                  : 'text-[#9ea3b0]'
              }`}
            >
              {stats.todayPnl >= 0 ? '+' : ''}${stats.todayPnl.toFixed(2)}
            </div>
          </div>

          <div className="h-7 w-px bg-[#181a22] hidden sm:block" />

          <div>
            <div className="text-[11px] text-[#696f7e]">Monthly P&L</div>
            <div
              className={`text-base font-semibold tabular-nums mt-0.5 ${
                stats.monthlyPnl > 0
                  ? 'text-[#10b981]'
                  : stats.monthlyPnl < 0
                  ? 'text-[#ef4444]'
                  : 'text-[#9ea3b0]'
              }`}
            >
              {stats.monthlyPnl >= 0 ? '+' : ''}${stats.monthlyPnl.toFixed(2)}
            </div>
          </div>

          <div className="h-7 w-px bg-[#181a22] hidden sm:block" />

          <div>
            <div className="text-[11px] text-[#696f7e]">Baseline Capital</div>
            <div className="text-base font-semibold tabular-nums text-[#d0d4dc] mt-0.5">
              ${stats.initialBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="h-7 w-px bg-[#181a22] hidden sm:block" />

          <div>
            <div className="text-[11px] text-[#696f7e]">Total Logged</div>
            <div className="text-base font-semibold tabular-nums text-[#d0d4dc] mt-0.5">
              {stats.totalTrades} trades
            </div>
          </div>
        </div>
      </section>

      {/* 2. Primary Equity Curve (Spacious, prominent) */}
      <section className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div>
            <h2 className="text-xs font-mono font-medium uppercase tracking-wider text-[#9ea3b0]">
              Equity & Realized Performance Curve
            </h2>
          </div>
          <span className="text-[11px] text-[#555a66] font-mono">
            Cumulative progression
          </span>
        </div>
        <EquityChart trades={trades} initialBalance={stats.initialBalance} />
      </section>

      {/* 3. Performance Metrics in Compact Horizontal Section */}
      <section className="rounded-lg border border-[#181a22] bg-[#0c0e13] px-4 py-3.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs font-mono divide-y sm:divide-y-0 sm:divide-x divide-[#181a22]">
          <div className="pt-2 sm:pt-0 sm:pr-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Win Rate</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-semibold text-[#f0f2f5] tabular-nums">
                {stats.winRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-[#696f7e]">
                ({stats.winCount}W / {stats.lossCount}L)
              </span>
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Profit Factor</span>
            <div className="mt-1 text-base font-semibold text-[#f0f2f5] tabular-nums">
              {stats.profitFactor.toFixed(2)}
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4 group cursor-help" title="Trading Expectancy: Rata-rata ekspektasi hasil per trade dalam satuan R (Risk Multiple). Formula: (Win Rate × Avg Win) - (Loss Rate × Avg Loss). Angka positif (+R) menandakan sistem Anda memiliki keunggulan (edge) jangka panjang.">
            <div className="flex items-center gap-1">
              <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e] group-hover:text-[#a0a6b5] transition-colors">Expectancy</span>
              <span className="text-[9px] text-[#555a66] font-sans">ℹ</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-base font-semibold tabular-nums ${stats.expectancy >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                {stats.expectancy >= 0 ? '+' : ''}{stats.expectancy}R
              </span>
              <span className="text-[10px] text-[#555a66]">/ trade</span>
            </div>
          </div>

          <div
            className="pt-2 sm:pt-0 sm:px-4 group cursor-help"
            title={
              stats.totalTrades === 0
                ? 'Average Risk-to-Reward: Belum ada data trade.'
                : stats.winCount === 0 && stats.lossCount > 0
                ? `Average Risk-to-Reward: Target 1:${(stats.avgPlannedRR > 0 ? stats.avgPlannedRR : 1).toFixed(2)} dari setup trading TP & SL (Belum ada trade profit terealisasi).`
                : stats.lossCount === 0 && stats.winCount > 0
                ? `Average Risk-to-Reward: 1:${stats.avgRR.toFixed(2)} dihitung dari rata-rata capaian Win R (+${stats.avgRR.toFixed(2)}R per 1R risk).`
                : `Average Realized Risk-to-Reward: 1:${stats.avgRR.toFixed(2)} (Rasio rata-rata kemenangan $${stats.avgWin.toFixed(2)} berbanding rata-rata kekalahan $${stats.avgLoss.toFixed(2)}).`
            }
          >
            <div className="flex items-center gap-1">
              <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e] group-hover:text-[#a0a6b5] transition-colors">
                Average R:R
              </span>
              <span className="text-[9px] text-[#555a66] font-sans">ℹ</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              {stats.totalTrades === 0 ? (
                <span className="text-base font-semibold text-[#555a66] font-mono">-</span>
              ) : stats.winCount === 0 && stats.lossCount > 0 ? (
                <>
                  <span className="text-base font-semibold text-[#f0f2f5] tabular-nums">
                    1:{(stats.avgPlannedRR > 0 ? stats.avgPlannedRR : 1).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#696f7e] font-sans">Planned</span>
                </>
              ) : (
                <>
                  <span className="text-base font-semibold text-[#f0f2f5] tabular-nums">
                    1:{stats.avgRR.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#696f7e] font-sans">
                    {stats.lossCount === 0 ? 'Win R' : 'Realized'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Max Drawdown</span>
            <div className="mt-1 text-base font-semibold tabular-nums text-[#ef4444]">
              -{stats.maxDrawdownPercent.toFixed(1)}%
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:pl-4">
            <span className="text-[10.5px] uppercase tracking-wider text-[#696f7e]">Avg Hold Time</span>
            <div className="mt-1 text-base font-semibold text-[#f0f2f5] tabular-nums">
              {stats.avgHoldingTimeMinutes} min
            </div>
          </div>
        </div>
      </section>

      {/* 4. Recent Executions & Performance Breakdown (Two-Column Split) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Executions Table (8 cols) */}
        <div className="lg:col-span-8 rounded-lg border border-[#181a22] bg-[#0c0e13] p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#181a22] mb-3">
            <div>
              <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-[#9ea3b0]">
                Recent Executions
              </h3>
              <p className="text-[11px] text-[#555a66]">Latest recorded journal entries</p>
            </div>
            <button
              onClick={onViewAllTrades}
              className="flex items-center gap-1 text-xs font-mono text-[#a0a6b5] hover:text-[#f4f5f7] transition-colors"
            >
              <span>Full Journal</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#181a22] text-[10px] uppercase text-[#696f7e]">
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">Asset</th>
                  <th className="py-2 px-2.5">Side</th>
                  <th className="py-2 px-2.5">Setup</th>
                  <th className="py-2 px-2.5 text-right">Entry</th>
                  <th className="py-2 px-2.5 text-right">Exit</th>
                  <th className="py-2 px-2.5 text-right">P&L</th>
                  <th className="py-2 px-2.5 text-right">R</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15171e]">
                {recentTrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[#555a66] text-xs">
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
                        className="hover:bg-[#12151c] cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-2.5 text-[#696f7e] tabular-nums whitespace-nowrap">
                          {trade.date}
                        </td>
                        <td className="py-2.5 px-2.5 font-medium text-[#e4e7ec] whitespace-nowrap">
                          {trade.instrument}
                        </td>
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          <span
                            className={
                              trade.direction === 'LONG'
                                ? 'text-[#10b981]'
                                : 'text-[#ef4444]'
                            }
                          >
                            {trade.direction}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-[#8c92a2] max-w-[180px] truncate">
                          {trade.setup}
                        </td>
                        <td className="py-2.5 px-2.5 text-right text-[#a0a6b5] tabular-nums">
                          {trade.entryPrice}
                        </td>
                        <td className="py-2.5 px-2.5 text-right text-[#a0a6b5] tabular-nums">
                          {trade.exitPrice}
                        </td>
                        <td
                          className={`py-2.5 px-2.5 text-right font-medium tabular-nums ${
                            isWin
                              ? 'text-[#10b981]'
                              : isLoss
                              ? 'text-[#ef4444]'
                              : 'text-[#696f7e]'
                          }`}
                        >
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </td>
                        <td
                          className={`py-2.5 px-2.5 text-right tabular-nums ${
                            trade.rMultiple >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
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

        {/* Right Column: Execution Extremes & Summary (4 cols, Editorial Key-Value) */}
        <div className="lg:col-span-4 rounded-lg border border-[#181a22] bg-[#0c0e13] p-4 sm:p-5">
          <div className="pb-3 border-b border-[#181a22] mb-3">
            <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-[#9ea3b0]">
              Performance Extremes
            </h3>
            <p className="text-[11px] text-[#555a66]">Historical boundary data</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Best Trade */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#161820]">
              <span className="text-[#696f7e]">Best Trade</span>
              <div className="text-right">
                {stats.bestTrade.pnl > 0 ? (
                  <div>
                    <span className="font-semibold text-[#10b981] tabular-nums">
                      +${stats.bestTrade.pnl.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#555a66] ml-1.5">
                      {stats.bestTrade.instrument} (+{stats.bestTrade.r}R)
                    </span>
                  </div>
                ) : (
                  <span className="text-[#555a66]">-</span>
                )}
              </div>
            </div>

            {/* Worst Trade */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#161820]">
              <span className="text-[#696f7e]">Worst Trade</span>
              <div className="text-right">
                {stats.worstTrade.pnl < 0 ? (
                  <div>
                    <span className="font-semibold text-[#ef4444] tabular-nums">
                      -${Math.abs(stats.worstTrade.pnl).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#555a66] ml-1.5">
                      {stats.worstTrade.instrument} ({stats.worstTrade.r}R)
                    </span>
                  </div>
                ) : (
                  <span className="text-[#555a66]">-</span>
                )}
              </div>
            </div>

            {/* Best Day */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#161820]">
              <span className="text-[#696f7e]">Best Day</span>
              <div className="text-right">
                {stats.bestDay.pnl > 0 ? (
                  <div>
                    <span className="font-semibold text-[#10b981] tabular-nums">
                      +${stats.bestDay.pnl.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#555a66] ml-1.5">{stats.bestDay.date}</span>
                  </div>
                ) : (
                  <span className="text-[#555a66]">-</span>
                )}
              </div>
            </div>

            {/* Worst Day */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#161820]">
              <span className="text-[#696f7e]">Worst Day</span>
              <div className="text-right">
                {stats.worstDay.pnl < 0 ? (
                  <div>
                    <span className="font-semibold text-[#ef4444] tabular-nums">
                      -${Math.abs(stats.worstDay.pnl).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#555a66] ml-1.5">{stats.worstDay.date}</span>
                  </div>
                ) : (
                  <span className="text-[#555a66]">-</span>
                )}
              </div>
            </div>

            {/* Average Win */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#161820]">
              <span className="text-[#696f7e]">Average Win</span>
              <div className="text-right">
                <span className="font-semibold text-[#10b981] tabular-nums">
                  {stats.winCount > 0 ? `+$${stats.avgWin.toFixed(2)}` : '$0.00'}
                </span>
                <span className="text-[10px] text-[#555a66] ml-1.5">({stats.winCount} wins)</span>
              </div>
            </div>

            {/* Average Loss */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#161820]">
              <span className="text-[#696f7e]">Average Loss</span>
              <div className="text-right">
                <span className="font-semibold text-[#ef4444] tabular-nums">
                  {stats.lossCount > 0 ? `-$${stats.avgLoss.toFixed(2)}` : '$0.00'}
                </span>
                <span className="text-[10px] text-[#555a66] ml-1.5">({stats.lossCount} losses)</span>
              </div>
            </div>

            {/* Current Streak */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#696f7e]">Current Streak</span>
              <span
                className={`font-semibold tabular-nums ${
                  stats.currentStreak.type === 'WIN'
                    ? 'text-[#10b981]'
                    : stats.currentStreak.type === 'LOSS'
                    ? 'text-[#ef4444]'
                    : 'text-[#696f7e]'
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
