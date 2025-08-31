import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ScatterChart, Scatter, ComposedChart,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, Clock,
  Award, AlertCircle, Activity, BarChart3, Calendar,
  Shield, Percent, ArrowUpDown,
  Calculator, AlertTriangle, CheckCircle, Brain, Zap,
  UserCheck, Settings
} from 'lucide-react';
import { useDataManager } from '../utils/core/dataManager';

// Simple Button component
const Button = ({ children, onClick, variant = 'default', size = 'md', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500'
  };
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Glassmorphic Card Component
const GlassCard = ({ children, className = "", hover = true }) => (
  <div className={`relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden ${
    hover ? 'group hover:scale-[1.02] transition-all duration-300' : ''
  } ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-cyan-500/5"></div>
    <div className="relative">{children}</div>
  </div>
);

const Analytics = ({ supabase, user }) => {
  const dataManager = useDataManager();
  const [profileMetrics, setProfileMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [activeTab, setActiveTab] = useState('performance');

  // Animation state from localStorage
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    return localStorage.getItem('animationsEnabled') !== 'false';
  });

  // Listen for animation toggle changes
  useEffect(() => {
    const handleAnimationToggle = (e) => {
      setAnimationsEnabled(e.detail);
    };
    window.addEventListener('animationToggle', handleAnimationToggle);
    return () => window.removeEventListener('animationToggle', handleAnimationToggle);
  }, []);

  // Animation class helper
  const getAnimationClass = (baseClass = '') => {
    return animationsEnabled 
      ? `${baseClass} group hover:scale-[1.02] transition-all duration-300`
      : baseClass;
  };

  // Calculate 6-factor Worth Score using REAL DATA from centralized dataManager
  const calculateWorthScore = () => {
    const stats = dataManager.getStatistics() || {};
    const trades = dataManager.trades || [];
    const closedTrades = trades.filter(t => t.status === 'closed');
    
    // 1. WIN RATE FACTOR (0-100 scale, based on actual win percentage)
    const actualWinRate = stats.winRate || 0;
    const winRateScore = Math.min(100, actualWinRate * 1.67); // 60% win rate = 100 score
    
    // 2. RISK MANAGEMENT FACTOR (based on profit factor and risk/reward)
    const profitFactor = stats.profitFactor || 0;
    const avgRiskReward = stats.avgWin && stats.avgLoss ? Math.abs(stats.avgWin / stats.avgLoss) : 0;
    const riskManagementScore = Math.min(100, 
      (profitFactor * 30) + // Profit factor component (max 60 points)
      (Math.min(avgRiskReward * 20, 40)) // Risk/reward ratio component (max 40 points)
    );
    
    // 3. CONSISTENCY FACTOR (based on drawdown and consecutive losses)
    const maxDrawdown = Math.abs(stats.maxDrawdown || 0);
    const consecutiveLosses = stats.consecutiveLosses || 0;
    const consistencyScore = Math.min(100, Math.max(0,
      100 - (maxDrawdown * 2) - (consecutiveLosses * 3)
    ));
    
    // 4. PROFIT FACTOR (direct scaling of profit factor metric)
    const profitFactorScore = Math.min(100, profitFactor * 50); // 2.0 PF = 100 score
    
    // 5. DISCIPLINE FACTOR (based on adherence to stop losses and targets)
    const totalTrades = closedTrades.length;
    const tradesWithStopLoss = closedTrades.filter(t => t.stopLoss && t.stopLoss !== '0').length;
    const tradesWithTakeProfit = closedTrades.filter(t => t.takeProfit && t.takeProfit !== '0').length;
    const disciplineScore = totalTrades > 0 ? 
      ((tradesWithStopLoss / totalTrades) * 50) + ((tradesWithTakeProfit / totalTrades) * 50) : 0;
    
    // 6. MARKET TIMING FACTOR (based on average hold time and win rate combination)
    const avgHoldTime = stats.avgHoldTime || 0;
    const timingEfficiency = actualWinRate > 0 ? (actualWinRate / Math.max(avgHoldTime, 1)) * 100 : 0;
    const marketTimingScore = Math.min(100, timingEfficiency);
    
    // Weighted scoring system based on importance
    const weightedScore = Math.round(
      winRateScore * 0.20 +          // 20% - Win rate is important
      riskManagementScore * 0.25 +   // 25% - Risk management is most critical
      consistencyScore * 0.20 +      // 20% - Consistency matters
      profitFactorScore * 0.15 +     // 15% - Overall profitability
      disciplineScore * 0.15 +       // 15% - Trading discipline
      marketTimingScore * 0.05       // 5% - Market timing (less weight)
    );
    
    const result = {
      overall: Math.max(0, Math.min(weightedScore || 0, 100)),
      factors: {
        winRate: Math.round(winRateScore || 0),
        riskManagement: Math.round(riskManagementScore || 0),
        consistency: Math.round(consistencyScore || 0),
        profitFactor: Math.round(profitFactorScore || 0),
        discipline: Math.round(disciplineScore || 0),
        marketTiming: Math.round(marketTimingScore || 0)
      }
    };

    return result;
  };

  // Get last 7 days including today for cumulative PnL
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return days;
  };

  // Calculate monthly performance data (fixed calculations)
  const getMonthlyPerformance = useMemo(() => {
    const trades = dataManager.trades.filter(t => t.status === 'closed');
    const monthlyData = {};
    
    trades.forEach(trade => {
      const monthKey = trade.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          pnl: 0,
          trades: 0,
          winningTrades: 0
        };
      }
      monthlyData[monthKey].pnl += trade.pnl || 0;
      monthlyData[monthKey].trades += 1;
      if (trade.pnl > 0) monthlyData[monthKey].winningTrades += 1;
    });

    return Object.values(monthlyData)
      .map(data => ({
        ...data,
        winRate: data.trades > 0 ? (data.winningTrades / data.trades) * 100 : 0,
        monthLabel: new Date(data.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }, [dataManager.trades]);

  // Calculate cumulative PnL for last 7 days including today
  const getCumulativePnL = useMemo(() => {
    const last7Days = getLast7Days();
    let cumulativePnL = 0;
    
    return last7Days.map(day => {
      const dayPnL = dataManager.getPnLForDate ? dataManager.getPnLForDate(day.date) : 0;
      cumulativePnL += dayPnL;
      return {
        date: day.label,
        cumulative: cumulativePnL,
        daily: dayPnL
      };
    });
  }, [dataManager]);

  // Pair performance analysis (fixed to use actual data)
  const getPairPerformance = useMemo(() => {
    const trades = dataManager.trades.filter(t => t.status === 'closed');
    const pairData = {};
    
    trades.forEach(trade => {
      if (!pairData[trade.pair]) {
        pairData[trade.pair] = {
          pair: trade.pair,
          totalTrades: 0,
          winningTrades: 0,
          totalPnL: 0,
          winRate: 0
        };
      }
      
      pairData[trade.pair].totalTrades += 1;
      pairData[trade.pair].totalPnL += trade.pnl || 0;
      if (trade.pnl > 0) pairData[trade.pair].winningTrades += 1;
    });

    return Object.values(pairData)
      .map(data => ({
        ...data,
        winRate: data.totalTrades > 0 ? (data.winningTrades / data.totalTrades) * 100 : 0
      }))
      .sort((a, b) => b.totalPnL - a.totalPnL)
      .slice(0, 8);
  }, [dataManager.trades]);

  // Timing analysis helper functions
  const getDayOfWeekStats = (dayOfWeek) => {
    const closedTrades = dataManager.trades.filter(t => t.status === 'closed');
    const dayTrades = closedTrades.filter(trade => {
      const date = new Date(trade.date);
      return date.getDay() === (dayOfWeek % 7); // Convert Monday=1 to Sunday=0 format
    });
    
    const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = dayTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const winRate = dayTrades.length > 0 ? (winningTrades / dayTrades.length) * 100 : 0;
    
    return {
      trades: dayTrades.length,
      pnl: totalPnL,
      winRate: winRate
    };
  };

  const getHourOfDayStats = (hour) => {
    const closedTrades = dataManager.trades.filter(t => t.status === 'closed');
    const hourTrades = closedTrades.filter(trade => {
      const date = new Date(trade.date);
      return date.getHours() === hour;
    });
    
    const totalPnL = hourTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = hourTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const winRate = hourTrades.length > 0 ? (winningTrades / hourTrades.length) * 100 : 0;
    
    return {
      trades: hourTrades.length,
      pnl: totalPnL,
      winRate: winRate
    };
  };

  const getSessionStats = (startHour, endHour) => {
    const closedTrades = dataManager.trades.filter(t => t.status === 'closed');
    const sessionTrades = closedTrades.filter(trade => {
      const date = new Date(trade.date);
      const hour = date.getHours();
      
      if (startHour <= endHour) {
        return hour >= startHour && hour < endHour;
      } else {
        // Handle overnight sessions
        return hour >= startHour || hour < endHour;
      }
    });
    
    const totalPnL = sessionTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = sessionTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const winRate = sessionTrades.length > 0 ? (winningTrades / sessionTrades.length) * 100 : 0;
    
    return {
      trades: sessionTrades.length,
      pnl: totalPnL,
      winRate: winRate
    };
  };

  // Get Worth Score data with safe fallback
  const worthScoreData = calculateWorthScore() || {
    overall: 0,
    factors: {
      winRate: 0,
      riskManagement: 0,
      consistency: 0,
      profitFactor: 0,
      discipline: 0,
      marketTiming: 0
    }
  };

  const stats = dataManager.statistics || {
    totalTrades: 0,
    winRate: 0,
    totalPnL: 0,
    profitFactor: 0
  };

  const monthlyPerformance = getMonthlyPerformance;
  const cumulativePnL = getCumulativePnL;
  const pairPerformance = getPairPerformance;

  // Loading state
  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <GlassCard hover={animationsEnabled}>
        <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
                Advanced Analytics Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Comprehensive analysis of your trading performance</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Period Selector */}
      <GlassCard hover={animationsEnabled}>
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            {['7d', '30d', '90d', '1y', 'all'].map(period => (
              <Button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
              >
                {period === 'all' ? 'All Time' : period.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 6-Factor Worth Score - Enhanced Design */}
      <GlassCard hover={animationsEnabled} className="overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Worth Score Analysis</h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">6-Factor Trading Performance</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {worthScoreData.overall}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Overall Score
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Enhanced Radar Chart */}
            <GlassCard hover={false} className="p-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Performance Radar</h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={[
                  { subject: 'Win Rate', value: worthScoreData.factors.winRate, fullMark: 100 },
                  { subject: 'Risk Mgmt', value: worthScoreData.factors.riskManagement, fullMark: 100 },
                  { subject: 'Consistency', value: worthScoreData.factors.consistency, fullMark: 100 },
                  { subject: 'Profit Factor', value: worthScoreData.factors.profitFactor, fullMark: 100 },
                  { subject: 'Discipline', value: worthScoreData.factors.discipline, fullMark: 100 },
                  { subject: 'Market Timing', value: worthScoreData.factors.marketTiming, fullMark: 100 }
                ]}>
                  <PolarGrid 
                    gridType="polygon" 
                    radialLines={false}
                    stroke="rgba(148, 163, 184, 0.3)"
                    strokeWidth={1}
                  />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ 
                      fill: 'rgb(71, 85, 105)', 
                      fontSize: 12, 
                      fontWeight: 500 
                    }} 
                    className="text-slate-600 dark:text-slate-300"
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={false} 
                    axisLine={false}
                  />
                  <Radar
                    name="Worth Score"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="rgba(59, 130, 246, 0.2)"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Enhanced Factor Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Factor Analysis</h3>
              {Object.entries({
                winRate: { name: 'Win Rate', icon: '🎯', color: 'from-green-500 to-emerald-500' },
                riskManagement: { name: 'Risk Management', icon: '🛡️', color: 'from-blue-500 to-cyan-500' },
                consistency: { name: 'Consistency', icon: '📊', color: 'from-purple-500 to-pink-500' },
                profitFactor: { name: 'Profit Factor', icon: '💰', color: 'from-yellow-500 to-orange-500' },
                discipline: { name: 'Discipline', icon: '🧠', color: 'from-indigo-500 to-purple-500' },
                marketTiming: { name: 'Market Timing', icon: '⏰', color: 'from-rose-500 to-pink-500' }
              }).map(([key, config]) => {
                const value = worthScoreData.factors[key];
                const grade = value >= 90 ? 'A+' : value >= 80 ? 'A' : value >= 70 ? 'B' : value >= 60 ? 'C' : 'D';
                return (
                  <GlassCard key={key} hover={false} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{config.icon}</div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{config.name}</h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Grade: {grade}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">/ 100</div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${config.color} transition-all duration-1000 ease-out rounded-full`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tab Navigation */}
      <GlassCard hover={animationsEnabled}>
        <div className="p-4">
          <nav className="flex space-x-1">
            {[
              { id: 'performance', name: 'Performance Overview', icon: TrendingUp },
              { id: 'pairs', name: 'Pair Analysis', icon: Target },
              { id: 'timing', name: 'Timing Analysis', icon: Clock }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-500/90 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </GlassCard>

      {/* Tab Content */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Trades', value: stats.totalTrades, color: 'blue', icon: Activity },
              { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, color: 'green', icon: Target },
              { 
                label: 'Total P&L', 
                value: `$${stats.totalPnL.toFixed(2)}`, 
                color: stats.totalPnL >= 0 ? 'green' : 'red', 
                icon: DollarSign 
              },
              { label: 'Profit Factor', value: stats.profitFactor.toFixed(2), color: 'purple', icon: Calculator }
            ].map((metric, index) => {
              const Icon = metric.icon;
              return (
                <GlassCard key={index} hover={animationsEnabled} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{metric.label}</p>
                      <p className={`text-2xl font-bold text-${metric.color}-600`}>
                        {metric.value}
                      </p>
                    </div>
                    <div className={`p-3 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-xl`}>
                      <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Performance */}
            <GlassCard hover={animationsEnabled}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
                  Monthly Performance
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="monthLabel" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        formatter={(value) => [`$${value.toFixed(2)}`, 'P&L']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Bar dataKey="pnl" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>

            {/* Last 7 Days Cumulative PnL */}
            <GlassCard hover={animationsEnabled}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <Activity className="w-5 h-5 text-blue-600 mr-2" />
                  Last 7 Days Cumulative P&L
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cumulativePnL}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        formatter={(value) => [`$${value.toFixed(2)}`, 'Cumulative P&L']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === 'pairs' && (
        <div className="space-y-6">
          {/* Pair Performance Chart */}
          <GlassCard hover={animationsEnabled}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Currency Pair Performance
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pairPerformance}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="pair" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Total P&L']}
                    />
                    <Bar dataKey="totalPnL" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>

          {/* Pair Statistics Table */}
          <GlassCard hover={animationsEnabled}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Detailed Pair Statistics
              </h3>
              <div className="overflow-x-auto">
                {pairPerformance.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No trading data available</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/80 dark:bg-slate-700/80 backdrop-blur-sm">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Pair</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Trades</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">Win Rate</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                      {pairPerformance.map((pair, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{pair.pair}</td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{pair.totalTrades}</td>
                          <td className="px-4 py-2">
                            <span className={`font-medium ${
                              pair.winRate >= 50 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {pair.winRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`font-medium ${
                              pair.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${pair.totalPnL.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'timing' && (
        <div className="space-y-6">
          {/* Day of Week Analysis */}
          <GlassCard hover={animationsEnabled}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Day of Week Performance</h3>
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const dayData = getDayOfWeekStats(index + 1);
                  return (
                    <div key={day} className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{day}</div>
                      <div className={`text-lg font-bold ${dayData.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        ${dayData.pnl.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {dayData.trades} trades
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {dayData.winRate.toFixed(0)}% WR
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>

          {/* Hour of Day Analysis */}
          <GlassCard hover={animationsEnabled}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Hour of Day Performance</h3>
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {Array.from({length: 24}, (_, hour) => {
                  const hourData = getHourOfDayStats(hour);
                  if (hourData.trades === 0) return null;
                  
                  return (
                    <div key={hour} className="text-center p-2 bg-gray-50 dark:bg-slate-700 rounded">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      <div className={`text-sm font-bold ${hourData.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${hourData.pnl.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {hourData.trades}t
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          </GlassCard>

          {/* Trading Session Analysis */}
          <GlassCard hover={animationsEnabled}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Trading Session Performance</h3>
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { name: 'Asia', start: 0, end: 8, color: 'blue' },
                  { name: 'London', start: 8, end: 16, color: 'green' },
                  { name: 'New York', start: 16, end: 24, color: 'purple' },
                  { name: 'Overlap', start: 13, end: 17, color: 'orange' }
                ].map(session => {
                  const sessionData = getSessionStats(session.start, session.end);
                  return (
                    <div key={session.name} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold text-${session.color}-600 dark:text-${session.color}-400`}>
                          {session.name}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {session.start}:00-{session.end}:00
                        </span>
                      </div>
                      <div className={`text-xl font-bold mb-1 ${sessionData.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${sessionData.pnl.toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {sessionData.trades} trades • {sessionData.winRate.toFixed(0)}% WR
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Analytics;