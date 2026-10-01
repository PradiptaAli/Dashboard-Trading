import React, { useState } from 'react';
import { ArrowLeft, Edit3, Trash2, Copy, AlertTriangle, Maximize2, Tag } from 'lucide-react';
import { Trade } from '../../types/trade';
import { ConfirmModal } from '../common/ConfirmModal';

interface TradeDetailViewProps {
  trade: Trade;
  onBack: () => void;
  onEdit: (trade: Trade) => void;
  onDelete: (tradeId: string) => void;
  onDuplicate: (tradeId: string) => void;
}

export const TradeDetailView: React.FC<TradeDetailViewProps> = ({
  trade,
  onBack,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isWin = trade.pnl > 0;
  const isLoss = trade.pnl < 0;

  return (
    <div className="space-y-6 max-w-[1300px]">
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-black/30 hover:bg-[#151820] px-2.5 py-1.5 text-xs text-[#a0a6b5] hover:text-[#f4f5f7] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Journal</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-semibold text-[#f4f5f7]">{trade.instrument}</span>
              <span
                className={`font-mono text-xs font-semibold ${
                  trade.direction === 'LONG' ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}
              >
                {trade.direction}
              </span>
              <span
                className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded ${
                  isWin
                    ? 'text-[#10b981] bg-[#10b981]/10'
                    : isLoss
                    ? 'text-[#ef4444] bg-[#ef4444]/10'
                    : 'text-[#6e7484] bg-[#1a1d25]'
                }`}
              >
                {trade.result}
              </span>
            </div>
            <div className="text-[11px] text-[#555a66] font-mono mt-0.5">
              {trade.date} · {trade.time || '10:00'} · {trade.session} Session · {trade.timeframe} · ID: {trade.id}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => onDuplicate(trade.id)}
            className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-black/30 hover:bg-[#151820] px-2.5 py-1.5 text-[#a0a6b5] hover:text-[#f4f5f7] transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>
          <button
            onClick={() => onEdit(trade)}
            className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-black/30 hover:bg-[#151820] px-2.5 py-1.5 text-[#a0a6b5] hover:text-[#f4f5f7] transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#2a1c20] bg-[#140e10] hover:bg-[#1f1317] px-2.5 py-1.5 text-[#ef4444] transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Plan Violations Warning Banner */}
      {trade.planViolations && trade.planViolations.length > 0 && (
        <div className="rounded-md border border-[#3b2b1a] bg-[#17130e] p-3 text-xs text-[#d9a86c]">
          <div className="flex items-center gap-1.5 font-mono font-medium text-[#f59e0b] mb-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Execution Rule Discrepancy</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[#c29660] font-mono text-[11px]">
            {trade.planViolations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Chart / Screenshot & Price Levels (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Chart Screenshot Container */}
          <div className="rounded-lg border border-white/[0.06] bg-black/30 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2 text-xs font-mono text-[#696f7e]">
              <span>Execution Chart Snapshot</span>
              {trade.screenshotBefore && (
                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="flex items-center gap-1 text-[11px] text-[#787f91] hover:text-[#d0d4dc]"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>{isZoomed ? 'Contract' : 'Expand'}</span>
                </button>
              )}
            </div>

            <div className={`relative bg-[#07080b] flex items-center justify-center ${isZoomed ? 'h-[500px]' : 'h-72'}`}>
              {trade.screenshotBefore ? (
                <img
                  src={trade.screenshotBefore}
                  alt={`Execution chart for ${trade.instrument}`}
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center p-6 text-[#4f5461] font-mono text-xs">
                  <div>No chart snapshot attached</div>
                  <div className="text-[11px] text-[#3e424e] mt-1">Upload an image when editing this trade</div>
                </div>
              )}
            </div>
          </div>

          {/* Compact Price Levels Grid */}
          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            <div className="rounded-md border border-white/[0.06] bg-black/30 p-2.5 text-center">
              <span className="text-[10px] text-[#555a66] uppercase">Entry</span>
              <div className="mt-0.5 font-semibold text-[#e4e7ec] tabular-nums">{trade.entryPrice}</div>
            </div>
            <div className="rounded-md border border-white/[0.06] bg-black/30 p-2.5 text-center">
              <span className="text-[10px] text-[#555a66] uppercase">Stop Loss</span>
              <div className="mt-0.5 font-semibold text-[#ef4444] tabular-nums">{trade.stopLoss}</div>
            </div>
            <div className="rounded-md border border-white/[0.06] bg-black/30 p-2.5 text-center">
              <span className="text-[10px] text-[#555a66] uppercase">Take Profit</span>
              <div className="mt-0.5 font-semibold text-[#10b981] tabular-nums">{trade.takeProfit}</div>
            </div>
            <div className="rounded-md border border-white/[0.06] bg-black/30 p-2.5 text-center">
              <span className="text-[10px] text-[#555a66] uppercase">Exit</span>
              <div className="mt-0.5 font-semibold text-[#e4e7ec] tabular-nums">{trade.exitPrice}</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Trade Statistics (5 cols) */}
        <div className="lg:col-span-5 rounded-lg border border-white/[0.06] bg-black/30 p-4 sm:p-5 font-mono text-xs space-y-4">
          {/* Main Financial Result Callout */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#696f7e]">Net Realized P&L</span>
              <div
                className={`text-2xl font-semibold tabular-nums mt-0.5 ${
                  isWin ? 'text-[#10b981]' : isLoss ? 'text-[#ef4444]' : 'text-[#848a97]'
                }`}
              >
                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#696f7e]">R-Multiple</span>
              <div
                className={`text-2xl font-semibold tabular-nums mt-0.5 ${
                  trade.rMultiple >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}
              >
                {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
              </div>
            </div>
          </div>

          {/* Key-Value Statistics List */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
              <span className="text-[#696f7e]">Position Sizing</span>
              <span className="font-semibold text-[#e4e7ec] tabular-nums">
                {trade.positionSize} {trade.sizeUnit || 'USDT'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
              <span className="text-[#696f7e]">Risk Amount (1R)</span>
              <span className="font-semibold text-[#e4e7ec] tabular-nums">
                ${trade.riskAmount.toFixed(2)} ({trade.riskPercent}%)
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
              <span className="text-[#696f7e]">Holding Duration</span>
              <span className="font-semibold text-[#e4e7ec] tabular-nums">
                {trade.holdingTimeMinutes || 30} minutes
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
              <span className="text-[#696f7e]">Setup Model</span>
              <span className="font-semibold text-[#e4e7ec]">{trade.setup}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
              <span className="text-[#696f7e]">Strategy</span>
              <span className="font-semibold text-[#e4e7ec]">{trade.strategy}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
              <span className="text-[#696f7e]">Trading Session</span>
              <span className="font-semibold text-[#e4e7ec]">{trade.session}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
              <span className="text-[#696f7e]">Emotional State</span>
              <span className="font-semibold text-[#e4e7ec]">{trade.emotion}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
              <span className="text-[#696f7e]">Execution Discipline</span>
              <span className="font-semibold text-[#10b981] tabular-nums">{trade.discipline} / 10</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#696f7e]">Mistake Flag</span>
              <span className={`font-semibold ${trade.mistake && trade.mistake !== 'None' ? 'text-[#ef4444]' : 'text-[#696f7e]'}`}>
                {trade.mistake || 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BELOW: Thesis, Exit Reasoning, Reviews, Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Thesis & Exit Reasoning */}
        <div className="rounded-lg border border-white/[0.06] bg-black/30 p-4 space-y-4">
          <div>
            <h4 className="text-xs font-mono font-medium uppercase tracking-wider text-[#9ea3b0] mb-1.5">
              Trade Thesis (Entry Rationale)
            </h4>
            <p className="text-xs text-[#a0a6b5] leading-relaxed">
              {trade.entryReason || 'No specific entry notes provided.'}
            </p>
          </div>
          <div className="pt-3 border-t border-white/[0.06]">
            <h4 className="text-xs font-mono font-medium uppercase tracking-wider text-[#9ea3b0] mb-1.5">
              Exit Reasoning
            </h4>
            <p className="text-xs text-[#a0a6b5] leading-relaxed">
              {trade.exitReason || 'No specific exit notes provided.'}
            </p>
          </div>
        </div>

        {/* Right: Notes, Review, Tags */}
        <div className="rounded-lg border border-white/[0.06] bg-black/30 p-4 space-y-4">
          <div>
            <h4 className="text-xs font-mono font-medium uppercase tracking-wider text-[#9ea3b0] mb-1.5">
              Review Notes & Observations
            </h4>
            <p className="text-xs text-[#a0a6b5] leading-relaxed">
              {trade.notes || 'No review notes entered for this session.'}
            </p>
          </div>
          {trade.tags && trade.tags.length > 0 && (
            <div className="pt-3 border-t border-white/[0.06]">
              <span className="text-[10.5px] font-mono uppercase text-[#696f7e] block mb-1.5">Tags</span>
              <div className="flex flex-wrap gap-2 text-xs text-[#8c92a2]">
                {trade.tags.map((tag, idx) => (
                  <span key={idx} className="flex items-center gap-1 font-mono text-[11px]">
                    <Tag className="h-3 w-3 text-[#555a66]" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmModal
          isOpen={true}
          title="Delete Trade Execution"
          message={`Are you sure you want to delete ${trade.instrument} trade from ${trade.date}? This cannot be undone.`}
          confirmLabel="Delete Entry"
          isDestructive={true}
          onConfirm={() => {
            onDelete(trade.id);
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};
