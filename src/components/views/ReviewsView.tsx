import React, { useState, useMemo } from 'react';
import { Trade, DailyReview, WeeklyReview } from '../../types/trade';
import { Calendar, Plus, Check } from 'lucide-react';
import { groupTradesByCategory } from '../../utils/calculations';

interface ReviewsViewProps {
  dailyReviews: DailyReview[];
  weeklyReviews: WeeklyReview[];
  trades: Trade[];
  onSaveDailyReview: (review: DailyReview) => void;
  onSaveWeeklyReview: (review: WeeklyReview) => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({
  dailyReviews,
  weeklyReviews,
  trades,
  onSaveDailyReview,
  onSaveWeeklyReview,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [isAdding, setIsAdding] = useState(false);

  // Daily review form state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [ruleViolations, setRuleViolations] = useState('None. Plan followed systematically.');
  const [emotionalState, setEmotionalState] = useState('Calm and focused.');
  const [mainLesson, setMainLesson] = useState('');
  const [tomorrowFocus, setTomorrowFocus] = useState('');

  // Weekly review form state
  const [weekLabel, setWeekLabel] = useState('Week 40 (Sep 28 - Oct 02, 2026)');
  const [weekStart, setWeekStart] = useState('2026-09-28');
  const [weekEnd, setWeekEnd] = useState('2026-10-02');
  const [whatWorked, setWhatWorked] = useState('');
  const [whatDidnt, setWhatDidnt] = useState('');
  const [changesNextWeek, setChangesNextWeek] = useState('');

  // Compute stats for selected day automatically
  const dayTrades = useMemo(() => {
    return trades.filter(t => t.date === selectedDate);
  }, [trades, selectedDate]);

  const dayStats = useMemo(() => {
    let pnl = 0;
    let r = 0;
    let wins = 0;
    let losses = 0;
    let best = { pnl: -Infinity, id: '-', instrument: '-' };
    let worst = { pnl: Infinity, id: '-', instrument: '-' };

    dayTrades.forEach(t => {
      pnl += t.pnl;
      r += t.rMultiple;
      if (t.pnl > 0) wins++;
      else if (t.pnl < 0) losses++;

      if (t.pnl > best.pnl) best = { pnl: t.pnl, id: t.id, instrument: t.instrument };
      if (t.pnl < worst.pnl) worst = { pnl: t.pnl, id: t.id, instrument: t.instrument };
    });

    const total = dayTrades.length;
    const wr = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

    return {
      total,
      pnl: Math.round(pnl),
      r: Number(r.toFixed(1)),
      wr: Number(wr.toFixed(1)),
      best: best.pnl === -Infinity ? null : best,
      worst: worst.pnl === Infinity ? null : worst,
    };
  }, [dayTrades]);

  // Compute stats for selected week automatically
  const weekTrades = useMemo(() => {
    return trades.filter(t => t.date >= weekStart && t.date <= weekEnd);
  }, [trades, weekStart, weekEnd]);

  const weekStats = useMemo(() => {
    let pnl = 0;
    let r = 0;
    let wins = 0;
    let losses = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    weekTrades.forEach(t => {
      pnl += t.pnl;
      r += t.rMultiple;
      if (t.pnl > 0) {
        wins++;
        grossProfit += t.pnl;
      } else if (t.pnl < 0) {
        losses++;
        grossLoss += Math.abs(t.pnl);
      }
    });

    const totalTrades = weekTrades.length;
    const winRate = wins + losses > 0 ? Number(((wins / (wins + losses)) * 100).toFixed(1)) : 0;
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;
    const expectancy = totalTrades > 0 ? Number((r / totalTrades).toFixed(2)) : 0;

    const setupStats = groupTradesByCategory(weekTrades, t => t.setup);
    const bestSetup = setupStats.length > 0 ? setupStats[0].name : 'N/A';

    const sessionStats = groupTradesByCategory(weekTrades, t => t.session);
    const bestSession = sessionStats.length > 0 ? sessionStats[0].name : 'N/A';

    return {
      totalTrades,
      pnl: Math.round(pnl),
      r: Number(r.toFixed(1)),
      winRate,
      profitFactor,
      expectancy,
      bestSetup,
      bestSession,
    };
  }, [weekTrades]);

  const handleSubmitDaily = (e: React.FormEvent) => {
    e.preventDefault();
    const newDaily: DailyReview = {
      id: `daily_${selectedDate}_${Date.now()}`,
      date: selectedDate,
      tradesCount: dayStats.total,
      dailyPnl: dayStats.pnl,
      dailyR: dayStats.r,
      winRate: dayStats.wr,
      whatWentWell,
      whatWentWrong,
      ruleViolations,
      emotionalState,
      mainLesson,
      tomorrowFocus,
      createdAt: new Date().toISOString(),
    };

    onSaveDailyReview(newDaily);
    setIsAdding(false);
    setWhatWentWell('');
    setWhatWentWrong('');
    setMainLesson('');
    setTomorrowFocus('');
  };

  const handleSubmitWeekly = (e: React.FormEvent) => {
    e.preventDefault();
    const newWeekly: WeeklyReview = {
      id: `weekly_${weekStart}_${Date.now()}`,
      weekLabel,
      startDate: weekStart,
      endDate: weekEnd,
      tradesCount: weekStats.totalTrades,
      netPnl: weekStats.pnl,
      netR: weekStats.r,
      winRate: weekStats.winRate,
      profitFactor: weekStats.profitFactor,
      expectancy: weekStats.expectancy,
      whatWorked,
      whatDidnt,
      changesNextWeek,
      bestPerformingSetup: weekStats.bestSetup,
      worstPerformingSetup: 'N/A',
      dominantSession: weekStats.bestSession,
      createdAt: new Date().toISOString(),
    };

    onSaveWeeklyReview(newWeekly);
    setIsAdding(false);
    setWhatWorked('');
    setWhatDidnt('');
    setChangesNextWeek('');
  };

  return (
    <div className="space-y-6 max-w-[1300px]">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#181a22]">
        <div>
          <h2 className="text-xl font-semibold text-[#f4f5f7] tracking-tight font-mono">
            Execution Reviews & Debriefs
          </h2>
          <p className="text-xs text-[#696f7e] mt-0.5">
            Systematic qualitative post-trade reflection and weekly retrospective logging
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Daily / Weekly Switcher */}
          <div className="flex items-center gap-1 rounded bg-[#0c0e13] p-0.5 text-xs font-mono border border-[#1e222c]">
            <button
              onClick={() => {
                setActiveTab('daily');
                setIsAdding(false);
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'daily'
                  ? 'bg-[#181b23] text-[#f4f5f7] font-medium'
                  : 'text-[#696f7e] hover:text-[#d0d4dc]'
              }`}
            >
              Daily Debrief
            </button>
            <button
              onClick={() => {
                setActiveTab('weekly');
                setIsAdding(false);
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'weekly'
                  ? 'bg-[#181b23] text-[#f4f5f7] font-medium'
                  : 'text-[#696f7e] hover:text-[#d0d4dc]'
              }`}
            >
              Weekly Retrospective
            </button>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-md bg-[#161820] hover:bg-[#1f232e] border border-[#262a36] px-3 py-1.5 text-xs font-medium text-[#f0f2f5] transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-[#10b981]" />
            <span>{isAdding ? 'Close Form' : `Log ${activeTab === 'daily' ? 'Daily' : 'Weekly'}`}</span>
          </button>
        </div>
      </div>

      {/* DAILY REVIEW SECTION */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* New Daily Review Form */}
          {isAdding && (
            <form onSubmit={handleSubmitDaily} className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#181a22] pb-3">
                <span className="font-medium uppercase tracking-wider text-[#9ea3b0]">
                  Log Daily Trading Reflection
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="rounded border border-[#1e222c] bg-[#11141b] px-2.5 py-1 text-[#e4e7ec] focus:outline-none"
                  required
                />
              </div>

              {/* Automatic Daily Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#11141b] p-3 rounded border border-[#181a22]">
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Daily P&L</span>
                  <span className={`text-sm font-semibold tabular-nums ${dayStats.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {dayStats.pnl >= 0 ? '+' : ''}${dayStats.pnl.toFixed(2)} ({dayStats.r}R)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Trades Executed</span>
                  <span className="text-sm font-semibold text-[#e4e7ec] tabular-nums">{dayStats.total}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Win Rate</span>
                  <span className="text-sm font-semibold text-[#e4e7ec] tabular-nums">{dayStats.wr}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Best Trade</span>
                  <span className="text-xs font-semibold text-[#10b981] tabular-nums">
                    {dayStats.best ? `+$${dayStats.best.pnl.toFixed(2)} (${dayStats.best.instrument})` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Worst Trade</span>
                  <span className="text-xs font-semibold text-[#ef4444] tabular-nums">
                    {dayStats.worst ? `-$${Math.abs(dayStats.worst.pnl).toFixed(2)} (${dayStats.worst.instrument})` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#696f7e] block mb-1">What went well today?</label>
                  <textarea
                    rows={2}
                    value={whatWentWell}
                    onChange={e => setWhatWentWell(e.target.value)}
                    className="w-full rounded border border-[#1e222c] bg-[#11141b] p-2.5 text-[#e4e7ec] font-sans text-xs focus:border-[#383f52] focus:outline-none placeholder-[#555a66]"
                    placeholder="Patience, execution discipline, setup identification..."
                    required
                  />
                </div>

                <div>
                  <label className="text-[#696f7e] block mb-1">What went wrong / mistakes?</label>
                  <textarea
                    rows={2}
                    value={whatWentWrong}
                    onChange={e => setWhatWentWrong(e.target.value)}
                    className="w-full rounded border border-[#1e222c] bg-[#11141b] p-2.5 text-[#e4e7ec] font-sans text-xs focus:border-[#383f52] focus:outline-none placeholder-[#555a66]"
                    placeholder="Chased entries, impatience, premature exits..."
                    required
                  />
                </div>

                <div>
                  <label className="text-[#696f7e] block mb-1">Rule Violations</label>
                  <input
                    type="text"
                    value={ruleViolations}
                    onChange={e => setRuleViolations(e.target.value)}
                    className="w-full h-8 rounded border border-[#1e222c] bg-[#11141b] px-3 text-[#e4e7ec] text-xs focus:border-[#383f52] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#696f7e] block mb-1">Emotional State</label>
                  <input
                    type="text"
                    value={emotionalState}
                    onChange={e => setEmotionalState(e.target.value)}
                    className="w-full h-8 rounded border border-[#1e222c] bg-[#11141b] px-3 text-[#e4e7ec] text-xs focus:border-[#383f52] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#696f7e] block mb-1">Main Lesson of the Day</label>
                  <textarea
                    rows={2}
                    value={mainLesson}
                    onChange={e => setMainLesson(e.target.value)}
                    className="w-full rounded border border-[#1e222c] bg-[#11141b] p-2.5 text-[#e4e7ec] font-sans text-xs focus:border-[#383f52] focus:outline-none placeholder-[#555a66]"
                    placeholder="Key principle to remember..."
                    required
                  />
                </div>

                <div>
                  <label className="text-[#696f7e] block mb-1">Tomorrow's Core Focus</label>
                  <textarea
                    rows={2}
                    value={tomorrowFocus}
                    onChange={e => setTomorrowFocus(e.target.value)}
                    className="w-full rounded border border-[#1e222c] bg-[#11141b] p-2.5 text-[#e4e7ec] font-sans text-xs focus:border-[#383f52] focus:outline-none placeholder-[#555a66]"
                    placeholder="Target watchlist, setups to prioritize..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#181a22]">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded px-3 py-1.5 text-[#696f7e] hover:text-[#d0d4dc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-md bg-[#161820] hover:bg-[#1f232e] border border-[#262a36] px-4 py-1.5 font-medium text-[#f0f2f5] transition-colors"
                >
                  <Check className="h-3.5 w-3.5 text-[#10b981]" />
                  <span>Save Daily Debrief</span>
                </button>
              </div>
            </form>
          )}

          {/* Daily Reviews Feed */}
          <div className="space-y-4">
            {dailyReviews.length === 0 ? (
              <div className="py-12 text-center text-[#555a66] font-mono text-xs rounded-lg border border-[#181a22] bg-[#0c0e13]">
                No daily debriefs logged yet. Click &ldquo;Log Daily&rdquo; to record end-of-day observations.
              </div>
            ) : (
              dailyReviews.map(rev => (
                <div key={rev.id} className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-4 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#181a22] pb-2 text-[#a0a6b5]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#696f7e]" />
                      <span className="font-semibold text-sm text-[#f4f5f7]">{rev.date} Daily Debrief</span>
                    </div>
                    <span className="text-[11px] text-[#555a66]">Recorded systematically</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#d0d4dc] font-sans">
                    <div className="rounded bg-[#11141b] p-3 border border-[#181a22]">
                      <span className="font-mono text-[10px] uppercase text-[#10b981] font-medium block mb-1">
                        What Went Well
                      </span>
                      <p className="text-xs text-[#a0a6b5] leading-relaxed">{rev.whatWentWell}</p>
                    </div>

                    <div className="rounded bg-[#11141b] p-3 border border-[#181a22]">
                      <span className="font-mono text-[10px] uppercase text-[#ef4444] font-medium block mb-1">
                        What Went Wrong
                      </span>
                      <p className="text-xs text-[#a0a6b5] leading-relaxed">{rev.whatWentWrong}</p>
                    </div>

                    <div className="rounded bg-[#11141b] p-3 border border-[#181a22]">
                      <span className="font-mono text-[10px] uppercase text-[#f59e0b] font-medium block mb-1">
                        Key Lesson
                      </span>
                      <p className="text-xs text-[#a0a6b5] leading-relaxed">{rev.mainLesson}</p>
                    </div>

                    <div className="rounded bg-[#11141b] p-3 border border-[#181a22]">
                      <span className="font-mono text-[10px] uppercase text-[#696f7e] font-medium block mb-1">
                        Tomorrow's Focus
                      </span>
                      <p className="text-xs text-[#a0a6b5] leading-relaxed">{rev.tomorrowFocus}</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] text-[#555a66] pt-1 border-t border-[#181a22]">
                    <span>Rule compliance: <strong className="text-[#a0a6b5] font-normal">{rev.ruleViolations}</strong></span>
                    <span>Emotional tone: <strong className="text-[#a0a6b5] font-normal">{rev.emotionalState}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* WEEKLY RETROSPECTIVE SECTION */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          {isAdding && (
            <form onSubmit={handleSubmitWeekly} className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 space-y-4 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#181a22] pb-3">
                <span className="font-medium uppercase tracking-wider text-[#9ea3b0]">
                  Log Weekly Performance Retrospective
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={weekStart}
                    onChange={e => setWeekStart(e.target.value)}
                    className="rounded border border-[#1e222c] bg-[#11141b] px-2 py-1 text-[#e4e7ec] focus:outline-none"
                  />
                  <span className="text-[#555a66]">to</span>
                  <input
                    type="date"
                    value={weekEnd}
                    onChange={e => setWeekEnd(e.target.value)}
                    className="rounded border border-[#1e222c] bg-[#11141b] px-2 py-1 text-[#e4e7ec] focus:outline-none"
                  />
                </div>
              </div>

              {/* Automatic Weekly Statistics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-[#11141b] p-3 rounded border border-[#181a22]">
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Weekly P&L</span>
                  <span className={`text-sm font-semibold tabular-nums ${weekStats.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {weekStats.pnl >= 0 ? '+' : ''}${weekStats.pnl.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Total R</span>
                  <span className="text-sm font-semibold text-[#10b981] tabular-nums">+{weekStats.r}R</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Win Rate</span>
                  <span className="text-sm font-semibold text-[#e4e7ec] tabular-nums">{weekStats.winRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Profit Factor</span>
                  <span className="text-sm font-semibold text-[#e4e7ec] tabular-nums">{weekStats.profitFactor}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Expectancy</span>
                  <span className="text-sm font-semibold text-[#10b981] tabular-nums">+{weekStats.expectancy}R</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Best Setup</span>
                  <span className="text-xs font-semibold text-[#e4e7ec] truncate block">{weekStats.bestSetup}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#696f7e] uppercase block">Best Session</span>
                  <span className="text-xs font-semibold text-[#e4e7ec] truncate block">{weekStats.bestSession}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[#696f7e] block mb-1">What worked this week?</label>
                  <textarea
                    rows={2}
                    value={whatWorked}
                    onChange={e => setWhatWorked(e.target.value)}
                    className="w-full rounded border border-[#1e222c] bg-[#11141b] p-2.5 text-[#e4e7ec] font-sans text-xs focus:border-[#383f52] focus:outline-none placeholder-[#555a66]"
                    placeholder="Strategies with highest edge, patience..."
                    required
                  />
                </div>

                <div>
                  <label className="text-[#696f7e] block mb-1">What didn't work?</label>
                  <textarea
                    rows={2}
                    value={whatDidnt}
                    onChange={e => setWhatDidnt(e.target.value)}
                    className="w-full rounded border border-[#1e222c] bg-[#11141b] p-2.5 text-[#e4e7ec] font-sans text-xs focus:border-[#383f52] focus:outline-none placeholder-[#555a66]"
                    placeholder="Overtrading, choppy sessions, slip-ups..."
                    required
                  />
                </div>

                <div>
                  <label className="text-[#696f7e] block mb-1">What changes should be made next week?</label>
                  <textarea
                    rows={2}
                    value={changesNextWeek}
                    onChange={e => setChangesNextWeek(e.target.value)}
                    className="w-full rounded border border-[#1e222c] bg-[#11141b] p-2.5 text-[#e4e7ec] font-sans text-xs focus:border-[#383f52] focus:outline-none placeholder-[#555a66]"
                    placeholder="Adjust position size, refine session timing..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#181a22]">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded px-3 py-1.5 text-[#696f7e] hover:text-[#d0d4dc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-md bg-[#161820] hover:bg-[#1f232e] border border-[#262a36] px-4 py-1.5 font-medium text-[#f0f2f5] transition-colors"
                >
                  <Check className="h-3.5 w-3.5 text-[#10b981]" />
                  <span>Save Weekly Retrospective</span>
                </button>
              </div>
            </form>
          )}

          {/* Weekly Reviews Feed */}
          <div className="space-y-4">
            {weeklyReviews.length === 0 ? (
              <div className="py-12 text-center text-[#555a66] font-mono text-xs rounded-lg border border-[#181a22] bg-[#0c0e13]">
                No weekly retrospectives logged yet. Click &ldquo;Log Weekly&rdquo; to review weekly performance.
              </div>
            ) : (
              weeklyReviews.map(w => (
                <div key={w.id} className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-4 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#181a22] pb-2 text-[#a0a6b5]">
                    <span className="font-semibold text-sm text-[#f4f5f7]">{w.weekLabel}</span>
                    <span className="text-[11px] text-[#555a66]">{w.startDate} → {w.endDate}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[#d0d4dc] font-sans">
                    <div className="rounded bg-[#11141b] p-3 border border-[#181a22]">
                      <span className="font-mono text-[10px] uppercase text-[#10b981] font-medium block mb-1">
                        What Worked
                      </span>
                      <p className="text-xs text-[#a0a6b5] leading-relaxed">{w.whatWorked}</p>
                    </div>

                    <div className="rounded bg-[#11141b] p-3 border border-[#181a22]">
                      <span className="font-mono text-[10px] uppercase text-[#ef4444] font-medium block mb-1">
                        What Didn't Work
                      </span>
                      <p className="text-xs text-[#a0a6b5] leading-relaxed">{w.whatDidnt}</p>
                    </div>

                    <div className="rounded bg-[#11141b] p-3 border border-[#181a22]">
                      <span className="font-mono text-[10px] uppercase text-[#f59e0b] font-medium block mb-1">
                        Next Week's Mandate
                      </span>
                      <p className="text-xs text-[#a0a6b5] leading-relaxed">{w.changesNextWeek}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
