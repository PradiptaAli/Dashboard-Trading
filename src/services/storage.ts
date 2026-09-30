import { Trade, StrategyDefinition, TradingPlan, DailyReview, WeeklyReview } from '../types/trade';
import { SEED_TRADES, INITIAL_STRATEGIES, DEFAULT_TRADING_PLAN, SEED_DAILY_REVIEWS, SEED_WEEKLY_REVIEWS } from '../data/mockData';

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
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse trades from localStorage', e);
    }
    // Default to clean empty slate (0 trades) as requested by user
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify([]));
    return [];
  },

  saveTrades(trades: Trade[]): void {
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
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
