import { Trade, TradingPlan } from '../types/trade';

export interface PerformanceStats {
  accountBalance: number;
  initialBalance: number;
  totalPnl: number;
  todayPnl: number;
  monthlyPnl: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  beCount: number;
  winRate: number; // 0-100
  profitFactor: number;
  expectancy: number; // in R
  avgRR: number;
  avgPlannedRR: number;
  maxDrawdownPercent: number;
  maxDrawdownAmount: number;
  currentStreak: { type: 'WIN' | 'LOSS' | 'NONE'; count: number };
  bestTrade: { pnl: number; r: number; instrument: string; id: string };
  worstTrade: { pnl: number; r: number; instrument: string; id: string };
  bestDay: { date: string; pnl: number };
  worstDay: { date: string; pnl: number };
  avgWin: number;
  avgLoss: number;
  avgHoldingTimeMinutes: number;
}

export interface CategoryStat {
  name: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  totalR: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number;
}

export function calculateStats(trades: Trade[], initialBalance: number = 500): PerformanceStats {
  if (!trades || trades.length === 0) {
    return {
      accountBalance: initialBalance,
      initialBalance,
      totalPnl: 0,
      todayPnl: 0,
      monthlyPnl: 0,
      totalTrades: 0,
      winCount: 0,
      lossCount: 0,
      beCount: 0,
      winRate: 0,
      profitFactor: 0,
      expectancy: 0,
      avgRR: 0,
      avgPlannedRR: 0,
      maxDrawdownPercent: 0,
      maxDrawdownAmount: 0,
      currentStreak: { type: 'NONE', count: 0 },
      bestTrade: { pnl: 0, r: 0, instrument: '-', id: '' },
      worstTrade: { pnl: 0, r: 0, instrument: '-', id: '' },
      bestDay: { date: '-', pnl: 0 },
      worstDay: { date: '-', pnl: 0 },
      avgWin: 0,
      avgLoss: 0,
      avgHoldingTimeMinutes: 0,
    };
  }

  // Sort trades chronologically
  const sorted = [...trades].sort((a, b) => {
    const da = `${a.date}T${a.time || '00:00'}`;
    const db = `${b.date}T${b.time || '00:00'}`;
    return new Date(da).getTime() - new Date(db).getTime();
  });

  let totalPnl = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let totalR = 0;
  let winCount = 0;
  let lossCount = 0;
  let beCount = 0;
  let totalHoldingMinutes = 0;

  let bestTrade = { pnl: -Infinity, r: -Infinity, instrument: '-', id: '' };
  let worstTrade = { pnl: Infinity, r: Infinity, instrument: '-', id: '' };

  const dayMap: Record<string, number> = {};

  // For drawdown calculation
  let peakEquity = initialBalance;
  let currentEquity = initialBalance;
  let maxDrawdownAmount = 0;
  let maxDrawdownPercent = 0;

  // For streaks
  let currentStreakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';
  let currentStreakCount = 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7); // e.g. "2026-09"
  let todayPnl = 0;
  let monthlyPnl = 0;

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    const pnl = t.pnl || 0;
    const r = t.rMultiple || 0;

    totalPnl += pnl;
    totalR += r;
    currentEquity += pnl;

    if (t.holdingTimeMinutes) {
      totalHoldingMinutes += t.holdingTimeMinutes;
    }

    if (pnl > 0) {
      grossProfit += pnl;
      winCount++;
      if (currentStreakType === 'WIN') {
        currentStreakCount++;
      } else {
        currentStreakType = 'WIN';
        currentStreakCount = 1;
      }
    } else if (pnl < 0) {
      grossLoss += Math.abs(pnl);
      lossCount++;
      if (currentStreakType === 'LOSS') {
        currentStreakCount++;
      } else {
        currentStreakType = 'LOSS';
        currentStreakCount = 1;
      }
    } else {
      beCount++;
    }

    // Track best & worst trade (only positive pnl can be best trade, only negative pnl can be worst trade)
    if (pnl > 0 && pnl > bestTrade.pnl) {
      bestTrade = { pnl, r, instrument: t.instrument, id: t.id };
    }
    if (pnl < 0 && pnl < worstTrade.pnl) {
      worstTrade = { pnl, r, instrument: t.instrument, id: t.id };
    }

    // Daily tracking
    dayMap[t.date] = (dayMap[t.date] || 0) + pnl;

    if (t.date === todayStr) {
      todayPnl += pnl;
    }
    if (t.date.startsWith(currentMonthPrefix)) {
      monthlyPnl += pnl;
    }

    // Peak equity & drawdown
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    } else {
      const ddAmount = peakEquity - currentEquity;
      const ddPercent = peakEquity > 0 ? (ddAmount / peakEquity) * 100 : 0;
      if (ddAmount > maxDrawdownAmount) {
        maxDrawdownAmount = ddAmount;
      }
      if (ddPercent > maxDrawdownPercent) {
        maxDrawdownPercent = ddPercent;
      }
    }
  }

  // Best & worst day (only positive for best day, only negative for worst day)
  let bestDay = { date: '-', pnl: -Infinity };
  let worstDay = { date: '-', pnl: Infinity };
  const dayKeys = Object.keys(dayMap);
  if (dayKeys.length > 0) {
    for (const d of dayKeys) {
      const val = dayMap[d];
      if (val > 0 && val > bestDay.pnl) bestDay = { date: d, pnl: val };
      if (val < 0 && val < worstDay.pnl) worstDay = { date: d, pnl: val };
    }
  } else {
    bestDay = { date: '-', pnl: 0 };
    worstDay = { date: '-', pnl: 0 };
  }

  const completedTrades = winCount + lossCount;
  const winRate = completedTrades > 0 ? (winCount / completedTrades) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
  const expectancy = sorted.length > 0 ? totalR / sorted.length : 0;
  const avgWin = winCount > 0 ? grossProfit / winCount : 0;
  const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;

  // 1. Calculate Average Planned Target R:R from trade setups (|TP - Entry| / |Entry - SL|)
  let totalPlannedRR = 0;
  let plannedRRSamples = 0;
  for (const t of sorted) {
    const riskDist = Math.abs((t.entryPrice || 0) - (t.stopLoss || 0));
    const rewardDist = Math.abs((t.takeProfit || 0) - (t.entryPrice || 0));
    if (riskDist > 0 && rewardDist > 0) {
      totalPlannedRR += rewardDist / riskDist;
      plannedRRSamples++;
    }
  }
  const avgPlannedRR = plannedRRSamples > 0 ? totalPlannedRR / plannedRRSamples : 0;

  // 2. Calculate Realized Win/Loss R:R
  const winTrades = sorted.filter(t => t.pnl > 0);
  const lossTrades = sorted.filter(t => t.pnl < 0);
  const avgWinR = winTrades.length > 0 ? winTrades.reduce((acc, t) => acc + (t.rMultiple || 0), 0) / winTrades.length : 0;
  const avgLossR = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((acc, t) => acc + (t.rMultiple || 0), 0) / lossTrades.length) : 0;

  let avgRR = 0;
  if (winCount > 0 && lossCount > 0) {
    // Both winning and losing trades exist: realized Reward-to-Risk ratio
    avgRR = avgLossR > 0 ? avgWinR / avgLossR : avgLoss > 0 ? avgWin / avgLoss : avgPlannedRR;
  } else if (winCount > 0 && lossCount === 0) {
    // Only winning trades recorded: use average win R or planned RR
    avgRR = avgWinR > 0 ? avgWinR : (avgPlannedRR > 0 ? avgPlannedRR : 2.0);
  } else if (winCount === 0 && lossCount > 0) {
    // Only losing trades recorded so far: use planned setup R:R (e.g. 1:2.00)
    avgRR = avgPlannedRR > 0 ? avgPlannedRR : 1.0;
  } else {
    avgRR = avgPlannedRR > 0 ? avgPlannedRR : 0;
  }

  const avgHoldingTimeMinutes = sorted.length > 0 ? Math.round(totalHoldingMinutes / sorted.length) : 0;

  return {
    accountBalance: Number((initialBalance + totalPnl).toFixed(2)),
    initialBalance,
    totalPnl: Number(totalPnl.toFixed(2)),
    todayPnl: Number(todayPnl.toFixed(2)),
    monthlyPnl: Number(monthlyPnl.toFixed(2)),
    totalTrades: sorted.length,
    winCount,
    lossCount,
    beCount,
    winRate: Number(winRate.toFixed(1)),
    profitFactor: Number(profitFactor.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    avgRR: Number(avgRR.toFixed(2)),
    avgPlannedRR: Number(avgPlannedRR.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(1)),
    maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
    currentStreak: { type: currentStreakType, count: currentStreakCount },
    bestTrade: bestTrade.pnl === -Infinity || bestTrade.pnl <= 0 ? { pnl: 0, r: 0, instrument: '-', id: '' } : { ...bestTrade, pnl: Number(bestTrade.pnl.toFixed(2)) },
    worstTrade: worstTrade.pnl === Infinity || worstTrade.pnl >= 0 ? { pnl: 0, r: 0, instrument: '-', id: '' } : { ...worstTrade, pnl: Number(worstTrade.pnl.toFixed(2)) },
    bestDay: bestDay.pnl === -Infinity || bestDay.pnl <= 0 ? { date: '-', pnl: 0 } : { ...bestDay, pnl: Number(bestDay.pnl.toFixed(2)) },
    worstDay: worstDay.pnl === Infinity || worstDay.pnl >= 0 ? { date: '-', pnl: 0 } : { ...worstDay, pnl: Number(worstDay.pnl.toFixed(2)) },
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    avgHoldingTimeMinutes,
  };
}

export function buildEquityCurve(
  trades: Trade[],
  initialBalance: number = 500,
  metric: 'pnl' | 'r' | 'equity' = 'equity',
  timeframeFilter: '7D' | '30D' | '3M' | '6M' | '1Y' | 'ALL' = 'ALL'
) {
  if (!trades || trades.length === 0) return [];

  const sorted = [...trades].sort((a, b) => {
    const da = `${a.date}T${a.time || '00:00'}`;
    const db = `${b.date}T${b.time || '00:00'}`;
    return new Date(da).getTime() - new Date(db).getTime();
  });

  // Filter by timeframe
  const now = new Date();
  let cutoffDate: Date | null = null;
  if (timeframeFilter === '7D') {
    cutoffDate = new Date(now.getTime() - 7 * 86400000);
  } else if (timeframeFilter === '30D') {
    cutoffDate = new Date(now.getTime() - 30 * 86400000);
  } else if (timeframeFilter === '3M') {
    cutoffDate = new Date(now.getTime() - 90 * 86400000);
  } else if (timeframeFilter === '6M') {
    cutoffDate = new Date(now.getTime() - 180 * 86400000);
  } else if (timeframeFilter === '1Y') {
    cutoffDate = new Date(now.getTime() - 365 * 86400000);
  }

  let filtered = sorted;
  if (cutoffDate) {
    filtered = sorted.filter(t => new Date(`${t.date}T${t.time || '00:00'}`).getTime() >= cutoffDate.getTime());
  }

  if (filtered.length === 0) {
    filtered = sorted.slice(-10); // fallback if current filter is empty
  }

  let runningPnl = 0;
  let runningR = 0;
  let runningEquity = initialBalance;

  const points: { date: string; time: string; value: number; tradeIndex: number; instrument: string; pnl: number; r: number }[] = [];

  // Start point
  points.push({
    date: filtered[0].date,
    time: '00:00',
    value: metric === 'equity' ? initialBalance : 0,
    tradeIndex: 0,
    instrument: 'START',
    pnl: 0,
    r: 0,
  });

  filtered.forEach((t, idx) => {
    runningPnl += t.pnl;
    runningR += t.rMultiple;
    runningEquity += t.pnl;

    let val = runningEquity;
    if (metric === 'pnl') val = runningPnl;
    if (metric === 'r') val = Number(runningR.toFixed(2));

    points.push({
      date: t.date,
      time: t.time,
      value: val,
      tradeIndex: idx + 1,
      instrument: t.instrument,
      pnl: t.pnl,
      r: t.rMultiple,
    });
  });

  return points;
}

export function groupTradesByCategory(
  trades: Trade[],
  categoryFn: (t: Trade) => string
): CategoryStat[] {
  const groups: Record<string, Trade[]> = {};
  for (const t of trades) {
    const key = categoryFn(t) || 'Unassigned';
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  const result: CategoryStat[] = [];
  for (const [name, items] of Object.entries(groups)) {
    let wins = 0;
    let losses = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let totalPnl = 0;
    let totalR = 0;

    for (const item of items) {
      totalPnl += item.pnl;
      totalR += item.rMultiple;
      if (item.pnl > 0) {
        wins++;
        grossProfit += item.pnl;
      } else if (item.pnl < 0) {
        losses++;
        grossLoss += Math.abs(item.pnl);
      }
    }

    const totalTrades = items.length;
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
    const expectancy = totalTrades > 0 ? totalR / totalTrades : 0;
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;

    result.push({
      name,
      totalTrades,
      wins,
      losses,
      winRate: Number(winRate.toFixed(1)),
      totalPnl: Math.round(totalPnl),
      totalR: Number(totalR.toFixed(1)),
      profitFactor: Number(profitFactor.toFixed(2)),
      expectancy: Number(expectancy.toFixed(2)),
      avgWin: Math.round(avgWin),
      avgLoss: Math.round(avgLoss),
      avgRR: Number(avgRR.toFixed(2)),
    });
  }

  // Sort descending by total P&L
  return result.sort((a, b) => b.totalPnl - a.totalPnl);
}

export function calculatePsychologyInsights(trades: Trade[]) {
  // Emotion breakdown
  const emotionGroups = groupTradesByCategory(trades, t => t.emotion);

  // Discipline breakdown
  const lowDisciplineTrades = trades.filter(t => t.discipline <= 5);
  const highDisciplineTrades = trades.filter(t => t.discipline >= 7);

  const lowDispWins = lowDisciplineTrades.filter(t => t.pnl > 0).length;
  const lowDispWinRate = lowDisciplineTrades.length > 0 ? (lowDispWins / lowDisciplineTrades.length) * 100 : 0;
  const lowDispPnl = lowDisciplineTrades.reduce((acc, t) => acc + t.pnl, 0);
  const lowDispR = lowDisciplineTrades.reduce((acc, t) => acc + t.rMultiple, 0);

  const highDispWins = highDisciplineTrades.filter(t => t.pnl > 0).length;
  const highDispWinRate = highDisciplineTrades.length > 0 ? (highDispWins / highDisciplineTrades.length) * 100 : 0;
  const highDispPnl = highDisciplineTrades.reduce((acc, t) => acc + t.pnl, 0);
  const highDispR = highDisciplineTrades.reduce((acc, t) => acc + t.rMultiple, 0);

  // Mistake breakdown
  const mistakeTrades = trades.filter(t => t.mistake && t.mistake !== 'None');
  const mistakeGroups: Record<string, { count: number; totalR: number; totalPnl: number }> = {};
  for (const t of mistakeTrades) {
    const m = t.mistake!;
    if (!mistakeGroups[m]) mistakeGroups[m] = { count: 0, totalR: 0, totalPnl: 0 };
    mistakeGroups[m].count++;
    mistakeGroups[m].totalR += t.rMultiple;
    mistakeGroups[m].totalPnl += t.pnl;
  }

  const mistakesList = Object.entries(mistakeGroups).map(([name, data]) => ({
    name,
    count: data.count,
    totalR: Number(data.totalR.toFixed(1)),
    totalPnl: Math.round(data.totalPnl),
  })).sort((a, b) => a.totalR - b.totalR); // worst mistakes first

  // FOMO trades specifically
  const fomoTrades = trades.filter(t => t.emotion === 'FOMO' || (t.tags && t.tags.includes('FOMO')));
  const fomoR = fomoTrades.reduce((acc, t) => acc + t.rMultiple, 0);
  const fomoPnl = fomoTrades.reduce((acc, t) => acc + t.pnl, 0);

  // Revenge trades
  const revengeTrades = trades.filter(t => t.emotion === 'Revenge');
  const revengeR = revengeTrades.reduce((acc, t) => acc + t.rMultiple, 0);

  return {
    emotionGroups,
    lowDiscipline: {
      count: lowDisciplineTrades.length,
      winRate: Number(lowDispWinRate.toFixed(1)),
      totalPnl: Math.round(lowDispPnl),
      totalR: Number(lowDispR.toFixed(1)),
    },
    highDiscipline: {
      count: highDisciplineTrades.length,
      winRate: Number(highDispWinRate.toFixed(1)),
      totalPnl: Math.round(highDispPnl),
      totalR: Number(highDispR.toFixed(1)),
    },
    mistakesList,
    fomo: {
      count: fomoTrades.length,
      totalR: Number(fomoR.toFixed(1)),
      totalPnl: Math.round(fomoPnl),
    },
    revenge: {
      count: revengeTrades.length,
      totalR: Number(revengeR.toFixed(1)),
    },
  };
}

export function generateTradingDNA(trades: Trade[]) {
  if (trades.length === 0) {
    return {
      bestSession: 'N/A',
      bestSetup: 'N/A',
      bestTimeframe: 'N/A',
      bestInstrument: 'N/A',
      worstInstrument: 'N/A',
      worstSetup: 'N/A',
      avgHoldingTime: '0 min',
      avgRiskPercent: '0%',
      longShortRatio: '50 / 50',
      scalpingVsSwing: 'Balanced',
      disciplineScore: 0,
      topEmotion: 'N/A',
      riskTakingScore: 'Moderate',
      overtradingRisk: 'Low',
    };
  }

  const bySession = groupTradesByCategory(trades, t => t.session);
  const bySetup = groupTradesByCategory(trades, t => t.setup);
  const byTf = groupTradesByCategory(trades, t => t.timeframe);
  const byInst = groupTradesByCategory(trades, t => t.instrument);

  const bestSession = bySession.sort((a, b) => b.totalR - a.totalR)[0]?.name || 'N/A';
  const bestSetup = bySetup.sort((a, b) => b.totalR - a.totalR)[0]?.name || 'N/A';
  const worstSetup = bySetup.sort((a, b) => a.totalR - b.totalR)[0]?.name || 'N/A';
  const bestTimeframe = byTf.sort((a, b) => b.totalR - a.totalR)[0]?.name || 'N/A';
  const bestInstrument = byInst.sort((a, b) => b.totalPnl - a.totalPnl)[0]?.name || 'N/A';
  const worstInstrument = byInst.sort((a, b) => a.totalPnl - b.totalPnl)[0]?.name || 'N/A';

  const totalHolding = trades.reduce((acc, t) => acc + (t.holdingTimeMinutes || 30), 0);
  const avgHoldingMin = Math.round(totalHolding / trades.length);
  const avgHoldingTime = avgHoldingMin >= 60 ? `${(avgHoldingMin / 60).toFixed(1)} hrs` : `${avgHoldingMin} min`;

  const totalRiskPct = trades.reduce((acc, t) => acc + (t.riskPercent || 1), 0);
  const avgRiskPercent = `${(totalRiskPct / trades.length).toFixed(1)}%`;

  const longs = trades.filter(t => t.direction === 'LONG').length;
  const longPct = Math.round((longs / trades.length) * 100);
  const shortPct = 100 - longPct;
  const longShortRatio = `${longPct} / ${shortPct}`;

  // Scalping (< 20m) vs Intraday (20m-180m) vs Swing (> 180m)
  const scalps = trades.filter(t => (t.holdingTimeMinutes || 0) < 20).length;
  const swings = trades.filter(t => (t.holdingTimeMinutes || 0) > 180).length;
  let scalpingVsSwing = 'Intraday Focused';
  if (scalps > trades.length * 0.45) scalpingVsSwing = 'High Frequency Scalper';
  else if (swings > trades.length * 0.35) scalpingVsSwing = 'Multi-Hour Swing';

  const totalDisp = trades.reduce((acc, t) => acc + (t.discipline || 7), 0);
  const disciplineScore = Number((totalDisp / trades.length).toFixed(1));

  // Top emotion during losses
  const lossTrades = trades.filter(t => t.pnl < 0);
  const lossEmotions: Record<string, number> = {};
  for (const t of lossTrades) {
    lossEmotions[t.emotion] = (lossEmotions[t.emotion] || 0) + 1;
  }
  let topEmotion = 'Calm';
  let maxEmoCount = 0;
  for (const [emo, count] of Object.entries(lossEmotions)) {
    if (count > maxEmoCount) {
      maxEmoCount = count;
      topEmotion = emo;
    }
  }

  // Risk profile
  const avgRiskNum = totalRiskPct / trades.length;
  let riskTakingScore = 'Conservative (0.5% - 1%)';
  if (avgRiskNum > 1.8) riskTakingScore = 'Aggressive (> 1.8%)';
  else if (avgRiskNum >= 1.0) riskTakingScore = 'Disciplined Standard (1.0% - 1.5%)';

  // Overtrading risk
  const tradesByDay: Record<string, number> = {};
  trades.forEach(t => {
    tradesByDay[t.date] = (tradesByDay[t.date] || 0) + 1;
  });
  const maxTradesDay = Math.max(...Object.values(tradesByDay), 0);
  let overtradingRisk = 'Low (Strict execution)';
  if (maxTradesDay >= 6) overtradingRisk = 'High (Spikes to 6+ trades/day)';
  else if (maxTradesDay >= 4) overtradingRisk = 'Moderate (Occasionally clusters)';

  return {
    bestSession,
    bestSetup,
    bestTimeframe,
    bestInstrument,
    worstInstrument,
    worstSetup,
    avgHoldingTime,
    avgRiskPercent,
    longShortRatio,
    scalpingVsSwing,
    disciplineScore,
    topEmotion,
    riskTakingScore,
    overtradingRisk,
  };
}

export function checkPlanViolations(trade: Partial<Trade>, plan: TradingPlan): string[] {
  const violations: string[] = [];

  // Minimum R:R check
  if (trade.entryPrice && trade.stopLoss && trade.takeProfit) {
    const risk = Math.abs(trade.entryPrice - trade.stopLoss);
    const reward = Math.abs(trade.takeProfit - trade.entryPrice);
    if (risk > 0) {
      const plannedRR = reward / risk;
      if (plannedRR < plan.minRR - 0.05) {
        violations.push(`Violates minimum 1:${plan.minRR} R:R rule (Target is 1:${plannedRR.toFixed(1)})`);
      }
    }
  }

  // Risk % check
  if (trade.riskPercent && trade.riskPercent > plan.riskPerTradePercent) {
    violations.push(`Exceeds maximum ${plan.riskPerTradePercent}% risk limit (Attempted ${trade.riskPercent}%)`);
  }

  // Allowed instrument check
  if (trade.instrument && plan.allowedInstruments && plan.allowedInstruments.length > 0) {
    if (!plan.allowedInstruments.includes(trade.instrument)) {
      violations.push(`Instrument "${trade.instrument}" is outside authorized watchlist`);
    }
  }

  // Allowed sessions check
  if (trade.session && plan.allowedSessions && plan.allowedSessions.length > 0) {
    if (!plan.allowedSessions.includes(trade.session)) {
      violations.push(`Session "${trade.session}" is not in authorized trading windows`);
    }
  }

  // Allowed timeframes check
  if (trade.timeframe && plan.allowedTimeframes && plan.allowedTimeframes.length > 0) {
    if (!plan.allowedTimeframes.includes(trade.timeframe)) {
      violations.push(`Timeframe "${trade.timeframe}" violates trade plan specifications`);
    }
  }

  return violations;
}
