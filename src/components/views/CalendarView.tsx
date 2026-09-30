import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Trade } from '../../types/trade';

interface CalendarViewProps {
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ trades, onSelectTrade }) => {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 0-indexed: 8 = September
  const [selectedDayTrades, setSelectedDayTrades] = useState<{ date: string; trades: Trade[] } | null>(null);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const tradesByDate = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    for (const t of trades) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    return map;
  }, [trades]);

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const adjustedFirstDay = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: null, dateStr: '', trades: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTrades = tradesByDate[dateStr] || [];
      days.push({ day: d, dateStr, trades: dayTrades });
    }

    return days;
  }, [currentYear, currentMonth, tradesByDate]);

  const monthlyStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const mTrades = trades.filter(t => t.date.startsWith(monthPrefix));

    let totalPnl = 0;
    let totalR = 0;
    let wins = 0;
    let losses = 0;

    mTrades.forEach(t => {
      totalPnl += t.pnl;
      totalR += t.rMultiple;
      if (t.pnl > 0) wins++;
      else if (t.pnl < 0) losses++;
    });

    const totalTrades = mTrades.length;
    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

    return {
      totalPnl: Number(totalPnl.toFixed(2)),
      totalR: Number(totalR.toFixed(1)),
      winRate: Number(winRate.toFixed(1)),
      totalTrades,
    };
  }, [trades, currentYear, currentMonth]);

  return (
    <div className="space-y-6 max-w-[1300px]">
      {/* Month Header & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#181a22]">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-[#f4f5f7] tracking-tight font-mono">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <div className="flex items-center gap-1 border border-[#1e222c] rounded-md p-0.5 bg-[#0c0e13]">
            <button
              onClick={prevMonth}
              className="p-1 text-[#6e7484] hover:text-[#e4e7ec] rounded"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setCurrentYear(2026);
                setCurrentMonth(8);
              }}
              className="px-2 py-0.5 text-xs text-[#8c92a2] hover:text-[#e4e7ec] font-mono"
            >
              Current
            </button>
            <button
              onClick={nextMonth}
              className="p-1 text-[#6e7484] hover:text-[#e4e7ec] rounded"
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Compact Monthly Metrics */}
        <div className="flex items-center gap-6 text-xs font-mono">
          <div>
            <span className="text-[#646a78] block text-[10.5px]">Month Net</span>
            <span
              className={`font-semibold tabular-nums ${
                monthlyStats.totalPnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
              }`}
            >
              {monthlyStats.totalPnl >= 0 ? '+' : ''}${monthlyStats.totalPnl.toFixed(2)}
            </span>
          </div>

          <div className="h-6 w-px bg-[#181a22]" />

          <div>
            <span className="text-[#646a78] block text-[10.5px]">Total R</span>
            <span
              className={`font-semibold tabular-nums ${
                monthlyStats.totalR >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
              }`}
            >
              {monthlyStats.totalR >= 0 ? '+' : ''}{monthlyStats.totalR}R
            </span>
          </div>

          <div className="h-6 w-px bg-[#181a22]" />

          <div>
            <span className="text-[#646a78] block text-[10.5px]">Win Rate</span>
            <span className="font-semibold text-[#e4e7ec] tabular-nums">
              {monthlyStats.winRate}% ({monthlyStats.totalTrades} trades)
            </span>
          </div>
        </div>
      </div>

      {/* Minimalist Monthly Grid */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-[#181a22] bg-[#0f1117] text-center text-[11px] font-mono text-[#696f7e] py-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[#15171e]">
          {calendarDays.map((cell, idx) => {
            if (!cell.day) {
              return <div key={`empty-${idx}`} className="h-24 bg-[#090b0e]/30" />;
            }

            const dayTrades = cell.trades;
            const hasTrades = dayTrades.length > 0;
            const dayPnl = dayTrades.reduce((acc, t) => acc + t.pnl, 0);
            const dayR = dayTrades.reduce((acc, t) => acc + t.rMultiple, 0);

            // Subtle background intensity
            let cellStyle = 'bg-[#0c0e13] text-[#4f5461]';
            if (hasTrades) {
              if (dayPnl > 0) {
                cellStyle = 'bg-[#10b981]/[0.03] hover:bg-[#10b981]/[0.07] text-[#e4e7ec] cursor-pointer';
              } else if (dayPnl < 0) {
                cellStyle = 'bg-[#ef4444]/[0.03] hover:bg-[#ef4444]/[0.07] text-[#e4e7ec] cursor-pointer';
              } else {
                cellStyle = 'bg-[#151820]/40 text-[#c2c7d4] cursor-pointer';
              }
            }

            return (
              <div
                key={cell.dateStr}
                onClick={() => {
                  if (hasTrades) {
                    setSelectedDayTrades({ date: cell.dateStr, trades: dayTrades });
                  }
                }}
                className={`h-24 p-2 flex flex-col justify-between transition-colors select-none ${cellStyle}`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={hasTrades ? 'font-medium text-[#d0d4dc]' : 'text-[#4f5461]'}>
                    {cell.day}
                  </span>
                  {hasTrades && (
                    <span className="text-[10px] text-[#696f7e]">
                      {dayTrades.length}t
                    </span>
                  )}
                </div>

                {hasTrades ? (
                  <div className="font-mono text-xs space-y-0.5">
                    <div
                      className={`font-semibold tabular-nums ${
                        dayPnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                      }`}
                    >
                      {dayPnl >= 0 ? '+' : ''}${dayPnl.toFixed(2)}
                    </div>
                    <div
                      className={`text-[10.5px] tabular-nums ${
                        dayR >= 0 ? 'text-[#10b981]/80' : 'text-[#ef4444]/80'
                      }`}
                    >
                      {dayR >= 0 ? '+' : ''}{dayR.toFixed(1)}R
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-[#333742] font-mono">·</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Clean Slide-Over / Modal for Day Executions */}
      {selectedDayTrades && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg border border-[#1e222c] bg-[#0c0e13] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#181a22] mb-4">
              <div>
                <h3 className="font-mono text-sm font-semibold text-[#f4f5f7]">
                  Executions for {selectedDayTrades.date}
                </h3>
                <span className="text-xs text-[#696f7e] font-mono">
                  {selectedDayTrades.trades.length} trades recorded
                </span>
              </div>
              <button
                onClick={() => setSelectedDayTrades(null)}
                className="p-1 rounded text-[#6e7484] hover:text-[#e4e7ec]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedDayTrades.trades.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedDayTrades(null);
                    onSelectTrade(t);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-md border border-[#181a22] bg-[#11131a] hover:bg-[#161922] cursor-pointer transition-colors text-xs font-mono"
                >
                  <div>
                    <div className="font-semibold text-[#e4e7ec] flex items-center gap-1.5">
                      <span>{t.instrument}</span>
                      <span className={t.direction === 'LONG' ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                        {t.direction}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#696f7e]">{t.setup} · {t.time || '10:00'}</div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-semibold tabular-nums ${
                        t.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                      }`}
                    >
                      {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#696f7e]">{t.rMultiple >= 0 ? '+' : ''}{t.rMultiple}R</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
