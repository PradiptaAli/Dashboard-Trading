import React from 'react';
import { Menu, Plus, Sparkles, Search, Activity, ShieldCheck, AlertTriangle, ShieldX } from 'lucide-react';
import { PerformanceStats } from '../../utils/calculations';

interface HeaderProps {
  currentTab: string;
  stats: PerformanceStats;
  onOpenNewTrade: () => void;
  onOpenMobileMenu: () => void;
  riskStatus: 'GREEN' | 'YELLOW' | 'RED';
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  stats,
  onOpenNewTrade,
  onOpenMobileMenu,
  riskStatus,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Overview';
      case 'journal': return 'Execution Journal';
      case 'calendar': return 'P&L Calendar';
      case 'analytics': return 'Performance Analytics';
      case 'risk': return 'Risk Management Center';
      case 'strategies': return 'Strategy Playbooks';
      case 'psychology': return 'Trader Psychology';
      case 'plan': return 'Trading Plan';
      case 'reviews': return 'Periodic Reviews';
      case 'dna': return 'Trading DNA & Edge';
      case 'settings': return 'System Settings';
      default: return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between liquid-glass-bar px-4 sm:px-6 lg:px-8 select-none relative">
      {/* Left: Mobile Trigger & View Title */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white lg:hidden transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-white font-sans">
              {getTabTitle(currentTab)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono liquid-glass-pill text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search / Filter Bar (Liquid Glass Pill) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            readOnly
            onClick={onOpenNewTrade}
            placeholder="Quick search instruments, setups, strategies... (Press / to search)"
            className="w-full h-9 rounded-full liquid-glass-pill pl-10 pr-9 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-white/30 transition-all cursor-pointer font-sans"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white/[0.08] px-1.5 py-0.5 rounded border border-white/[0.1]">
            /
          </kbd>
        </div>
      </div>

      {/* Right: Restrained summary tickers & Action (Liquid Glass Capsules) */}
      <div className="flex items-center gap-3 text-xs">
        {/* Today's Performance Pill */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full liquid-glass-pill">
          <Activity className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px] font-medium">Today</span>
          <span
            className={`font-mono font-bold tabular-nums text-xs ${
              stats.todayPnl > 0
                ? 'text-emerald-400'
                : stats.todayPnl < 0
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {stats.todayPnl >= 0 ? '+' : ''}${stats.todayPnl.toFixed(2)}
          </span>
        </div>

        {/* Win Rate Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-pill">
          <span className="text-slate-400 text-[11px] font-medium">Win Rate</span>
          <span className="font-mono font-bold tabular-nums text-xs text-slate-100">
            {stats.winRate.toFixed(1)}%
          </span>
        </div>

        {/* Risk Status Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-pill">
          {riskStatus === 'GREEN' ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          ) : riskStatus === 'YELLOW' ? (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <ShieldX className="h-3.5 w-3.5 text-rose-400" />
          )}
          <span className="text-[11px] font-semibold text-slate-200">
            {riskStatus === 'GREEN' ? 'Normal Risk' : riskStatus === 'YELLOW' ? 'Caution' : 'Risk Breached'}
          </span>
        </div>

        {/* AI Scan PnL Action */}
        <button
          onClick={onOpenNewTrade}
          className="hidden sm:flex items-center gap-1.5 rounded-full liquid-glass-pill px-3 py-2 text-xs font-medium text-zinc-200 transition-all active:scale-[0.98]"
          title="Scan trade screenshot or shared PnL card with Gemini AI Vision"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#FF9A66]" />
          <span>AI Vision Scan</span>
        </button>

        {/* Record Trade Button */}
        <button
          onClick={onOpenNewTrade}
          className="flex items-center gap-1.5 rounded-full btn-accent px-4 py-2 text-xs font-semibold transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span className="hidden sm:inline">New Trade</span>
        </button>
      </div>
    </header>
  );
};

