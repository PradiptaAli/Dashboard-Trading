import { Trade, StrategyDefinition, TradingPlan, DailyReview, WeeklyReview } from '../types/trade';

export const INITIAL_ACCOUNT_BALANCE = 500;

export const DEFAULT_TRADING_PLAN: TradingPlan = {
  accountName: 'Primary Master Apex',
  initialBalance: INITIAL_ACCOUNT_BALANCE,
  riskPerTradePercent: 1.0,
  maxDailyLossPercent: 3.0,
  maxWeeklyLossPercent: 6.0,
  maxTradesPerDay: 4,
  minRR: 2.0,
  allowedInstruments: ['XAUUSD', 'BTCUSD', 'EURUSD', 'NASDAQ', 'NVDA', 'SPY'],
  allowedSessions: ['London', 'New York'],
  allowedSetups: [
    'NY Open Liquidity Sweep',
    'London Breakout Retest',
    'Prev Day High/Low Sweep',
    'Fair Value Gap Fill',
    'Bull Flag Momentum',
    'Daily Pivot Reversal',
  ],
  allowedTimeframes: ['M5', 'M15', 'H1', 'H4'],
  stopConditions: [
    '3 consecutive losses in a single day trigger terminal lockout',
    'Hit maximum daily loss threshold (-3.0% / -$15.00)',
    'Experiencing FOMO or Revenge urge rating > 6/10',
    'Any intentional manual stop loss expansion',
  ],
};

export const INITIAL_STRATEGIES: StrategyDefinition[] = [
  {
    id: 'strat-liq-sweep',
    name: 'Liquidity Sweep',
    description: 'High-probability institutional sweep of key liquidity pools (Asian highs/lows, previous day extremes) followed by a sharp market structure shift.',
    entryConditions: [
      'Price sweeps major liquidity cluster by 5-15 ticks/points',
      'Lower timeframe Market Structure Shift (MSS) with displacement candle',
      'Entry on return to Fair Value Gap (FVG) or optimal trade entry (OTE)',
    ],
    exitConditions: [
      'Stop loss positioned beyond the sweeping wick apex',
      'Target 1: Opposing internal liquidity pool (1:2 R:R)',
      'Target 2: External session extreme or daily swing high/low',
    ],
    riskRules: 'Fixed 1.0% risk. Do not enter if sweep wick exceeds 2x average true range.',
    minRR: 2.0,
    allowedSessions: ['London', 'New York'],
    allowedTimeframes: ['M5', 'M15', 'H1'],
  },
  {
    id: 'strat-breakout',
    name: 'Breakout',
    description: 'Momentum expansion from established consolidation ranges during high volume session opens.',
    entryConditions: [
      'At least 3 tests of support or resistance within a 90-minute contraction box',
      'Impulsive 5-minute close completely outside the horizontal boundary',
      'Volume surge greater than 1.5x 20-period volume moving average',
    ],
    exitConditions: [
      'Stop loss placed just inside the broken consolidation boundary',
      'Take profit at 1.618 and 2.0 Fibonacci extension targets',
    ],
    riskRules: 'Risk strictly 0.75% to 1.0%. Never chase price more than 1R away from breakout point.',
    minRR: 2.0,
    allowedSessions: ['London', 'New York'],
    allowedTimeframes: ['M5', 'M15'],
  },
  {
    id: 'strat-pullback',
    name: 'Pullback',
    description: 'Trend continuation entry taking advantage of shallow retracements into dynamic moving averages (20/50 EMA) and previous support turned resistance.',
    entryConditions: [
      'Strong prevailing higher timeframe trend confirmed on H1/H4',
      'Retracement to confluence zone (20 EMA + prior broken swing structure)',
      'Rejection candlestick pattern (pin bar or engulfing) in direction of trend',
    ],
    exitConditions: [
      'Stop loss placed below the swing retest low (long) or above swing high (short)',
      'Take profit at previous trend swing high or measured move projection',
    ],
    riskRules: '1.0% standard risk. Trail stop loss to breakeven once price reaches 1.5R.',
    minRR: 2.0,
    allowedSessions: ['London', 'New York', 'Asian'],
    allowedTimeframes: ['M15', 'H1', 'H4'],
  },
  {
    id: 'strat-reversal',
    name: 'Reversal',
    description: 'Mean-reversion trades taking counter-trend exhaustion moves at higher-timeframe HTF supply/demand or major daily key psychological levels.',
    entryConditions: [
      'HTF key level reached with RSI extreme divergence',
      'Exhaustion volume spike followed by immediate rejection candle',
      'Break of minor internal trendline',
    ],
    exitConditions: [
      'Tight stop loss above the exhaustion wick',
      'Target first major support/resistance or 50% retracement of the prior leg',
    ],
    riskRules: 'Reduced risk: max 0.5% - 0.75% due to counter-trend nature. Zero tolerance for widening stop.',
    minRR: 2.5,
    allowedSessions: ['London', 'New York'],
    allowedTimeframes: ['M15', 'H1'],
  },
];

// Seed raw trade data generator for authentic, highly diverse 125 trades
function generateSeedTrades(): Trade[] {
  const instruments = [
    { sym: 'XAUUSD', basePrice: 2450, tick: 0.1, lotUnit: 'oz', step: 15 },
    { sym: 'BTCUSD', basePrice: 63500, tick: 1, lotUnit: 'coins', step: 800 },
    { sym: 'NASDAQ', basePrice: 19800, tick: 0.25, lotUnit: 'contracts', step: 120 },
    { sym: 'EURUSD', basePrice: 1.0920, tick: 0.0001, lotUnit: 'lots', step: 0.0040 },
    { sym: 'NVDA', basePrice: 124.50, tick: 0.01, lotUnit: 'shares', step: 3.5 },
    { sym: 'SPY', basePrice: 554.00, tick: 0.05, lotUnit: 'shares', step: 5.0 },
  ];

  const setups = [
    { name: 'NY Open Liquidity Sweep', strat: 'Liquidity Sweep', tf: 'M5' as const, sess: 'New York' as const, winProb: 0.65 },
    { name: 'London Breakout Retest', strat: 'Breakout', tf: 'M15' as const, sess: 'London' as const, winProb: 0.58 },
    { name: 'Prev Day High/Low Sweep', strat: 'Liquidity Sweep', tf: 'M15' as const, sess: 'London' as const, winProb: 0.63 },
    { name: 'Fair Value Gap Fill', strat: 'Pullback', tf: 'M15' as const, sess: 'New York' as const, winProb: 0.56 },
    { name: 'Bull Flag Momentum', strat: 'Breakout', tf: 'M5' as const, sess: 'New York' as const, winProb: 0.54 },
    { name: 'Daily Pivot Reversal', strat: 'Reversal', tf: 'H1' as const, sess: 'Asian' as const, winProb: 0.42 },
  ];

  const emotions = [
    { emo: 'Calm & Focused' as const, weight: 65, avgDisp: 9 },
    { emo: 'FOMO' as const, weight: 12, avgDisp: 4 },
    { emo: 'Revenge' as const, weight: 6, avgDisp: 3 },
    { emo: 'Fear / Hesitant' as const, weight: 8, avgDisp: 6 },
    { emo: 'Greed' as const, weight: 5, avgDisp: 5 },
    { emo: 'Boredom' as const, weight: 4, avgDisp: 4 },
  ];

  const mistakes = [
    'None',
    'Chased entry',
    'Moved stop loss',
    'Exited prematurely',
    'Oversized position',
    'Ignored trading plan',
  ];

  const sampleScreenshots = [
    '/src/assets/images/chart_breakout_setup_1790744925578.jpg',
    '/src/assets/images/chart_reversal_trade_1790744940943.jpg',
  ];

  const trades: Trade[] = [];

  // Deterministic pseudo-random generator
  let seed = 42;
  function rnd() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  // Dates spanning from 2026-06-01 to 2026-09-28
  const startDate = new Date('2026-06-01T08:00:00Z').getTime();
  const endDate = new Date('2026-09-28T16:00:00Z').getTime();
  const dayMs = 86400000;
  const totalDays = Math.floor((endDate - startDate) / dayMs);

  let currentId = 101;

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const curDate = new Date(startDate + dayOffset * dayMs);
    const dayOfWeek = curDate.getUTCDay();
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Decide how many trades on this day (0 to 3)
    const rCount = rnd();
    let numTrades = 0;
    if (rCount > 0.75) numTrades = 2;
    else if (rCount > 0.40) numTrades = 1;
    else if (rCount > 0.25) numTrades = 3;
    else numTrades = 0;

    for (let k = 0; k < numTrades; k++) {
      const inst = instruments[Math.floor(rnd() * instruments.length)];
      const setupObj = setups[Math.floor(rnd() * setups.length)];
      const direction = rnd() > 0.44 ? ('LONG' as const) : ('SHORT' as const);

      // Emotion determination
      const emoRoll = rnd() * 100;
      let emoChoice = emotions[0];
      let accum = 0;
      for (const e of emotions) {
        accum += e.weight;
        if (emoRoll <= accum) {
          emoChoice = e;
          break;
        }
      }

      // Discipline & Confidence
      let discipline = Math.min(10, Math.max(1, Math.round(emoChoice.avgDisp + (rnd() * 2 - 1))));
      let confidence = Math.min(10, Math.max(3, Math.round(7 + (rnd() * 4 - 2))));

      // Mistake
      let mistake = 'None';
      if (emoChoice.emo === 'FOMO') {
        mistake = rnd() > 0.5 ? 'Chased entry' : 'Oversized position';
        discipline = Math.min(discipline, 4);
      } else if (emoChoice.emo === 'Revenge') {
        mistake = rnd() > 0.5 ? 'Ignored trading plan' : 'Moved stop loss';
        discipline = Math.min(discipline, 3);
      } else if (emoChoice.emo === 'Fear / Hesitant') {
        mistake = rnd() > 0.6 ? 'Exited prematurely' : 'None';
      }

      // Risk determination
      let riskPercent = 1.0;
      if (mistake === 'Oversized position') riskPercent = 2.2;
      else if (setupObj.strat === 'Reversal') riskPercent = 0.6;
      else riskPercent = Number((0.8 + rnd() * 0.4).toFixed(1));

      const riskAmount = Number((INITIAL_ACCOUNT_BALANCE * (riskPercent / 100)).toFixed(2));

      // Calculate realistic price levels
      const priceVariation = (rnd() * 0.05 - 0.025) * inst.basePrice;
      const entryPrice = Number((inst.basePrice + priceVariation).toFixed(inst.sym === 'EURUSD' ? 4 : 2));
      const stopDistance = inst.step * (0.8 + rnd() * 0.4);
      const stopLoss = direction === 'LONG'
        ? Number((entryPrice - stopDistance).toFixed(inst.sym === 'EURUSD' ? 4 : 2))
        : Number((entryPrice + stopDistance).toFixed(inst.sym === 'EURUSD' ? 4 : 2));

      const rrMultiplier = 2.0 + (rnd() * 1.5);
      const takeProfit = direction === 'LONG'
        ? Number((entryPrice + stopDistance * rrMultiplier).toFixed(inst.sym === 'EURUSD' ? 4 : 2))
        : Number((entryPrice - stopDistance * rrMultiplier).toFixed(inst.sym === 'EURUSD' ? 4 : 2));

      // Win probability influenced by setup and emotion
      let effectiveWinProb = setupObj.winProb;
      if (emoChoice.emo === 'FOMO' || emoChoice.emo === 'Revenge') {
        effectiveWinProb *= 0.52;
      }
      if (discipline < 5) {
        effectiveWinProb *= 0.65;
      }

      const isWin = rnd() < effectiveWinProb;
      let rMultiple = 0;
      let pnl = 0;
      let result: 'WIN' | 'LOSS' | 'BE' = 'LOSS';
      let exitPrice = stopLoss;

      if (isWin) {
        result = 'WIN';
        // R between +1.8R and +3.4R
        rMultiple = Number((1.8 + rnd() * 1.5).toFixed(2));
        pnl = Number((riskAmount * rMultiple).toFixed(2));
        exitPrice = direction === 'LONG'
          ? Number((entryPrice + stopDistance * rMultiple).toFixed(inst.sym === 'EURUSD' ? 4 : 2))
          : Number((entryPrice - stopDistance * rMultiple).toFixed(inst.sym === 'EURUSD' ? 4 : 2));
      } else {
        if (rnd() < 0.12 && mistake === 'None') {
          // Breakeven trade
          result = 'BE';
          rMultiple = 0;
          pnl = 0;
          exitPrice = entryPrice;
        } else {
          result = 'LOSS';
          if (mistake === 'Moved stop loss') {
            rMultiple = -1.8;
            pnl = Number((riskAmount * -1.8).toFixed(2));
          } else {
            rMultiple = -1.0;
            pnl = -riskAmount;
          }
        }
      }

      // Holding time in minutes
      let holdingTimeMinutes = Math.round(15 + rnd() * 120);
      if (setupObj.tf === 'M5') holdingTimeMinutes = Math.round(10 + rnd() * 45);
      if (setupObj.tf === 'H1') holdingTimeMinutes = Math.round(90 + rnd() * 240);

      // Session time string
      let hour = 14;
      if (setupObj.sess === 'London') hour = 8 + Math.floor(rnd() * 3);
      else if (setupObj.sess === 'New York') hour = 13 + Math.floor(rnd() * 4);
      else hour = 2 + Math.floor(rnd() * 3);
      const minute = Math.floor(rnd() * 59);
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const dateStr = curDate.toISOString().split('T')[0];

      // Screenshots for select high-conviction trades
      const hasScreenshot = rnd() > 0.5;
      const screenshot = hasScreenshot ? sampleScreenshots[Math.floor(rnd() * sampleScreenshots.length)] : undefined;

      // Plan violations detection
      const violations: string[] = [];
      if (riskPercent > 1.0) {
        violations.push(`Exceeds maximum 1.0% risk limit (Risked ${riskPercent}%)`);
      }
      if (setupObj.sess === 'Asian') {
        violations.push(`Session "Asian" is outside authorized trading windows (London/NY only)`);
      }
      if (rrMultiplier < 2.0) {
        violations.push(`Violates minimum 1:2.0 R:R rule`);
      }

      const tags = [setupObj.strat, setupObj.sess];
      if (mistake !== 'None') tags.push('Mistake');
      if (rMultiple >= 2.5) tags.push('A+ Setup');

      trades.push({
        id: `TRD-${currentId++}`,
        date: dateStr,
        time: timeStr,
        instrument: inst.sym,
        direction,
        entryPrice,
        stopLoss,
        takeProfit,
        exitPrice,
        positionSize: Number((riskAmount / (stopDistance || 1)).toFixed(2)),
        riskPercent,
        riskAmount,
        pnl,
        rMultiple,
        result,
        strategy: setupObj.strat,
        setup: setupObj.name,
        timeframe: setupObj.tf,
        session: setupObj.sess,
        entryReason: `Clean confluence at key ${direction === 'LONG' ? 'support' : 'resistance'} with confirmed displacement and volume validation.`,
        exitReason: result === 'WIN' 
          ? 'TP reached systematically at opposing liquidity target.' 
          : result === 'BE' ? 'Trailing stop moved to breakeven was triggered.' : 'Original SL hit according to risk management criteria.',
        emotion: emoChoice.emo,
        confidence,
        discipline,
        mistake,
        tags,
        screenshotBefore: screenshot,
        screenshotAfter: screenshot,
        notes: `Executed during ${setupObj.sess} session. Market structure aligned with higher timeframe bias.`,
        holdingTimeMinutes,
        planViolations: violations.length > 0 ? violations : undefined,
      });
    }
  }

  return trades;
}

export const SEED_TRADES: Trade[] = generateSeedTrades();

export const SEED_DAILY_REVIEWS: DailyReview[] = [
  {
    id: 'rev-d-2026-09-28',
    date: '2026-09-28',
    whatWentWell: 'Waited patiently for the NY Open liquidity sweep on XAUUSD before triggering entry. Maintained strict 1% risk allocation.',
    whatWentWrong: 'Exited the runner slightly ahead of the full 3R target due to impatience during the consolidation phase.',
    ruleViolations: 'None. All trading plan criteria adhered to fully.',
    emotionalState: 'Calm, patient, focused execution.',
    mainLesson: 'Letting the full systematic setup play out yields significantly higher expectancy than micromanaging the position.',
    tomorrowFocus: 'Only engage London session if Asian range is clean and clearly demarcated.',
  },
  {
    id: 'rev-d-2026-09-25',
    date: '2026-09-25',
    whatWentWell: 'Recognized choppy market conditions on NASDAQ early and closed terminal after two small break-evens instead of forcing low quality setups.',
    whatWentWrong: 'Felt slight FOMO when BTCUSD had a fast spike during mid-day.',
    ruleViolations: 'None. Preserved capital effectively.',
    emotionalState: 'Slightly restless initially, but settled into disciplined observation.',
    mainLesson: 'Preserving mental capital during low-probability regimes is just as important as winning trades.',
    tomorrowFocus: 'Stick to primary watchlist: XAUUSD and EURUSD.',
  },
];

export const SEED_WEEKLY_REVIEWS: WeeklyReview[] = [
  {
    id: 'rev-w-39',
    weekLabel: 'Week 39 (Sep 21 - Sep 25, 2026)',
    startDate: '2026-09-21',
    endDate: '2026-09-25',
    whatWorked: 'Liquidity sweep setups during NY Open performed with a 75% win rate. Risk control was solid throughout the week.',
    whatDidnt: 'Took 1 impulse trade on Tuesday after missing the initial move on EURUSD which resulted in a -1.0R loss.',
    changesNextWeek: 'Enforce a 10-minute cooldown rule after any missed breakout before considering re-entry.',
  },
  {
    id: 'rev-w-38',
    weekLabel: 'Week 38 (Sep 14 - Sep 18, 2026)',
    startDate: '2026-09-14',
    endDate: '2026-09-18',
    whatWorked: 'Held winning trades into opposing 4H key levels, capturing two +3.2R winners on Gold.',
    whatDidnt: 'Tried to trade Asian session on Monday night when liquidity was thin, resulting in needless slippage.',
    changesNextWeek: 'Completely eliminate Asian session execution from the active plan.',
  },
];
