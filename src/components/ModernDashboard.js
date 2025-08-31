"use client"

import React, { useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Shield,
  Calendar,
  PieChart,
  Activity,
  Settings,
  Bell,
  User,
  Moon,
  Sun,
  Zap,
  Award,
  TrendingUpIcon,
  BarChartIcon,
} from "lucide-react"

// Custom UI Components (shadcn/ui style)
const Card = ({ className, children, ...props }) => (
  <div
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
)

const CardHeader = ({ className, children, ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
)

const CardTitle = ({ className, children, ...props }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h3>
)

const CardContent = ({ className, children, ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
)

const Button = ({ variant = "default", size = "default", className, children, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  }
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const Input = ({ className, ...props }) => (
  <input
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
)

const Label = ({ className, ...props }) => (
  <label
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  />
)

const Badge = ({ variant = "default", className, children, ...props }) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
  }
  
  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

const Progress = ({ value, className, ...props }) => (
  <div
    className={`relative h-4 w-full overflow-hidden rounded-full bg-secondary ${className}`}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
)

const Select = ({ value, onValueChange, children }) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
    </div>
  )
}

const Tabs = ({ defaultValue, className, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue)
  
  return (
    <div className={className}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  )
}


// Sample Data
const intradayPnLData = [
  { time: "09:00", pnl: 0 },
  { time: "10:00", pnl: 150 },
  { time: "11:00", pnl: 280 },
  { time: "12:00", pnl: 180 },
  { time: "13:00", pnl: 420 },
  { time: "14:00", pnl: 380 },
  { time: "15:00", pnl: 650 },
  { time: "16:00", pnl: 580 },
]

const performanceHeatmapData = [
  { day: "Mon", hour: "9", value: 85, trades: 3 },
  { day: "Mon", hour: "10", value: 92, trades: 2 },
  { day: "Mon", hour: "11", value: 78, trades: 4 },
  { day: "Mon", hour: "12", value: 65, trades: 1 },
  { day: "Mon", hour: "13", value: 88, trades: 3 },
  { day: "Mon", hour: "14", value: 95, trades: 2 },
  { day: "Mon", hour: "15", value: 72, trades: 5 },
  { day: "Mon", hour: "16", value: 89, trades: 2 },
  { day: "Tue", hour: "9", value: 91, trades: 2 },
  { day: "Tue", hour: "10", value: 76, trades: 3 },
  { day: "Tue", hour: "11", value: 83, trades: 4 },
  { day: "Tue", hour: "12", value: 69, trades: 2 },
  { day: "Tue", hour: "13", value: 94, trades: 1 },
  { day: "Tue", hour: "14", value: 87, trades: 3 },
  { day: "Tue", hour: "15", value: 79, trades: 4 },
  { day: "Tue", hour: "16", value: 92, trades: 2 },
]

const monthlyPerformanceData = [
  { month: "Jan", profit: 1200, trades: 45, winRate: 68 },
  { month: "Feb", profit: 850, trades: 38, winRate: 71 },
  { month: "Mar", profit: 1450, trades: 52, winRate: 74 },
  { month: "Apr", profit: 980, trades: 41, winRate: 69 },
  { month: "May", profit: 1680, trades: 48, winRate: 76 },
  { month: "Jun", profit: 1247, trades: 44, winRate: 73 },
]

const tradingMetricsData = [
  { metric: "Win Rate", value: 73, fullMark: 100 },
  { metric: "Risk Management", value: 90, fullMark: 100 },
  { metric: "Consistency", value: 85, fullMark: 100 },
  { metric: "Profit Factor", value: 72, fullMark: 100 },
  { metric: "Discipline", value: 88, fullMark: 100 },
  { metric: "Market Timing", value: 76, fullMark: 100 },
]

export default function ModernTradingDashboard({ userProfile, dataManager }) {
  const [isDark, setIsDark] = useState(false)
  const [accountBalance, setAccountBalance] = useState("10000")
  const [riskPerTrade, setRiskPerTrade] = useState("2")
  const [currencyPair, setCurrencyPair] = useState("EURUSD")
  const [entryPrice, setEntryPrice] = useState("1.25")
  const [stopLoss, setStopLoss] = useState("1.245")
  const [takeProfit, setTakeProfit] = useState("1.26")

  const toggleTheme = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // Calculate position sizing and risk metrics
  const positionSize = Math.floor(
    ((parseFloat(accountBalance) * parseFloat(riskPerTrade)) /
      100 /
      Math.abs(parseFloat(entryPrice) - parseFloat(stopLoss))) *
      100000,
  )
  
  const riskAmount = ((parseFloat(accountBalance) * parseFloat(riskPerTrade)) / 100).toFixed(2)
  
  const potentialProfit = (
    (positionSize * Math.abs(parseFloat(takeProfit) - parseFloat(entryPrice))) /
    100000
  ).toFixed(2)
  
  const riskReward = (
    Math.abs(parseFloat(takeProfit) - parseFloat(entryPrice)) /
    Math.abs(parseFloat(entryPrice) - parseFloat(stopLoss))
  ).toFixed(2)

  // Calculate 6-factor Worth Score
  const calculateWorthScore = () => {
    const winRate = tradingMetricsData[0].value
    const riskManagement = tradingMetricsData[1].value
    const consistency = tradingMetricsData[2].value
    const profitFactor = tradingMetricsData[3].value
    const discipline = tradingMetricsData[4].value
    const marketTiming = tradingMetricsData[5].value

    // Weighted scoring system based on radar chart metrics (0-100)
    const score = Math.round(
      winRate * 0.2 +
        riskManagement * 0.25 +
        consistency * 0.2 +
        profitFactor * 0.15 +
        discipline * 0.1 +
        marketTiming * 0.1,
    )
    return Math.min(score, 100)
  }

  const worthScore = calculateWorthScore()

  // Get actual data from dataManager if available
  const stats = dataManager?.getStatistics() || {}

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 transition-colors duration-300 ${isDark ? "dark" : ""}`}>
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tradeworth</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Professional Trading Platform</p>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <Activity className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <PieChart className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <Calendar className="w-4 h-4 mr-2" />
                Journal
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <Target className="w-4 h-4 mr-2" />
                Goals
              </Button>
            </nav>

            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="relative overflow-hidden transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className={`transition-all duration-300 ${isDark ? "rotate-180 scale-0" : "rotate-0 scale-100"}`}>
                  <Sun className="w-4 h-4 text-yellow-500" />
                </div>
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isDark ? "rotate-0 scale-100" : "rotate-180 scale-0"}`}
                >
                  <Moon className="w-4 h-4 text-blue-400" />
                </div>
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{userProfile?.full_name || 'Trader'}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Pro Trader</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-white/80 via-white/90 to-white/95 dark:from-slate-800/80 dark:to-slate-800/95 border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Account Balance</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    ${parseFloat(accountBalance).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +2.4% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/80 via-white/90 to-white/95 dark:from-slate-800/80 dark:to-slate-800/95 border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Win Rate</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.winRate || '73.2'}%</p>
                  <p className="text-xs text-green-600 dark:text-green-500 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +5.1% vs last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/80 via-white/90 to-white/95 dark:from-slate-800/80 dark:to-slate-800/95 border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Monthly P&L</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-500">+${stats.totalPnl || '1,247'}</p>
                  <p className="text-xs text-green-600 dark:text-green-500 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    12.47% return
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/80 via-white/90 to-white/95 dark:from-slate-800/80 dark:to-slate-800/95 border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Risk Score</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">Low</p>
                  <Progress value={25} className="mt-2 h-2" />
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Worth Score card */}
          <Card className="bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-200/30 dark:from-blue-500/10 dark:to-blue-600/20 border-blue-200 dark:border-blue-500/30 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Worth Score</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{worthScore}</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center mt-1">
                    <Award className="w-3 h-3 mr-1" />
                    {worthScore >= 85
                      ? "Elite Trader"
                      : worthScore >= 70
                        ? "Skilled"
                        : worthScore >= 55
                          ? "Developing"
                          : "Needs Focus"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Worth Score radar chart section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Worth Score Radar Chart */}
          <Card className="bg-gradient-to-br from-white/80 via-white/90 to-white/95 dark:from-slate-800/80 dark:to-slate-800/95 border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                <Award className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                <span>Worth Score Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-full h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={tradingMetricsData}>
                      <PolarGrid stroke="rgb(148 163 184)" strokeOpacity={0.4} />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fontSize: 12, fill: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)", fontWeight: 600 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)", fontWeight: 500 }}
                        tickCount={5}
                      />
                      <Radar
                        name="Trading Metrics"
                        dataKey="value"
                        stroke="rgb(37, 99, 235)"
                        fill="rgb(37, 99, 235)"
                        fillOpacity={0.15}
                        strokeWidth={3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mb-1">{worthScore}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Overall Worth Score</p>
                  <Badge
                    variant="outline"
                    className="mt-2 text-blue-600 dark:text-blue-500 border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5"
                  >
                    {worthScore >= 85
                      ? "Elite Trader"
                      : worthScore >= 70
                        ? "Skilled Trader"
                        : worthScore >= 55
                          ? "Developing"
                          : "Needs Focus"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced analytics section with charts */}
          <div className="lg:col-span-2 grid grid-cols-1 gap-6">
            <Card className="bg-gradient-to-br from-white/80 via-white/90 to-white/95 dark:from-slate-800/80 dark:to-slate-800/95 border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                  <TrendingUpIcon className="w-5 h-5 text-blue-600" />
                  <span>Intraday Cumulative P&L</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={intradayPnLData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184)" strokeOpacity={0.4} />
                      <XAxis
                        dataKey="time"
                        stroke={isDark ? "rgb(248 250 252)" : "rgb(15 23 42)"}
                        fontSize={12}
                        fontWeight={600}
                        axisLine={{ stroke: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)", strokeWidth: 1 }}
                        tickLine={{ stroke: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)" }}
                      />
                      <YAxis
                        stroke={isDark ? "rgb(248 250 252)" : "rgb(15 23 42)"}
                        fontSize={12}
                        fontWeight={600}
                        axisLine={{ stroke: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)", strokeWidth: 1 }}
                        tickLine={{ stroke: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "rgb(15 23 42)" : "rgb(255 255 255)",
                          border: `1px solid ${isDark ? "rgb(71 85 105)" : "rgb(203 213 225)"}`,
                          borderRadius: "8px",
                          color: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                        labelStyle={{ color: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)", fontWeight: 600 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke="rgb(22, 163, 74)"
                        fill="rgb(22, 163, 74)"
                        fillOpacity={0.2}
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/80 via-white/90 to-white/95 dark:from-slate-800/80 dark:to-slate-800/95 border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                  <BarChartIcon className="w-5 h-5 text-blue-600" />
                  <span>Monthly Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyPerformanceData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184)" strokeOpacity={0.4} />
                      <XAxis
                        dataKey="month"
                        stroke={isDark ? "rgb(248 250 252)" : "rgb(15 23 42)"}
                        fontSize={12}
                        fontWeight={600}
                        axisLine={{ stroke: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)", strokeWidth: 1 }}
                        tickLine={{ stroke: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)" }}
                      />
                      <YAxis
                        stroke={isDark ? "rgb(248 250 252)" : "rgb(15 23 42)"}
                        fontSize={12}
                        fontWeight={600}
                        axisLine={{ stroke: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)", strokeWidth: 1 }}
                        tickLine={{ stroke: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "rgb(15 23 42)" : "rgb(255 255 255)",
                          border: `1px solid ${isDark ? "rgb(71 85 105)" : "rgb(203 213 225)"}`,
                          borderRadius: "8px",
                          color: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                        labelStyle={{ color: isDark ? "rgb(248 250 252)" : "rgb(15 23 42)", fontWeight: 600 }}
                      />
                      <Bar dataKey="profit" fill="rgb(37, 99, 235)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance heatmap section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-white/80 via-white/90 to-white/95 dark:from-slate-800/80 dark:to-slate-800/95 border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Trading Performance Heatmap</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 gap-2">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 p-2"></div>
                {["9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM"].map((hour) => (
                  <div key={hour} className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center p-2">
                    {hour}
                  </div>
                ))}
                {["Mon", "Tue"].map((day) => (
                  <React.Fragment key={day}>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 p-2 flex items-center">
                      {day}
                    </div>
                    {performanceHeatmapData
                      .filter((d) => d.day === day)
                      .map((cell, index) => (
                        <div
                          key={`${day}-${index}`}
                          className={`
                            aspect-square rounded-md flex items-center justify-center text-xs font-medium
                            ${
                              cell.value >= 90
                                ? "bg-green-500 text-white"
                                : cell.value >= 80
                                  ? "bg-green-400 text-white"
                                  : cell.value >= 70
                                    ? "bg-yellow-400 text-black"
                                    : "bg-red-400 text-white"
                            }
                          `}
                          title={`${day} ${cell.hour}:00 - ${cell.value}% success rate, ${cell.trades} trades`}
                        >
                          {cell.trades}
                        </div>
                      ))}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-slate-600 dark:text-slate-400">
                <span>Number of trades per time slot</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded"></div>
                  <span>&lt;70%</span>
                  <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                  <span>70-80%</span>
                  <div className="w-3 h-3 bg-green-400 rounded"></div>
                  <span>80-90%</span>
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>&gt;90%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trade Calculator */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-white/80 via-white/90 to-white/95 dark:from-slate-800/80 dark:to-slate-800/95 border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Trade Calculator</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="balance" className="text-sm font-medium text-slate-900 dark:text-white">
                    Account Balance ($)
                  </Label>
                  <Input
                    id="balance"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk" className="text-sm font-medium text-slate-900 dark:text-white">
                    Risk Per Trade (%)
                  </Label>
                  <Input
                    id="risk"
                    value={riskPerTrade}
                    onChange={(e) => setRiskPerTrade(e.target.value)}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                  />
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={parseFloat(riskPerTrade) <= 2 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {parseFloat(riskPerTrade) <= 2 ? "Conservative" : "High Risk"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pair" className="text-sm font-medium text-slate-900 dark:text-white">
                    Currency Pair
                  </Label>
                  <Select value={currencyPair} onValueChange={setCurrencyPair}>
                    <option value="EURUSD">EUR/USD</option>
                    <option value="GBPUSD">GBP/USD</option>
                    <option value="USDJPY">USD/JPY</option>
                    <option value="AUDUSD">AUD/USD</option>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="entry" className="text-xs font-medium text-slate-900 dark:text-white">
                      Entry Price
                    </Label>
                    <Input
                      id="entry"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stop" className="text-xs font-medium text-slate-900 dark:text-white">
                      Stop Loss
                    </Label>
                    <Input
                      id="stop"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profit" className="text-xs font-medium text-slate-900 dark:text-white">
                      Take Profit
                    </Label>
                    <Input
                      id="profit"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-sm"
                    />
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Target className="w-4 h-4 mr-2" />
                  Calculate Position
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results & Analytics */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="results" className="space-y-6">
              <div className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 p-1 text-slate-600 dark:text-slate-400 w-full">
                <button
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm flex-1"
                >
                  Position Results
                </button>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex-1">
                  Risk Analysis
                </button>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex-1">
                  Trade History
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-200/30 dark:from-blue-500/10 dark:to-blue-600/20 border-blue-200 dark:border-blue-500/20 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Position Size</h3>
                        <Badge variant="outline" className="text-blue-600 border-blue-300 dark:border-blue-500/30">
                          {currencyPair}
                        </Badge>
                      </div>
                      <p className="text-3xl font-bold text-blue-600 mb-2">{positionSize.toLocaleString()} lots</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{(positionSize * 100000).toLocaleString()} units</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 via-red-100/50 to-red-200/30 dark:from-red-500/10 dark:to-red-600/20 border-red-200 dark:border-red-500/20 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Risk Amount</h3>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-3xl font-bold text-red-600 mb-2">${riskAmount}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{riskPerTrade}% of balance</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 via-green-100/50 to-green-200/30 dark:from-green-500/10 dark:to-green-600/20 border-green-200 dark:border-green-500/20 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Potential Profit</h3>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-green-600 mb-2">${potentialProfit}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Target reward</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-200/30 dark:from-blue-500/10 dark:to-blue-600/20 border-blue-200 dark:border-blue-500/20 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Risk/Reward</h3>
                        <Shield className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-600 mb-2">1:{riskReward}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Ratio analysis</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}