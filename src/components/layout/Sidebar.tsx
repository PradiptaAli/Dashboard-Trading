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
} from 'lucide-react';

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
  { key: 'risk', label: 'Risk', icon: ShieldAlert },
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-56 flex-col border-r border-[#1a1d24] bg-[#0c0e12] select-none transition-transform duration-150 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Terminal Header */}
        <div className="flex h-13 items-center justify-between px-4 border-b border-[#16181f]">
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-1 bg-[#10b981] rounded-full" />
            <span className="text-[13px] font-semibold tracking-tight text-[#f0f2f5]">TradeOS</span>
            <span className="text-[10px] text-[#555a66] font-mono tracking-wider">TERMINAL</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 text-[#6e7482] hover:text-[#e4e7ec] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action: Quick Log */}
        {onOpenNewTrade && (
          <div className="p-3 pb-2">
            <button
              onClick={onOpenNewTrade}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#161922] hover:bg-[#1c202c] border border-[#232734] px-3 py-1.5 text-xs font-medium text-[#e4e7ec] transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-[#10b981]" />
              <span>Record Trade</span>
            </button>
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-0.5 px-2 py-2 overflow-y-auto">
          <div className="px-2 pb-1 text-[10px] font-medium text-[#4f5461] uppercase tracking-wider">
            Workspace
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
                className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors ${
                  isActive
                    ? 'bg-[#181b23] text-[#f4f5f7] font-medium'
                    : 'text-[#828896] hover:bg-[#12141a] hover:text-[#d3d7df]'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 transition-colors ${
                    isActive ? 'text-[#e4e7ec]' : 'text-[#656b78] group-hover:text-[#9ea4b2]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Settings & Account summary */}
        <div className="border-t border-[#16181f] p-2 space-y-1">
          <button
            onClick={() => {
              onSelectTab('settings');
              onCloseMobile();
            }}
            className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors ${
              currentTab === 'settings'
                ? 'bg-[#181b23] text-[#f4f5f7] font-medium'
                : 'text-[#828896] hover:bg-[#12141a] hover:text-[#d3d7df]'
            }`}
          >
            <Settings className="h-3.5 w-3.5 text-[#656b78]" />
            <span>Settings</span>
          </button>

          {/* Quiet Account State */}
          <div className="mt-1 px-2.5 py-2 rounded-md bg-[#0f1116] border border-[#171920]">
            <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
              <span>Account Equity</span>
              <span className={`tabular-nums font-mono text-[10.5px] ${totalPnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            </div>
            <div className="text-sm font-semibold tabular-nums text-[#e8ebf0] tracking-tight mt-0.5 font-mono">
              ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
