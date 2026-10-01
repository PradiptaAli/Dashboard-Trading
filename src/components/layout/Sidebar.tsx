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
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-60 flex-col liquid-glass-sidebar select-none transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/[0.06] relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] border border-white/15">
              <TrendingUp className="h-4 w-4 text-white" />
              </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-white font-sans">TradeOS</span>
                <span className="text-[9px] font-medium text-zinc-300 bg-white/[0.06] border border-white/10 px-1.5 py-0.5 rounded-full">
                  PRO
                </span>
              </div>
              <p className="text-[9.5px] text-slate-400 font-mono tracking-widest">TRADING JOURNAL</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Trader Profile Card (Liquid Glass Pill) */}
        <div className="px-3 pt-3.5 pb-1">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl liquid-glass-pill transition-all">
            <div className="relative">
              <img
                src={traderAvatar}
                alt="Trader Profile"
                className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/20 shadow-md"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A0D15]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate">Alex Thorne</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">Active Session</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action: Quick Log Button with Liquid Gradient */}
        {onOpenNewTrade && (
          <div className="px-3 py-2">
            <button
              onClick={onOpenNewTrade}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white hover:bg-white/85 px-3.5 py-2 text-xs font-medium text-black transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Record New Trade</span>
            </button>
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
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
                    ? 'liquid-glass-pill text-white font-bold shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Settings & Account summary */}
        <div className="border-t border-white/[0.06] p-3 space-y-2">
          <button
            onClick={() => {
              onSelectTab('settings');
              onCloseMobile();
            }}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              currentTab === 'settings'
                ? 'liquid-glass-pill text-white font-bold'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`}
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Settings</span>
          </button>

          {/* Account Equity Card (Liquid Glass Card) */}
          <div className="p-3.5 rounded-2xl liquid-glass-card shadow-lg">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Net Portfolio</span>
              <span className={`tabular-nums font-mono text-[11px] font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            </div>
            <div className="text-lg font-medium tabular-nums text-white tracking-tight mt-1 font-mono">
              ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/[0.08]">
              <div 
                className={`h-full rounded-full ${totalPnl >= 0 ? 'bg-emerald-400' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, Math.max(10, ((accountBalance / 50000) * 100)))}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

