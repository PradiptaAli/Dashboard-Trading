import React, { useState } from 'react';
import { Trade, TradingPlan } from '../../types/trade';
import { StorageService } from '../../services/storage';
import { ConfirmModal } from '../common/ConfirmModal';
import { Download, Upload, RotateCcw, Check, Trash2, Sparkles, Key, Eye, EyeOff, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, hasApiKey, testGeminiApiKey } from '../../services/aiScanner';

interface SettingsViewProps {
  trades: Trade[];
  tradingPlan: TradingPlan;
  onResetData: () => void;
  onClearAllTrades: () => void;
  onLoadDemoTrades: () => void;
  onImportTrades: (imported: Trade[]) => void;
  onUpdateInitialBalance: (newBalance: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  trades,
  tradingPlan,
  onResetData,
  onClearAllTrades,
  onLoadDemoTrades,
  onImportTrades,
  onUpdateInitialBalance,
}) => {
  const [initialBalanceInput, setInitialBalanceInput] = useState(tradingPlan.initialBalance || 500);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // In-app modal confirmations
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLoadDemoModal, setShowLoadDemoModal] = useState(false);
  const [showResetAllModal, setShowResetAllModal] = useState(false);

  // Gemini AI Key settings
  const [geminiKeyInput, setGeminiKeyInput] = useState(getStoredApiKey());
  const [showGeminiSecret, setShowGeminiSecret] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isGeminiActive, setIsGeminiActive] = useState(hasApiKey());

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredApiKey(geminiKeyInput);
    const active = hasApiKey();
    setIsGeminiActive(active);
    setGeminiStatus({
      text: active ? 'Gemini API Key tersimpan dan aktif!' : 'API Key dihapus. Terminal beralih ke Mode Cepat / Offline.',
      isError: false,
    });
    setTimeout(() => setGeminiStatus(null), 3500);
  };

  const handleTestGeminiKey = async () => {
    if (!geminiKeyInput.trim()) {
      setGeminiStatus({ text: 'Masukkan Gemini API Key terlebih dahulu.', isError: true });
      return;
    }
    setIsTestingGemini(true);
    setGeminiStatus(null);
    const res = await testGeminiApiKey(geminiKeyInput);
    setIsTestingGemini(false);
    setGeminiStatus({
      text: res.message,
      isError: !res.success,
    });
    if (res.success) {
      setStoredApiKey(geminiKeyInput);
      setIsGeminiActive(true);
    }
  };

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateInitialBalance(initialBalanceInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(trades, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tradeos_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = event => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportTrades(parsed);
            setFeedbackMsg({ text: `Successfully imported ${parsed.length} trades.` });
            setTimeout(() => setFeedbackMsg(null), 3000);
          } else {
            setFeedbackMsg({ text: 'Invalid backup format: expected an array of trade objects.', isError: true });
            setTimeout(() => setFeedbackMsg(null), 4000);
          }
        } catch {
          setFeedbackMsg({ text: 'Failed to parse JSON file.', isError: true });
          setTimeout(() => setFeedbackMsg(null), 4000);
        }
      };
    }
  };

  const handleExportCSV = () => {
    const csv = StorageService.exportToCSV(trades);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tradeos_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-4xl font-mono text-xs">
      <div className="pb-4 border-b border-[#181a22]">
        <h2 className="text-xl font-semibold text-[#f4f5f7] tracking-tight">
          Terminal Settings & Data Management
        </h2>
        <p className="text-xs text-[#696f7e] mt-0.5 font-sans">
          Baseline capital, data persistence, backups, and terminal state
        </p>
      </div>

      {feedbackMsg && (
        <div
          className={`rounded border p-3 ${
            feedbackMsg.isError
              ? 'border-[#3a1b22] bg-[#140b0e] text-[#ef4444]'
              : 'border-[#1b3a2a] bg-[#0b1410] text-[#10b981]'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Account Settings */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 space-y-4">
        <div className="border-b border-[#181a22] pb-3 text-xs uppercase tracking-wider text-[#9ea3b0] font-medium">
          Account Baseline & Starting Capital
        </div>

        <form onSubmit={handleSaveBalance} className="space-y-3 max-w-md">
          <div>
            <label className="text-[#696f7e] block mb-1">Starting Account Capital ($ USD)</label>
            <input
              type="number"
              step="any"
              value={initialBalanceInput}
              onChange={e => setInitialBalanceInput(parseFloat(e.target.value) || 0)}
              className="w-full h-8 rounded border border-[#1e222c] bg-[#11141b] px-3 text-[#e4e7ec] focus:border-[#383f52] focus:outline-none tabular-nums"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md bg-[#161820] hover:bg-[#1f232e] border border-[#262a36] px-3.5 py-1.5 font-medium text-[#f0f2f5] transition-colors"
            >
              <Check className="h-3.5 w-3.5 text-[#10b981]" />
              <span>Save Baseline</span>
            </button>
            {saveSuccess && (
              <span className="text-[#10b981] flex items-center gap-1 text-[11px]">
                Updated to ${initialBalanceInput}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Gemini AI Vision Scanner Configuration */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#181a22] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#10b981]" />
            <span className="text-xs uppercase tracking-wider text-[#9ea3b0] font-medium">
              Google Gemini AI Vision Scanner
            </span>
          </div>
          {isGeminiActive ? (
            <span className="px-2 py-0.5 rounded text-[10.5px] bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 flex items-center gap-1.5 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
              Aktif (Gemini 2.5 Flash)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10.5px] bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Mode Cepat / Local OCR
            </span>
          )}
        </div>

        <p className="text-[#8c92a2] text-xs font-sans leading-relaxed">
          AI Scanner membaca screenshot PnL Binance, Bybit, OKX, atau tiket MT5 dan otomatis mengisi instrumen, arah, harga entry/exit, dan P&L. Masukkan API Key Google Gemini Anda di bawah ini agar pemindaian berjalan dengan presisi multimodal 100%.
        </p>

        <form onSubmit={handleSaveGeminiKey} className="space-y-3 max-w-lg">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#696f7e] block">Gemini API Key</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#10b981] hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>Dapatkan API Key Gratis di Google AI Studio</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showGeminiSecret ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiKeyInput}
                onChange={e => setGeminiKeyInput(e.target.value)}
                className="w-full h-8 rounded border border-[#1e222c] bg-[#11141b] px-3 pr-8 text-[#e4e7ec] focus:border-[#383f52] focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowGeminiSecret(!showGeminiSecret)}
                className="absolute right-2 top-2 text-[#6e7484] hover:text-[#e4e7ec]"
              >
                {showGeminiSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md bg-[#161820] hover:bg-[#1f232e] border border-[#262a36] px-3.5 py-1.5 font-medium text-[#f0f2f5] transition-colors"
            >
              <Check className="h-3.5 w-3.5 text-[#10b981]" />
              <span>Simpan API Key</span>
            </button>

            <button
              type="button"
              disabled={isTestingGemini}
              onClick={handleTestGeminiKey}
              className="flex items-center gap-1.5 rounded-md border border-[#1e222c] bg-[#11141b] hover:bg-[#181c26] px-3.5 py-1.5 text-[#a0a6b5] hover:text-[#f4f5f7] disabled:opacity-50 transition-colors"
            >
              {isTestingGemini ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#10b981]" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-[#10b981]" />
              )}
              <span>Tes Koneksi</span>
            </button>
          </div>

          {geminiStatus && (
            <div
              className={`rounded border p-2.5 text-[11px] ${
                geminiStatus.isError
                  ? 'border-[#3a1b22] bg-[#140b0e] text-[#ef4444]'
                  : 'border-[#1b3a2a] bg-[#0b1410] text-[#10b981]'
              }`}
            >
              {geminiStatus.text}
            </div>
          )}
        </form>
      </div>

      {/* Database State & Trade History Actions */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#181a22] pb-3">
          <span className="text-xs uppercase tracking-wider text-[#9ea3b0] font-medium">Journal Database Records</span>
          <span className="text-[11px] text-[#696f7e]">
            Current: <strong className="text-[#e4e7ec] font-semibold">{trades.length} trades recorded</strong>
          </span>
        </div>

        <p className="text-[#8c92a2] text-xs font-sans">
          You can wipe your trade history completely to keep a blank journal for your own trades, or load authentic demo trades to explore terminal analytics.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#2d1b22] bg-[#140b0e] hover:bg-[#1f1016] px-3.5 py-1.5 text-[#ef4444] transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Wipe All Trades (0 Trades)</span>
          </button>

          <button
            onClick={() => setShowLoadDemoModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#1e222c] bg-[#161820] hover:bg-[#1f232e] px-3.5 py-1.5 text-[#a0a6b5] hover:text-[#f4f5f7] transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#10b981]" />
            <span>Load Demo Trade Set</span>
          </button>
        </div>
      </div>

      {/* Backup and Export */}
      <div className="rounded-lg border border-[#181a22] bg-[#0c0e13] p-5 space-y-4">
        <div className="border-b border-[#181a22] pb-3 text-xs uppercase tracking-wider text-[#9ea3b0] font-medium">
          Data Export & Backup
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={trades.length === 0}
            className="flex items-center gap-1.5 rounded-md border border-[#1e222c] bg-[#161820] hover:bg-[#1f232e] px-3.5 py-1.5 text-[#a0a6b5] hover:text-[#f4f5f7] disabled:opacity-40 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={trades.length === 0}
            className="flex items-center gap-1.5 rounded-md border border-[#1e222c] bg-[#161820] hover:bg-[#1f232e] px-3.5 py-1.5 text-[#a0a6b5] hover:text-[#f4f5f7] disabled:opacity-40 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON Database</span>
          </button>

          <label className="flex items-center gap-1.5 rounded-md border border-[#1e222c] bg-[#161820] hover:bg-[#1f232e] px-3.5 py-1.5 text-[#a0a6b5] hover:text-[#f4f5f7] cursor-pointer transition-colors">
            <Upload className="h-3.5 w-3.5" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* Factory Reset */}
      <div className="rounded-lg border border-[#26181d] bg-[#10090c] p-5 space-y-3">
        <div className="border-b border-[#26181d] pb-2 text-xs uppercase tracking-wider text-[#ef4444] font-medium">
          Factory Reset
        </div>

        <p className="text-[#8c92a2] text-xs font-sans">
          Reset all trades, trading plans, and reviews to factory zero settings.
        </p>

        <div>
          <button
            onClick={() => setShowResetAllModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#2d1b22] bg-[#140b0e] hover:bg-[#1f1016] px-3.5 py-1.5 text-[#ef4444] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset All Terminal State</span>
          </button>
        </div>
      </div>

      {/* In-app confirmation dialogs */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Wipe All Trades"
        message={`Are you sure you want to delete all ${trades.length} trades? Your execution journal will be completely blank.`}
        confirmLabel="Wipe All Trades"
        onConfirm={() => {
          onClearAllTrades();
          setShowClearModal(false);
          setFeedbackMsg({ text: 'All trades wiped. Journal is now completely clean.' });
          setTimeout(() => setFeedbackMsg(null), 3000);
        }}
        onCancel={() => setShowClearModal(false)}
      />

      <ConfirmModal
        isOpen={showLoadDemoModal}
        title="Load Demo Trade History"
        message="This will populate your journal with sample trades across XAUUSD, BTCUSDT, EURUSD, and NASDAQ."
        confirmLabel="Load Demo Trades"
        isDestructive={false}
        onConfirm={() => {
          onLoadDemoTrades();
          setShowLoadDemoModal(false);
          setFeedbackMsg({ text: 'Loaded demo trades successfully.' });
          setTimeout(() => setFeedbackMsg(null), 3000);
        }}
        onCancel={() => setShowLoadDemoModal(false)}
      />

      <ConfirmModal
        isOpen={showResetAllModal}
        title="Factory Reset All Settings"
        message="Are you sure you want to reset all data, starting capital, and configurations back to clean initial state?"
        confirmLabel="Factory Reset"
        onConfirm={() => {
          onResetData();
          setShowResetAllModal(false);
          setFeedbackMsg({ text: 'Terminal reset to factory clean state.' });
          setTimeout(() => setFeedbackMsg(null), 3000);
        }}
        onCancel={() => setShowResetAllModal(false)}
      />
    </div>
  );
};
