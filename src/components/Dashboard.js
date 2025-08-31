import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  Award, AlertCircle, Activity, Brain, Calendar
} from 'lucide-react';
import { useDataManager } from '../utils';
import { Card, CardHeader, CardTitle, CardContent, Badge, Select, Button } from './ui/components';

const Dashboard = ({ accountBalance }) => {
  const dataManager = useDataManager();
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  // Get dynamic account balance from centralized data manager
  const dynamicBalance = dataManager.getDynamicAccountBalance();
  const currentBalance = accountBalance || dynamicBalance;

  // Get data from centralized data manager
  const statistics = dataManager.getStatistics();
  const chartData = dataManager.getChartData();
  const portfolioMetrics = dataManager.getPortfolioMetrics(currentBalance);
  const calendarData = dataManager.getCalendarData();

  useEffect(() => {
    // Data is automatically available from dataManager
    setLoading(false);
  }, [dataManager, selectedTimeframe]);

  // Generate insights based on current statistics
  const generateInsights = () => {
    const insights = [];
    
    if (statistics.worthScore > 80) {
      insights.push({
        title: 'Excellent Trading Performance',
        description: 'Your Worth Score indicates strong trading discipline and risk management.',
        severity: 'info',
        insight_type: 'achievement'
      });
    } else if (statistics.worthScore < 50) {
      insights.push({
        title: 'Focus on Risk Management',
        description: 'Consider reviewing your position sizing and risk-reward ratios.',
        severity: 'warning',
        insight_type: 'suggestion'
      });
    }

    if (statistics.winRate > 60) {
      insights.push({
        title: 'Strong Win Rate',
        description: `Your ${statistics.winRate.toFixed(1)}% win rate is above average.`,
        severity: 'info',
        insight_type: 'achievement'
      });
    }

    if (statistics.totalTrades > 100) {
      insights.push({
        title: 'Experienced Trader',
        description: `With ${statistics.totalTrades} trades, you have solid trading experience.`,
        severity: 'info',
        insight_type: 'achievement'
      });
    }

    return insights;
  };

  // Calculate current month P&L from statistics
  const getCurrentMonthPnL = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyData = chartData.monthlyPerformance || [];
    const currentMonthData = monthlyData.find(month => {
      const monthDate = new Date(month.month + '-01');
      return monthDate.getMonth() === currentMonth && monthDate.getFullYear() === currentYear;
    });
    
    return currentMonthData?.pnl || 0;
  };

  // Worth Score components for radar chart display
  const getWorthScoreRadarData = () => {
    return {
      overall: statistics.worthScore || 0,
      winRate: Math.min(100, (statistics.winRate || 0) * 1.6), // Scale to 100
      timing: Math.min(100, (statistics.consistency || 0)), // Use consistency as timing proxy
      discipline: Math.min(100, (statistics.discipline || 0)),
      riskManagement: Math.min(100, (statistics.riskManagement || 0)),
      consistency: Math.min(100, (statistics.consistency || 0))
    };
  };

  // Get today's intraday P&L from chart data
  const getTodaysIntradayPnL = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = dataManager.trades.filter(t => 
      t.date === today && t.status === 'closed'
    );

    const intradayPnL = [];
    let cumulativePnL = 0;
    todayTrades.forEach((trade, index) => {
      cumulativePnL += trade.pnl || 0;
      intradayPnL.push({
        time: trade.entry_time || `${index + 1}`,
        pnl: cumulativePnL,
        trade: index + 1
      });
    });

    return intradayPnL;
  };

  // Use monthly performance from chart data
  const getMonthlyPerformanceData = () => {
    return chartData.monthlyPerformance || [];
  };

  // Get monthly heatmap data for a specific month
  const getMonthlyHeatmapData = (targetMonth = new Date()) => {
    const calendarData = dataManager.getCalendarData(targetMonth.getFullYear(), targetMonth.getMonth());
    
    // Convert object to array format expected by the component
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month, day).toISOString().split('T')[0];
      const dayData = calendarData[day] || { tradeCount: 0, totalPnL: 0 };
      
      result.push({
        date: dateStr,
        count: dayData.tradeCount,
        value: dayData.totalPnL
      });
    }
    
    return result;
  };

  // Get insights based on current statistics
  const getInsights = () => {
    return generateInsights();
  };

  // Current data from dataManager for display
  const currentMonthPnL = getCurrentMonthPnL();
  const worthScoreData = getWorthScoreRadarData();
  const todaysIntradayPnL = getTodaysIntradayPnL();
  const monthlyPerformanceData = getMonthlyPerformanceData();
  const insights = getInsights();

  const StatCard = ({ title, value, change, changeLabel, icon: Icon, gradient = 'from-blue-500 to-purple-600' }) => (
    <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                <span>{changeLabel}</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  // Glassmorphic Performance Overview Card (replaces old radar)
  const PerformanceOverview = ({ stats }) => {
    const performanceMetrics = [
      { 
        label: 'Win Rate', 
        value: `${(stats.winRate || 0).toFixed(1)}%`, 
        trend: stats.winRate >= 60 ? 'positive' : stats.winRate >= 40 ? 'neutral' : 'negative',
        icon: Target
      },
      { 
        label: 'Profit Factor', 
        value: (stats.profitFactor || 0).toFixed(2), 
        trend: stats.profitFactor >= 1.5 ? 'positive' : stats.profitFactor >= 1 ? 'neutral' : 'negative',
        icon: TrendingUp
      },
      { 
        label: 'Total P&L', 
        value: `$${(stats.totalPnL || 0).toLocaleString()}`, 
        trend: stats.totalPnL >= 0 ? 'positive' : 'negative',
        icon: DollarSign
      },
      { 
        label: 'Max Drawdown', 
        value: `${Math.abs(stats.maxDrawdown || 0).toFixed(1)}%`, 
        trend: Math.abs(stats.maxDrawdown || 0) <= 5 ? 'positive' : Math.abs(stats.maxDrawdown || 0) <= 15 ? 'neutral' : 'negative',
        icon: AlertCircle
      }
    ];

    return (
      <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10"></div>
        <div className="relative p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Performance Overview</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Key trading metrics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {performanceMetrics.map((metric, index) => {
              const Icon = metric.icon;
              const trendColors = {
                positive: 'from-green-500 to-emerald-500',
                neutral: 'from-yellow-500 to-orange-500',
                negative: 'from-red-500 to-pink-500'
              };
              
              return (
                <div key={index} className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${trendColors[metric.trend]}`}></div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{metric.value}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{metric.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const IntradayPnLChart = ({ data }) => (
    <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-blue-500/5 to-purple-500/10"></div>
      <div className="relative p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Today's Cumulative P&L</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Intraday performance tracking</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis dataKey="time" tick={{ fill: 'rgb(71, 85, 105)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgb(71, 85, 105)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip 
              formatter={(value) => [`$${value.toFixed(2)}`, 'Cumulative P&L']}
              labelFormatter={(label) => `Trade: ${label}`}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: 'none', 
                borderRadius: '12px', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(16px)'
              }}
            />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke="#10B981"
              strokeWidth={3}
              fill="url(#pnlGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const MonthlyPerformanceChart = ({ data }) => (
    <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-cyan-500/10"></div>
      <div className="relative p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Performance</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Monthly P&L breakdown</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.7}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis dataKey="month" tick={{ fill: 'rgb(71, 85, 105)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis 
              domain={['dataMin', 'dataMax']} 
              tick={{ fill: 'rgb(71, 85, 105)', fontSize: 11 }} 
              axisLine={false} 
              tickLine={false}
              tickFormatter={(value) => {
                // Format Y-axis to show whole numbers or reasonable decimals
                if (Math.abs(value) >= 1000) {
                  return `$${(value / 1000).toFixed(1)}k`;
                } else if (Math.abs(value) >= 100) {
                  return `$${Math.round(value)}`;
                } else if (Math.abs(value) >= 10) {
                  return `$${value.toFixed(1)}`;
                } else {
                  return `$${value.toFixed(2)}`;
                }
              }}
            />
            <Tooltip 
              formatter={(value, name) => [
                name === 'pnl' ? `$${value.toFixed(2)}` : `${value.toFixed(1)}%`,
                name === 'pnl' ? 'Monthly P&L' : 'Win Rate'
              ]}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: 'none', 
                borderRadius: '12px', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(16px)'
              }}
            />
            <Bar dataKey="pnl" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const TradingHeatmap = () => {
    const [heatmapMonth, setHeatmapMonth] = useState(new Date());
    const monthlyHeatmapData = getMonthlyHeatmapData(heatmapMonth);
    
    // Generate month options (last 12 months)
    const getMonthOptions = () => {
      const options = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        options.push({
          value: date.toISOString().substring(0, 7), // YYYY-MM format
          label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });
      }
      return options;
    };

    // Generate monthly calendar grid
    const generateMonthlyGrid = () => {
      const year = heatmapMonth.getFullYear();
      const month = heatmapMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      
      // Start from Sunday of the week containing the first day
      startDate.setDate(startDate.getDate() - startDate.getDay());
      
      const weeks = [];
      let currentWeek = [];
      
      for (let i = 0; i < 42; i++) { // 6 weeks max
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayData = monthlyHeatmapData.find(d => d.date === dateStr) || { date: dateStr, count: 0, value: 0 };
        const isCurrentMonth = currentDate.getMonth() === month;
        
        currentWeek.push({
          date: currentDate,
          dateStr,
          day: currentDate.getDate(),
          isCurrentMonth,
          trades: dayData.count || 0,
          pnl: dayData.value || 0
        });
        
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
        
        if (currentDate > lastDay && currentWeek.length === 0) break;
      }
      
      return weeks;
    };

    const weeks = generateMonthlyGrid();
    
    const getCellColor = (day) => {
      if (!day.isCurrentMonth) return 'bg-gray-50';
      if (day.trades === 0) return 'bg-gray-100';
      
      const intensity = Math.min(4, Math.max(1, day.trades));
      if (day.pnl > 0) {
        return `bg-green-${100 + intensity * 100} border border-green-${200 + intensity * 100}`;
      } else if (day.pnl < 0) {
        return `bg-red-${100 + intensity * 100} border border-red-${200 + intensity * 200}`;
      }
      return 'bg-yellow-200 border border-yellow-300';
    };

    return (
      <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-purple-500/10"></div>
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Trading Heatmap</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Monthly activity overview</p>
              </div>
            </div>
            <Select
              value={heatmapMonth.toISOString().substring(0, 7)}
              onValueChange={(value) => setHeatmapMonth(new Date(value + '-01'))}
              className="w-48"
            >
              {getMonthOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-medium text-gray-500 text-center p-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`aspect-square rounded text-xs flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${getCellColor(day)}`}
                  title={`${day.dateStr}: ${day.trades} trades, $${day.pnl.toFixed(2)} P&L`}
                >
                  <span className={`font-medium ${day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                    {day.day}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span>No trades</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>Profit</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <span>Loss</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>Breakeven</span>
          </div>
        </div>
        </div>
      </div>
    );
  };

  const InsightCard = ({ insight }) => {
    const getIcon = (type) => {
      switch (type) {
        case 'achievement': return Award;
        case 'warning': return AlertCircle;
        default: return Brain;
      }
    };

    const getBadgeVariant = (severity) => {
      switch (severity) {
        case 'warning': return 'outline';
        case 'critical': return 'destructive';
        default: return 'secondary';
      }
    };

    const Icon = getIcon(insight.insight_type);
    const variant = getBadgeVariant(insight.severity);

    return (
      <div className="p-4 border-l-4 border-primary/20 bg-muted/50 rounded-md">
        <div className="flex items-start space-x-3">
          <Icon className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-foreground">{insight.title}</h4>
              <Badge variant={variant}>{insight.severity}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Trading Dashboard</h1>
          <Select
            value={selectedTimeframe}
            onValueChange={setSelectedTimeframe}
            className="w-40"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Account Balance"
            value={`$${accountBalance.toLocaleString()}`}
            icon={DollarSign}
            gradient="from-green-500 to-emerald-600"
          />
          <StatCard
            title="Total P&L"
            value={`$${(statistics.totalPnL || 0).toLocaleString()}`}
            change={currentMonthPnL}
            changeLabel={`$${Math.abs(currentMonthPnL).toLocaleString()} this month`}
            icon={TrendingUp}
            gradient={(statistics.totalPnL || 0) >= 0 ? "from-green-500 to-blue-600" : "from-red-500 to-pink-600"}
          />
          <StatCard
            title="Win Rate"
            value={`${(statistics.winRate || 0).toFixed(1)}%`}
            icon={Target}
            gradient="from-blue-500 to-cyan-600"
          />
          <StatCard
            title="Total Trades"
            value={(statistics.totalTrades || 0).toLocaleString()}
            icon={Activity}
            gradient="from-purple-500 to-indigo-600"
          />
          <StatCard
            title="Worth Score"
            value={statistics.worthScore || 0}
            icon={Award}
            gradient="from-orange-500 to-red-600"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceOverview stats={statistics} />
          <IntradayPnLChart data={todaysIntradayPnL} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyPerformanceChart data={monthlyPerformanceData} />
          <TradingHeatmap />
        </div>

        {/* Insights */}
        <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10"></div>
          <div className="relative p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Trading Insights</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">AI-powered recommendations</p>
              </div>
            </div>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </div>
          </div>
        </div>
    </div>
  );
};

export default Dashboard;