import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  BarChart2,
  ShieldAlert,
  Layers,
  Brain,
  CheckSquare,
  Fingerprint,
  Settings,
  X,
  Plus,
  TrendingUp,
} from 'lucide-react';
import traderAvatar from '../../assets/images/avatar_trader_pro_1790744952839.jpg';

export type NavItemKey =
  | 'overview'
  | 'journal'
  | 'calendar'
  | 'analytics'
  | 'risk'
  | 'strategies'
  | 'psychology'
  | 'plan'
  | 'reviews'
  | 'dna'
  | 'settings';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  accountBalance: number;
  totalPnl: number;
  onOpenNewTrade?: () => void;
}

const navItems: { key: NavItemKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'journal', label: 'Journal', icon: BookOpen },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'analytics', label: 'Analytics', icon: BarChart2 },
  { key: 'risk', label: 'Risk Center', icon: ShieldAlert },
  { key: 'strategies', label: 'Strategies', icon: Layers },
  { key: 'psychology', label: 'Psychology', icon: Brain },
  { key: 'plan', label: 'Trading Plan', icon: CheckSquare },
  { key: 'reviews', label: 'Reviews', icon: CheckSquare },
  { key: 'dna', label: 'Trading DNA', icon: Fingerprint },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  accountBalance,
  totalPnl,
  onOpenNewTrade,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-60 flex-col border-r border-white/[0.06] bg-[#0A0D14]/95 backdrop-blur-2xl select-none transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white font-sans">TradeOS</span>
                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">EXECUTION TERMINAL</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Trader Profile Card (Umber Style) */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
            <div className="relative">
              <img
                src={traderAvatar}
                alt="Trader Profile"
                className="h-9 w-9 rounded-lg object-cover ring-1 ring-white/10"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0A0D14]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 truncate">Alex Thorne</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-400/90 font-medium">Live Market Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action: Quick Log Button with Emerald Gradient */}
        {onOpenNewTrade && (
          <div className="px-3 py-2">
            <button
              onClick={onOpenNewTrade}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 px-3.5 py-2 text-xs font-semibold text-[#07090E] shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Record New Trade</span>
            </button>
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Navigation
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  onCloseMobile();
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-white/[0.08] to-white/[0.04] text-white border border-white/[0.09] shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Settings & Account summary */}
        <div className="border-t border-white/[0.05] p-3 space-y-2">
          <button
            onClick={() => {
              onSelectTab('settings');
              onCloseMobile();
            }}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              currentTab === 'settings'
                ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`}
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span>Settings</span>
          </button>

          {/* Account Equity Card */}
          <div className="p-3 rounded-xl bg-gradient-to-b from-[#111624] to-[#0D101A] border border-white/[0.06] shadow-inner">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Net Portfolio</span>
              <span className={`tabular-nums font-mono text-[11px] font-semibold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            </div>
            <div className="text-base font-bold tabular-nums text-white tracking-tight mt-1 font-mono">
              ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div 
                className={`h-full rounded-full ${totalPnl >= 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, Math.max(10, ((accountBalance / 50000) * 100)))}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

