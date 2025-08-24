import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ScatterChart, Scatter, ComposedChart,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, Clock,
  Award, AlertCircle, Activity, BarChart3, Calendar,
  Shield, Percent, ArrowUpDown,
  Calculator, AlertTriangle, CheckCircle, Brain, Zap,
  UserCheck, TrendingDown as Psychology
} from 'lucide-react';

const Analytics = ({ supabase, user }) => {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalTrades: 0,
      winRate: 0,
      totalPnL: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      avgHoldTime: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0
    },
    riskMetrics: {
      winLossRatio: 0,
      averageRisk: 0,
      riskRewardRatio: 0,
      expectancy: 0,
      recoveryFactor: 0,
      calmarRatio: 0,
      sterlingRatio: 0
    },
    timeAnalysis: {
      bestTradingHour: 0,
      worstTradingHour: 0,
      bestTradingDay: '',
      worstTradingDay: '',
      avgTradesByHour: [],
      performanceByDay: [],
      performanceByMonth: []
    },
    pairAnalysis: {
      bestPair: '',
      worstPair: '',
      pairPerformance: [],
      pairDistribution: []
    },
    drawdownAnalysis: {
      currentDrawdown: 0,
      maxDrawdownPeriod: 0,
      drawdownHistory: [],
      recoveryTimes: []
    },
    setupAnalysis: {
      bestSetup: '',
      worstSetup: '',
      setupPerformance: [],
      setupDistribution: []
    },
    behavioralAnalysis: {
      emotionalPatterns: {
        revenge_trading: { score: 0, examples: [], suggestions: [] },
        fear_of_missing_out: { score: 0, examples: [], suggestions: [] },
        overconfidence: { score: 0, examples: [], suggestions: [] },
        loss_aversion: { score: 0, examples: [], suggestions: [] },
        anchoring_bias: { score: 0, examples: [], suggestions: [] }
      },
      tradingBehaviors: {
        consistency: { score: 0, analysis: '', improvements: [] },
        discipline: { score: 0, analysis: '', improvements: [] },
        patience: { score: 0, analysis: '', improvements: [] },
        risk_management: { score: 0, analysis: '', improvements: [] }
      },
      strengths: [],
      weaknesses: [],
      recommendations: [],
      personalityProfile: '',
      worthScore: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, selectedPeriod]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Get all trades for the user (including open trades for some calculations)
      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      // Apply date filter based on selected period
      if (selectedPeriod !== 'all') {
        const days = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365
        };
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days[selectedPeriod]);
        query = query.gte('date', cutoffDate.toISOString().split('T')[0]);
      }

      const { data: trades } = await query;

      if (trades && trades.length > 0) {
        calculateAnalytics(trades);
      } else {
        // Set default values if no trades
        setAnalyticsData({
          overview: {
            totalTrades: 0,
            winRate: 0,
            totalPnL: 0,
            profitFactor: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            avgHoldTime: 0,
            avgWin: 0,
            avgLoss: 0,
            largestWin: 0,
            largestLoss: 0,
            consecutiveWins: 0,
            consecutiveLosses: 0
          },
          riskMetrics: {
            winLossRatio: 0,
            averageRisk: 0,
            riskRewardRatio: 0,
            expectancy: 0,
            recoveryFactor: 0,
            calmarRatio: 0,
            sterlingRatio: 0
          },
          timeAnalysis: {
            bestTradingHour: 0,
            worstTradingHour: 0,
            bestTradingDay: '',
            worstTradingDay: '',
            avgTradesByHour: [],
            performanceByDay: [],
            performanceByMonth: []
          },
          pairAnalysis: {
            bestPair: '',
            worstPair: '',
            pairPerformance: [],
            pairDistribution: []
          },
          drawdownAnalysis: {
            currentDrawdown: 0,
            maxDrawdownPeriod: 0,
            drawdownHistory: [],
            recoveryTimes: []
          },
          setupAnalysis: {
            bestSetup: '',
            worstSetup: '',
            setupPerformance: [],
            setupDistribution: []
          },
          behavioralAnalysis: {
            emotionalPatterns: {
              revenge_trading: { score: 0, examples: [], suggestions: [] },
              fear_of_missing_out: { score: 0, examples: [], suggestions: [] },
              overconfidence: { score: 0, examples: [], suggestions: [] },
              loss_aversion: { score: 0, examples: [], suggestions: [] },
              anchoring_bias: { score: 0, examples: [], suggestions: [] }
            },
            tradingBehaviors: {
              consistency: { score: 0, analysis: '', improvements: [] },
              discipline: { score: 0, analysis: '', improvements: [] },
              patience: { score: 0, analysis: '', improvements: [] },
              risk_management: { score: 0, analysis: '', improvements: [] }
            },
            strengths: [],
            weaknesses: [],
            recommendations: [],
            personalityProfile: 'No trading data available yet',
            worthScore: 0
          }
        });
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
    setLoading(false);
  };

  const calculateAnalytics = (trades) => {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);

    // Basic Overview Metrics
    const overview = {
      totalTrades: trades.length,
      winRate: (winningTrades.length / trades.length) * 100,
      totalPnL: totalPnL,
      profitFactor: calculateProfitFactor(winningTrades, losingTrades),
      sharpeRatio: calculateSharpeRatio(trades),
      maxDrawdown: calculateMaxDrawdown(trades),
      avgHoldTime: trades.reduce((sum, t) => sum + (t.hold_time_minutes || 0), 0) / trades.length,
      avgWin: winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades.map(t => t.pnl))) : 0,
      consecutiveWins: calculateMaxConsecutive(trades, 'win'),
      consecutiveLosses: calculateMaxConsecutive(trades, 'loss')
    };

    // Risk Metrics
    const riskMetrics = {
      winLossRatio: overview.avgLoss > 0 ? overview.avgWin / overview.avgLoss : 0,
      averageRisk: calculateAverageRisk(trades),
      riskRewardRatio: trades.reduce((sum, t) => sum + (t.rr || 0), 0) / trades.length,
      expectancy: calculateExpectancy(winningTrades, losingTrades),
      recoveryFactor: overview.maxDrawdown > 0 ? totalPnL / overview.maxDrawdown : 0,
      calmarRatio: calculateCalmarRatio(totalPnL, overview.maxDrawdown),
      sterlingRatio: calculateSterlingRatio(totalPnL, overview.maxDrawdown)
    };

    // Time Analysis
    const timeAnalysis = calculateTimeAnalysis(trades);

    // Pair Analysis
    const pairAnalysis = calculatePairAnalysis(trades);

    // Drawdown Analysis
    const drawdownAnalysis = calculateDrawdownAnalysis(trades);

    // Setup Analysis
    const setupAnalysis = calculateSetupAnalysis(trades);

    // Behavioral Analysis
    const behavioralAnalysis = calculateBehavioralAnalysis(trades, overview, riskMetrics);

    setAnalyticsData({
      overview,
      riskMetrics,
      timeAnalysis,
      pairAnalysis,
      drawdownAnalysis,
      setupAnalysis,
      behavioralAnalysis
    });
  };

  const calculateProfitFactor = (winningTrades, losingTrades) => {
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    return grossLoss > 0 ? grossProfit / grossLoss : 0;
  };

  const calculateSharpeRatio = (trades) => {
    if (trades.length < 2) return 0;
    const returns = trades.map(t => (t.pnl_percentage || 0) / 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
    );
    return stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
  };

  const calculateMaxDrawdown = (trades) => {
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;

    trades.forEach(trade => {
      runningPnL += trade.pnl;
      if (runningPnL > peak) {
        peak = runningPnL;
      }
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return maxDrawdown;
  };

  const calculateMaxConsecutive = (trades, type) => {
    let maxCount = 0;
    let currentCount = 0;

    trades.forEach(trade => {
      const isWin = trade.pnl > 0;
      const isTargetType = (type === 'win' && isWin) || (type === 'loss' && !isWin);

      if (isTargetType) {
        currentCount++;
        maxCount = Math.max(maxCount, currentCount);
      } else {
        currentCount = 0;
      }
    });

    return maxCount;
  };

  const calculateAverageRisk = (trades) => {
    const risksPerTrade = trades.map(trade => {
      if (trade.entry && trade.stop_loss && trade.lot_size) {
        const riskPerLot = Math.abs(trade.entry - trade.stop_loss) * 100000; // Convert to pips
        return riskPerLot * trade.lot_size;
      }
      return 0;
    });
    return risksPerTrade.reduce((sum, risk) => sum + risk, 0) / trades.length;
  };

  const calculateExpectancy = (winningTrades, losingTrades) => {
    const totalTrades = winningTrades.length + losingTrades.length;
    if (totalTrades === 0) return 0;

    const winRate = winningTrades.length / totalTrades;
    const lossRate = losingTrades.length / totalTrades;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0;

    return (winRate * avgWin) + (lossRate * avgLoss);
  };

  const calculateCalmarRatio = (totalReturn, maxDrawdown) => {
    const annualizedReturn = totalReturn; // Simplified - should be annualized
    return maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;
  };

  const calculateSterlingRatio = (totalReturn, maxDrawdown) => {
    // Sterling ratio uses 10% minimum drawdown
    const adjustedDrawdown = Math.max(maxDrawdown, totalReturn * 0.1);
    return adjustedDrawdown > 0 ? totalReturn / adjustedDrawdown : 0;
  };

  const calculateTimeAnalysis = (trades) => {
    // Group trades by hour, day of week, and month
    const hourlyPerformance = {};
    const dailyPerformance = {};
    const monthlyPerformance = {};

    trades.forEach(trade => {
      const date = new Date(trade.date);
      const hour = trade.entry_time ? new Date(`1970-01-01T${trade.entry_time}`).getHours() : 12;
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const month = date.toLocaleDateString('en-US', { month: 'long' });

      // Hourly
      if (!hourlyPerformance[hour]) hourlyPerformance[hour] = { pnl: 0, trades: 0 };
      hourlyPerformance[hour].pnl += trade.pnl;
      hourlyPerformance[hour].trades += 1;

      // Daily
      if (!dailyPerformance[dayOfWeek]) dailyPerformance[dayOfWeek] = { pnl: 0, trades: 0 };
      dailyPerformance[dayOfWeek].pnl += trade.pnl;
      dailyPerformance[dayOfWeek].trades += 1;

      // Monthly
      if (!monthlyPerformance[month]) monthlyPerformance[month] = { pnl: 0, trades: 0 };
      monthlyPerformance[month].pnl += trade.pnl;
      monthlyPerformance[month].trades += 1;
    });

    // Find best and worst hours/days
    const hourEntries = Object.entries(hourlyPerformance);
    const bestHour = hourEntries.reduce((best, [hour, data]) => 
      data.pnl > (best[1]?.pnl || -Infinity) ? [hour, data] : best, [0, { pnl: -Infinity }])[0];
    const worstHour = hourEntries.reduce((worst, [hour, data]) => 
      data.pnl < (worst[1]?.pnl || Infinity) ? [hour, data] : worst, [0, { pnl: Infinity }])[0];

    const dayEntries = Object.entries(dailyPerformance);
    const bestDay = dayEntries.reduce((best, [day, data]) => 
      data.pnl > (best[1]?.pnl || -Infinity) ? [day, data] : best, ['', { pnl: -Infinity }])[0];
    const worstDay = dayEntries.reduce((worst, [day, data]) => 
      data.pnl < (worst[1]?.pnl || Infinity) ? [day, data] : worst, ['', { pnl: Infinity }])[0];

    return {
      bestTradingHour: parseInt(bestHour),
      worstTradingHour: parseInt(worstHour),
      bestTradingDay: bestDay,
      worstTradingDay: worstDay,
      avgTradesByHour: Object.entries(hourlyPerformance).map(([hour, data]) => ({
        hour: parseInt(hour),
        trades: data.trades,
        pnl: data.pnl
      })),
      performanceByDay: Object.entries(dailyPerformance).map(([day, data]) => ({
        day,
        trades: data.trades,
        pnl: data.pnl
      })),
      performanceByMonth: Object.entries(monthlyPerformance).map(([month, data]) => ({
        month,
        trades: data.trades,
        pnl: data.pnl
      }))
    };
  };

  const calculatePairAnalysis = (trades) => {
    const pairPerformance = {};
    
    trades.forEach(trade => {
      if (!pairPerformance[trade.pair]) {
        pairPerformance[trade.pair] = { pnl: 0, trades: 0, wins: 0 };
      }
      pairPerformance[trade.pair].pnl += trade.pnl;
      pairPerformance[trade.pair].trades += 1;
      if (trade.pnl > 0) pairPerformance[trade.pair].wins += 1;
    });

    const pairEntries = Object.entries(pairPerformance);
    const bestPair = pairEntries.reduce((best, [pair, data]) => 
      data.pnl > (best[1]?.pnl || -Infinity) ? [pair, data] : best, ['', { pnl: -Infinity }])[0];
    const worstPair = pairEntries.reduce((worst, [pair, data]) => 
      data.pnl < (worst[1]?.pnl || Infinity) ? [pair, data] : worst, ['', { pnl: Infinity }])[0];

    return {
      bestPair,
      worstPair,
      pairPerformance: pairEntries.map(([pair, data]) => ({
        pair,
        pnl: data.pnl,
        trades: data.trades,
        winRate: (data.wins / data.trades) * 100
      })),
      pairDistribution: pairEntries.map(([pair, data]) => ({
        name: pair,
        value: data.trades
      }))
    };
  };

  const calculateDrawdownAnalysis = (trades) => {
    let runningPnL = 0;
    let peak = 0;
    let drawdownHistory = [];
    let currentDrawdownStart = null;
    let recoveryTimes = [];

    trades.forEach((trade, index) => {
      runningPnL += trade.pnl;
      
      if (runningPnL > peak) {
        // New peak reached
        if (currentDrawdownStart !== null) {
          // End of drawdown period
          const recoveryTime = index - currentDrawdownStart;
          recoveryTimes.push(recoveryTime);
          currentDrawdownStart = null;
        }
        peak = runningPnL;
      }
      
      const drawdown = peak - runningPnL;
      if (drawdown > 0 && currentDrawdownStart === null) {
        currentDrawdownStart = index;
      }

      drawdownHistory.push({
        date: trade.date,
        drawdown: drawdown,
        equity: runningPnL
      });
    });

    return {
      currentDrawdown: peak - runningPnL,
      maxDrawdownPeriod: Math.max(...recoveryTimes, 0),
      drawdownHistory,
      recoveryTimes
    };
  };

  const calculateSetupAnalysis = (trades) => {
    const setupPerformance = {};
    
    trades.forEach(trade => {
      const setup = trade.setup || 'Unknown';
      if (!setupPerformance[setup]) {
        setupPerformance[setup] = { pnl: 0, trades: 0, wins: 0 };
      }
      setupPerformance[setup].pnl += trade.pnl;
      setupPerformance[setup].trades += 1;
      if (trade.pnl > 0) setupPerformance[setup].wins += 1;
    });

    const setupEntries = Object.entries(setupPerformance);
    const bestSetup = setupEntries.reduce((best, [setup, data]) => 
      data.pnl > (best[1]?.pnl || -Infinity) ? [setup, data] : best, ['', { pnl: -Infinity }])[0];
    const worstSetup = setupEntries.reduce((worst, [setup, data]) => 
      data.pnl < (worst[1]?.pnl || Infinity) ? [setup, data] : worst, ['', { pnl: Infinity }])[0];

    return {
      bestSetup,
      worstSetup,
      setupPerformance: setupEntries.map(([setup, data]) => ({
        setup,
        pnl: data.pnl,
        trades: data.trades,
        winRate: (data.wins / data.trades) * 100
      })),
      setupDistribution: setupEntries.map(([setup, data]) => ({
        name: setup,
        value: data.trades
      }))
    };
  };

  const calculateBehavioralAnalysis = (trades, overview, riskMetrics) => {
    // Analyze emotional patterns and trading psychology
    const emotionalPatterns = {
      revenge_trading: analyzeRevengeTradingPattern(trades),
      fear_of_missing_out: analyzeFOMOPattern(trades),
      overconfidence: analyzeOverconfidencePattern(trades, overview),
      loss_aversion: analyzeLossAversionPattern(trades),
      anchoring_bias: analyzeAnchoringBias(trades)
    };

    // Analyze trading behaviors
    const tradingBehaviors = {
      consistency: analyzeConsistency(trades, overview),
      discipline: analyzeDiscipline(trades),
      patience: analyzePatience(trades),
      risk_management: analyzeRiskManagement(trades, riskMetrics)
    };

    // Generate strengths, weaknesses, and recommendations
    const { strengths, weaknesses, recommendations } = generatePsychologicalInsights(
      emotionalPatterns, tradingBehaviors, overview, riskMetrics
    );

    // Calculate personality profile
    const personalityProfile = calculatePersonalityProfile(emotionalPatterns, tradingBehaviors);

    // Calculate enhanced worth score
    const worthScore = calculateBehavioralWorthScore(overview, riskMetrics, emotionalPatterns, tradingBehaviors);

    return {
      emotionalPatterns,
      tradingBehaviors,
      strengths,
      weaknesses,
      recommendations,
      personalityProfile,
      worthScore
    };
  };

  // Behavioral Pattern Analysis Functions
  const analyzeRevengeTradingPattern = (trades) => {
    const patterns = [];
    let score = 0;

    for (let i = 1; i < trades.length; i++) {
      const prevTrade = trades[i - 1];
      const currentTrade = trades[i];
      
      // Check for revenge trading after loss
      if (prevTrade.pnl < 0 && currentTrade.lot_size > (prevTrade.lot_size * 1.5)) {
        patterns.push(`${currentTrade.date}: Increased position size ${((currentTrade.lot_size / prevTrade.lot_size - 1) * 100).toFixed(0)}% after loss`);
        score += 15;
      }
      
      // Same-day trading after loss
      if (prevTrade.pnl < 0 && prevTrade.date === currentTrade.date) {
        patterns.push(`${currentTrade.date}: Multiple trades on same day after loss`);
        score += 10;
      }
    }

    const suggestions = score > 30 ? [
      'Implement mandatory cooling-off periods after losses',
      'Set strict daily position size limits',
      'Use a trading journal to track emotional state before trades'
    ] : score > 15 ? [
      'Consider waiting periods between trades after losses',
      'Review position sizing rules'
    ] : ['Good emotional control - maintain current discipline'];

    return { score, examples: patterns.slice(0, 5), suggestions };
  };

  const analyzeFOMOPattern = (trades) => {
    let score = 0;
    const patterns = [];
    
    // Analyze for quick entries without proper setup
    trades.forEach(trade => {
      if (trade.setup === 'Other' || trade.setup === 'News Trading') {
        patterns.push(`${trade.date}: Possible FOMO trade - ${trade.setup}`);
        score += 8;
      }
    });

    const suggestions = score > 25 ? [
      'Always wait for your proven setups',
      'Create a pre-trade checklist and stick to it',
      'Turn off social media during trading hours'
    ] : ['Good setup discipline - continue following your plan'];

    return { score, examples: patterns.slice(0, 5), suggestions };
  };

  const analyzeOverconfidencePattern = (trades, overview) => {
    let score = 0;
    const patterns = [];

    if (overview.winRate > 70 && overview.totalTrades > 10) {
      // Check for increasing position sizes during winning streaks
      let winStreak = 0;
      for (let i = 0; i < trades.length; i++) {
        if (trades[i].pnl > 0) {
          winStreak++;
          if (winStreak > 3 && i < trades.length - 1) {
            const nextTrade = trades[i + 1];
            if (nextTrade.lot_size > trades[i].lot_size * 1.2) {
              patterns.push(`After ${winStreak} wins: Increased position size by ${((nextTrade.lot_size / trades[i].lot_size - 1) * 100).toFixed(0)}%`);
              score += 12;
            }
          }
        } else {
          winStreak = 0;
        }
      }
    }

    const suggestions = score > 20 ? [
      'Maintain consistent position sizing regardless of recent performance',
      'Review trades monthly to stay humble',
      'Remember that past performance doesn\'t guarantee future results'
    ] : ['Good emotional consistency'];

    return { score, examples: patterns.slice(0, 5), suggestions };
  };

  const analyzeLossAversionPattern = (trades) => {
    let score = 0;
    const patterns = [];

    trades.forEach(trade => {
      const riskReward = Math.abs((trade.take_profit - trade.entry) / (trade.entry - trade.stop_loss));
      if (riskReward < 1) {
        patterns.push(`${trade.date}: Poor R:R ratio (1:${riskReward.toFixed(2)}) - possible fear of larger stop losses`);
        score += 5;
      }
    });

    const suggestions = score > 15 ? [
      'Focus on trades with minimum 1:2 risk/reward ratio',
      'Accept that proper stop losses are essential for long-term success',
      'Backtest strategies to build confidence in wider stops'
    ] : ['Good risk/reward discipline'];

    return { score, examples: patterns.slice(0, 5), suggestions };
  };

  const analyzeAnchoringBias = (trades) => {
    let score = 0;
    const patterns = [];
    
    // This would require more complex analysis of entry points vs market levels
    // For now, simplified version
    const avgEntry = trades.reduce((sum, t) => sum + t.entry, 0) / trades.length;
    const entryVariance = trades.reduce((sum, t) => sum + Math.pow(t.entry - avgEntry, 2), 0) / trades.length;
    
    if (entryVariance < avgEntry * 0.01) {
      patterns.push('Entries seem clustered around similar price levels');
      score += 10;
    }

    const suggestions = score > 15 ? [
      'Analyze multiple timeframes before entry',
      'Focus on price action rather than round numbers',
      'Use dynamic support/resistance levels'
    ] : ['Good entry point diversity'];

    return { score, examples: patterns.slice(0, 3), suggestions };
  };

  const analyzeConsistency = (trades, overview) => {
    const monthlyPnL = {};
    trades.forEach(trade => {
      const month = trade.date.substring(0, 7);
      monthlyPnL[month] = (monthlyPnL[month] || 0) + trade.pnl;
    });
    
    const monthlyResults = Object.values(monthlyPnL);
    const avgMonthly = monthlyResults.reduce((sum, pnl) => sum + pnl, 0) / monthlyResults.length;
    const variance = monthlyResults.reduce((sum, pnl) => sum + Math.pow(pnl - avgMonthly, 2), 0) / monthlyResults.length;
    const consistency = Math.max(0, 100 - (Math.sqrt(variance) / Math.abs(avgMonthly)) * 20);

    return {
      score: Math.round(consistency),
      analysis: consistency > 70 ? 'Excellent consistency in monthly performance' :
                consistency > 50 ? 'Good consistency with room for improvement' :
                'High volatility in monthly results - focus on risk management',
      improvements: consistency < 60 ? [
        'Implement stricter position sizing rules',
        'Review and refine your trading plan',
        'Focus on quality over quantity of trades'
      ] : ['Maintain current approach']
    };
  };

  const analyzeDiscipline = (trades) => {
    let disciplineScore = 100;
    const issues = [];
    
    trades.forEach(trade => {
      // Check if stop loss was moved (would need trade updates to detect)
      if (!trade.stop_loss || trade.stop_loss === 0) {
        disciplineScore -= 5;
        issues.push(`${trade.date}: No stop loss set`);
      }
    });

    return {
      score: Math.max(0, disciplineScore),
      analysis: disciplineScore > 80 ? 'Excellent trade discipline' :
                disciplineScore > 60 ? 'Good discipline with minor issues' :
                'Discipline needs improvement',
      improvements: disciplineScore < 70 ? [
        'Always set stop losses before entering trades',
        'Never move stop losses against you',
        'Follow your trading plan exactly'
      ] : ['Continue current discipline']
    };
  };

  const analyzePatience = (trades) => {
    const avgHoldTime = trades.reduce((sum, t) => sum + (t.hold_time_minutes || 60), 0) / trades.length;
    const patienceScore = Math.min(100, (avgHoldTime / 240) * 100); // 4 hours = 100%
    
    return {
      score: Math.round(patienceScore),
      analysis: patienceScore > 70 ? 'Excellent patience - letting trades develop' :
                patienceScore > 40 ? 'Moderate patience - could hold longer' :
                'Scalping style or impatient exits',
      improvements: patienceScore < 50 ? [
        'Focus on higher timeframe analysis',
        'Set longer-term targets',
        'Use alerts instead of watching charts constantly'
      ] : ['Good patience levels']
    };
  };

  const analyzeRiskManagement = (trades, riskMetrics) => {
    const riskScore = Math.min(100, (riskMetrics.recoveryFactor || 1) * 25);
    
    return {
      score: Math.round(riskScore),
      analysis: riskScore > 70 ? 'Excellent risk management' :
                riskScore > 50 ? 'Good risk control with room for improvement' :
                'Risk management needs significant improvement',
      improvements: riskScore < 60 ? [
        'Reduce position sizes',
        'Implement strict daily loss limits',
        'Focus on capital preservation over profits'
      ] : ['Maintain current risk controls']
    };
  };

  const generatePsychologicalInsights = (emotionalPatterns, tradingBehaviors, overview, riskMetrics) => {
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    // Analyze strengths
    if (tradingBehaviors.discipline.score > 80) strengths.push('Excellent trade discipline');
    if (tradingBehaviors.consistency.score > 70) strengths.push('Consistent performance');
    if (tradingBehaviors.patience.score > 70) strengths.push('Patient trade execution');
    if (emotionalPatterns.revenge_trading.score < 20) strengths.push('Good emotional control after losses');

    // Analyze weaknesses
    if (emotionalPatterns.revenge_trading.score > 30) weaknesses.push('Tendency toward revenge trading');
    if (emotionalPatterns.fear_of_missing_out.score > 25) weaknesses.push('FOMO-driven entries');
    if (tradingBehaviors.consistency.score < 50) weaknesses.push('Inconsistent monthly results');
    if (emotionalPatterns.loss_aversion.score > 20) weaknesses.push('Risk-averse position sizing');

    // Generate recommendations
    if (overview.winRate < 50) {
      recommendations.push('Focus on strategy refinement - win rate needs improvement');
    }
    if (riskMetrics.recoveryFactor < 2) {
      recommendations.push('Implement stricter risk management - recovery factor is low');
    }
    if (emotionalPatterns.revenge_trading.score > 20) {
      recommendations.push('Create specific rules for trading after losses');
    }

    return { strengths, weaknesses, recommendations };
  };

  const calculatePersonalityProfile = (emotionalPatterns, tradingBehaviors) => {
    const disciplineScore = tradingBehaviors.discipline.score;
    const patienceScore = tradingBehaviors.patience.score;
    const emotionalScore = 100 - (emotionalPatterns.revenge_trading.score + emotionalPatterns.fear_of_missing_out.score) / 2;

    if (disciplineScore > 80 && patienceScore > 70 && emotionalScore > 70) {
      return 'Systematic Trader - You follow rules consistently and manage emotions well';
    } else if (patienceScore < 40 && disciplineScore > 60) {
      return 'Scalper Profile - Quick decisions with good discipline';
    } else if (emotionalScore < 50) {
      return 'Emotional Trader - Decisions influenced by recent results';
    } else if (disciplineScore < 50) {
      return 'Discretionary Trader - Flexible but needs more structure';
    } else {
      return 'Developing Trader - Building consistency and emotional control';
    }
  };

  const calculateBehavioralWorthScore = (overview, riskMetrics, emotionalPatterns, tradingBehaviors) => {
    const baseScore = Math.max(0, Math.min(overview.winRate * 4, 400));
    const profitScore = Math.max(0, Math.min((riskMetrics.profitFactor || 1) * 100, 300));
    const emotionalScore = Math.max(0, 200 - (emotionalPatterns.revenge_trading.score + emotionalPatterns.fear_of_missing_out.score) / 2);
    const behaviorScore = (tradingBehaviors.discipline.score + tradingBehaviors.consistency.score) / 2;
    
    return Math.round(baseScore + profitScore + emotionalScore + behaviorScore);
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-full`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );

  const TabButton = ({ id, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Trades"
          value={analyticsData.overview.totalTrades}
          icon={Activity}
          color="blue"
        />
        <MetricCard
          title="Win Rate"
          value={`${analyticsData.overview.winRate.toFixed(1)}%`}
          subtitle={`${analyticsData.overview.totalTrades > 0 ? 
            Math.round((analyticsData.overview.totalTrades * analyticsData.overview.winRate / 100)) : 0} winners`}
          icon={Target}
          color="green"
        />
        <MetricCard
          title="Profit Factor"
          value={analyticsData.overview.profitFactor.toFixed(2)}
          subtitle={analyticsData.overview.profitFactor > 1 ? "Profitable" : "Needs Improvement"}
          icon={Calculator}
          color={analyticsData.overview.profitFactor > 1 ? "green" : "red"}
        />
        <MetricCard
          title="Sharpe Ratio"
          value={analyticsData.overview.sharpeRatio.toFixed(2)}
          subtitle={analyticsData.overview.sharpeRatio > 1 ? "Good" : "Poor"}
          icon={TrendingUp}
          color={analyticsData.overview.sharpeRatio > 1 ? "green" : "orange"}
        />
      </div>

      {/* PnL and Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total P&L"
          value={`$${analyticsData.overview.totalPnL.toLocaleString()}`}
          icon={DollarSign}
          color={analyticsData.overview.totalPnL >= 0 ? "green" : "red"}
        />
        <MetricCard
          title="Max Drawdown"
          value={`$${analyticsData.overview.maxDrawdown.toLocaleString()}`}
          icon={TrendingDown}
          color="red"
        />
        <MetricCard
          title="Average Hold Time"
          value={`${(analyticsData.overview.avgHoldTime / 60).toFixed(1)}h`}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Win/Loss Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Win/Loss Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Win:</span>
              <span className="font-semibold text-green-600">
                ${analyticsData.overview.avgWin.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Loss:</span>
              <span className="font-semibold text-red-600">
                ${analyticsData.overview.avgLoss.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Largest Win:</span>
              <span className="font-semibold text-green-600">
                ${analyticsData.overview.largestWin.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Largest Loss:</span>
              <span className="font-semibold text-red-600">
                ${analyticsData.overview.largestLoss.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Consecutive Trades</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Max Consecutive Wins:</span>
              <span className="font-semibold text-green-600">
                {analyticsData.overview.consecutiveWins}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Max Consecutive Losses:</span>
              <span className="font-semibold text-red-600">
                {analyticsData.overview.consecutiveLosses}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRiskTab = () => (
    <div className="space-y-6">
      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Win/Loss Ratio"
          value={analyticsData.riskMetrics.winLossRatio.toFixed(2)}
          icon={ArrowUpDown}
          color="blue"
        />
        <MetricCard
          title="Risk/Reward Ratio"
          value={analyticsData.riskMetrics.riskRewardRatio.toFixed(2)}
          icon={Shield}
          color="green"
        />
        <MetricCard
          title="Expectancy"
          value={`$${analyticsData.riskMetrics.expectancy.toFixed(2)}`}
          icon={Calculator}
          color={analyticsData.riskMetrics.expectancy > 0 ? "green" : "red"}
        />
        <MetricCard
          title="Recovery Factor"
          value={analyticsData.riskMetrics.recoveryFactor.toFixed(2)}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Advanced Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Risk Ratios</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Calmar Ratio:</span>
              <span className="font-semibold">{analyticsData.riskMetrics.calmarRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sterling Ratio:</span>
              <span className="font-semibold">{analyticsData.riskMetrics.sterlingRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Risk per Trade:</span>
              <span className="font-semibold">${analyticsData.riskMetrics.averageRisk.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Drawdown Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Drawdown History</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={analyticsData.drawdownAnalysis.drawdownHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Drawdown']} />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderTimeAnalysisTab = () => (
    <div className="space-y-6">
      {/* Time Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Best Trading Hour"
          value={`${analyticsData.timeAnalysis.bestTradingHour}:00`}
          icon={Clock}
          color="green"
        />
        <MetricCard
          title="Worst Trading Hour"
          value={`${analyticsData.timeAnalysis.worstTradingHour}:00`}
          icon={Clock}
          color="red"
        />
        <MetricCard
          title="Best Trading Day"
          value={analyticsData.timeAnalysis.bestTradingDay}
          icon={Calendar}
          color="green"
        />
        <MetricCard
          title="Worst Trading Day"
          value={analyticsData.timeAnalysis.worstTradingDay}
          icon={Calendar}
          color="red"
        />
      </div>

      {/* Hourly Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Hour</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.timeAnalysis.avgTradesByHour}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'pnl' ? `$${value.toFixed(2)}` : value,
                name === 'pnl' ? 'P&L' : 'Trades'
              ]}
            />
            <Bar dataKey="pnl" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Day of Week</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.timeAnalysis.performanceByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'pnl' ? `$${value.toFixed(2)}` : value,
                name === 'pnl' ? 'P&L' : 'Trades'
              ]}
            />
            <Bar dataKey="pnl" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPairAnalysisTab = () => (
    <div className="space-y-6">
      {/* Pair Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Best Performing Pair"
          value={analyticsData.pairAnalysis.bestPair}
          icon={Award}
          color="green"
        />
        <MetricCard
          title="Worst Performing Pair"
          value={analyticsData.pairAnalysis.worstPair}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Pair Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">P&L by Currency Pair</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.pairAnalysis.pairPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pair" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'P&L']} />
              <Bar dataKey="pnl" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade Distribution by Pair</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.pairAnalysis.pairDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {analyticsData.pairAnalysis.pairDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Pair Performance Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Pair Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trades</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.pairAnalysis.pairPerformance.map((pair, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pair.pair}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pair.trades}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    pair.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${pair.pnl.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pair.winRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSetupAnalysisTab = () => (
    <div className="space-y-6">
      {/* Setup Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Best Setup"
          value={analyticsData.setupAnalysis.bestSetup}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          title="Worst Setup"
          value={analyticsData.setupAnalysis.worstSetup}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Setup Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">P&L by Setup Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.setupAnalysis.setupPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="setup" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'P&L']} />
              <Bar dataKey="pnl" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.setupAnalysis.setupDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {analyticsData.setupAnalysis.setupDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 60%)`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Setup Performance Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Setup Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setup</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trades</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.setupAnalysis.setupPerformance.map((setup, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {setup.setup}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {setup.trades}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    setup.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${setup.pnl.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {setup.winRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBehavioralTab = () => (
    <div className="space-y-6">
      {/* Psychology Profile */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Brain className="w-6 h-6 text-purple-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Trading Psychology Profile</h2>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6">
          <p className="text-lg text-gray-800 font-medium">
            {analyticsData.behavioralAnalysis.personalityProfile}
          </p>
        </div>
        
        {/* Enhanced Worth Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-6 text-center">
            <Award className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">{analyticsData.behavioralAnalysis.worthScore}</div>
            <div className="text-sm opacity-90">Enhanced Worth Score</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Strengths</h4>
            <ul className="text-sm text-green-700 space-y-1">
              {analyticsData.behavioralAnalysis.strengths.map((strength, index) => (
                <li key={index}>• {strength}</li>
              ))}
            </ul>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">Areas to Improve</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              {analyticsData.behavioralAnalysis.weaknesses.map((weakness, index) => (
                <li key={index}>• {weakness}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Emotional Patterns Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotional Pattern Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(analyticsData.behavioralAnalysis.emotionalPatterns).map(([pattern, data]) => (
            <div key={pattern} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 capitalize">
                  {pattern.replace('_', ' ')}
                </h4>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                  data.score > 30 ? 'bg-red-500' : data.score > 15 ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  {data.score}
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-2">
                {data.examples.length > 0 ? `${data.examples.length} examples found` : 'No patterns detected'}
              </div>
              <div className="text-xs space-y-1">
                {data.suggestions.map((suggestion, index) => (
                  <p key={index} className="text-gray-700">💡 {suggestion}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Behavior Scores */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Behavior Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(analyticsData.behavioralAnalysis.tradingBehaviors).map(([behavior, data]) => (
            <div key={behavior} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 capitalize">
                  {behavior.replace('_', ' ')}
                </h4>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    data.score > 80 ? 'bg-green-500' : 
                    data.score > 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="font-bold text-lg">{data.score}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{data.analysis}</p>
              <div className="space-y-1">
                {data.improvements.map((improvement, index) => (
                  <p key={index} className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                    📈 {improvement}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actionable Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analyticsData.behavioralAnalysis.recommendations.map((recommendation, index) => (
            <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <p className="text-blue-800 font-medium text-sm">{recommendation}</p>
                  <button className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline">
                    Add to Trading Goals →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {analyticsData.behavioralAnalysis.recommendations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Great job! No immediate behavioral improvements needed.</p>
            <p className="text-sm">Continue following your current trading plan.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Trading Analytics</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1">
          <TabButton
            id="overview"
            label="Overview"
            active={activeTab === 'overview'}
            onClick={setActiveTab}
          />
          <TabButton
            id="risk"
            label="Risk Analysis"
            active={activeTab === 'risk'}
            onClick={setActiveTab}
          />
          <TabButton
            id="time"
            label="Time Analysis"
            active={activeTab === 'time'}
            onClick={setActiveTab}
          />
          <TabButton
            id="pairs"
            label="Pair Analysis"
            active={activeTab === 'pairs'}
            onClick={setActiveTab}
          />
          <TabButton
            id="setups"
            label="Setup Analysis"
            active={activeTab === 'setups'}
            onClick={setActiveTab}
          />
          <TabButton
            id="behavioral"
            label="Psychology"
            active={activeTab === 'behavioral'}
            onClick={setActiveTab}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-screen">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'risk' && renderRiskTab()}
        {activeTab === 'time' && renderTimeAnalysisTab()}
        {activeTab === 'pairs' && renderPairAnalysisTab()}
        {activeTab === 'setups' && renderSetupAnalysisTab()}
        {activeTab === 'behavioral' && renderBehavioralTab()}
      </div>
    </div>
  );
};

export default Analytics;