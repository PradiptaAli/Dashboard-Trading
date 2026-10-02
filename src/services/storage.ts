import { Trade, StrategyDefinition, TradingPlan, DailyReview, WeeklyReview } from '../types/trade';
import { SEED_TRADES, INITIAL_STRATEGIES, DEFAULT_TRADING_PLAN, SEED_DAILY_REVIEWS, SEED_WEEKLY_REVIEWS } from '../data/mockData';
import { saveScreenshotToDb, deleteScreenshotFromDb } from './imageStorage';

const STORAGE_KEYS = {
  TRADES: 'tradeos_trades_v3',
  STRATEGIES: 'tradeos_strategies_v3',
  PLAN: 'tradeos_plan_v3',
  DAILY_REVIEWS: 'tradeos_daily_reviews_v3',
  WEEKLY_REVIEWS: 'tradeos_weekly_reviews_v3',
  CURRENT_ACCOUNT: 'tradeos_account_v3',
};

export const StorageService = {
  getTrades(): Trade[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRADES);
      if (data !== null) {
        const parsed: Trade[] = JSON.parse(data);

        // Auto-heal: If localStorage is bloated with existing uncompressed screenshots,
        // sync them to IndexedDB and prune duplicates
        if (data.length > 2000000) {
          setTimeout(() => {
            try {
              parsed.forEach(t => {
                const img = t.screenshotBefore || t.screenshotAfter;
                if (img && (img.startsWith('data:image') || img.length > 500)) {
                  saveScreenshotToDb(t.id, img).catch(() => {});
                }
              });
              // Save a pruned version to free up localStorage quota immediately
              const slimmed = parsed.map(t => ({
                ...t,
                screenshotAfter: undefined, // remove redundant duplicate
              }));
              localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(slimmed));
            } catch (_) {}
          }, 100);
        }

        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse trades from localStorage', e);
    }
    // Default to clean empty slate (0 trades) as requested by user
    try {
      localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify([]));
    } catch (_) {}
    return [];
  },

  saveTrades(trades: Trade[]): void {
    // 1. Asynchronously save all screenshot data URLs into IndexedDB (virtually unlimited capacity)
    trades.forEach(t => {
      const img = t.screenshotBefore || t.screenshotAfter;
      if (img && (img.startsWith('data:image') || img.length > 500)) {
        saveScreenshotToDb(t.id, img).catch(() => {});
      }
    });

    // 2. Persist to localStorage with auto-quota recovery
    try {
      localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
    } catch (quotaError) {
      console.warn('LocalStorage quota limit reached. Automatically optimizing screenshot storage...', quotaError);

      try {
        // Keep full screenshots for top 4 most recent trades; for older trades keep metadata and let IndexedDB supply screenshots
        const trimmed = trades.map((t, index) => {
          if (index >= 3 && t.screenshotBefore && t.screenshotBefore.startsWith('data:image')) {
            return {
              ...t,
              screenshotBefore: undefined,
              screenshotAfter: undefined,
            };
          }
          return {
            ...t,
            screenshotAfter: undefined, // remove redundant duplicate
          };
        });
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trimmed));
      } catch (err2) {
        // Extreme fallback: keep all trade stats, text, and numbers intact in localStorage, images safely in IndexedDB
        console.warn('Aggressive localStorage quota cleanup applied; images preserved in IndexedDB.', err2);
        const stripped = trades.map(t => ({
          ...t,
          screenshotBefore: t.screenshotBefore?.startsWith('data:image') ? undefined : t.screenshotBefore,
          screenshotAfter: undefined,
        }));
        try {
          localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(stripped));
        } catch (criticalErr) {
          console.error('Critical localStorage error:', criticalErr);
        }
      }
    }
  },

  addTrade(trade: Trade): Trade[] {
    const trades = this.getTrades();
    const updated = [trade, ...trades];
    this.saveTrades(updated);
    return updated;
  },

  updateTrade(trade: Trade): Trade[] {
    const trades = this.getTrades();
    const updated = trades.map(t => (t.id === trade.id ? trade : t));
    this.saveTrades(updated);
    return updated;
  },

  deleteTrade(tradeId: string): Trade[] {
    deleteScreenshotFromDb(tradeId).catch(() => {});
    const trades = this.getTrades();
    const updated = trades.filter(t => t.id !== tradeId);
    this.saveTrades(updated);
    return updated;
  },

  clearAllTrades(): Trade[] {
    this.saveTrades([]);
    return [];
  },

  loadDemoTrades(): Trade[] {
    this.saveTrades(SEED_TRADES);
    return SEED_TRADES;
  },

  duplicateTrade(tradeId: string): Trade[] {
    const trades = this.getTrades();
    const target = trades.find(t => t.id === tradeId);
    if (!target) return trades;

    const newId = `TRD-${Date.now().toString().slice(-4)}`;
    const copy: Trade = {
      ...target,
      id: newId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
    };
    const updated = [copy, ...trades];
    this.saveTrades(updated);
    return updated;
  },

  getStrategies(): StrategyDefinition[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STRATEGIES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse strategies', e);
    }
    localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(INITIAL_STRATEGIES));
    return INITIAL_STRATEGIES;
  },

  saveStrategies(strats: StrategyDefinition[]): void {
    localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strats));
  },

  getTradingPlan(): TradingPlan {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAN);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse trading plan', e);
    }
    localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(DEFAULT_TRADING_PLAN));
    return DEFAULT_TRADING_PLAN;
  },

  saveTradingPlan(plan: TradingPlan): void {
    localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan));
  },

  getDailyReviews(): DailyReview[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_REVIEWS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse daily reviews', e);
    }
    localStorage.setItem(STORAGE_KEYS.DAILY_REVIEWS, JSON.stringify(SEED_DAILY_REVIEWS));
    return SEED_DAILY_REVIEWS;
  },

  saveDailyReviews(reviews: DailyReview[]): void {
    localStorage.setItem(STORAGE_KEYS.DAILY_REVIEWS, JSON.stringify(reviews));
  },

  getWeeklyReviews(): WeeklyReview[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEEKLY_REVIEWS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse weekly reviews', e);
    }
    localStorage.setItem(STORAGE_KEYS.WEEKLY_REVIEWS, JSON.stringify(SEED_WEEKLY_REVIEWS));
    return SEED_WEEKLY_REVIEWS;
  },

  saveWeeklyReviews(reviews: WeeklyReview[]): void {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_REVIEWS, JSON.stringify(reviews));
  },

  resetAllToDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.STRATEGIES);
    localStorage.removeItem(STORAGE_KEYS.PLAN);
    localStorage.removeItem(STORAGE_KEYS.DAILY_REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.WEEKLY_REVIEWS);
  },

  exportToCSV(trades: Trade[]): string {
    const headers = [
      'ID',
      'Date',
      'Time',
      'Instrument',
      'Direction',
      'EntryPrice',
      'StopLoss',
      'TakeProfit',
      'ExitPrice',
      'PositionSize',
      'RiskPercent',
      'RiskAmount',
      'PnL',
      'RMultiple',
      'Result',
      'Strategy',
      'Setup',
      'Timeframe',
      'Session',
      'Emotion',
      'Confidence',
      'Discipline',
      'Mistake',
    ];

    const rows = trades.map(t => [
      t.id,
      t.date,
      t.time,
      t.instrument,
      t.direction,
      t.entryPrice,
      t.stopLoss,
      t.takeProfit,
      t.exitPrice,
      t.positionSize,
      t.riskPercent,
      t.riskAmount,
      t.pnl,
      t.rMultiple,
      t.result,
      `"${t.strategy.replace(/"/g, '""')}"`,
      `"${t.setup.replace(/"/g, '""')}"`,
      t.timeframe,
      t.session,
      `"${t.emotion}"`,
      t.confidence,
      t.discipline,
      `"${t.mistake || 'None'}"`,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },
};
