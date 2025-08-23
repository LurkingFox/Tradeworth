import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Calculator, TrendingUp, Shield, AlertTriangle, DollarSign, 
  Calendar, BookOpen, BarChart3, Target, Clock, Filter,
  Plus, Edit, Trash2, ChevronLeft, ChevronRight,
  Activity, Award, AlertCircle, Upload,
  Brain, Zap, CheckCircle, Star, Users, Settings, LineChart
} from 'lucide-react';
import API_CONFIG from './apiConfig'; // Add this import

// TradingView News Widget
const TradingViewNewsWidget = memo(() => {
  const container = useRef();

  useEffect(() => {
    try {
      if (container.current) {
        container.current.innerHTML = '';
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = `
          {
            "displayMode": "regular",
            "feedMode": "all_symbols",
            "colorTheme": "light",
            "isTransparent": false,
            "locale": "en",
            "width": "100%",
            "height": 500
          }`;
        container.current.appendChild(script);
      }
    } catch (e) {
      // Silently ignore TradingView widget errors
      // Optionally log: console.debug('TradingView News Widget error:', e);
    }
    return () => {
      if (container.current) container.current.innerHTML = '';
    };
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/news-flow/?priority=top_stories" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Top stories by TradingView</span>
        </a>
      </div>
    </div>
  );
});

// TradingView Economic Calendar Widget
const TradingViewCalendarWidget = memo(() => {
  const container = useRef();

  useEffect(() => {
    try {
      if (container.current) {
        container.current.innerHTML = '';
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = `
          {
            "colorTheme": "light",
            "isTransparent": false,
            "locale": "en",
            "countryFilter": "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
            "importanceFilter": "-1,0,1",
            "width": "100%",
            "height": 500
          }`;
        container.current.appendChild(script);
      }
    } catch (e) {
      // Silently ignore TradingView widget errors
    }
    return () => {
      if (container.current) container.current.innerHTML = '';
    };
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/economic-calendar/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Economic calendar by TradingView</span>
        </a>
      </div>
    </div>
  );
});

// TradingView Advanced Chart Widget
const TradingViewWidget = memo(() => {
  const container = useRef();

  useEffect(() => {
    try {
      if (container.current) {
        container.current.innerHTML = '';
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = `
          {
            "autosize": true,
            "symbol": "FX_IDC:EURUSD",
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "light",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "calendar": false,
            "support_host": "https://www.tradingview.com"
          }`;
        container.current.appendChild(widgetDiv);
        container.current.appendChild(script);
      }
    } catch (e) {
      // Silently ignore TradingView widget errors
    }
    return () => {
      if (container.current) container.current.innerHTML = '';
    };
  }, []);

  return (
    <div 
      className="tradingview-widget-container" 
      ref={container}
      style={{ height: "100%", width: "100%" }}
    />
  );
});

const TradingJournal = () => {
  const [activeTab, setActiveTab] = useState('risk-calculator');
  const [selectedChartSymbol, setSelectedChartSymbol] = useState('EURUSD');
  
  // Risk Calculator State
  const [riskInputs, setRiskInputs] = useState({
    accountBalance: 10000,
    riskPercent: 2,
    entryPrice: 1.2500,
    stopLoss: 1.2450,
    takeProfit: 1.2600,
    currencyPair: 'EURUSD'
  });
  const [riskResults, setRiskResults] = useState({});

  // Trade Journal State
  const [trades, setTrades] = useState([
    {
      id: 1,
      date: '2025-08-20',
      pair: 'EURUSD',
      type: 'BUY',
      entry: 1.2500,
      exit: 1.2580,
      stopLoss: 1.2450,
      takeProfit: 1.2600,
      lotSize: 0.1,
      pnl: 80,
      status: 'closed',
      notes: 'Bullish breakout above resistance',
      setup: 'Trend Following',
      rr: 1.6
    },
    {
      id: 2,
      date: '2025-08-21',
      pair: 'GBPUSD',
      type: 'SELL',
      entry: 1.3200,
      exit: 1.3150,
      stopLoss: 1.3250,
      takeProfit: 1.3100,
      lotSize: 0.15,
      pnl: 75,
      status: 'closed',
      notes: 'Bearish divergence on RSI',
      setup: 'Reversal',
      rr: 2.0
    }
  ]);

  const [newTrade, setNewTrade] = useState({
    date: new Date().toISOString().split('T')[0],
    pair: 'EURUSD',
    type: 'BUY',
    entry: '',
    exit: '',
    stopLoss: '',
    takeProfit: '',
    lotSize: '',
    notes: '',
    setup: 'Trend Following'
  });

  const [showAddTrade, setShowAddTrade] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Goals State
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: 'Achieve 65% Win Rate',
      description: 'Improve trade selection and timing to reach 65% win rate',
      priority: 'High',
      deadline: '2025-12-31',
      status: 'In Progress',
      progress: 45,
      milestones: [
        { id: 1, text: 'Analyze losing trades', completed: true },
        { id: 2, text: 'Refine entry criteria', completed: true },
        { id: 3, text: 'Practice on demo account', completed: false },
        { id: 4, text: 'Apply new strategy live', completed: false }
      ]
    },
    {
      id: 2,
      title: 'Increase Account by 20%',
      description: 'Grow trading account by 20% over the next 6 months',
      priority: 'High',
      deadline: '2026-02-22',
      status: 'Not Started',
      progress: 0,
      milestones: [
        { id: 1, text: 'Set monthly targets', completed: false },
        { id: 2, text: 'Track monthly progress', completed: false },
        { id: 3, text: 'Review and adjust strategy', completed: false }
      ]
    }
  ]);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    deadline: '',
    milestones: ['']
  });
  const [showAddGoal, setShowAddGoal] = useState(false);

  const majorPairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
    'EURJPY', 'GBPJPY', 'EURGBP', 'AUDCAD', 'GBPAUD', 'XAUUSD', 'BTCUSD'
  ];

  const tradeSetups = [
    'Trend Following', 'Reversal', 'Breakout', 'Support/Resistance', 
    'News Trading', 'Scalping', 'Swing Trading', 'Other'
  ];

  // Risk Calculator Functions
  const calculateRisk = () => {
    try {
      const { accountBalance, riskPercent, entryPrice, stopLoss, takeProfit } = riskInputs;
      
      const pipDifference = Math.abs(entryPrice - stopLoss);
      const rewardPipDifference = Math.abs(takeProfit - entryPrice);
      
      const isJpyPair = riskInputs.currencyPair.includes('JPY');
      const isGoldPair = riskInputs.currencyPair === 'XAUUSD';
      const isBtcPair = riskInputs.currencyPair === 'BTCUSD';
      
      let pipSize;
      if (isJpyPair) {
        pipSize = 0.01;
      } else if (isGoldPair) {
        pipSize = 0.1;
      } else if (isBtcPair) {
        pipSize = 1;
      } else {
        pipSize = 0.0001;
      }
      
      const pipsAtRisk = pipDifference / pipSize;
      const rewardPips = rewardPipDifference / pipSize;
      const riskAmount = (accountBalance * riskPercent) / 100;
      const pipValue = riskAmount / pipsAtRisk;
      
      let lotSize;
      let positionSizeStandardLots;
      
      if (isGoldPair) {
        lotSize = (riskAmount / pipsAtRisk) / 10;
        positionSizeStandardLots = lotSize;
      } else if (isBtcPair) {
        lotSize = riskAmount / pipsAtRisk;
        positionSizeStandardLots = lotSize;
      } else {
        const standardLotSize = 100000;
        lotSize = (pipValue * standardLotSize) / (isJpyPair ? 100 : 1);
        positionSizeStandardLots = lotSize / standardLotSize;
      }
      
      const rrRatio = rewardPips / pipsAtRisk;
      const potentialProfit = riskAmount * rrRatio;
      
      setRiskResults({
        riskAmount: riskAmount.toFixed(2),
        pipsAtRisk: pipsAtRisk.toFixed(1),
        rewardPips: rewardPips.toFixed(1),
        rrRatio: rrRatio.toFixed(2),
        lotSize: isGoldPair || isBtcPair ? lotSize.toFixed(4) : lotSize.toFixed(0),
        positionSizeStandardLots: positionSizeStandardLots.toFixed(4),
        pipValue: pipValue.toFixed(2),
        potentialProfit: potentialProfit.toFixed(2),
        breakEvenWinRate: ((1 / (1 + rrRatio)) * 100).toFixed(1),
        instrumentType: isGoldPair ? 'oz' : isBtcPair ? 'BTC' : 'units'
      });
    } catch (error) {
      console.error('Risk calculation error:', error);
    }
  };

  useEffect(() => {
    calculateRisk();
  }, [riskInputs]);

  const handleRiskInputChange = (field, value) => {
    setRiskInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || value
    }));
  };

  const getRiskLevel = () => {
    if (riskInputs.riskPercent <= 1) return { level: 'Conservative', color: 'text-green-600', bg: 'bg-green-50' };
    if (riskInputs.riskPercent <= 2) return { level: 'Moderate', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (riskInputs.riskPercent <= 5) return { level: 'Aggressive', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { level: 'High Risk', color: 'text-red-600', bg: 'bg-red-50' };
  };

  // Trade Journal Functions
  const addTrade = () => {
    if (!newTrade.entry || !newTrade.stopLoss || !newTrade.takeProfit || !newTrade.lotSize) return;
    
    const pnl = newTrade.exit ? 
      (parseFloat(newTrade.exit) - parseFloat(newTrade.entry)) * parseFloat(newTrade.lotSize) * 10000 : 0;
    
    const trade = {
      id: Date.now(),
      ...newTrade,
      entry: parseFloat(newTrade.entry),
      exit: newTrade.exit ? parseFloat(newTrade.exit) : null,
      stopLoss: parseFloat(newTrade.stopLoss),
      takeProfit: parseFloat(newTrade.takeProfit),
      lotSize: parseFloat(newTrade.lotSize),
      pnl: pnl,
      status: newTrade.exit ? 'closed' : 'open',
      rr: Math.abs((parseFloat(newTrade.takeProfit) - parseFloat(newTrade.entry)) / 
                  (parseFloat(newTrade.entry) - parseFloat(newTrade.stopLoss)))
    };
    
    setTrades(prev => [...prev, trade]);
    setNewTrade({
      date: new Date().toISOString().split('T')[0],
      pair: 'EURUSD',
      type: 'BUY',
      entry: '',
      exit: '',
      stopLoss: '',
      takeProfit: '',
      lotSize: '',
      notes: '',
      setup: 'Trend Following'
    });
    setShowAddTrade(false);
  };

  const deleteTrade = (id) => {
    setTrades(prev => prev.filter(trade => trade.id !== id));
  };

  // Goals Functions
  const addGoal = () => {
    if (!newGoal.title || !newGoal.description || !newGoal.deadline) return;
    
    const goal = {
      id: Date.now(),
      ...newGoal,
      status: 'Not Started',
      progress: 0,
      milestones: newGoal.milestones.filter(m => m.trim()).map((text, index) => ({
        id: index + 1,
        text: text.trim(),
        completed: false
      }))
    };
    
    setGoals(prev => [...prev, goal]);
    setNewGoal({
      title: '',
      description: '',
      priority: 'Medium',
      deadline: '',
      milestones: ['']
    });
    setShowAddGoal(false);
  };

  const toggleMilestone = (goalId, milestoneId) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const updatedMilestones = goal.milestones.map(milestone =>
          milestone.id === milestoneId 
            ? { ...milestone, completed: !milestone.completed }
            : milestone
        );
        
        const completedCount = updatedMilestones.filter(m => m.completed).length;
        const progress = (completedCount / updatedMilestones.length) * 100;
        
        return {
          ...goal,
          milestones: updatedMilestones,
          progress: progress,
          status: progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'
        };
      }
      return goal;
    }));
  };

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  // Statistics
  const calculateStats = () => {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => t.pnl > 0);
    const losingTrades = closedTrades.filter(t => t.pnl < 0);
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: winRate.toFixed(1),
      totalPnL: totalPnL.toFixed(2),
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      openTrades: trades.filter(t => t.status === 'open').length
    };
  };

  const stats = calculateStats();
  const riskLevel = getRiskLevel();

  const filteredTrades = trades.filter(trade => {
    if (filterStatus === 'all') return true;
    return trade.status === filterStatus;
  });

  // AI Analysis State
  const [claudeAnalysis, setClaudeAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyChecked, setApiKeyChecked] = useState(false);
  const [defaultApiKeyValid, setDefaultApiKeyValid] = useState(false);

  // Import/Export State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [selectedImports, setSelectedImports] = useState([]);
  const [importMethod, setImportMethod] = useState('paste'); // 'paste' or 'file'
  const [dragOver, setDragOver] = useState(false);

  // Check the default API key on mount
  useEffect(() => {
    const checkDefaultApiKey = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: API_CONFIG.ANTHROPIC_API_KEY,
            prompt: "Test connection"
          })
        });
        if (response.ok) {
          setDefaultApiKeyValid(true);
        }
      } catch (e) {
        setDefaultApiKeyValid(false);
      } finally {
        setApiKeyChecked(true);
      }
    };
    checkDefaultApiKey();
  }, []);

  // AI Analysis Function
  const analyzeTradesWithClaude = async (analysisType = 'performance') => {
    let keyToUse = anthropicApiKey;
    if (defaultApiKeyValid && !anthropicApiKey) {
      keyToUse = API_CONFIG.ANTHROPIC_API_KEY;
    }
    if (!keyToUse) {
      setShowApiKeyModal(true);
      return;
    }

    setAnalysisLoading(true);
    setClaudeAnalysis(""); // Clear previous analysis

    try {
      const stats = calculateStats();
      const recentTrades = trades.slice(-5);

      let prompt = `As a professional trading analyst, analyze this trading performance data:

ACCOUNT PERFORMANCE:
- Total Trades: ${stats.totalTrades}
- Win Rate: ${stats.winRate}%
- Total P&L: ${stats.totalPnL}
- Profit Factor: ${stats.profitFactor}

RECENT TRADES:
${recentTrades.map(t => `${t.date}: ${t.pair} ${t.type} - P&L: ${t.pnl}`).join('\n')}

Provide specific, actionable insights for trading improvement.`;

      const response = await fetch("http://localhost:4000/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          apiKey: keyToUse,
          prompt
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        setClaudeAnalysis("Error: Invalid response from backend (not JSON).");
        setAnalysisLoading(false);
        return;
      }

      if (!response.ok) {
        setClaudeAnalysis(
          data && data.error
            ? `Error: ${data.error}`
            : `Error: API request failed with status ${response.status}`
        );
        setAnalysisLoading(false);
        return;
      }

      // Handle Anthropic response structure
      if (data.content && Array.isArray(data.content) && data.content[0] && data.content[0].text) {
        setClaudeAnalysis(data.content[0].text);
      } else if (data.completion) {
        setClaudeAnalysis(data.completion);
      } else if (data.error) {
        setClaudeAnalysis(`Error: ${data.error}`);
      } else {
        setClaudeAnalysis("Error: Unexpected response format from Claude API.");
      }
    } catch (error) {
      setClaudeAnalysis(`Error: ${error.message || error}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const parseTradeHistory = (text) => {
    // Find the "Positions" section and its header
    const lines = text.trim().split('\n');
    let headerIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (
        lines[i].toLowerCase().includes('time') &&
        lines[i].toLowerCase().includes('symbol') &&
        lines[i].toLowerCase().includes('type') &&
        lines[i].toLowerCase().includes('volume')
      ) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) return [];

    const headerLine = lines[headerIdx];
    const delimiter = headerLine.includes(';') ? ';' : ',';
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());

    // Helper to find column index by possible names
    const findCol = (names) => {
      for (let n of names) {
        const idx = headers.findIndex(h => h.includes(n));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    // Map columns
    const colIdx = {
      date: findCol(['time']),
      pair: findCol(['symbol']),
      type: findCol(['type']),
      entry: findCol(['price']),
      stopLoss: findCol(['s / l', 'sl']),
      takeProfit: findCol(['t / p', 'tp']),
      exit: findCol(['price', 'close price']),
      lotSize: findCol(['volume']),
      pnl: findCol(['profit']),
    };

    // Helper to parse European numbers (e.g., "3 328,74" or "- 0,94")
    const parseEuroNum = (val) => {
      if (!val) return 0;
      return parseFloat(val.replace(/\s/g, '').replace(',', '.').replace('−', '-').replace(/[^0-9.-]/g, '')) || 0;
    };

    // Parse each trade row
    const trades = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const row = lines[i].trim();
      if (!row || row.startsWith(';;;;;')) break; // End of section
      const cols = row.split(delimiter).map(c => c.trim());
      if (cols.length < 8) continue;

      // Only parse rows with a valid symbol and type
      if (!cols[colIdx.pair] || !cols[colIdx.type]) continue;

      // Parse open/close times
      let date = cols[colIdx.date] ? cols[colIdx.date].split(' ')[0].replace(/\./g, '-') : '';
      let entry = parseEuroNum(cols[colIdx.entry]);
      let exit = parseEuroNum(cols[colIdx.exit === colIdx.entry ? 9 : colIdx.exit]); // Use the second "Price" as exit
      let stopLoss = parseEuroNum(cols[colIdx.stopLoss]);
      let takeProfit = parseEuroNum(cols[colIdx.takeProfit]);
      let lotSize = parseEuroNum(cols[colIdx.lotSize]);
      let pnl = parseEuroNum(cols[colIdx.pnl]);

      // Clean up symbol (remove trailing 's' for XAUUSDs)
      let pair = cols[colIdx.pair];
      if (pair.endsWith('s') && pair !== 'USDSGD') pair = pair.slice(0, -1);

      trades.push({
        id: Date.now() + i,
        date: date || new Date().toISOString().split('T')[0],
        pair: pair,
        type: (cols[colIdx.type] || 'BUY').toUpperCase(),
        entry,
        exit,
        stopLoss,
        takeProfit,
        lotSize: lotSize || 0.01,
        pnl,
        notes: 'Imported from broker CSV',
        setup: 'Imported',
        status: exit ? 'closed' : 'open',
        rr: (entry && stopLoss && takeProfit && entry !== stopLoss)
          ? Math.abs((takeProfit - entry) / (entry - stopLoss))
          : 1
      });
    }

    // Only return trades with valid entry and lot size
    return trades.filter(t => t.entry && t.lotSize && t.pair);
  };

  const analyzeImportedTrades = (trades) => ({
    totalTrades: trades.length,
    validTrades: trades.filter(t => t.pair && t.entry && t.lotSize).length,
    closedTrades: trades.filter(t => t.status === 'closed').length,
    openTrades: trades.filter(t => t.status === 'open').length,
    totalPnL: trades.reduce((sum, t) => sum + (t.pnl || 0), 0),
    winRate: trades.filter(t => t.status === 'closed').length > 0 ? 
      (trades.filter(t => t.pnl > 0).length / trades.filter(t => t.status === 'closed').length) * 100 : 0
  });

  const handleImportAnalysis = () => {
    if (!importText.trim()) return;
    const parsedTrades = parseTradeHistory(importText);
    const analysis = analyzeImportedTrades(parsedTrades);
    setImportResults({
      trades: parsedTrades,
      analysis: analysis
    });
    setSelectedImports(parsedTrades.map((_, index) => index));
  };

  const importSelectedTrades = () => {
    if (!importResults || selectedImports.length === 0) return;
    const tradesToImport = selectedImports.map(index => importResults.trades[index]);
    setTrades(prev => [...prev, ...tradesToImport]);
    setImportText('');
    setImportResults(null);
    setSelectedImports([]);
    setShowImportModal(false);
  };

  const toggleTradeSelection = (index) => {
    setSelectedImports(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleFileUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImportText(e.target.result);
      // Automatically analyze after file is loaded
      setTimeout(() => {
        handleImportAnalysis();
      }, 0);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Professional Trading Journal</h1>
        <p className="text-gray-600 text-lg">Complete trading management platform with risk calculator, journal & analytics</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center mb-8 bg-white rounded-xl p-2 shadow-lg">
        {[
          { id: 'risk-calculator', label: 'Risk Calculator', icon: Calculator },
          { id: 'journal', label: 'Trade Journal', icon: BookOpen },
          { id: 'charts', label: 'Charts', icon: LineChart },
          { id: 'news', label: 'News & Calendar', icon: Calendar },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'goals', label: 'Goals', icon: Target },
          { id: 'ai-analysis', label: 'AI Analysis', icon: Brain }
        ].map(tab => {
          const Icon = tab.icon;
          // Disable AI tab until API key check is done
          const isAiTab = tab.id === 'ai-analysis';
          const disabled = isAiTab && !apiKeyChecked;
          return (
            <button
              key={tab.id}
              onClick={() => !disabled && setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 mx-1 rounded-lg transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={disabled}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{tab.label}</span>
              {/* Spinner for AI tab while checking */}
              {isAiTab && !apiKeyChecked && (
                <span className="ml-2">
                  <svg className="animate-spin h-4 w-4 text-blue-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Risk Calculator Tab */}
      {activeTab === 'risk-calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Calculator className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-800">Trade Parameters</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Balance ($)</label>
                <input
                  type="number"
                  value={riskInputs.accountBalance}
                  onChange={(e) => handleRiskInputChange('accountBalance', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Per Trade (%)</label>
                <input
                  type="number"
                  value={riskInputs.riskPercent}
                  onChange={(e) => handleRiskInputChange('riskPercent', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  step="0.1"
                />
                <div className={`mt-2 px-3 py-2 rounded-lg ${riskLevel.bg}`}>
                  <span className={`font-medium ${riskLevel.color}`}>Risk Level: {riskLevel.level}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency Pair</label>
                <select
                  value={riskInputs.currencyPair}
                  onChange={(e) => handleRiskInputChange('currencyPair', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {majorPairs.map(pair => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Price</label>
                  <input
                    type="number"
                    value={riskInputs.entryPrice}
                    onChange={(e) => handleRiskInputChange('entryPrice', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.0001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss</label>
                  <input
                    type="number"
                    value={riskInputs.stopLoss}
                    onChange={(e) => handleRiskInputChange('stopLoss', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.0001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Take Profit</label>
                  <input
                    type="number"
                    value={riskInputs.takeProfit}
                    onChange={(e) => handleRiskInputChange('takeProfit', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.0001"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setNewTrade(prev => ({
                    ...prev,
                    pair: riskInputs.currencyPair,
                    entry: riskInputs.entryPrice.toString(),
                    stopLoss: riskInputs.stopLoss.toString(),
                    takeProfit: riskInputs.takeProfit.toString(),
                    lotSize: riskResults.positionSizeStandardLots || '0.01'
                  }));
                  setShowAddTrade(true);
                  setActiveTab('journal');
                }}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Trade to Journal
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Target className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-800">Position Sizing Results</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Position Size</p>
                <p className="text-2xl font-bold text-blue-600">{riskResults.positionSizeStandardLots || '0.00'} lots</p>
                <p className="text-xs text-gray-500">{riskResults.lotSize || '0'} {riskResults.instrumentType || 'units'}</p>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Risk Amount</p>
                <p className="text-2xl font-bold text-red-600">${riskResults.riskAmount || '0.00'}</p>
                <p className="text-xs text-gray-500">{riskInputs.riskPercent}% of balance</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Potential Profit</p>
                <p className="text-2xl font-bold text-green-600">${riskResults.potentialProfit || '0.00'}</p>
                <p className="text-xs text-gray-500">{riskResults.rewardPips || '0'} pips</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Risk/Reward</p>
                <p className="text-2xl font-bold text-purple-600">1:{riskResults.rrRatio || '0.00'}</p>
                <p className="text-xs text-gray-500">{riskResults.pipsAtRisk || '0'} pips risk</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Pip Value</span>
                <span className="font-semibold">${riskResults.pipValue || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Break-even Win Rate</span>
                <span className="font-semibold">{riskResults.breakEvenWinRate || '0.0'}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News & Calendar Tab */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Market News & Economic Calendar</h2>
            <p className="text-gray-600">Stay informed with real-time market news and upcoming economic events</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Market News Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-lg">📰</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Market News</h3>
                  <p className="text-sm text-gray-600">Real-time financial news and market updates</p>
                </div>
              </div>

              {/* News Widget Container */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <TradingViewNewsWidget />
              </div>

              {/* News Features */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-sm font-semibold text-blue-800">Breaking News</div>
                  <div className="text-xs text-blue-600">Market-moving events</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-sm font-semibold text-green-800">Analysis</div>
                  <div className="text-xs text-green-600">Expert insights</div>
                </div>
              </div>
            </div>

            {/* Economic Calendar Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-lg">📅</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Economic Calendar</h3>
                  <p className="text-sm text-gray-600">Upcoming economic events and data releases</p>
                </div>
              </div>

              {/* Calendar Widget Container */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <TradingViewCalendarWidget />
              </div>

              {/* Calendar Features */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                  <div className="text-xs font-semibold text-red-800">High Impact</div>
                  <div className="text-xs text-red-600">🔴</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                  <div className="text-xs font-semibold text-yellow-800">Medium Impact</div>
                  <div className="text-xs text-yellow-600">🟡</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <div className="text-xs font-semibold text-gray-800">Low Impact</div>
                  <div className="text-xs text-gray-600">⚪</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Tips Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 text-lg">💡</span>
              </div>
              News Trading Guidelines
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Before High-Impact Events</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Reduce position sizes</li>
                  <li>• Widen stop losses</li>
                  <li>• Avoid new trades 30 min before</li>
                  <li>• Monitor economic forecasts</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">⚡ During News Events</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Expect high volatility</li>
                  <li>• Watch for fake breakouts</li>
                  <li>• Wait for market direction</li>
                  <li>• Use smaller lot sizes</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">🎯 After News Release</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Wait 15-30 minutes</li>
                  <li>• Look for trend continuation</li>
                  <li>• Check for reversal patterns</li>
                  <li>• Resume normal trading</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Key Economic Indicators */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-orange-600 text-lg">📈</span>
              </div>
              Key Economic Indicators to Watch
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'NFP', desc: 'Non-Farm Payrolls', impact: 'Very High', currency: 'USD' },
                { name: 'CPI', desc: 'Consumer Price Index', impact: 'High', currency: 'USD/EUR' },
                { name: 'GDP', desc: 'Gross Domestic Product', impact: 'High', currency: 'All' },
                { name: 'Interest Rates', desc: 'Central Bank Rates', impact: 'Very High', currency: 'All' }
              ].map((indicator, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800">{indicator.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{indicator.desc}</p>
                  <div className="flex justify-between text-xs">
                    <span className={`px-2 py-1 rounded ${
                      indicator.impact === 'Very High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {indicator.impact}
                    </span>
                    <span className="text-gray-500">{indicator.currency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                <LineChart className="h-6 w-6 text-green-600 mr-2" />
                Professional Trading Charts
              </h2>
              <div className="text-sm text-gray-600">
                Powered by TradingView • Live Market Data
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">📈</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-blue-800">Native TradingView Integration</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Complete professional charting platform with real-time data, technical indicators, and drawing tools. 
                    Use the symbol search and toolbar controls within the chart for full functionality.
                  </p>
                </div>
              </div>
            </div>

            {/* Full TradingView Chart Container */}
            <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: '700px' }}>
              <TradingViewWidget />
            </div>

            {/* Chart Features Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-semibold text-green-800 mb-1">Real-Time Data</h4>
                <p className="text-sm text-green-700">Live market feeds from global exchanges</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🛠️</div>
                <h4 className="font-semibold text-blue-800 mb-1">Pro Tools</h4>
                <p className="text-sm text-blue-700">Full suite of technical analysis tools</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold text-purple-800 mb-1">Indicators</h4>
                <p className="text-sm text-purple-700">100+ technical indicators available</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">💾</div>
                <h4 className="font-semibold text-orange-800 mb-1">Save Layouts</h4>
                <p className="text-sm text-orange-700">Preserve your chart configurations</p>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">💡 Chart Navigation Tips:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <strong>Symbol Search:</strong> Use the search box in the top-left of the chart to change instruments
                </div>
                <div>
                  <strong>Timeframes:</strong> Click timeframe buttons (1m, 5m, 1h, 1D, etc.) to change chart period
                </div>
                <div>
                  <strong>Indicators:</strong> Click the indicator button to add technical analysis tools
                </div>
                <div>
                  <strong>Drawing Tools:</strong> Use the left toolbar to add trend lines, support/resistance levels
                </div>
              </div>
            </div>

            {/* External Link */}
            <div className="mt-6 text-center">
              <a 
                href="https://www.tradingview.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                Open Full TradingView Platform →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Trade Journal Tab */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddTrade(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Trade
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Upload className="h-5 w-5 mr-2" />
                Import
              </button>

              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Trades</option>
                  <option value="open">Open Trades</option>
                  <option value="closed">Closed Trades</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add Trade Form */}
          {showAddTrade && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Add New Trade</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={newTrade.date}
                    onChange={(e) => setNewTrade(prev => ({...prev, date: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pair</label>
                  <select
                    value={newTrade.pair}
                    onChange={(e) => setNewTrade(prev => ({...prev, pair: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {majorPairs.map(pair => (
                      <option key={pair} value={pair}>{pair}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newTrade.type}
                    onChange={(e) => setNewTrade(prev => ({...prev, type: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Setup</label>
                  <select
                    value={newTrade.setup}
                    onChange={(e) => setNewTrade(prev => ({...prev, setup: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {tradeSetups.map(setup => (
                      <option key={setup} value={setup}>{setup}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Price</label>
                  <input
                    type="number"
                    value={newTrade.entry}
                    onChange={(e) => setNewTrade(prev => ({...prev, entry: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.0001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss</label>
                  <input
                    type="number"
                    value={newTrade.stopLoss}
                    onChange={(e) => setNewTrade(prev => ({...prev, stopLoss: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.0001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Take Profit</label>
                  <input
                    type="number"
                    value={newTrade.takeProfit}
                    onChange={(e) => setNewTrade(prev => ({...prev, takeProfit: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.0001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lot Size</label>
                  <input
                    type="number"
                    value={newTrade.lotSize}
                    onChange={(e) => setNewTrade(prev => ({...prev, lotSize: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exit Price (Optional)</label>
                  <input
                    type="number"
                    value={newTrade.exit}
                    onChange={(e) => setNewTrade(prev => ({...prev, exit: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.0001"
                    placeholder="Leave empty for open trades"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade(prev => ({...prev, notes: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Trade analysis, market conditions, emotions, etc."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={addTrade}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Trade
                </button>
                <button
                  onClick={() => {
                    setShowAddTrade(false);
                    setNewTrade({
                      date: new Date().toISOString().split('T')[0],
                      pair: 'EURUSD',
                      type: 'BUY',
                      entry: '',
                      exit: '',
                      stopLoss: '',
                      takeProfit: '',
                      lotSize: '',
                      notes: '',
                      setup: 'Trend Following'
                    });
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Trades List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lots</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trade.pair}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.entry}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trade.exit || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.lotSize}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold ${
                          trade.pnl > 0 ? 'text-green-600' : trade.pnl < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          ${trade.pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {trade.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => deleteTrade(trade.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total P&L</p>
                  <p className={`text-2xl font-bold ${
                    parseFloat(stats.totalPnL) > 0 ? 'text-green-600' : 
                    parseFloat(stats.totalPnL) < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    ${stats.totalPnL}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.winRate}%</p>
                </div>
                <Award className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Trades</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalTrades}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open Trades</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.openTrades}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              Performance Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Winning Trades</p>
                <p className="text-xl font-bold text-green-600">{stats.winningTrades}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Losing Trades</p>
                <p className="text-xl font-bold text-red-600">{stats.losingTrades}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Average Win</p>
                <p className="text-xl font-bold text-green-600">${stats.avgWin}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Profit Factor</p>
                <p className={`text-xl font-bold ${
                  parseFloat(stats.profitFactor) > 1 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.profitFactor}
                </p>
              </div>
            </div>

            {/* Trading Insights */}
            <div className="mt-6 space-y-4">
              {parseFloat(stats.profitFactor) < 1 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800">Low Profit Factor</h4>
                      <p className="text-sm text-red-700">Your average losses exceed average wins. Focus on better risk/reward ratios.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {parseFloat(stats.winRate) < 50 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Low Win Rate</h4>
                      <p className="text-sm text-yellow-700">Consider improving your entry timing or trade selection criteria.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {parseFloat(stats.totalPnL) > 0 && parseFloat(stats.winRate) > 60 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Award className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800">Strong Performance</h4>
                      <p className="text-sm text-green-700">Excellent win rate and positive P&L. Keep up the consistent approach!</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Key Recommendations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Maintain consistent position sizing (2% rule)</li>
                  <li>• Focus on setups with 1:2+ risk/reward ratios</li>
                  <li>• Review and learn from losing trades</li>
                  <li>• Keep detailed trade notes for pattern recognition</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Target className="h-6 w-6 text-blue-600 mr-2" />
              Trading Goals & Planning
            </h2>
            <button
              onClick={() => setShowAddGoal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Goal
            </button>
          </div>

          {/* Add Goal Form */}
          {showAddGoal && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Create SMART Trading Goal</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title *</label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal(prev => ({...prev, title: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Achieve 65% Win Rate"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({...prev, description: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Detailed description of what you want to achieve and why..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={newGoal.priority}
                      onChange={(e) => setNewGoal(prev => ({...prev, priority: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                    <input
                      type="date"
                      value={newGoal.deadline}
                      onChange={(e) => setNewGoal(prev => ({...prev, deadline: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Milestones</label>
                  {newGoal.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={milestone}
                        onChange={(e) => {
                          const updatedMilestones = [...newGoal.milestones];
                          updatedMilestones[index] = e.target.value;
                          setNewGoal(prev => ({...prev, milestones: updatedMilestones}));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={`Milestone ${index + 1}`}
                      />
                      <button
                        onClick={() => {
                          const updatedMilestones = newGoal.milestones.filter((_, i) => i !== index);
                          setNewGoal(prev => ({...prev, milestones: updatedMilestones}));
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setNewGoal(prev => ({...prev, milestones: [...prev.milestones, '']}))}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Milestone
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={addGoal}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Goal
                </button>
                <button
                  onClick={() => {
                    setShowAddGoal(false);
                    setNewGoal({
                      title: '',
                      description: '',
                      priority: 'Medium',
                      deadline: '',
                      milestones: ['']
                    });
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Goals List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {goals.map((goal) => (
                <div key={goal.id} className="p-6 flex flex-col sm:flex-row">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-gray-800 truncate">{goal.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs font-medium rounded-full" style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem', paddingTop: '0.125rem', paddingBottom: '0.125rem', backgroundColor: goal.priority === 'High' ? '#d1fae5' : goal.priority === 'Medium' ? '#e0f2fe' : '#f3e8ff' }}>
                        {goal.priority} Priority
                      </span>
                      <span className="text-xs font-medium rounded-full" style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem', paddingTop: '0.125rem', paddingBottom: '0.125rem', backgroundColor: goal.status === 'Completed' ? '#d1e7dd' : goal.status === 'In Progress' ? '#fff3cd' : '#f8d7da' }}>
                        {goal.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{goal.progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            goal.progress === 100 ? 'bg-green-500' :
                            goal.progress > 50 ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Milestone Toggle Buttons */}
                  <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-4 space-y-2">
                    {goal.milestones.map((milestone) => (
                      <button
                        key={milestone.id}
                        onClick={() => toggleMilestone(goal.id, milestone.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          milestone.completed ? 'bg-green-500' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        title={milestone.text}
                      >
                        {milestone.completed && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Tab */}
      {activeTab === 'ai-analysis' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                <Brain className="h-6 w-6 text-purple-600 mr-2" />
                AI-Powered Trading Analysis
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">AI Analysis Ready</span>
                </div>
                <p className="text-blue-700 text-sm mt-2">
                  Get professional-grade trading insights powered by AI analysis of your trading data.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => analyzeTradesWithClaude('performance')}
                  disabled={analysisLoading}
                  className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span className="font-semibold">Performance Analysis</span>
                  <span className="text-xs text-blue-100 mt-1">Win rate, P&L, patterns</span>
                </button>

                <button
                  onClick={() => analyzeTradesWithClaude('risk')}
                  disabled={analysisLoading}
                  className="flex flex-col items-center p-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
                >
                  <Shield className="h-6 w-6 mb-2" />
                  <span className="font-semibold">Risk Assessment</span>
                  <span className="text-xs text-red-100 mt-1">Position sizing, risk management</span>
                </button>

                <button
                  onClick={() => analyzeTradesWithClaude('strategy')}
                  disabled={analysisLoading}
                  className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  <Target className="h-6 w-6 mb-2" />
                  <span className="font-semibold">Strategy Review</span>
                  <span className="text-xs text-purple-100 mt-1">Setup analysis, improvements</span>
                </button>
              </div>

              {(analysisLoading || claudeAnalysis) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                    AI Trading Analysis
                  </h3>
                  
                  {analysisLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Analyzing your trading data...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-700 bg-white p-4 rounded-lg border text-sm leading-relaxed">
                      {claudeAnalysis}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Award className="h-5 w-5 text-yellow-500 mr-2" />
                AI Analysis Features
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span><strong>Performance Insights:</strong> Deep dive into win rates, profit patterns, and trading efficiency</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span><strong>Risk Assessment:</strong> Professional evaluation of position sizing and risk management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span><strong>Strategy Optimization:</strong> Identify successful patterns and improvement opportunities</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span><strong>Personalized Recommendations:</strong> Tailored advice based on your trading style</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                Professional Grade Analysis
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>Powered by advanced AI analysis, providing the same insights used by professional trading firms.</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Analysis Includes:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Performance pattern recognition</li>
                    <li>• Risk management evaluation</li>
                    <li>• Strategy optimization recommendations</li>
                    <li>• Market condition assessment</li>
                    <li>• Actionable improvement strategies</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Connect Claude AI</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="sk-ant-..."
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>How to get your API key:</strong><br/>
                  1. Visit console.anthropic.com<br/>
                  2. Sign up or log in<br/>
                  3. Navigate to "API Keys"<br/>
                  4. Create a new key<br/>
                  5. Copy and paste it here
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  disabled={!anthropicApiKey}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  Connect
                </button>
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">Import Trade History</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                  setImportResults(null);
                  setSelectedImports([]);
                  setImportMethod('paste');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {!importResults ? (
              <div className="space-y-6">
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setImportMethod('paste')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      importMethod === 'paste' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📋 Paste Data
                  </button>
                  <button
                    onClick={() => setImportMethod('file')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      importMethod === 'file' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📁 Upload File
                  </button>
                </div>

                {importMethod === 'paste' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paste your trade history data:
                    </label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Paste your trade data here..."
                    />
                    <button
                      onClick={handleImportAnalysis}
                      disabled={!importText.trim()}
                      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Analyze & Preview
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragOver 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="text-4xl">📁</div>
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          Drop your trade history file here
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Supports CSV, TXT files up to 10MB
                        </p>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleFileUpload(file);
                          }}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Choose File
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-3">
                    Import Analysis
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-green-600 font-medium">Total Trades:</span>
                      <p className="text-green-800 font-semibold">{importResults.analysis.totalTrades}</p>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">Valid Trades:</span>
                      <p className="text-green-800 font-semibold">{importResults.analysis.validTrades}</p>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">Total P&L:</span>
                      <p className={`font-semibold ${importResults.analysis.totalPnL >= 0 ? 'text-green-800' : 'text-red-600'}`}>
                        ${importResults.analysis.totalPnL.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">Win Rate:</span>
                      <p className="text-green-800 font-semibold">{importResults.analysis.winRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-800">Preview & Select Trades</h4>
                    <div className="space-x-2">
                      <button
                        onClick={() => setSelectedImports(importResults.trades.map((_, i) => i))}
                        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedImports([])}
                        className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                      >
                        Select None
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Select</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Pair</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-left">Entry</th>
                          <th className="px-3 py-2 text-left">Exit</th>
                          <th className="px-3 py-2 text-left">Lots</th>
                          <th className="px-3 py-2 text-left">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResults.trades.map((trade, index) => (
                          <tr key={index} className={`border-t ${selectedImports.includes(index) ? 'bg-blue-50' : ''}`}>
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selectedImports.includes(index)}
                                onChange={() => toggleTradeSelection(index)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-3 py-2">{trade.date}</td>
                            <td className="px-3 py-2 font-medium">{trade.pair}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 text-xs rounded ${
                                trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {trade.type}
                              </span>
                            </td>
                            <td className="px-3 py-2">{trade.entry}</td>
                            <td className="px-3 py-2">{trade.exit || '-'}</td>
                            <td className="px-3 py-2">{trade.lotSize}</td>
                            <td className="px-3 py-2">
                              <span className={`font-medium ${
                                trade.pnl > 0 ? 'text-green-600' : trade.pnl < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                ${trade.pnl.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setImportResults(null);
                      setSelectedImports([]);
                    }}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Back to Import
                  </button>
                  <button
                    onClick={importSelectedTrades}
                    disabled={selectedImports.length === 0}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Import {selectedImports.length} Selected Trades
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingJournal;