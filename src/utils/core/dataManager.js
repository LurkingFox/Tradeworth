// src/utils/dataManager.js
// Centralized data management system for consistency across all components

import React from 'react';
import { calculateTradingStatistics } from '../calculations/statisticsCalculator';
import { processTradeCalculations, batchProcessTrades, calculateDeferredPnL } from '../calculations/pnlCalculator';
import { tradeCache } from './tradeCache';

/**
 * Centralized data manager to ensure consistency across all components
 * This is the single source of truth for trading data and statistics
 */
class DataManager {
  constructor() {
    this.trades = [];
    this.statistics = null;
    this.subscribers = new Set();
    this.lastUpdate = Date.now();
  }

  /**
   * Subscribe to data changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of data changes
   */
  notifySubscribers() {
    this.lastUpdate = Date.now();
    this.subscribers.forEach(callback => {
      try {
        callback({
          trades: this.trades,
          statistics: this.statistics,
          timestamp: this.lastUpdate
        });
      } catch (error) {
        console.error('Error notifying data subscriber:', error);
      }
    });
  }

  /**
   * Set trades data and recalculate statistics with caching optimization
   */
  setTrades(trades, accountBalance = 10000, options = {}) {
    const { 
      useCache = true, 
      batchProcess = true, 
      lazyCalculation = true 
    } = options;
    
    // Generate hash for cache key
    const tradesHash = this.generateTradesHash(trades);
    
    // Try to get cached statistics first
    if (useCache) {
      const cachedStats = tradeCache.getCachedStatistics('global', tradesHash);
      if (cachedStats) {
        this.trades = trades;
        this.statistics = cachedStats;
        this.notifySubscribers();
        console.log('DataManager: Using cached statistics for', trades.length, 'trades');
        return;
      }
    }
    
    console.log(`🔄 DataManager.setTrades called with ${(trades || []).length} trades`);
    console.log(`🔍 TRACE: setTrades options:`, { useCache, batchProcess, lazyCalculation });
    console.log(`🔍 TRACE: First 3 trade IDs:`, (trades || []).slice(0, 3).map(t => t.id));
    console.log(`🔍 TRACE: Last 3 trade IDs:`, (trades || []).slice(-3).map(t => t.id));
    
    // Write debug trace to console for monitoring
    const debugData = {
      timestamp: new Date().toISOString(),
      event: 'setTrades_called',
      tradesCount: (trades || []).length,
      options: { useCache, batchProcess, lazyCalculation },
      firstThreeIds: (trades || []).slice(0, 3).map(t => t.id),
      lastThreeIds: (trades || []).slice(-3).map(t => t.id),
      willUseBatchProcess: batchProcess && (trades || []).length > 500
    };
    console.log('🚨 DEBUG_DATAMANAGER:', JSON.stringify(debugData));
    
    // Process trades efficiently
    if (batchProcess && trades.length > 500) {
      console.log('DataManager: Batch processing', trades.length, 'trades with lazy calculation');
      this.trades = batchProcessTrades(trades, { 
        lazyCalculation,
        chunkSize: 1000,
        progressCallback: (progress) => {
          console.log(`Processing trades: ${progress.processed}/${progress.total} (${Math.round(progress.progress)}%)`);
        }
      });
      console.log(`✅ DataManager batch processing complete: ${this.trades.length} trades processed`);
      console.log(`🔍 TRACE: Final this.trades length after batch: ${this.trades.length}`);
    } else {
      // Standard processing for smaller datasets
      console.log('DataManager: Standard processing for', trades.length, 'trades');
      this.trades = (trades || []).map(trade => processTradeCalculations(trade));
      console.log(`✅ DataManager standard processing complete: ${this.trades.length} trades processed`);
      console.log(`🔍 TRACE: Final this.trades length after standard: ${this.trades.length}`);
    }
    
    // Calculate deferred PnL for closed trades if needed
    if (lazyCalculation) {
      const deferredCount = this.trades.filter(t => t.calculationsDeferred).length;
      if (deferredCount > 0) {
        console.log(`Calculating deferred PnL for ${deferredCount} trades`);
        this.trades = calculateDeferredPnL(this.trades);
      }
    }
    
    // Calculate and cache statistics
    this.statistics = calculateTradingStatistics(this.trades, accountBalance);
    
    if (useCache) {
      tradeCache.setCachedStatistics('global', tradesHash, this.statistics);
    }
    
    // Notify all subscribers
    this.notifySubscribers();
    
    console.log('DataManager: Updated trades and statistics', {
      totalTrades: this.trades.length,
      worthScore: this.statistics.worthScore,
      winRate: this.statistics.winRate,
      cached: useCache,
      batchProcessed: batchProcess && trades.length > 500
    });
    
    // Final debug trace
    const finalDebugData = {
      timestamp: new Date().toISOString(),
      event: 'setTrades_completed',
      finalTradesCount: this.trades.length,
      statisticsCalculated: !!this.statistics,
      winRate: this.statistics?.winRate || 0,
      totalPnL: this.statistics?.totalPnL || 0
    };
    console.log('🚨 DEBUG_DATAMANAGER_FINAL:', JSON.stringify(finalDebugData));
    
    // Store final result in localStorage for monitoring
    try {
      localStorage.setItem('tradejournal_datamanager_latest', JSON.stringify(finalDebugData));
      const existingLogs = JSON.parse(localStorage.getItem('tradejournal_datamanager_log') || '[]');
      existingLogs.push(finalDebugData);
      // Keep only last 20 debug entries
      if (existingLogs.length > 20) existingLogs.splice(0, existingLogs.length - 20);
      localStorage.setItem('tradejournal_datamanager_log', JSON.stringify(existingLogs));
    } catch (e) {}
  }

  /**
   * Generate hash for trades array for caching
   */
  generateTradesHash(trades) {
    if (!Array.isArray(trades) || trades.length === 0) return 'empty';
    
    // Create a hash based on trade count, first/last dates, and total PnL
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const hashString = `${trades.length}_${sortedTrades[0]?.date}_${sortedTrades[sortedTrades.length - 1]?.date}_${trades.reduce((sum, t) => sum + (t.pnl || 0), 0)}`;
    
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Add a single trade
   */
  addTrade(trade, accountBalance = 10000) {
    const processedTrade = processTradeCalculations(trade);
    this.trades.push(processedTrade);
    
    // Recalculate statistics
    this.statistics = calculateTradingStatistics(this.trades, accountBalance);
    
    // Notify subscribers
    this.notifySubscribers();
    
    return processedTrade;
  }

  /**
   * Update a trade by ID
   */
  updateTrade(tradeId, updates, accountBalance = 10000) {
    const index = this.trades.findIndex(t => t.id === tradeId);
    if (index === -1) return null;

    // Merge updates with existing trade
    const updatedTrade = { ...this.trades[index], ...updates };
    const processedTrade = processTradeCalculations(updatedTrade);
    
    this.trades[index] = processedTrade;
    
    // Recalculate statistics
    this.statistics = calculateTradingStatistics(this.trades, accountBalance);
    
    // Notify subscribers
    this.notifySubscribers();
    
    return processedTrade;
  }

  /**
   * Remove a trade by ID
   */
  removeTrade(tradeId, accountBalance = 10000) {
    const initialLength = this.trades.length;
    this.trades = this.trades.filter(t => t.id !== tradeId);
    
    if (this.trades.length !== initialLength) {
      // Recalculate statistics
      this.statistics = calculateTradingStatistics(this.trades, accountBalance);
      
      // Notify subscribers
      this.notifySubscribers();
      
      return true;
    }
    
    return false;
  }

  /**
   * Get current statistics (always up to date)
   */
  getStatistics() {
    return this.statistics || calculateTradingStatistics(this.trades);
  }

  /**
   * Get all trades
   */
  getTrades() {
    return [...this.trades];
  }

  /**
   * Get filtered trades based on criteria
   */
  getFilteredTrades(filters = {}) {
    let filteredTrades = [...this.trades];

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filteredTrades = filteredTrades.filter(trade => trade.status === filters.status);
    }

    // Pair filter
    if (filters.pair && filters.pair !== 'all') {
      filteredTrades = filteredTrades.filter(trade => trade.pair === filters.pair);
    }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      filteredTrades = filteredTrades.filter(trade => trade.type === filters.type);
    }

    // Setup filter
    if (filters.setup && filters.setup !== 'all') {
      filteredTrades = filteredTrades.filter(trade => trade.setup === filters.setup);
    }

    // Date range filter
    if (filters.dateFrom) {
      filteredTrades = filteredTrades.filter(trade => trade.date >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filteredTrades = filteredTrades.filter(trade => trade.date <= filters.dateTo);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTrades = filteredTrades.filter(trade => 
        trade.pair.toLowerCase().includes(searchLower) ||
        (trade.notes && trade.notes.toLowerCase().includes(searchLower)) ||
        (trade.setup && trade.setup.toLowerCase().includes(searchLower))
      );
    }

    return filteredTrades;
  }

  /**
   * Get trades for a specific date
   */
  getTradesForDate(dateString) {
    return this.trades.filter(trade => trade.date === dateString);
  }

  /**
   * Get P&L for a specific date
   */
  getPnLForDate(dateString) {
    return this.getTradesForDate(dateString)
      .reduce((total, trade) => total + (trade.pnl || 0), 0);
  }


  /**
   * Get performance metrics by pair
   */
  getPerformanceByPair() {
    const pairStats = {};
    
    this.trades.forEach(trade => {
      if (!pairStats[trade.pair]) {
        pairStats[trade.pair] = {
          pair: trade.pair,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          totalPnL: 0,
          winRate: 0,
          avgPnL: 0
        };
      }
      
      const stats = pairStats[trade.pair];
      stats.totalTrades++;
      stats.totalPnL += trade.pnl || 0;
      
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
    });

    return Object.values(pairStats).sort((a, b) => b.totalPnL - a.totalPnL);
  }

  /**
   * Get performance metrics by setup
   */
  getPerformanceBySetup() {
    const setupStats = {};
    
    this.trades.forEach(trade => {
      const setup = trade.setup || 'Unknown';
      
      if (!setupStats[setup]) {
        setupStats[setup] = {
          setup,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          totalPnL: 0,
          winRate: 0,
          avgPnL: 0
        };
      }
      
      const stats = setupStats[setup];
      stats.totalTrades++;
      stats.totalPnL += trade.pnl || 0;
      
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
    });

    return Object.values(setupStats).sort((a, b) => b.totalPnL - a.totalPnL);
  }

  /**
   * Get monthly performance data
   */
  getMonthlyPerformance() {
    const monthlyData = {};
    
    this.trades.forEach(trade => {
      const month = trade.date.substring(0, 7); // YYYY-MM
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          totalPnL: 0,
          winRate: 0
        };
      }
      
      const data = monthlyData[month];
      data.totalTrades++;
      data.totalPnL += trade.pnl || 0;
      
      if (trade.status === 'closed') {
        if (trade.pnl > 0) data.wins++;
        else if (trade.pnl < 0) data.losses++;
      }
    });

    // Calculate win rates
    Object.values(monthlyData).forEach(data => {
      const closedTrades = data.wins + data.losses;
      data.winRate = closedTrades > 0 ? (data.wins / closedTrades) * 100 : 0;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Get data for charts and visualizations
   */
  getChartData() {
    const sortedTrades = [...this.trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let cumulativePnL = 0;
    const equityCurve = sortedTrades.map(trade => {
      cumulativePnL += trade.pnl || 0;
      return {
        date: trade.date,
        pnl: trade.pnl || 0,
        cumulativePnL,
        trade: trade.pair
      };
    });

    return {
      equityCurve,
      monthlyPerformance: this.statistics?.monthlyPerformance || [],
      dailyPerformance: this.statistics?.dailyPerformance || [],
      performanceByPair: this.statistics?.pairPerformance || [],
      performanceBySetup: this.statistics?.setupPerformance || [],
      drawdownHistory: this.statistics?.drawdownHistory || [],
      
      // Additional chart data
      winLossDistribution: this.getWinLossDistribution(),
      tradingHeatmap: this.getTradingHeatmap(),
      riskRewardScatter: this.getRiskRewardScatterData(),
      monthlyGrowthChart: this.getMonthlyGrowthData()
    };
  }

  /**
   * Get win/loss distribution for charts
   */
  getWinLossDistribution() {
    const closedTrades = this.trades.filter(t => t.status === 'closed');
    const wins = closedTrades.filter(t => t.pnl > 0);
    const losses = closedTrades.filter(t => t.pnl < 0);
    
    // Create P&L buckets
    const buckets = {
      '-500+': 0, '-250to-500': 0, '-100to-250': 0, '-50to-100': 0, '-10to-50': 0, '0to-10': 0,
      '0to10': 0, '10to50': 0, '50to100': 0, '100to250': 0, '250to500': 0, '500+': 0
    };

    closedTrades.forEach(trade => {
      const pnl = trade.pnl || 0;
      if (pnl >= 500) buckets['500+']++;
      else if (pnl >= 250) buckets['250to500']++;
      else if (pnl >= 100) buckets['100to250']++;
      else if (pnl >= 50) buckets['50to100']++;
      else if (pnl >= 10) buckets['10to50']++;
      else if (pnl >= 0) buckets['0to10']++;
      else if (pnl >= -10) buckets['0to-10']++;
      else if (pnl >= -50) buckets['-10to-50']++;
      else if (pnl >= -100) buckets['-50to-100']++;
      else if (pnl >= -250) buckets['-100to-250']++;
      else if (pnl >= -500) buckets['-250to-500']++;
      else buckets['-500+']++;
    });

    return {
      buckets,
      totalWins: wins.length,
      totalLosses: losses.length,
      avgWin: wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0,
      avgLoss: losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0)) / losses.length : 0
    };
  }

  /**
   * Get trading activity heatmap data
   */
  getTradingHeatmap() {
    const heatmapData = {};
    
    this.trades.forEach(trade => {
      const date = new Date(trade.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = date.getHours(); // Would need time data
      
      const key = `${dayOfWeek}-${hour || 12}`; // Default to noon if no time
      if (!heatmapData[key]) {
        heatmapData[key] = {
          dayOfWeek,
          hour: hour || 12,
          trades: 0,
          totalPnL: 0,
          avgPnL: 0
        };
      }
      
      heatmapData[key].trades++;
      heatmapData[key].totalPnL += trade.pnl || 0;
      heatmapData[key].avgPnL = heatmapData[key].totalPnL / heatmapData[key].trades;
    });

    return Object.values(heatmapData);
  }

  /**
   * Get risk/reward scatter plot data
   */
  getRiskRewardScatterData() {
    return this.trades
      .filter(t => t.status === 'closed' && t.rr)
      .map(trade => ({
        riskReward: trade.rr,
        pnl: trade.pnl || 0,
        pair: trade.pair,
        setup: trade.setup,
        date: trade.date,
        size: Math.abs(trade.pnl || 0) // For bubble size
      }));
  }

  /**
   * Get monthly portfolio growth data
   */
  getMonthlyGrowthData() {
    const monthlyData = {};
    let cumulativePnL = 0;
    
    const sortedTrades = [...this.trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedTrades.forEach(trade => {
      const month = trade.date.substring(0, 7); // YYYY-MM
      cumulativePnL += trade.pnl || 0;
      
      monthlyData[month] = {
        month,
        cumulativePnL,
        monthlyReturn: (monthlyData[month]?.monthlyReturn || 0) + (trade.pnl || 0),
        portfolioValue: (this.statistics?.portfolioValue || 10000) + cumulativePnL
      };
    });

    return Object.values(monthlyData);
  }

  /**
   * Get advanced performance analytics
   */
  getAdvancedAnalytics() {
    if (!this.statistics) return null;

    return {
      // Kelly Criterion and advanced metrics
      kellyCriterion: this.statistics.kellyCriterion || 0,
      sortinoRatio: this.statistics.sortinoRatio || 0,
      informationRatio: this.statistics.informationRatio || 0,
      treynorRatio: this.statistics.treynorRatio || 0,
      
      // Statistical measures
      volatility: this.statistics.volatility || 0,
      skewness: this.statistics.skewness || 0,
      kurtosis: this.statistics.kurtosis || 0,
      
      // MFE/MAE
      maxFavorableExcursion: this.statistics.maxFavorableExcursion || 0,
      maxAdverseExcursion: this.statistics.maxAdverseExcursion || 0,
      
      // Portfolio metrics
      portfolioValue: this.statistics.portfolioValue || 0,
      portfolioGrowth: this.statistics.portfolioGrowth || 0,
      
      // Best/worst performance
      bestTradingPair: this.statistics.bestTradingPair,
      worstTradingPair: this.statistics.worstTradingPair,
      bestTradingSetup: this.statistics.bestTradingSetup,
      worstTradingSetup: this.statistics.worstTradingSetup,
      bestTradingDay: this.statistics.bestTradingDay,
      worstTradingDay: this.statistics.worstTradingDay
    };
  }

  /**
   * Get comprehensive risk analysis
   */
  getRiskAnalysis() {
    if (!this.statistics) return null;

    return {
      // Core risk metrics
      maxDrawdown: this.statistics.maxDrawdown || 0,
      currentDrawdown: this.statistics.currentDrawdown || 0,
      maxRiskPerTrade: this.statistics.maxRiskPerTrade || 0,
      avgRiskPerTrade: this.statistics.avgRiskPerTrade || 0,
      valueAtRisk: this.statistics.valueAtRisk || 0,
      
      // Risk-adjusted returns
      sharpeRatio: this.statistics.sharpeRatio || 0,
      sortinoRatio: this.statistics.sortinoRatio || 0,
      calmarRatio: this.statistics.calmarRatio || 0,
      
      // Streak analysis
      maxWinStreak: this.statistics.maxWinStreak || 0,
      maxLossStreak: this.statistics.maxLossStreak || 0,
      currentStreak: this.statistics.currentStreak || 0,
      
      // Recovery metrics
      recoveryFactor: this.statistics.recoveryFactor || 0,
      expectancy: this.statistics.expectancy || 0,
      
      // Behavioral scores
      consistency: this.statistics.consistency || 0,
      discipline: this.statistics.discipline || 0,
      riskManagement: this.statistics.riskManagement || 0
    };
  }

  /**
   * Calculate dynamic account balance based on trading data
   * If no initial balance is found, uses 10000 as default starting balance
   */
  getDynamicAccountBalance() {
    if (!this.trades || this.trades.length === 0) {
      return 10000; // Default starting balance if no trades
    }

    // Get the earliest trade to determine starting point
    const sortedTrades = [...this.trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const closedTrades = sortedTrades.filter(trade => trade.status === 'closed');
    
    if (closedTrades.length === 0) {
      return 10000; // Default if no closed trades
    }

    // Calculate total P&L from all closed trades
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    // If we have portfolio value from statistics, use it
    if (this.statistics && this.statistics.portfolioValue) {
      return this.statistics.portfolioValue;
    }
    
    // Otherwise calculate as starting balance + total P&L
    const startingBalance = 10000; // Could be made configurable
    return startingBalance + totalPnL;
  }

  /**
   * Get trading calendar data
   */
  getCalendarData(year = new Date().getFullYear(), month = new Date().getMonth()) {
    const calendarData = {};
    
    // Get all trades for the specified month
    const monthTrades = this.trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    });

    // Calculate user's historical P&L ranges for normalization
    const allDailyPnL = {};
    this.trades.forEach(trade => {
      const dateKey = new Date(trade.date).toISOString().split('T')[0];
      if (!allDailyPnL[dateKey]) allDailyPnL[dateKey] = 0;
      allDailyPnL[dateKey] += trade.pnl || 0;
    });

    const dailyPnLValues = Object.values(allDailyPnL).filter(pnl => pnl !== 0);
    const maxPnL = dailyPnLValues.length > 0 ? Math.max(...dailyPnLValues) : 100;
    const minPnL = dailyPnLValues.length > 0 ? Math.min(...dailyPnLValues) : -100;
    const avgTradingVolume = dailyPnLValues.length > 0 ? dailyPnLValues.reduce((sum, pnl) => sum + Math.abs(pnl), 0) / dailyPnLValues.length : 50;

    // Group by day
    monthTrades.forEach(trade => {
      const day = new Date(trade.date).getDate();
      if (!calendarData[day]) {
        calendarData[day] = {
          day,
          trades: [],
          totalPnL: 0,
          tradeCount: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          intensity: 0
        };
      }
      
      calendarData[day].trades.push(trade);
      calendarData[day].totalPnL += trade.pnl || 0;
      calendarData[day].tradeCount++;
      
      if (trade.pnl > 0) calendarData[day].wins++;
      else if (trade.pnl < 0) calendarData[day].losses++;
    });

    // Calculate win rates and normalized intensity
    Object.values(calendarData).forEach(dayData => {
      const closedTrades = dayData.wins + dayData.losses;
      dayData.winRate = closedTrades > 0 ? (dayData.wins / closedTrades) * 100 : 0;
      
      // Calculate intensity normalized to user's typical trading patterns
      const pnlIntensity = Math.abs(dayData.totalPnL) / Math.max(avgTradingVolume, 1);
      const volumeIntensity = dayData.tradeCount / Math.max(this.getAverageTradesPerDay(), 1);
      
      // Combine P&L and volume intensity (0-1 scale)
      dayData.intensity = Math.min((pnlIntensity + volumeIntensity) / 2, 1);
      
      // Add performance color coding
      if (dayData.totalPnL > 0) {
        dayData.performanceLevel = 'profit';
        dayData.performanceIntensity = Math.min(dayData.totalPnL / maxPnL, 1);
      } else if (dayData.totalPnL < 0) {
        dayData.performanceLevel = 'loss';
        dayData.performanceIntensity = Math.min(Math.abs(dayData.totalPnL) / Math.abs(minPnL), 1);
      } else {
        dayData.performanceLevel = 'neutral';
        dayData.performanceIntensity = 0;
      }
    });

    return calendarData;
  }

  // Helper method for average trades per day calculation
  getAverageTradesPerDay() {
    if (this.trades.length === 0) return 1;
    
    const tradeDates = [...new Set(this.trades.map(trade => new Date(trade.date).toISOString().split('T')[0]))];
    return this.trades.length / Math.max(tradeDates.length, 1);
  }

  /**
   * Get user's actively traded currency pairs
   */
  getUserTradingPairs() {
    const pairs = [...new Set(this.trades.map(trade => trade.pair))];
    return pairs.length > 0 ? pairs : ['EURUSD', 'GBPUSD', 'USDJPY']; // Default major pairs
  }

  /**
   * Filter economic events by user's trading pairs
   */
  getRelevantMarketEvents(economicEvents = []) {
    const userPairs = this.getUserTradingPairs();
    
    // Extract unique currencies from user's trading pairs
    const userCurrencies = [...new Set(
      userPairs.flatMap(pair => {
        // Handle different pair formats (EURUSD, EUR/USD, etc.)
        const cleanPair = pair.replace('/', '').replace('-', '').replace('_', '');
        if (cleanPair.length >= 6) {
          return [cleanPair.substring(0, 3), cleanPair.substring(3, 6)];
        }
        return [];
      })
    )];

    return economicEvents.filter(event => {
      // Check if event affects any of the user's currencies
      return userCurrencies.some(currency => 
        event.currency === currency || 
        event.currencies?.includes(currency) ||
        event.title?.includes(currency) ||
        event.description?.includes(currency)
      );
    }).map(event => ({
      ...event,
      relevantPairs: userPairs.filter(pair => 
        pair.includes(event.currency) || 
        (event.currencies && event.currencies.some(curr => pair.includes(curr)))
      ),
      impactLevel: this.calculateEventImpact(event, userPairs)
    }));
  }

  /**
   * Calculate how much an economic event might impact user's portfolio
   */
  calculateEventImpact(event, userPairs) {
    let impact = 0;
    
    // Base impact from event importance
    if (event.importance === 'high' || event.impact === 'high') impact += 3;
    else if (event.importance === 'medium' || event.impact === 'medium') impact += 2;
    else impact += 1;
    
    // Increase impact based on how many of user's pairs are affected
    const affectedPairs = userPairs.filter(pair => 
      pair.includes(event.currency) || 
      (event.currencies && event.currencies.some(curr => pair.includes(curr)))
    );
    
    impact += affectedPairs.length;
    
    // Consider recent trading activity in affected pairs
    const recentTrades = this.trades
      .filter(trade => affectedPairs.includes(trade.pair))
      .filter(trade => {
        const tradeDate = new Date(trade.date);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return tradeDate > weekAgo;
      });
    
    if (recentTrades.length > 0) impact += 1;
    
    return Math.min(impact, 5); // Cap at 5
  }

  /**
   * Get paginated trades with advanced filtering
   */
  getPaginatedTrades(page = 1, pageSize = 10, filters = {}) {
    const filteredTrades = this.getFilteredTrades(filters);
    const totalPages = Math.ceil(filteredTrades.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      trades: filteredTrades.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        totalPages,
        totalTrades: filteredTrades.length,
        pageSize,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, filteredTrades.length)
      }
    };
  }

  /**
   * Get import/export analytics
   */
  getImportAnalytics(trades) {
    if (!Array.isArray(trades) || trades.length === 0) {
      return {
        totalTrades: 0,
        validTrades: 0,
        closedTrades: 0,
        openTrades: 0,
        totalPnL: 0,
        pairs: [],
        setups: [],
        dateRange: { from: '', to: '' },
        avgLotSize: 0,
        winRate: 0,
        estimatedWorthScore: 0
      };
    }

    const validTrades = trades.filter(t => t.pair && t.entry && t.lotSize);
    const closedTrades = validTrades.filter(t => t.status === 'closed');
    const openTrades = validTrades.filter(t => t.status === 'open');
    const wins = closedTrades.filter(t => t.pnl > 0);
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
    
    // Quick worth score estimation
    const baseScore = Math.max(0, Math.min(winRate * 4, 400));
    const profitFactor = this.calculateQuickProfitFactor(closedTrades);
    const profitScore = Math.max(0, Math.min(profitFactor * 100, 300));
    const estimatedWorthScore = Math.round(baseScore + profitScore);

    return {
      totalTrades: trades.length,
      validTrades: validTrades.length,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      totalPnL: Math.round(totalPnL * 100) / 100,
      pairs: [...new Set(validTrades.map(t => t.pair))],
      setups: [...new Set(validTrades.map(t => t.setup).filter(Boolean))],
      dateRange: {
        from: validTrades.reduce((min, t) => t.date < min ? t.date : min, validTrades[0]?.date || ''),
        to: validTrades.reduce((max, t) => t.date > max ? t.date : max, validTrades[0]?.date || '')
      },
      avgLotSize: validTrades.length > 0 ? 
        Math.round((validTrades.reduce((sum, t) => sum + (t.lotSize || 0), 0) / validTrades.length) * 100) / 100 : 0,
      winRate: Math.round(winRate * 10) / 10,
      estimatedWorthScore
    };
  }

  /**
   * Quick profit factor calculation for imports
   */
  calculateQuickProfitFactor(closedTrades) {
    const wins = closedTrades.filter(t => t.pnl > 0);
    const losses = closedTrades.filter(t => t.pnl < 0);
    
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    
    return grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
  }

  /**
   * Get radar chart data for behavioral analysis
   */
  getRadarChartData() {
    if (!this.statistics) return null;

    return {
      consistency: this.statistics.consistency || 0,
      discipline: this.statistics.discipline || 0,
      riskManagement: this.statistics.riskManagement || 0,
      performance: Math.min((this.statistics.worthScore || 0) / 10, 100), // Scale to 0-100
      experience: Math.min((this.statistics.totalTrades || 0) * 2, 100), // Scale to 0-100
      profitability: this.statistics.winRate || 0
    };
  }

  /**
   * Get all unique filter options
   */
  getFilterOptions() {
    const pairs = [...new Set(this.trades.map(t => t.pair))].sort();
    const setups = [...new Set(this.trades.map(t => t.setup).filter(Boolean))].sort();
    const years = [...new Set(this.trades.map(t => t.date.substring(0, 4)))].sort().reverse();
    const months = [...new Set(this.trades.map(t => t.date.substring(0, 7)))].sort().reverse();
    
    return { pairs, setups, years, months };
  }

  /**
   * Get trading session analysis (if time data available)
   */
  getTradingSessionAnalysis() {
    const sessions = {
      'Asian': { trades: 0, pnl: 0, winRate: 0, hours: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      'European': { trades: 0, pnl: 0, winRate: 0, hours: [8, 9, 10, 11, 12, 13, 14, 15, 16] },
      'American': { trades: 0, pnl: 0, winRate: 0, hours: [16, 17, 18, 19, 20, 21, 22, 23] }
    };

    this.trades.forEach(trade => {
      const date = new Date(trade.date);
      const hour = date.getHours();
      
      // Determine session (simplified)
      let session = 'Asian';
      if (hour >= 8 && hour < 16) session = 'European';
      else if (hour >= 16 || hour < 8) session = 'American';
      
      sessions[session].trades++;
      sessions[session].pnl += trade.pnl || 0;
    });

    return sessions;
  }

  /**
   * Get comprehensive portfolio metrics
   */
  getPortfolioMetrics(initialBalance = 10000) {
    const currentValue = initialBalance + (this.statistics?.totalPnL || 0);
    const growth = ((currentValue / initialBalance) - 1) * 100;
    
    return {
      initialBalance,
      currentValue: Math.round(currentValue * 100) / 100,
      totalReturn: this.statistics?.totalPnL || 0,
      percentageGrowth: Math.round(growth * 100) / 100,
      annualizedReturn: this.calculateAnnualizedReturn(growth),
      maxPortfolioValue: this.calculateMaxPortfolioValue(initialBalance),
      minPortfolioValue: this.calculateMinPortfolioValue(initialBalance),
      currentDrawdownPercent: this.statistics?.currentDrawdown ? 
        (this.statistics.currentDrawdown / currentValue) * 100 : 0
    };
  }

  /**
   * Calculate annualized return
   */
  calculateAnnualizedReturn(totalGrowthPercent) {
    if (this.trades.length === 0) return 0;
    
    const firstTrade = new Date(this.trades.reduce((earliest, trade) => 
      trade.date < earliest ? trade.date : earliest, this.trades[0].date));
    const lastTrade = new Date(this.trades.reduce((latest, trade) => 
      trade.date > latest ? trade.date : latest, this.trades[0].date));
    
    const yearsDiff = (lastTrade - firstTrade) / (365.25 * 24 * 60 * 60 * 1000);
    
    if (yearsDiff <= 0) return totalGrowthPercent;
    
    const annualized = Math.pow(1 + totalGrowthPercent / 100, 1 / yearsDiff) - 1;
    return Math.round(annualized * 10000) / 100; // Return as percentage
  }

  /**
   * Calculate max portfolio value during trading period
   */
  calculateMaxPortfolioValue(initialBalance) {
    let runningBalance = initialBalance;
    let maxBalance = initialBalance;
    
    const sortedTrades = [...this.trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedTrades.forEach(trade => {
      runningBalance += trade.pnl || 0;
      maxBalance = Math.max(maxBalance, runningBalance);
    });
    
    return Math.round(maxBalance * 100) / 100;
  }

  /**
   * Calculate min portfolio value during trading period
   */
  calculateMinPortfolioValue(initialBalance) {
    let runningBalance = initialBalance;
    let minBalance = initialBalance;
    
    const sortedTrades = [...this.trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedTrades.forEach(trade => {
      runningBalance += trade.pnl || 0;
      minBalance = Math.min(minBalance, runningBalance);
    });
    
    return Math.round(minBalance * 100) / 100;
  }

  /**
   * Export comprehensive data
   */
  exportData() {
    return {
      trades: this.trades,
      statistics: this.statistics,
      chartData: this.getChartData(),
      advancedAnalytics: this.getAdvancedAnalytics(),
      riskAnalysis: this.getRiskAnalysis(),
      portfolioMetrics: this.getPortfolioMetrics(),
      radarData: this.getRadarChartData(),
      exportTimestamp: new Date().toISOString(),
      version: '2.0'
    };
  }

  /**
   * Import comprehensive data
   */
  importData(data, accountBalance = 10000) {
    if (data.trades && Array.isArray(data.trades)) {
      this.setTrades(data.trades, accountBalance);
      
      // If advanced statistics are included, merge them
      if (data.statistics) {
        this.statistics = { ...this.statistics, ...data.statistics };
      }
      
      return true;
    }
    return false;
  }

  /**
   * Clear all data and reset
   */
  clearAll() {
    this.trades = [];
    this.statistics = calculateTradingStatistics([]);
    this.notifySubscribers();
  }

  /**
   * Get comprehensive data summary for debugging
   */
  getDataSummary() {
    return {
      totalTrades: this.trades.length,
      statisticsKeys: this.statistics ? Object.keys(this.statistics).length : 0,
      worthScore: this.statistics?.worthScore || 0,
      winRate: this.statistics?.winRate || 0,
      totalPnL: this.statistics?.totalPnL || 0,
      lastUpdate: new Date(this.lastUpdate).toISOString(),
      dataAge: Date.now() - this.lastUpdate,
      subscriberCount: this.subscribers.size
    };
  }

  /**
   * Get data freshness indicator
   */
  getDataAge() {
    return Date.now() - this.lastUpdate;
  }
}

// Create singleton instance
export const dataManager = new DataManager();

// React hook for using the data manager
export const useDataManager = () => {
  const [data, setData] = React.useState({
    trades: dataManager.getTrades(),
    statistics: dataManager.getStatistics(),
    timestamp: dataManager.lastUpdate
  });

  React.useEffect(() => {
    const unsubscribe = dataManager.subscribe(setData);
    return unsubscribe;
  }, []);

  return {
    trades: data.trades,
    statistics: data.statistics,
    timestamp: data.timestamp,
    // Helper methods
    setTrades: (trades, accountBalance) => dataManager.setTrades(trades, accountBalance),
    addTrade: (trade, accountBalance) => dataManager.addTrade(trade, accountBalance),
    updateTrade: (id, updates, accountBalance) => dataManager.updateTrade(id, updates, accountBalance),
    removeTrade: (id, accountBalance) => dataManager.removeTrade(id, accountBalance),
    getFilteredTrades: (filters) => dataManager.getFilteredTrades(filters),
    getFilterOptions: () => dataManager.getFilterOptions(),
    getTradesForDate: (dateStr) => dataManager.getTradesForDate(dateStr),
    getPnLForDate: (dateStr) => dataManager.getPnLForDate(dateStr),
    getStatistics: () => dataManager.getStatistics(),
    getTimeAnalysis: () => dataManager.getTradingSessionAnalysis(),
    subscribe: (callback) => dataManager.subscribe(callback),
    getChartData: () => dataManager.getChartData(),
    getAdvancedAnalytics: () => dataManager.getAdvancedAnalytics(),
    getRiskAnalysis: () => dataManager.getRiskAnalysis(),
    getPortfolioMetrics: (balance) => dataManager.getPortfolioMetrics(balance),
    getCalendarData: (year, month) => dataManager.getCalendarData(year, month),
    getPaginatedTrades: (page, size, filters) => dataManager.getPaginatedTrades(page, size, filters),
    getImportAnalytics: (trades) => dataManager.getImportAnalytics(trades),
    exportData: () => dataManager.exportData(),
    importData: (data, balance) => dataManager.importData(data, balance),
    clearAll: () => dataManager.clearAll(),
    getDynamicAccountBalance: () => dataManager.getDynamicAccountBalance(),
    getUserTradingPairs: () => dataManager.getUserTradingPairs(),
    getRelevantMarketEvents: (events) => dataManager.getRelevantMarketEvents(events)
  };
};

// Utility functions for components
export const getConsistentStatistics = (trades, accountBalance = 10000) => {
  return calculateTradingStatistics(trades, accountBalance);
};

export const getConsistentWorthScore = (statistics) => {
  if (!statistics) return 0;
  return statistics.worthScore || 0;
};

export default dataManager;