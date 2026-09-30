import React, { useState, useMemo } from 'react';
import { Trade, StrategyDefinition, TradingPlan, DailyReview, WeeklyReview } from './types/trade';
import { StorageService } from './services/storage';
import { calculateStats } from './utils/calculations';
import { Sidebar, NavItemKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TradeModal } from './components/common/TradeModal';

// Views
import { OverviewView } from './components/views/OverviewView';
import { JournalView } from './components/views/JournalView';
import { TradeDetailView } from './components/views/TradeDetailView';
import { CalendarView } from './components/views/CalendarView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { RiskCenterView } from './components/views/RiskCenterView';
import { StrategiesView } from './components/views/StrategiesView';
import { PsychologyView } from './components/views/PsychologyView';
import { TradingPlanView } from './components/views/TradingPlanView';
import { ReviewsView } from './components/views/ReviewsView';
import { TradingDNAView } from './components/views/TradingDNAView';
import { SettingsView } from './components/views/SettingsView';

export default function App() {
  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<NavItemKey>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Trade modal state
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Application Data State backed by StorageService
  const [trades, setTrades] = useState<Trade[]>(() => StorageService.getTrades());
  const [strategies, setStrategies] = useState<StrategyDefinition[]>(() => StorageService.getStrategies());
  const [tradingPlan, setTradingPlan] = useState<TradingPlan>(() => StorageService.getTradingPlan());
  const [dailyReviews, setDailyReviews] = useState<DailyReview[]>(() => StorageService.getDailyReviews());
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>(() => StorageService.getWeeklyReviews());

  // Dynamic calculations engine
  const stats = useMemo(() => {
    return calculateStats(trades, tradingPlan.initialBalance || 500);
  }, [trades, tradingPlan.initialBalance]);

  // Risk status assessment
  const riskStatus = useMemo<'GREEN' | 'YELLOW' | 'RED'>(() => {
    const todayLosses = Math.abs(Math.min(0, stats.todayPnl));
    const dailyLimit = (tradingPlan.initialBalance || 500) * ((tradingPlan.maxDailyLossPercent || 3) / 100);

    if (todayLosses >= dailyLimit || stats.maxDrawdownPercent >= 10) return 'RED';
    if (todayLosses >= dailyLimit * 0.7 || (stats.currentStreak.type === 'LOSS' && stats.currentStreak.count >= 2)) return 'YELLOW';
    return 'GREEN';
  }, [stats, tradingPlan]);

  // Trade actions
  const handleSaveTrade = (tradeToSave: Trade) => {
    let updated: Trade[];
    const exists = trades.some(t => t.id === tradeToSave.id);
    if (exists) {
      updated = StorageService.updateTrade(tradeToSave);
      if (selectedTrade && selectedTrade.id === tradeToSave.id) {
        setSelectedTrade(tradeToSave);
      }
    } else {
      updated = StorageService.addTrade(tradeToSave);
    }
    setTrades(updated);
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setTradeModalOpen(true);
  };

  const handleDeleteTrade = (tradeId: string) => {
    const updated = StorageService.deleteTrade(tradeId);
    setTrades(updated);
    if (selectedTrade && selectedTrade.id === tradeId) {
      setSelectedTrade(null);
    }
  };

  const handleDuplicateTrade = (tradeId: string) => {
    const updated = StorageService.duplicateTrade(tradeId);
    setTrades(updated);
  };

  const handleClearAllTrades = () => {
    const updated = StorageService.clearAllTrades();
    setTrades(updated);
    setSelectedTrade(null);
  };

  const handleLoadDemoTrades = () => {
    const updated = StorageService.loadDemoTrades();
    setTrades(updated);
  };

  const handleOpenNewTrade = () => {
    setEditingTrade(null);
    setTradeModalOpen(true);
  };

  // Plan & Review actions
  const handleUpdatePlan = (newPlan: TradingPlan) => {
    StorageService.saveTradingPlan(newPlan);
    setTradingPlan(newPlan);
  };

  const handleSaveDailyReview = (rev: DailyReview) => {
    const updated = [rev, ...dailyReviews];
    StorageService.saveDailyReviews(updated);
    setDailyReviews(updated);
  };

  const handleSaveWeeklyReview = (rev: WeeklyReview) => {
    const updated = [rev, ...weeklyReviews];
    StorageService.saveWeeklyReviews(updated);
    setWeeklyReviews(updated);
  };

  const handleResetData = () => {
    StorageService.resetAllToDefaults();
    setTrades(StorageService.getTrades());
    setStrategies(StorageService.getStrategies());
    setTradingPlan(StorageService.getTradingPlan());
    setDailyReviews(StorageService.getDailyReviews());
    setWeeklyReviews(StorageService.getWeeklyReviews());
    setSelectedTrade(null);
  };

  const handleImportTrades = (imported: Trade[]) => {
    StorageService.saveTrades(imported);
    setTrades(imported);
  };

  const handleUpdateInitialBalance = (newBalance: number) => {
    const updated = { ...tradingPlan, initialBalance: newBalance };
    handleUpdatePlan(updated);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07090E] text-[#E2E8F0] antialiased">
      {/* Persistent Terminal Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          setSelectedTrade(null);
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        accountBalance={stats.accountBalance}
        totalPnl={stats.totalPnl}
        onOpenNewTrade={handleOpenNewTrade}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#07090E]">
        {/* Top Header Bar */}
        <Header
          currentTab={selectedTrade ? 'journal' : currentTab}
          stats={stats}
          onOpenNewTrade={handleOpenNewTrade}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          riskStatus={riskStatus}
        />

        {/* Dynamic Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#07090E]">
          <div className="mx-auto max-w-[1560px]">
            {selectedTrade ? (
              <TradeDetailView
                trade={selectedTrade}
                onBack={() => setSelectedTrade(null)}
                onEdit={handleEditTrade}
                onDelete={handleDeleteTrade}
                onDuplicate={handleDuplicateTrade}
              />
            ) : (
              <>
                {currentTab === 'overview' && (
                  <OverviewView
                    trades={trades}
                    stats={stats}
                    onSelectTrade={t => setSelectedTrade(t)}
                    onViewAllTrades={() => setCurrentTab('journal')}
                  />
                )}

                {currentTab === 'journal' && (
                  <JournalView
                    trades={trades}
                    onOpenNewTrade={handleOpenNewTrade}
                    onSelectTrade={t => setSelectedTrade(t)}
                    onEditTrade={handleEditTrade}
                    onDeleteTrade={handleDeleteTrade}
                    onDuplicateTrade={handleDuplicateTrade}
                    onClearAllTrades={handleClearAllTrades}
                    onLoadDemoTrades={handleLoadDemoTrades}
                  />
                )}

                {currentTab === 'calendar' && (
                  <CalendarView
                    trades={trades}
                    onSelectTrade={t => setSelectedTrade(t)}
                  />
                )}

                {currentTab === 'analytics' && (
                  <AnalyticsView trades={trades} />
                )}

                {currentTab === 'risk' && (
                  <RiskCenterView
                    trades={trades}
                    stats={stats}
                    tradingPlan={tradingPlan}
                  />
                )}

                {currentTab === 'strategies' && (
                  <StrategiesView
                    strategies={strategies}
                    trades={trades}
                    onSelectTrade={t => setSelectedTrade(t)}
                  />
                )}

                {currentTab === 'psychology' && (
                  <PsychologyView trades={trades} />
                )}

                {currentTab === 'plan' && (
                  <TradingPlanView
                    plan={tradingPlan}
                    onUpdatePlan={handleUpdatePlan}
                    trades={trades}
                    onSelectTrade={t => setSelectedTrade(t)}
                  />
                )}

                {currentTab === 'reviews' && (
                  <ReviewsView
                    dailyReviews={dailyReviews}
                    weeklyReviews={weeklyReviews}
                    trades={trades}
                    onSaveDailyReview={handleSaveDailyReview}
                    onSaveWeeklyReview={handleSaveWeeklyReview}
                  />
                )}

                {currentTab === 'dna' && (
                  <TradingDNAView trades={trades} />
                )}

                {currentTab === 'settings' && (
                  <SettingsView
                    trades={trades}
                    tradingPlan={tradingPlan}
                    onResetData={handleResetData}
                    onClearAllTrades={handleClearAllTrades}
                    onLoadDemoTrades={handleLoadDemoTrades}
                    onImportTrades={handleImportTrades}
                    onUpdateInitialBalance={handleUpdateInitialBalance}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Record / Edit Trade Modal */}
      <TradeModal
        isOpen={tradeModalOpen}
        onClose={() => {
          setTradeModalOpen(false);
          setEditingTrade(null);
        }}
        onSave={handleSaveTrade}
        initialTrade={editingTrade}
        tradingPlan={tradingPlan}
        accountBalance={stats.accountBalance}
      />
    </div>
  );
}
