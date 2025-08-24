import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  Award, AlertCircle, Activity, Brain
} from 'lucide-react';

const Dashboard = ({ supabase, user }) => {
  const [dashboardData, setDashboardData] = useState({
    overview: {
      accountBalance: 0,
      totalPnL: 0,
      winRate: 0,
      totalTrades: 0,
      monthlyPnL: 0
    },
    worthScore: {
      overall: 0,
      winRate: 0,
      timing: 0,
      discipline: 0,
      riskManagement: 0,
      consistency: 0
    },
    chartData: {
      intradayPnL: [],
      monthlyPerformance: [],
      heatmapData: []
    },
    insights: []
  });

  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [allTrades, setAllTrades] = useState([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, selectedTimeframe]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOverviewData(),
        loadWorthScore(),
        loadChartData(),
        loadInsights()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setLoading(false);
  };

  const loadOverviewData = async () => {
    try {
      // Get user profile with account balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_balance, currency')
        .eq('id', user.id)
        .single();

      // Get all trades to calculate actual metrics
      const { data: allTrades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);

      // Calculate actual metrics from trades
      const closedTrades = allTrades?.filter(t => t.status === 'closed') || [];
      const winningTrades = closedTrades.filter(t => t.pnl > 0);
      const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

      // Get current month PnL
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyTrades = closedTrades.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= startOfMonth;
      });

      const monthlyPnL = monthlyTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

      setDashboardData(prev => ({
        ...prev,
        overview: {
          accountBalance: profile?.account_balance || 10000, // Default starting balance
          totalPnL: totalPnL,
          winRate: winRate,
          totalTrades: closedTrades.length,
          monthlyPnL: monthlyPnL
        }
      }));
    } catch (error) {
      console.error('Error loading overview data:', error);
    }
  };

  const loadWorthScore = async () => {
    try {
      // Get all closed trades for Worth Score calculation
      const { data: recentTrades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'closed')
        .order('date', { ascending: false })
        .limit(100);

      if (recentTrades && recentTrades.length > 0) {
        const worthScore = calculateWorthScore(recentTrades);
        setDashboardData(prev => ({
          ...prev,
          worthScore
        }));
      } else {
        // Default scores if no trades
        setDashboardData(prev => ({
          ...prev,
          worthScore: {
            overall: 0,
            winRate: 0,
            timing: 0,
            discipline: 0,
            riskManagement: 0,
            consistency: 0
          }
        }));
      }
    } catch (error) {
      console.error('Error loading Worth Score:', error);
    }
  };

  const calculateWorthScore = (trades) => {
    if (trades.length === 0) {
      return {
        overall: 0,
        winRate: 0,
        timing: 0,
        discipline: 0,
        riskManagement: 0,
        consistency: 0
      };
    }

    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const winRate = (winningTrades.length / totalTrades) * 100;
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Calculate max loss streak for consistency
    let currentLossStreak = 0;
    let maxLossStreak = 0;
    trades.forEach(trade => {
      if (trade.pnl < 0) {
        currentLossStreak++;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      } else {
        currentLossStreak = 0;
      }
    });

    // Enhanced 1000-point Worth Score calculation (matching AppContent.js)
    const baseScore = Math.max(0, Math.min(winRate * 4, 400)); // Win rate component (0-400)
    const profitScore = Math.max(0, Math.min(profitFactor * 100, 300)); // Profit factor component (0-300)
    const consistencyScore = Math.max(0, 200 - (maxLossStreak * 20)); // Consistency component (0-200)
    const experienceScore = Math.min(totalTrades * 2, 100); // Experience component (0-100)
    const overall = Math.round(baseScore + profitScore + consistencyScore + experienceScore);

    // Component scores (scaled to show individual performance)
    const winRateScore = Math.min(250, (winRate / 60) * 250); // 0-250 scale
    const timingScore = experienceScore * 2.5; // Based on experience, scaled to 0-250
    const disciplineScore = Math.min(250, profitScore * 0.83); // Based on profit factor, scaled to 0-250
    const riskManagementScore = Math.min(250, consistencyScore * 1.25); // Based on consistency, scaled to 0-250
    const consistencyScoreDisplay = Math.min(250, consistencyScore * 1.25); // Scaled to 0-250

    return {
      overall: Math.min(1000, overall),
      winRate: Math.round(winRateScore),
      timing: Math.round(timingScore), 
      discipline: Math.round(disciplineScore),
      riskManagement: Math.round(riskManagementScore),
      consistency: Math.round(consistencyScoreDisplay)
    };
  };

  const loadChartData = async () => {
    try {
      // Get all trades for analysis
      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (!tradesData) return;
      
      // Store trades in state for heatmap month switching
      setAllTrades(tradesData);

      // Load intraday cumulative PnL for today
      const today = new Date().toISOString().split('T')[0];
      const todayTrades = tradesData.filter(t => t.date === today && t.status === 'closed');

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

      // Calculate monthly performance from actual trades
      const monthlyPerformance = calculateMonthlyPerformance(tradesData);

      // Calculate daily performance for current month heatmap
      const heatmapData = calculateMonthlyHeatmapData(tradesData);

      setDashboardData(prev => ({
        ...prev,
        chartData: {
          intradayPnL,
          monthlyPerformance,
          heatmapData
        }
      }));
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const calculateMonthlyPerformance = (trades) => {
    const monthlyData = {};
    const closedTrades = trades.filter(t => t.status === 'closed');

    closedTrades.forEach(trade => {
      const date = new Date(trade.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          pnl: 0,
          trades: 0,
          wins: 0
        };
      }
      
      monthlyData[monthKey].pnl += trade.pnl || 0;
      monthlyData[monthKey].trades += 1;
      if (trade.pnl > 0) monthlyData[monthKey].wins += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        pnl: data.pnl,
        winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
        trades: data.trades
      }))
      .slice(-12) // Last 12 months
      .reverse();
  };

  const calculateMonthlyHeatmapData = (trades, targetMonth = new Date()) => {
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    
    // Get last day of target month
    const lastDay = new Date(year, month + 1, 0);
    
    const dailyData = {};
    
    // Initialize all days of the month with 0
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = new Date(year, month, day).toISOString().split('T')[0];
      dailyData[dateStr] = { pnl: 0, trades: 0 };
    }
    
    // Fill with actual trade data
    const closedTrades = trades.filter(t => t.status === 'closed');
    closedTrades.forEach(trade => {
      const tradeDate = new Date(trade.date);
      if (tradeDate.getFullYear() === year && tradeDate.getMonth() === month) {
        const dateStr = trade.date;
        if (dailyData[dateStr]) {
          dailyData[dateStr].pnl += trade.pnl || 0;
          dailyData[dateStr].trades += 1;
        }
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      count: data.trades, // Actual trade count
      value: data.pnl
    }));
  };

  const loadInsights = async () => {
    try {
      // Get recent behavioral insights
      const { data: insights } = await supabase
        .from('behavioral_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(5);

      // Generate basic insights if none exist
      const basicInsights = generateBasicInsights();
      
      setDashboardData(prev => ({
        ...prev,
        insights: insights?.length > 0 ? insights : basicInsights
      }));
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const generateBasicInsights = () => {
    const insights = [];
    const { overview, worthScore } = dashboardData;

    if (worthScore.overall > 80) {
      insights.push({
        title: 'Excellent Trading Performance',
        description: 'Your Worth Score indicates strong trading discipline and risk management.',
        severity: 'info',
        insight_type: 'achievement'
      });
    } else if (worthScore.overall < 50) {
      insights.push({
        title: 'Focus on Risk Management',
        description: 'Consider reviewing your position sizing and risk-reward ratios.',
        severity: 'warning',
        insight_type: 'suggestion'
      });
    }

    if (overview.winRate > 60) {
      insights.push({
        title: 'Strong Win Rate',
        description: `Your ${overview.winRate.toFixed(1)}% win rate is above average.`,
        severity: 'info',
        insight_type: 'achievement'
      });
    }

    return insights;
  };

  const StatCard = ({ title, value, change, changeLabel, icon: Icon, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {changeLabel}
            </p>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-full`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const WorthScoreRadar = ({ data }) => {
    const radarData = [
      { subject: 'Win Rate', value: data.winRate, fullMark: 250 },
      { subject: 'Timing', value: data.timing, fullMark: 250 },
      { subject: 'Discipline', value: data.discipline, fullMark: 250 },
      { subject: 'Risk Mgmt', value: data.riskManagement, fullMark: 250 },
      { subject: 'Consistency', value: data.consistency, fullMark: 250 }
    ];

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Worth Score</h3>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">{data.overall}</div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="Worth Score"
              dataKey="value"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const IntradayPnLChart = ({ data }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Cumulative P&L</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`$${value.toFixed(2)}`, 'Cumulative P&L']}
            labelFormatter={(label) => `Trade: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const MonthlyPerformanceChart = ({ data }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis domain={['dataMin', 'dataMax']} />
          <Tooltip 
            formatter={(value, name) => [
              name === 'pnl' ? `$${value.toFixed(2)}` : `${value.toFixed(1)}%`,
              name === 'pnl' ? 'Monthly P&L' : 'Win Rate'
            ]}
          />
          <Bar dataKey="pnl" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const TradingHeatmap = () => {
    const [heatmapMonth, setHeatmapMonth] = useState(new Date());
    const [monthlyHeatmapData, setMonthlyHeatmapData] = useState([]);
    
    // Recalculate heatmap data when month changes
    useEffect(() => {
      if (allTrades.length > 0) {
        const newHeatmapData = calculateMonthlyHeatmapData(allTrades, heatmapMonth);
        setMonthlyHeatmapData(newHeatmapData);
      }
    }, [heatmapMonth, allTrades]);
    
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
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Trading Heatmap</h3>
          <select
            value={heatmapMonth.toISOString().substring(0, 7)}
            onChange={(e) => setHeatmapMonth(new Date(e.target.value + '-01'))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getMonthOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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

    const getColor = (severity) => {
      switch (severity) {
        case 'warning': return 'orange';
        case 'critical': return 'red';
        default: return 'blue';
      }
    };

    const Icon = getIcon(insight.insight_type);
    const color = getColor(insight.severity);

    return (
      <div className={`p-4 border-l-4 border-${color}-500 bg-${color}-50`}>
        <div className="flex items-start">
          <Icon className={`w-5 h-5 text-${color}-600 mt-0.5 mr-3`} />
          <div>
            <h4 className={`font-medium text-${color}-800`}>{insight.title}</h4>
            <p className={`text-sm text-${color}-700 mt-1`}>{insight.description}</p>
          </div>
        </div>
      </div>
    );
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Trading Dashboard</h1>
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Account Balance"
          value={`$${dashboardData.overview.accountBalance.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total P&L"
          value={`$${dashboardData.overview.totalPnL.toLocaleString()}`}
          change={dashboardData.overview.monthlyPnL}
          changeLabel={`$${Math.abs(dashboardData.overview.monthlyPnL).toLocaleString()} this month`}
          icon={TrendingUp}
          color={dashboardData.overview.totalPnL >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Win Rate"
          value={`${dashboardData.overview.winRate.toFixed(1)}%`}
          icon={Target}
          color="blue"
        />
        <StatCard
          title="Total Trades"
          value={dashboardData.overview.totalTrades.toLocaleString()}
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Worth Score"
          value={dashboardData.worthScore.overall}
          icon={Award}
          color="indigo"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorthScoreRadar data={dashboardData.worthScore} />
        <IntradayPnLChart data={dashboardData.chartData.intradayPnL} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyPerformanceChart data={dashboardData.chartData.monthlyPerformance} />
        <TradingHeatmap />
      </div>

      {/* Insights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Insights</h3>
        <div className="space-y-4">
          {dashboardData.insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;