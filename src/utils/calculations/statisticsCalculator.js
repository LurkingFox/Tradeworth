// src/utils/statisticsCalculator.js
// Centralized statistics calculation to ensure consistency across all components

import { parseFinancialNumber, processTradeCalculations } from './pnlCalculator';

/**
 * Calculate comprehensive trading statistics from trades array
 * This ensures all components show consistent data
 */
export const calculateTradingStatistics = (trades, accountBalance = 0) => {
  if (!Array.isArray(trades) || trades.length === 0) {
    return getEmptyStatistics();
  }

  // Process all trades to ensure consistent calculations
  const processedTrades = trades.map(trade => processTradeCalculations(trade));
  
  // Separate trades by status
  const allTrades = processedTrades;
  const closedTrades = allTrades.filter(t => t.status === 'closed');
  const openTrades = allTrades.filter(t => t.status === 'open');
  const winningTrades = closedTrades.filter(t => t.pnl > 0);
  const losingTrades = closedTrades.filter(t => t.pnl < 0);
  const breakEvenTrades = closedTrades.filter(t => t.pnl === 0);

  // Basic metrics
  const totalTrades = closedTrades.length;
  const openTradeCount = openTrades.length;
  const winCount = winningTrades.length;
  const lossCount = losingTrades.length;
  
  // P&L calculations
  const totalPnL = closedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));
  
  // Win rate
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  
  // Average calculations
  const avgWin = winCount > 0 ? grossProfit / winCount : 0;
  const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
  
  // Profit factor
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
  
  // Largest win/loss
  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
  const largestLoss = losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades.map(t => t.pnl))) : 0;

  // Consecutive streaks
  const { maxWinStreak, maxLossStreak, currentStreak } = calculateStreaks(closedTrades);
  
  // Drawdown analysis
  const { maxDrawdown, currentDrawdown, drawdownHistory } = calculateDrawdown(closedTrades, accountBalance);
  
  // Advanced ratios
  const expectancy = totalTrades > 0 ? ((winRate / 100) * avgWin) - (((100 - winRate) / 100) * avgLoss) : 0;
  // Convert percentage drawdown to absolute for ratio calculations
  const maxDrawdownAbsolute = maxDrawdown > 0 ? (maxDrawdown / 100) * accountBalance : 0;
  const recoveryFactor = maxDrawdownAbsolute > 0 ? Math.abs(totalPnL / maxDrawdownAbsolute) : 0;
  const calmarRatio = maxDrawdownAbsolute > 0 ? totalPnL / maxDrawdownAbsolute : 0;
  
  // Sharpe ratio (simplified)
  const returns = closedTrades.map(t => t.pnl);
  const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
  const stdDev = returns.length > 1 ? Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
  ) : 0;
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  // Worth Score calculation (consistent across all components)
  const worthScore = calculateWorthScore({
    winRate,
    profitFactor,
    maxLossStreak,
    totalTrades,
    consistency: calculateConsistency(closedTrades)
  });

  // Behavioral analysis
  const behavioralMetrics = calculateBehavioralMetrics(closedTrades);

  // Time-based analysis
  const timeMetrics = calculateTimeMetrics(closedTrades);

  // Pair performance analysis
  const pairPerformance = calculatePairPerformance(allTrades);

  // Setup performance analysis  
  const setupPerformance = calculateSetupPerformance(allTrades);

  // Advanced analytics
  const advancedAnalytics = calculateAdvancedAnalytics(closedTrades);

  // Risk metrics
  const riskMetrics = calculateRiskMetrics(closedTrades, accountBalance);

  return {
    // Basic metrics
    totalTrades,
    openTrades: openTradeCount,
    closedTrades: totalTrades,
    winningTrades: winCount,
    losingTrades: lossCount,
    breakEvenTrades: breakEvenTrades.length,
    
    // Performance metrics
    winRate: Math.round(winRate * 10) / 10,
    totalPnL: Math.round(totalPnL * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossLoss: Math.round(grossLoss * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    
    // Risk metrics
    largestWin: Math.round(largestWin * 100) / 100,
    largestLoss: Math.round(largestLoss * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    currentDrawdown: Math.round(currentDrawdown * 100) / 100,
    
    // Streaks
    maxWinStreak,
    maxLossStreak,
    currentStreak,
    
    // Advanced ratios
    expectancy: Math.round(expectancy * 100) / 100,
    recoveryFactor: Math.round(recoveryFactor * 100) / 100,
    calmarRatio: Math.round(calmarRatio * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 1000) / 1000,
    
    // Worth Score
    worthScore: Math.round(worthScore),
    
    // Behavioral metrics
    ...behavioralMetrics,
    
    // Time-based metrics
    ...timeMetrics,
    
    // Risk analysis
    ...riskMetrics,
    
    // Advanced analytics
    ...advancedAnalytics,
    
    // Performance breakdowns
    pairPerformance,
    setupPerformance,
    
    // Chart data
    drawdownHistory,
    allTrades: processedTrades,
    closedTrades,
    openTrades,
    winningTrades,
    losingTrades,
    
    // Additional derived metrics
    bestTradingPair: pairPerformance.length > 0 ? pairPerformance[0] : null,
    worstTradingPair: pairPerformance.length > 0 ? pairPerformance[pairPerformance.length - 1] : null,
    bestTradingSetup: setupPerformance.length > 0 ? setupPerformance[0] : null,
    worstTradingSetup: setupPerformance.length > 0 ? setupPerformance[setupPerformance.length - 1] : null,
    
    // Portfolio metrics
    portfolioValue: accountBalance + totalPnL,
    portfolioGrowth: accountBalance > 0 ? ((accountBalance + totalPnL) / accountBalance - 1) * 100 : 0,
    
    // Trading activity metrics
    avgTradesPerMonth: timeMetrics.monthlyPerformance?.length > 0 ? 
      totalTrades / timeMetrics.monthlyPerformance.length : 0,
    
    // Risk-adjusted metrics
    informationRatio: advancedAnalytics.volatility > 0 ? expectancy / advancedAnalytics.volatility : 0,
    treynorRatio: advancedAnalytics.volatility > 0 ? totalPnL / advancedAnalytics.volatility : 0
  };
};

/**
 * Calculate empty statistics structure
 */
const getEmptyStatistics = () => ({
  totalTrades: 0,
  openTrades: 0,
  closedTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  breakEvenTrades: 0,
  winRate: 0,
  totalPnL: 0,
  grossProfit: 0,
  grossLoss: 0,
  avgWin: 0,
  avgLoss: 0,
  profitFactor: 0,
  largestWin: 0,
  largestLoss: 0,
  maxDrawdown: 0,
  currentDrawdown: 0,
  maxWinStreak: 0,
  maxLossStreak: 0,
  currentStreak: 0,
  expectancy: 0,
  recoveryFactor: 0,
  calmarRatio: 0,
  sharpeRatio: 0,
  worthScore: 0,
  consistency: 0,
  discipline: 0,
  riskManagement: 0,
  kellyCriterion: 0,
  sortinoRatio: 0,
  volatility: 0,
  skewness: 0,
  kurtosis: 0,
  portfolioValue: 0,
  portfolioGrowth: 0,
  drawdownHistory: [],
  allTrades: [],
  closedTrades: [],
  openTrades: [],
  winningTrades: [],
  losingTrades: [],
  pairPerformance: [],
  setupPerformance: [],
  monthlyPerformance: [],
  dailyPerformance: []
});

/**
 * Calculate consecutive win/loss streaks
 */
const calculateStreaks = (closedTrades) => {
  if (closedTrades.length === 0) {
    return { maxWinStreak: 0, maxLossStreak: 0, currentStreak: 0 };
  }

  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let currentStreak = 0;

  // Sort by date to ensure chronological order
  const sortedTrades = [...closedTrades].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedTrades.forEach((trade, index) => {
    if (trade.pnl > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else if (trade.pnl < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }

    // Current streak (from the most recent trade)
    if (index === sortedTrades.length - 1) {
      if (trade.pnl > 0) {
        currentStreak = currentWinStreak;
      } else if (trade.pnl < 0) {
        currentStreak = -currentLossStreak;
      } else {
        currentStreak = 0;
      }
    }
  });

  return { maxWinStreak, maxLossStreak, currentStreak };
};

/**
 * Calculate drawdown analysis
 */
const calculateDrawdown = (closedTrades, initialBalance = 1000) => {
  if (closedTrades.length === 0) {
    return { maxDrawdown: 0, currentDrawdown: 0, drawdownHistory: [] };
  }

  // Sort by date to ensure chronological order
  const sortedTrades = [...closedTrades].sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = initialBalance;
  let peakBalance = initialBalance;
  let maxDrawdownPercent = 0;
  let currentDrawdownPercent = 0;
  const drawdownHistory = [];

  sortedTrades.forEach(trade => {
    runningBalance += (trade.pnl || 0);
    
    // Update peak balance
    if (runningBalance > peakBalance) {
      peakBalance = runningBalance;
    }
    
    // Calculate drawdown as percentage of peak balance
    const drawdownAbsolute = peakBalance - runningBalance;
    const drawdownPercent = peakBalance > 0 ? (drawdownAbsolute / peakBalance) * 100 : 0;
    
    maxDrawdownPercent = Math.max(maxDrawdownPercent, drawdownPercent);
    currentDrawdownPercent = drawdownPercent;

    drawdownHistory.push({
      date: trade.date,
      balance: runningBalance,
      drawdown: drawdownPercent,
      peak: peakBalance
    });
  });

  return { 
    maxDrawdown: maxDrawdownPercent, 
    currentDrawdown: currentDrawdownPercent, 
    drawdownHistory 
  };
};

/**
 * Calculate Worth Score (consistent across all components)
 */
const calculateWorthScore = ({ winRate, profitFactor, maxLossStreak, totalTrades, consistency }) => {
  if (totalTrades === 0) return 0;

  // Win Rate Component (0-400 points)
  const baseScore = Math.max(0, Math.min(winRate * 4, 400));
  
  // Profit Factor Component (0-300 points)
  const profitScore = Math.max(0, Math.min(profitFactor * 100, 300));
  
  // Consistency Component (0-200 points)
  const consistencyScore = Math.max(0, 200 - (maxLossStreak * 20));
  
  // Experience Component (0-100 points)
  const experienceScore = Math.min(totalTrades * 2, 100);

  return baseScore + profitScore + consistencyScore + experienceScore;
};

/**
 * Calculate consistency score
 */
const calculateConsistency = (closedTrades) => {
  if (closedTrades.length < 3) return 0;

  // Calculate monthly P&L consistency
  const monthlyPnL = {};
  closedTrades.forEach(trade => {
    const month = trade.date.substring(0, 7); // YYYY-MM
    monthlyPnL[month] = (monthlyPnL[month] || 0) + trade.pnl;
  });

  const monthlyResults = Object.values(monthlyPnL);
  if (monthlyResults.length < 2) return 50;

  const avgMonthly = monthlyResults.reduce((sum, pnl) => sum + pnl, 0) / monthlyResults.length;
  const variance = monthlyResults.reduce((sum, pnl) => sum + Math.pow(pnl - avgMonthly, 2), 0) / monthlyResults.length;
  const stdDev = Math.sqrt(variance);

  // Calculate consistency score (0-100)
  const coefficient = avgMonthly !== 0 ? stdDev / Math.abs(avgMonthly) : 1;
  const consistency = Math.max(0, Math.min(100, 100 - (coefficient * 50)));

  return Math.round(consistency);
};

/**
 * Calculate behavioral metrics
 */
const calculateBehavioralMetrics = (closedTrades) => {
  if (closedTrades.length === 0) {
    return {
      consistency: 0,
      discipline: 0,
      riskManagement: 0
    };
  }

  const consistency = calculateConsistency(closedTrades);
  
  // Discipline score based on R:R ratios and proper risk management
  let disciplineScore = 100;
  let riskMgmtScore = 100;

  closedTrades.forEach(trade => {
    // Penalize trades without proper stop losses
    if (!trade.stopLoss || trade.stopLoss === 0) {
      disciplineScore -= 5;
    }
    
    // Penalize poor R:R ratios
    if (trade.rr && trade.rr < 1) {
      riskMgmtScore -= 3;
    }
  });

  return {
    consistency,
    discipline: Math.max(0, Math.round(disciplineScore)),
    riskManagement: Math.max(0, Math.round(riskMgmtScore))
  };
};

/**
 * Calculate time-based metrics
 */
const calculateTimeMetrics = (closedTrades) => {
  if (closedTrades.length === 0) {
    return {
      avgHoldTime: 0,
      totalTradingDays: 0,
      tradesPerDay: 0,
      bestTradingDay: null,
      worstTradingDay: null,
      monthlyPerformance: [],
      dailyPerformance: []
    };
  }

  // Calculate average hold time
  const avgHoldTime = closedTrades.reduce((sum, trade) => {
    return sum + (trade.holdTimeMinutes || 240); // Default 4 hours if not specified
  }, 0) / closedTrades.length;

  // Calculate daily performance
  const dailyPerformance = {};
  closedTrades.forEach(trade => {
    const date = trade.date.split('T')[0];
    if (!dailyPerformance[date]) {
      dailyPerformance[date] = {
        date,
        trades: 0,
        pnl: 0,
        wins: 0,
        losses: 0
      };
    }
    dailyPerformance[date].trades++;
    dailyPerformance[date].pnl += trade.pnl || 0;
    if (trade.pnl > 0) dailyPerformance[date].wins++;
    else if (trade.pnl < 0) dailyPerformance[date].losses++;
  });

  const dailyArray = Object.values(dailyPerformance);
  const bestTradingDay = dailyArray.reduce((best, day) => 
    (!best || day.pnl > best.pnl) ? day : best, null);
  const worstTradingDay = dailyArray.reduce((worst, day) => 
    (!worst || day.pnl < worst.pnl) ? day : worst, null);

  // Calculate monthly performance
  const monthlyPerformance = {};
  closedTrades.forEach(trade => {
    const month = trade.date.substring(0, 7); // YYYY-MM
    if (!monthlyPerformance[month]) {
      monthlyPerformance[month] = {
        month,
        trades: 0,
        pnl: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      };
    }
    monthlyPerformance[month].trades++;
    monthlyPerformance[month].pnl += trade.pnl || 0;
    if (trade.pnl > 0) monthlyPerformance[month].wins++;
    else if (trade.pnl < 0) monthlyPerformance[month].losses++;
  });

  // Calculate win rates for months
  Object.values(monthlyPerformance).forEach(month => {
    const closedMonthTrades = month.wins + month.losses;
    month.winRate = closedMonthTrades > 0 ? (month.wins / closedMonthTrades) * 100 : 0;
  });

  const totalTradingDays = dailyArray.length;
  const tradesPerDay = totalTradingDays > 0 ? closedTrades.length / totalTradingDays : 0;

  return {
    avgHoldTime: Math.round(avgHoldTime),
    totalTradingDays,
    tradesPerDay: Math.round(tradesPerDay * 100) / 100,
    bestTradingDay,
    worstTradingDay,
    monthlyPerformance: Object.values(monthlyPerformance).sort((a, b) => a.month.localeCompare(b.month)),
    dailyPerformance: dailyArray.sort((a, b) => a.date.localeCompare(b.date))
  };
};

/**
 * Calculate pair-specific performance
 */
const calculatePairPerformance = (trades) => {
  const pairStats = {};
  
  trades.forEach(trade => {
    if (!pairStats[trade.pair]) {
      pairStats[trade.pair] = {
        pair: trade.pair,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        totalPnL: 0,
        winRate: 0,
        avgPnL: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgLotSize: 0
      };
    }
    
    const stats = pairStats[trade.pair];
    stats.totalTrades++;
    stats.totalPnL += trade.pnl || 0;
    stats.avgLotSize += trade.lotSize || 0;
    
    if (trade.pnl > stats.bestTrade) stats.bestTrade = trade.pnl;
    if (trade.pnl < stats.worstTrade) stats.worstTrade = trade.pnl;
    
    if (trade.status === 'closed') {
      if (trade.pnl > 0) stats.wins++;
      else if (trade.pnl < 0) stats.losses++;
    }
  });

  // Calculate derived metrics
  Object.values(pairStats).forEach(stats => {
    const closedTrades = stats.wins + stats.losses;
    stats.winRate = closedTrades > 0 ? (stats.wins / closedTrades) * 100 : 0;
    stats.avgPnL = stats.totalTrades > 0 ? stats.totalPnL / stats.totalTrades : 0;
    stats.avgLotSize = stats.totalTrades > 0 ? stats.avgLotSize / stats.totalTrades : 0;
  });

  return Object.values(pairStats).sort((a, b) => b.totalPnL - a.totalPnL);
};

/**
 * Calculate setup-specific performance  
 */
const calculateSetupPerformance = (trades) => {
  const setupStats = {};
  
  trades.forEach(trade => {
    const setup = trade.setup || 'Unknown';
    
    if (!setupStats[setup]) {
      setupStats[setup] = {
        setup,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        totalPnL: 0,
        winRate: 0,
        avgPnL: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgRR: 0
      };
    }
    
    const stats = setupStats[setup];
    stats.totalTrades++;
    stats.totalPnL += trade.pnl || 0;
    stats.avgRR += trade.rr || 0;
    
    if (trade.pnl > stats.bestTrade) stats.bestTrade = trade.pnl;
    if (trade.pnl < stats.worstTrade) stats.worstTrade = trade.pnl;
    
    if (trade.status === 'closed') {
      if (trade.pnl > 0) stats.wins++;
      else if (trade.pnl < 0) stats.losses++;
    }
  });

  // Calculate derived metrics
  Object.values(setupStats).forEach(stats => {
    const closedTrades = stats.wins + stats.losses;
    stats.winRate = closedTrades > 0 ? (stats.wins / closedTrades) * 100 : 0;
    stats.avgPnL = stats.totalTrades > 0 ? stats.totalPnL / stats.totalTrades : 0;
    stats.avgRR = stats.totalTrades > 0 ? stats.avgRR / stats.totalTrades : 0;
  });

  return Object.values(setupStats).sort((a, b) => b.totalPnL - a.totalPnL);
};

/**
 * Calculate advanced analytics metrics
 */
const calculateAdvancedAnalytics = (closedTrades) => {
  if (closedTrades.length === 0) {
    return {
      kellyCriterion: 0,
      sortinoRatio: 0,
      maxFavorableExcursion: 0,
      maxAdverseExcursion: 0,
      consecutiveLossStreak: 0,
      consecutiveWinStreak: 0,
      tradingFrequency: 0,
      volatility: 0,
      skewness: 0,
      kurtosis: 0
    };
  }

  const returns = closedTrades.map(t => t.pnl || 0);
  const winningReturns = returns.filter(r => r > 0);
  const losingReturns = returns.filter(r => r < 0);
  
  // Kelly Criterion
  const avgWin = winningReturns.length > 0 ? winningReturns.reduce((a, b) => a + b, 0) / winningReturns.length : 0;
  const avgLoss = losingReturns.length > 0 ? Math.abs(losingReturns.reduce((a, b) => a + b, 0)) / losingReturns.length : 0;
  const winProb = winningReturns.length / closedTrades.length;
  const lossProb = 1 - winProb;
  const kellyCriterion = avgLoss > 0 ? Math.max(0, (winProb / avgLoss) - (lossProb / avgWin)) : 0;

  // Volatility (standard deviation)
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  // Sortino Ratio (downside deviation)
  const downsideReturns = returns.filter(r => r < meanReturn);
  const downsideVariance = downsideReturns.length > 0 ? 
    downsideReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / downsideReturns.length : 0;
  const downsideDeviation = Math.sqrt(downsideVariance);
  const sortinoRatio = downsideDeviation > 0 ? meanReturn / downsideDeviation : 0;

  // MFE/MAE (simplified - would need tick data for accurate calculation)
  const maxFavorableExcursion = Math.max(...returns);
  const maxAdverseExcursion = Math.abs(Math.min(...returns));

  // Statistical measures
  const skewness = calculateSkewness(returns, meanReturn, volatility);
  const kurtosis = calculateKurtosis(returns, meanReturn, volatility);

  return {
    kellyCriterion: Math.max(0, Math.min(1, kellyCriterion)),
    sortinoRatio: Math.round(sortinoRatio * 1000) / 1000,
    maxFavorableExcursion: Math.round(maxFavorableExcursion * 100) / 100,
    maxAdverseExcursion: Math.round(maxAdverseExcursion * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
    skewness: Math.round(skewness * 1000) / 1000,
    kurtosis: Math.round(kurtosis * 1000) / 1000
  };
};

/**
 * Helper function to calculate skewness
 */
const calculateSkewness = (values, mean, stdDev) => {
  if (stdDev === 0 || values.length < 3) return 0;
  
  const n = values.length;
  const skew = values.reduce((sum, value) => {
    return sum + Math.pow((value - mean) / stdDev, 3);
  }, 0);
  
  return (n / ((n - 1) * (n - 2))) * skew;
};

/**
 * Helper function to calculate kurtosis
 */
const calculateKurtosis = (values, mean, stdDev) => {
  if (stdDev === 0 || values.length < 4) return 0;
  
  const n = values.length;
  const kurt = values.reduce((sum, value) => {
    return sum + Math.pow((value - mean) / stdDev, 4);
  }, 0);
  
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * kurt - (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
};

/**
 * Calculate risk metrics
 */
const calculateRiskMetrics = (closedTrades, accountBalance) => {
  if (closedTrades.length === 0 || accountBalance <= 0) {
    return {
      maxRiskPerTrade: 0,
      avgRiskPerTrade: 0,
      riskRewardRatio: 0,
      valueAtRisk: 0
    };
  }

  // Calculate risk percentages
  const riskAmounts = closedTrades
    .filter(t => t.risk && t.risk > 0)
    .map(t => (t.risk / accountBalance) * 100);

  const maxRiskPerTrade = riskAmounts.length > 0 ? Math.max(...riskAmounts) : 0;
  const avgRiskPerTrade = riskAmounts.length > 0 ? 
    riskAmounts.reduce((sum, risk) => sum + risk, 0) / riskAmounts.length : 0;

  // Calculate average R:R ratio
  const rrRatios = closedTrades
    .filter(t => t.rr && t.rr > 0)
    .map(t => t.rr);
  const riskRewardRatio = rrRatios.length > 0 ?
    rrRatios.reduce((sum, rr) => sum + rr, 0) / rrRatios.length : 0;

  // Value at Risk (simplified - 95% confidence)
  const returns = closedTrades.map(t => (t.pnl / accountBalance) * 100);
  returns.sort((a, b) => a - b);
  const varIndex = Math.floor(returns.length * 0.05);
  const valueAtRisk = returns.length > 0 ? Math.abs(returns[varIndex] || 0) : 0;

  return {
    maxRiskPerTrade: Math.round(maxRiskPerTrade * 100) / 100,
    avgRiskPerTrade: Math.round(avgRiskPerTrade * 100) / 100,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    valueAtRisk: Math.round(valueAtRisk * 100) / 100
  };
};

// Export additional utility functions
export const getConsistentStatistics = (trades, accountBalance = 10000) => {
  return calculateTradingStatistics(trades, accountBalance);
};

export const getConsistentWorthScore = (statistics) => {
  if (!statistics) return 0;
  return statistics.worthScore || 0;
};

export default { calculateTradingStatistics, getConsistentStatistics, getConsistentWorthScore };