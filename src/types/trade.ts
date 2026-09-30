export type Direction = 'LONG' | 'SHORT';
export type TradeResult = 'WIN' | 'LOSS' | 'BE';
export type TradingSession = 'Asian' | 'London' | 'New York';
export type Timeframe = 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
export type EmotionState = 
  | 'Calm & Focused'
  | 'FOMO'
  | 'Revenge'
  | 'Fear / Hesitant'
  | 'Greed'
  | 'Boredom'
  | 'Overconfident'
  | 'Anxious';

export type MarketType = 'Crypto' | 'Forex' | 'CFD';
export type SizeUnit = 'USDT' | 'Lots' | 'Contracts' | 'Units';

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  instrument: string; // user custom input, e.g. BTCUSDT, ETHUSDT, XAUUSD, EURUSD, US100
  marketType?: MarketType;
  sizeUnit?: SizeUnit;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;
  positionSize: number; // in USDT for Crypto, or Lots for Forex/CFD
  riskPercent: number; // e.g. 1.0 = 1%
  riskAmount: number; // in USD
  pnl: number; // dollar P&L
  rMultiple: number; // e.g. +2.4R or -1.0R
  result: TradeResult;
  strategy: string; // e.g., Breakout, Pullback, Reversal, Liquidity Sweep
  setup: string; // e.g., NY Open Sweep, Prev Day High Rejection, Bull Flag, Order Block Retest
  timeframe: Timeframe;
  session: TradingSession;
  entryReason: string;
  exitReason: string;
  emotion: EmotionState;
  confidence: number; // 1 to 10
  discipline: number; // 1 to 10
  mistake?: string; // e.g. "Chased entry", "Moved stop loss", "Exited prematurely", "None"
  tags: string[];
  screenshotBefore?: string;
  screenshotAfter?: string;
  notes?: string;
  holdingTimeMinutes?: number;
  planViolations?: string[];
}

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  entryConditions: string[];
  exitConditions: string[];
  riskRules: string;
  minRR: number;
  allowedSessions: TradingSession[];
  allowedTimeframes: Timeframe[];
  setups?: { name: string; description?: string }[];
}

export interface TradingPlan {
  accountName: string;
  initialBalance: number;
  riskPerTradePercent: number;
  maxDailyLossPercent: number;
  maxWeeklyLossPercent: number;
  maxTradesPerDay: number;
  minRR: number;
  allowedInstruments: string[];
  allowedSessions: TradingSession[];
  allowedSetups: string[];
  allowedTimeframes: Timeframe[];
  stopConditions: string[];
}

export interface DailyReview {
  id: string;
  date: string;
  tradesCount?: number;
  dailyPnl?: number;
  dailyR?: number;
  winRate?: number;
  whatWentWell: string;
  whatWentWrong: string;
  ruleViolations: string;
  emotionalState: string;
  mainLesson: string;
  tomorrowFocus: string;
  createdAt?: string;
}

export interface WeeklyReview {
  id: string;
  weekLabel: string;
  startDate: string;
  endDate: string;
  tradesCount?: number;
  netPnl?: number;
  netR?: number;
  winRate?: number;
  profitFactor?: number;
  expectancy?: number;
  whatWorked: string;
  whatDidnt: string;
  changesNextWeek: string;
  bestPerformingSetup?: string;
  worstPerformingSetup?: string;
  dominantSession?: string;
  createdAt?: string;
}

export interface AccountSummary {
  id: string;
  name: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
}
