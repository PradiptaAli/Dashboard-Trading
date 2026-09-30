import React, { useState } from 'react';
import { Trade, TradingPlan, TradingSession, Timeframe } from '../../types/trade';
import { ClipboardList, ShieldAlert, Check, AlertTriangle, ExternalLink, Plus, Trash2 } from 'lucide-react';

interface TradingPlanViewProps {
  plan: TradingPlan;
  onUpdatePlan: (updatedPlan: TradingPlan) => void;
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
}

export const TradingPlanView: React.FC<TradingPlanViewProps> = ({
  plan,
  onUpdatePlan,
  trades,
  onSelectTrade,
}) => {
  const [formData, setFormData] = useState<TradingPlan>(plan);
  const [isSaved, setIsSaved] = useState(false);
  const [newStopCondition, setNewStopCondition] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePlan(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const violatedTrades = trades.filter(t => t.planViolations && t.planViolations.length > 0);

  const toggleSession = (sess: TradingSession) => {
    const current = formData.allowedSessions || [];
    const exists = current.includes(sess);
    const updated = exists ? current.filter(s => s !== sess) : [...current, sess];
    setFormData({ ...formData, allowedSessions: updated });
  };

  const toggleTimeframe = (tf: Timeframe) => {
    const current = formData.allowedTimeframes || [];
    const exists = current.includes(tf);
    const updated = exists ? current.filter(t => t !== tf) : [...current, tf];
    setFormData({ ...formData, allowedTimeframes: updated });
  };

  const addStopCondition = () => {
    if (!newStopCondition.trim()) return;
    setFormData({
      ...formData,
      stopConditions: [...formData.stopConditions, newStopCondition.trim()],
    });
    setNewStopCondition('');
  };

  const removeStopCondition = (index: number) => {
    setFormData({
      ...formData,
      stopConditions: formData.stopConditions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6 max-w-[1300px]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#181a22]">
        <div>
          <h2 className="text-xl font-semibold text-[#f4f5f7] tracking-tight font-mono">
            Systematic Trading Plan & Risk Rules
          </h2>
          <p className="text-xs text-[#696f7e] mt-0.5">
            Hard execution boundaries and risk limits monitored against each trade
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#10b981] bg-[#10b981]/10 px-3 py-1 rounded border border-[#10b981]/20">
            <Check className="h-3.5 w-3.5" />
            <span>Plan Saved & Active</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Quantitative Risk Rules */}
          <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 space-y-4">
            <div className="border-b border-[#181a22] pb-3 text-xs uppercase tracking-wider text-[#9ea3b0] font-medium">
              1. Quantitative Risk Thresholds
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[#696f7e] block mb-1">Risk Per Trade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.riskPerTradePercent}
                  onChange={e => setFormData({ ...formData, riskPerTradePercent: parseFloat(e.target.value) || 0 })}
                  className="w-full h-8 rounded border border-[#1e222c] bg-[#11141b] px-3 text-[#e4e7ec] focus:border-[#383f52] focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="text-[#696f7e] block mb-1">Maximum Daily Loss (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.maxDailyLossPercent}
                  onChange={e => setFormData({ ...formData, maxDailyLossPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full h-8 rounded border border-[#1e222c] bg-[#11141b] px-3 text-[#e4e7ec] focus:border-[#383f52] focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="text-[#696f7e] block mb-1">Maximum Weekly Loss (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.maxWeeklyLossPercent}
                  onChange={e => setFormData({ ...formData, maxWeeklyLossPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full h-8 rounded border border-[#1e222c] bg-[#11141b] px-3 text-[#e4e7ec] focus:border-[#383f52] focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="text-[#696f7e] block mb-1">Maximum Trades Per Day</label>
                <input
                  type="number"
                  value={formData.maxTradesPerDay}
                  onChange={e => setFormData({ ...formData, maxTradesPerDay: parseInt(e.target.value) || 1 })}
                  className="w-full h-8 rounded border border-[#1e222c] bg-[#11141b] px-3 text-[#e4e7ec] focus:border-[#383f52] focus:outline-none tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* 2. Trading Specification Rules */}
          <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 space-y-4">
            <div className="border-b border-[#181a22] pb-3 text-xs uppercase tracking-wider text-[#9ea3b0] font-medium">
              2. Technical Execution Specifications
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[#696f7e] block mb-1">Minimum Risk-to-Reward Ratio</label>
                <div className="flex items-center gap-2">
                  <span className="text-[#696f7e]">1 :</span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minRR}
                    onChange={e => setFormData({ ...formData, minRR: parseFloat(e.target.value) || 1 })}
                    className="w-full h-8 rounded border border-[#1e222c] bg-[#11141b] px-3 text-[#e4e7ec] focus:border-[#383f52] focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#696f7e] block mb-1.5">Authorized Trading Sessions</label>
                <div className="flex gap-2">
                  {(['London', 'New York', 'Asian'] as TradingSession[]).map(sess => {
                    const active = formData.allowedSessions.includes(sess);
                    return (
                      <button
                        type="button"
                        key={sess}
                        onClick={() => toggleSession(sess)}
                        className={`px-3 py-1 rounded text-xs transition-colors ${
                          active
                            ? 'bg-[#181b23] text-[#f4f5f7] font-medium border border-[#2d3243]'
                            : 'bg-[#11141b] text-[#696f7e] border border-[#1e222c] hover:text-[#a0a6b5]'
                        }`}
                      >
                        {sess}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[#696f7e] block mb-1.5">Authorized Timeframes</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['M1', 'M5', 'M15', 'H1', 'H4', 'D1'] as Timeframe[]).map(tf => {
                    const active = formData.allowedTimeframes.includes(tf);
                    return (
                      <button
                        type="button"
                        key={tf}
                        onClick={() => toggleTimeframe(tf)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          active
                            ? 'bg-[#181b23] text-[#f4f5f7] font-medium border border-[#2d3243]'
                            : 'bg-[#11141b] text-[#696f7e] border border-[#1e222c] hover:text-[#a0a6b5]'
                        }`}
                      >
                        {tf}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[#696f7e] block mb-1">Authorized Instruments</label>
                <input
                  type="text"
                  value={formData.allowedInstruments.join(', ')}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      allowedInstruments: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
                    })
                  }
                  className="w-full h-8 rounded border border-[#1e222c] bg-[#11141b] px-3 text-[#e4e7ec] focus:border-[#383f52] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Stop Conditions */}
        <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 space-y-4">
          <div className="border-b border-[#181a22] pb-3 text-xs uppercase tracking-wider text-[#9ea3b0] font-medium">
            3. Mandatory Circuit Breakers & Invalidation Triggers
          </div>

          <div className="space-y-2">
            {formData.stopConditions.map((cond, idx) => (
              <div key={idx} className="flex items-center justify-between rounded bg-[#11141b] p-2.5 border border-[#181a22]">
                <div className="flex items-center gap-2 text-[#d0d4dc]">
                  <ShieldAlert className="h-3.5 w-3.5 text-[#f59e0b] shrink-0" />
                  <span>{cond}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeStopCondition(idx)}
                  className="p-1 text-[#696f7e] hover:text-[#ef4444]"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Add stop condition (e.g., 2 consecutive losses trigger a 2-hour break)"
              value={newStopCondition}
              onChange={e => setNewStopCondition(e.target.value)}
              className="flex-1 h-8 rounded border border-[#1e222c] bg-[#11141b] px-3 text-[#e4e7ec] text-xs focus:border-[#383f52] focus:outline-none placeholder-[#555a66]"
            />
            <button
              type="button"
              onClick={addStopCondition}
              className="h-8 rounded border border-[#1e222c] bg-[#161820] hover:bg-[#1f232e] px-3 text-[#a0a6b5] hover:text-[#e4e7ec] flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md bg-[#161820] hover:bg-[#1f232e] border border-[#262a36] px-4 py-2 text-xs font-medium text-[#f0f2f5] transition-colors"
          >
            <Check className="h-3.5 w-3.5 text-[#10b981]" />
            <span>Save Trading Plan</span>
          </button>
        </div>
      </form>

      {/* 4. Historical Rule Infraction Log */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[#181a22] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b]" />
            <h3 className="font-medium uppercase tracking-wider text-[#9ea3b0]">
              Historical Rule Discrepancy Log ({violatedTrades.length} Trades)
            </h3>
          </div>
          <span className="text-[11px] text-[#555a66]">
            Automatically detected against plan constraints
          </span>
        </div>

        {violatedTrades.length === 0 ? (
          <div className="py-8 text-center text-[#555a66]">
            No rule discrepancies detected. Full systematic discipline observed across all trades.
          </div>
        ) : (
          <div className="space-y-2">
            {violatedTrades.slice(0, 10).map(t => (
              <div
                key={t.id}
                onClick={() => onSelectTrade(t)}
                className="flex items-center justify-between rounded border border-[#241d14] bg-[#120f0a] p-2.5 hover:bg-[#19150e] cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 text-[#e4e7ec]">
                    <span className="font-semibold">{t.id}</span>
                    <span className="text-[#555a66]">·</span>
                    <span>{t.instrument}</span>
                    <span className={t.direction === 'LONG' ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                      {t.direction}
                    </span>
                    <span className="text-[#555a66] text-[10px]">({t.date})</span>
                  </div>
                  <div className="text-[#d9a86c] text-[11px] mt-0.5">
                    {t.planViolations?.join('; ')}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-semibold tabular-nums ${t.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)} ({t.rMultiple}R)
                  </div>
                  <span className="text-[10px] text-[#696f7e] flex items-center gap-1 justify-end mt-0.5">
                    <span>Inspect</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
