import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Download,
  Plus,
  Edit2,
  Trash2,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { Trade } from '../../types/trade';
import { StorageService } from '../../services/storage';
import { ConfirmModal } from '../common/ConfirmModal';

interface JournalViewProps {
  trades: Trade[];
  onOpenNewTrade: () => void;
  onSelectTrade: (trade: Trade) => void;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
  onDuplicateTrade: (tradeId: string) => void;
  onClearAllTrades?: () => void;
  onLoadDemoTrades?: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  trades,
  onOpenNewTrade,
  onSelectTrade,
  onEditTrade,
  onDeleteTrade,
  onDuplicateTrade,
  onClearAllTrades,
  onLoadDemoTrades,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstrument, setFilterInstrument] = useState('ALL');
  const [filterSetup, setFilterSetup] = useState('ALL');
  const [filterDirection, setFilterDirection] = useState('ALL');
  const [filterResult, setFilterResult] = useState('ALL');

  // In-app modal confirm states
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'pnl' | 'r' | 'instrument' | 'entryPrice'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Unique filter values
  const uniqueInstruments = useMemo(() => Array.from(new Set(trades.map(t => t.instrument))).sort(), [trades]);
  const uniqueSetups = useMemo(() => Array.from(new Set(trades.map(t => t.setup))).sort(), [trades]);

  // Filtering logic
  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          t.instrument.toLowerCase().includes(q) ||
          t.setup.toLowerCase().includes(q) ||
          t.strategy.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          t.id.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (filterInstrument !== 'ALL' && t.instrument !== filterInstrument) return false;
      if (filterSetup !== 'ALL' && t.setup !== filterSetup) return false;
      if (filterDirection !== 'ALL' && t.direction !== filterDirection) return false;
      if (filterResult !== 'ALL' && t.result !== filterResult) return false;

      return true;
    });
  }, [trades, searchQuery, filterInstrument, filterSetup, filterDirection, filterResult]);

  // Sorting logic
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      let diff = 0;
      if (sortField === 'date') {
        const da = `${a.date}T${a.time || '00:00'}`;
        const db = `${b.date}T${b.time || '00:00'}`;
        diff = new Date(da).getTime() - new Date(db).getTime();
      } else if (sortField === 'pnl') {
        diff = a.pnl - b.pnl;
      } else if (sortField === 'r') {
        diff = a.rMultiple - b.rMultiple;
      } else if (sortField === 'instrument') {
        diff = a.instrument.localeCompare(b.instrument);
      } else if (sortField === 'entryPrice') {
        diff = a.entryPrice - b.entryPrice;
      }
      return sortOrder === 'desc' ? -diff : diff;
    });
  }, [filteredTrades, sortField, sortOrder]);

  const handleSort = (field: 'date' | 'pnl' | 'r' | 'instrument' | 'entryPrice') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterInstrument('ALL');
    setFilterSetup('ALL');
    setFilterDirection('ALL');
    setFilterResult('ALL');
  };

  const handleExportCSV = () => {
    const csvContent = StorageService.exportToCSV(sortedTrades);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trade_journal_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-[1500px]">
      {/* 1. Header Toolbar & Compact Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#181a22]">
        {/* Search & Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555a66]" />
            <input
              type="text"
              placeholder="Search ticker, setup, notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 w-60 sm:w-72 rounded-md border border-[#1e222c] bg-[#0c0e13] pl-8 pr-3 text-xs text-[#e4e7ec] placeholder-[#555a66] focus:border-[#3a4154] focus:outline-none"
            />
          </div>

          {/* Compact Dropdown Filters */}
          <select
            value={filterInstrument}
            onChange={e => setFilterInstrument(e.target.value)}
            className="h-8 rounded-md border border-[#1e222c] bg-[#0c0e13] px-2.5 text-xs text-[#a0a6b5] focus:outline-none"
          >
            <option value="ALL">All Instruments</option>
            {uniqueInstruments.map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>

          <select
            value={filterDirection}
            onChange={e => setFilterDirection(e.target.value)}
            className="h-8 rounded-md border border-[#1e222c] bg-[#0c0e13] px-2.5 text-xs text-[#a0a6b5] focus:outline-none"
          >
            <option value="ALL">All Sides</option>
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>

          <select
            value={filterResult}
            onChange={e => setFilterResult(e.target.value)}
            className="h-8 rounded-md border border-[#1e222c] bg-[#0c0e13] px-2.5 text-xs text-[#a0a6b5] focus:outline-none"
          >
            <option value="ALL">All Outcomes</option>
            <option value="WIN">Win</option>
            <option value="LOSS">Loss</option>
            <option value="BE">Breakeven</option>
          </select>

          {(searchQuery || filterInstrument !== 'ALL' || filterDirection !== 'ALL' || filterResult !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs text-[#6e7484] hover:text-[#d0d4dc] px-2 py-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#646a78] font-mono text-[11px] mr-2 hidden sm:inline">
            {sortedTrades.length} of {trades.length} entries
          </span>

          <button
            onClick={handleExportCSV}
            disabled={trades.length === 0}
            className="flex items-center gap-1.5 h-8 rounded-md border border-[#1e222c] bg-[#0c0e13] hover:bg-[#151820] px-3 text-[#a0a6b5] hover:text-[#e4e7ec] transition-colors disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewTrade}
            className="flex items-center gap-1.5 h-8 rounded-md bg-[#161820] hover:bg-[#1f232e] border border-[#262a36] px-3 font-medium text-[#f0f2f5] transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-[#10b981]" />
            <span>Record Trade</span>
          </button>
        </div>
      </div>

      {/* 2. Professional Data Table */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] overflow-hidden">
        {trades.length === 0 ? (
          <div className="py-20 text-center">
            <h4 className="text-sm font-medium text-[#e4e7ec]">No trades recorded yet</h4>
            <p className="text-xs text-[#6e7484] mt-1 max-w-sm mx-auto">
              Your performance metrics, risk center, and journal analytics will populate once you log your first execution.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={onOpenNewTrade}
                className="flex items-center gap-1.5 rounded-md bg-[#161820] hover:bg-[#1f232e] border border-[#262a36] px-3.5 py-1.5 text-xs font-medium text-[#f0f2f5]"
              >
                <Plus className="h-3.5 w-3.5 text-[#10b981]" />
                <span>Record First Trade</span>
              </button>
              {onLoadDemoTrades && (
                <button
                  onClick={onLoadDemoTrades}
                  className="rounded-md border border-[#1e222c] px-3.5 py-1.5 text-xs text-[#8c92a2] hover:text-[#e4e7ec]"
                >
                  Load Demo Data
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 z-10 bg-[#0f1117] border-b border-[#181a22] text-[10.5px] uppercase tracking-wider text-[#696f7e]">
                <tr>
                  <th
                    onClick={() => handleSort('date')}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#d0d4dc]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('instrument')}
                    className="py-2.5 px-3 cursor-pointer hover:text-[#d0d4dc]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Instrument</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Side</th>
                  <th className="py-2.5 px-3">Setup</th>
                  <th
                    onClick={() => handleSort('entryPrice')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-[#d0d4dc]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Entry</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right">Exit</th>
                  <th className="py-2.5 px-3 text-right">Size</th>
                  <th
                    onClick={() => handleSort('pnl')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-[#d0d4dc]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Net P&L</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('r')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-[#d0d4dc]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>R</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center">Result</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15171e]">
                {sortedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[#555a66] text-xs">
                      No executions match the current filters.
                    </td>
                  </tr>
                ) : (
                  sortedTrades.map(trade => {
                    const isWin = trade.pnl > 0;
                    const isLoss = trade.pnl < 0;

                    return (
                      <tr
                        key={trade.id}
                        className="hover:bg-[#12151c] transition-colors group cursor-pointer"
                      >
                        <td
                          onClick={() => onSelectTrade(trade)}
                          className="py-2.5 px-3 text-[#696f7e] tabular-nums whitespace-nowrap"
                        >
                          <span className="text-[#a0a6b5]">{trade.date}</span>{' '}
                          <span className="text-[#4f5461] text-[10px]">{trade.time}</span>
                        </td>

                        <td
                          onClick={() => onSelectTrade(trade)}
                          className="py-2.5 px-3 font-medium text-[#e4e7ec] whitespace-nowrap"
                        >
                          {trade.instrument}
                        </td>

                        <td
                          onClick={() => onSelectTrade(trade)}
                          className="py-2.5 px-3 whitespace-nowrap"
                        >
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

                        <td
                          onClick={() => onSelectTrade(trade)}
                          className="py-2.5 px-3 text-[#8c92a2] max-w-[200px] truncate"
                        >
                          {trade.setup}
                        </td>

                        <td
                          onClick={() => onSelectTrade(trade)}
                          className="py-2.5 px-3 text-right text-[#a0a6b5] tabular-nums"
                        >
                          {trade.entryPrice}
                        </td>

                        <td
                          onClick={() => onSelectTrade(trade)}
                          className="py-2.5 px-3 text-right text-[#a0a6b5] tabular-nums"
                        >
                          {trade.exitPrice}
                        </td>

                        <td
                          onClick={() => onSelectTrade(trade)}
                          className="py-2.5 px-3 text-right text-[#696f7e] tabular-nums whitespace-nowrap"
                        >
                          {trade.positionSize} {trade.sizeUnit || 'USDT'}
                        </td>

                        <td
                          onClick={() => onSelectTrade(trade)}
                          className={`py-2.5 px-3 text-right font-medium tabular-nums ${
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
                          onClick={() => onSelectTrade(trade)}
                          className={`py-2.5 px-3 text-right font-medium tabular-nums ${
                            trade.rMultiple >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                          }`}
                        >
                          {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                        </td>

                        <td
                          onClick={() => onSelectTrade(trade)}
                          className="py-2.5 px-3 text-center"
                        >
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              isWin
                                ? 'text-[#10b981] bg-[#10b981]/10'
                                : isLoss
                                ? 'text-[#ef4444] bg-[#ef4444]/10'
                                : 'text-[#6e7484] bg-[#1a1d25]'
                            }`}
                          >
                            {trade.result}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onEditTrade(trade);
                              }}
                              className="p-1 text-[#6e7484] hover:text-[#d0d4dc]"
                              title="Edit Trade"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onDuplicateTrade(trade.id);
                              }}
                              className="p-1 text-[#6e7484] hover:text-[#d0d4dc]"
                              title="Duplicate Trade"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setTradeToDelete(trade);
                              }}
                              className="p-1 text-[#6e7484] hover:text-[#ef4444]"
                              title="Delete Trade"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      {tradeToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Trade Execution"
          message={`Are you sure you want to delete ${tradeToDelete.instrument} trade from ${tradeToDelete.date}? This action cannot be reversed.`}
          confirmLabel="Delete Entry"
          isDestructive={true}
          onConfirm={() => {
            onDeleteTrade(tradeToDelete.id);
            setTradeToDelete(null);
          }}
          onCancel={() => setTradeToDelete(null)}
        />
      )}

      {showClearConfirm && onClearAllTrades && (
        <ConfirmModal
          isOpen={true}
          title="Clear Entire Trade Journal"
          message="Are you sure you want to permanently clear all trade executions? All statistics will reset to default baseline."
          confirmLabel="Clear All Data"
          isDestructive={true}
          onConfirm={() => {
            onClearAllTrades();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
};
