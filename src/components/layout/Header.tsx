import React from 'react';
import { Menu, Plus, Sparkles } from 'lucide-react';
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
      case 'journal': return 'Journal';
      case 'calendar': return 'Calendar';
      case 'analytics': return 'Analytics';
      case 'risk': return 'Risk Center';
      case 'strategies': return 'Strategies';
      case 'psychology': return 'Psychology';
      case 'plan': return 'Trading Plan';
      case 'reviews': return 'Reviews';
      case 'dna': return 'Trading DNA';
      case 'settings': return 'Settings';
      default: return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-13 items-center justify-between border-b border-[#181a22] bg-[#0c0e12]/95 px-4 sm:px-6 backdrop-blur-sm select-none">
      {/* Left: Mobile Trigger & View Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded p-1 text-[#6e7482] hover:bg-[#161820] hover:text-[#d3d7df] lg:hidden"
          aria-label="Open mobile menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#848a97] font-medium">Terminal</span>
          <span className="text-[#3a3e4a]">/</span>
          <span className="text-[#e6e9ef] font-medium tracking-tight">{getTabTitle(currentTab)}</span>
        </div>
      </div>

      {/* Right: Restrained summary tickers & Action */}
      <div className="flex items-center gap-5 text-xs">
        {/* Today's Performance */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[#646a78]">Today</span>
          <span
            className={`font-mono font-medium tabular-nums ${
              stats.todayPnl > 0
                ? 'text-[#10b981]'
                : stats.todayPnl < 0
                ? 'text-[#ef4444]'
                : 'text-[#8c92a2]'
            }`}
          >
            {stats.todayPnl >= 0 ? '+' : ''}${stats.todayPnl.toFixed(2)}
          </span>
        </div>

        <div className="hidden md:block h-3 w-px bg-[#1f222c]" />

        {/* Win Rate */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-[#646a78]">Win Rate</span>
          <span className="font-mono font-medium tabular-nums text-[#d0d4dc]">
            {stats.winRate.toFixed(1)}%
          </span>
        </div>

        <div className="hidden lg:block h-3 w-px bg-[#1f222c]" />

        {/* Risk Status (Quiet indicator) */}
        <div className="hidden lg:flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              riskStatus === 'GREEN'
                ? 'bg-[#10b981]'
                : riskStatus === 'YELLOW'
                ? 'bg-[#f59e0b]'
                : 'bg-[#ef4444]'
            }`}
          />
          <span className="text-[11px] text-[#717786]">
            {riskStatus === 'GREEN' ? 'Normal' : riskStatus === 'YELLOW' ? 'Caution' : 'Breached'}
          </span>
        </div>

        {/* AI Scan PnL Quick Action */}
        <button
          onClick={onOpenNewTrade}
          className="hidden sm:flex items-center gap-1.5 rounded-md bg-[#141720] hover:bg-[#1c202d] border border-[#232938] px-2.5 py-1.5 text-xs font-medium text-[#e4e7ec] transition-colors"
          title="Scan trade screenshot or shared PnL card with Gemini AI"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#10b981]" />
          <span>AI Scan PnL</span>
        </button>

        {/* Record Trade Button */}
        <button
          onClick={onOpenNewTrade}
          className="flex items-center gap-1.5 rounded-md bg-[#161820] hover:bg-[#1f232e] border border-[#262a36] px-2.5 py-1.5 text-xs font-medium text-[#f0f2f5] transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-[#10b981]" />
          <span>New Trade</span>
        </button>
      </div>
    </header>
  );
};
