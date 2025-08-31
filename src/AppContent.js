import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Calculator, Shield, Calendar, BookOpen, BarChart3, Target, Filter,
  Plus, Edit, Trash2, ChevronLeft, ChevronRight,
  Activity, AlertCircle, Upload, CheckCircle, LineChart,
  Newspaper, User, LogOut, Home, TrendingUp
} from 'lucide-react';

// Import new components
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Profile from './components/Profile';

// Import centralized data management system
import { useDataManager } from './utils/core/dataManager';
import { tradeCache } from './utils/core/tradeCache';
import { 
  parseFinancialNumber, 
  calculatePositionSize, 
  calculateRiskReward,
  calculateRiskAmount,
  getInstrumentSpec,
  calculatePips,
  calculatePnL
} from './utils/calculations/pnlCalculator';

// Import database utilities
import { 
  migrateLocalTradesToDatabase, 
  loadTradesFromDatabase,
  addTradeToDatabase,
  updateTradeInDatabase,
  deleteTradeFromDatabase,
  batchDeleteTrades,
  checkExistingTrades,
  deleteAllUserTrades,
  optimizedTradeImport
} from './utils/database/migrateTrades';
import { importManager } from './utils/core/importManager';
import ImportProgressModal from './components/ui/ImportProgressModal';
import PairSearchInput from './components/ui/PairSearchInput';
import { fetchProfileMetrics, calculateEnhancedWorthScore, formatMetricValue } from './utils/database/profileMetrics';

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
    }
    return () => {
      if (container.current) {
        // Properly cleanup TradingView timeline widget
        const scripts = container.current.querySelectorAll('script');
        scripts.forEach(script => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        });
        
        // Remove all child elements
        while (container.current.firstChild) {
          container.current.removeChild(container.current.firstChild);
        }
      }
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
            "height": 400
          }`;
        container.current.appendChild(script);
      }
    } catch (e) {
      // Silently ignore TradingView widget errors
    }
    return () => {
      if (container.current) {
        // Properly cleanup TradingView economic calendar widget
        const scripts = container.current.querySelectorAll('script');
        scripts.forEach(script => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        });
        
        // Remove all child elements
        while (container.current.firstChild) {
          container.current.removeChild(container.current.firstChild);
        }
      }
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
      if (container.current) {
        // Properly cleanup TradingView advanced chart widget
        const scripts = container.current.querySelectorAll('script');
        scripts.forEach(script => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        });
        
        // Clear any TradingView instances if available
        if (window.TradingView && window.TradingView.widget) {
          try {
            // Some TradingView widgets have destroy methods
            if (typeof window.TradingView.widget.destroy === 'function') {
              window.TradingView.widget.destroy();
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        
        // Remove all child elements
        while (container.current.firstChild) {
          container.current.removeChild(container.current.firstChild);
        }
      }
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

const TradingJournal = ({ session, supabase }) => {
  // Use centralized data manager for consistent data across all components
  const dataManager = useDataManager();
  
  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Import Progress State
  const [importJob, setImportJob] = useState(null);
  const [showImportProgress, setShowImportProgress] = useState(false);
  
  /* DISABLED AI ANALYSIS
  // AI Analysis State
  const [claudeAnalysis, setClaudeAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  */
  
  // Dynamic Trading Goals based on actual performance
  const generateSmartGoals = () => {
    const stats = dataManager.statistics;
    const goals = [];
    
    // Goal 1: Win Rate Improvement (if user has trades)
    if (stats.totalTrades > 0) {
      const targetWinRate = Math.min(Math.ceil(stats.winRate + 10), 85); // Cap at 85%
      goals.push({
        id: generateId(),
        title: `Improve Win Rate to ${targetWinRate}%`,
        description: `Current: ${stats.winRate}% → Target: ${targetWinRate}%`,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: stats.winRate >= targetWinRate ? 'completed' : 'in-progress',
        priority: 'high',
        current: stats.winRate,
        target: targetWinRate,
        milestones: []
      });
    }

    // Goal 2: Profit Target (if user has P&L data)
    if (stats.totalTrades > 5) {
      const monthlyTarget = stats.totalPnL > 0 ? Math.ceil(stats.totalPnL * 1.5) : 500;
      goals.push({
        id: generateId(),
        title: `Reach $${monthlyTarget} Monthly Profit`,
        description: `Build on current performance trends`,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'in-progress',
        priority: 'medium',
        current: stats.totalPnL,
        target: monthlyTarget,
        milestones: []
      });
    }

    // Goal 3: Risk Management (based on actual risk behavior)
    const avgLossSize = stats.totalLosses > 0 ? Math.abs(stats.totalLossAmount / stats.totalLosses) : 0;
    if (avgLossSize > 0) {
      goals.push({
        id: generateId(),
        title: 'Optimize Risk Management',
        description: `Reduce average loss size from $${avgLossSize.toFixed(2)} to improve R:R ratio`,
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'in-progress',
        priority: 'high',
        milestones: []
      });
    }

    // Default goal for new users
    if (goals.length === 0) {
      goals.push({
        id: 1,
        title: 'Start Your Trading Journey',
        description: 'Record your first 10 trades to unlock personalized goals',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'in-progress',
        priority: 'high',
        current: stats.totalTrades,
        target: 10,
        milestones: []
      });
    }

    return goals;
  };

  const [tradingGoals, setTradingGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
    priority: 'medium',
    milestones: []
  });
  const [editingGoal, setEditingGoal] = useState(null);
  
  // Risk Calculator State
  const [riskInputs, setRiskInputs] = useState({
    accountBalance: 10000, // Will be updated from dataManager
    riskPercent: 2,
    entryPrice: 1.2500,
    stopLoss: 1.2450,
    takeProfit: 1.2600,
    currencyPair: 'EURUSD',
    accountCurrency: 'USD'
  });
  const [riskResults, setRiskResults] = useState({});

  // Notification system
  const [notifications, setNotifications] = useState([]);

  // Function to add notifications
  const showNotification = (message, type = 'info', duration = 5000) => {
    const id = generateId();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  // App starts with empty trades - will load from database if available
  useEffect(() => {
    console.log('Trading journal initialized - ready to load trades from database');
    
    // Force clear any cached sample trades with integer IDs
    const currentTrades = dataManager.trades;
    const sampleTradeIds = [1, 2, 3];
    const hasSampleTrades = currentTrades.some(trade => sampleTradeIds.includes(trade.id));
    
    if (hasSampleTrades) {
      console.log('Detected and removing sample trades with integer IDs');
      const cleanTrades = currentTrades.filter(trade => !sampleTradeIds.includes(trade.id));
      dataManager.setTrades(cleanTrades, riskInputs.accountBalance);
    }
  }, []);

  // Connect account balance to real data from dataManager
  useEffect(() => {
    const baseBalance = 10000; // Starting balance - could be made configurable
    const currentBalance = baseBalance + dataManager.statistics.totalPnL;
    setRiskInputs(prev => ({ 
      ...prev, 
      accountBalance: Math.max(currentBalance, 0) // Ensure never negative
    }));
  }, [dataManager.statistics.totalPnL]);

  // Update trading goals based on performance changes
  useEffect(() => {
    const smartGoals = generateSmartGoals();
    setTradingGoals(smartGoals);
  }, [dataManager.statistics.totalTrades, dataManager.statistics.winRate, dataManager.statistics.totalPnL]);

  // Mobile detection and scroll handling
  useEffect(() => {
    const detectMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || 
                           (window.innerHeight < window.innerWidth && window.innerHeight <= 480);
      setIsMobile(isMobileDevice);
    };

    const handleScroll = () => {
      if (isMobile) {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          setIsNavVisible(false); // Hide nav when scrolling down
        } else if (currentScrollY < lastScrollY) {
          setIsNavVisible(true); // Show nav when scrolling up
        }
        setLastScrollY(currentScrollY);
      }
    };

    // Initial detection
    detectMobile();
    
    // Add event listeners
    window.addEventListener('resize', detectMobile);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', detectMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, lastScrollY]);

  const [userProfile, setUserProfile] = useState(null);
  const [profileMetrics, setProfileMetrics] = useState(null);
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
  const [editingTrade, setEditingTrade] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [selectedImports, setSelectedImports] = useState([]);
  const [importMethod, setImportMethod] = useState('paste'); // 'paste' or 'file'
  
  // Pagination and enhanced filters
  const [currentPage, setCurrentPage] = useState(1);
  const [tradesPerPage] = useState(50);
  const [filterPair, setFilterPair] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterSetup, setFilterSetup] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  // Migration states
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('idle'); // 'idle', 'migrating', 'success', 'error'
  const [migrationMessage, setMigrationMessage] = useState('');
  const [quickMigrating, setQuickMigrating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [showDeleteFilteredModal, setShowDeleteFilteredModal] = useState(false);
  const [deletingFiltered, setDeletingFiltered] = useState(false);

  const majorPairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
    'EURJPY', 'GBPJPY', 'EURGBP', 'AUDCAD', 'GBPAUD', 'XAUUSD', 'BTCUSD'
  ];

  const tradeSetups = [
    'Trend Following', 'Reversal', 'Breakout', 'Support/Resistance', 
    'News Trading', 'Scalping', 'Swing Trading', 'Other'
  ];

  // Function to get currency pair icon for display
  const getCurrencyPairIcon = (pair) => {
    const symbol = pair.toUpperCase();
    
    // Import icons from lucide-react (these should be available in AppContent)
    const iconStyle = "w-4 h-4 inline-block mr-2";
    
    if (symbol.includes('EUR')) return <span className={`${iconStyle} text-blue-600`}>€</span>;
    if (symbol.includes('GBP')) return <span className={`${iconStyle} text-green-600`}>£</span>;
    if (symbol.includes('USD') && !symbol.includes('BTC')) return <span className={`${iconStyle} text-green-700`}>$</span>;
    if (symbol.includes('BTC')) return <span className={`${iconStyle} text-orange-500`}>₿</span>;
    if (symbol.includes('JPY')) return <span className={`${iconStyle} text-red-600`}>¥</span>;
    if (symbol.includes('CHF')) return <span className={`${iconStyle} text-red-800`}>₣</span>;
    if (symbol.includes('AUD')) return <span className={`${iconStyle} text-blue-800`}>A$</span>;
    if (symbol.includes('CAD')) return <span className={`${iconStyle} text-red-700`}>C$</span>;
    if (symbol.includes('XAU') || symbol.includes('GOLD')) return <span className={`${iconStyle} text-yellow-600`}>🏅</span>;
    
    return <span className={`${iconStyle} text-gray-500`}>💱</span>;
  };

  // Enhanced Risk Calculator Functions using centralized calculations
  const calculateRisk = () => {
    const { accountBalance, riskPercent, entryPrice, stopLoss, takeProfit, currencyPair } = riskInputs;
    
    if (!entryPrice || !stopLoss || !takeProfit || !accountBalance) {
      setRiskResults({});
      return;
    }
    
    // Get instrument specifications from centralized system
    const instrumentSpec = getInstrumentSpec(currencyPair);
    const isBtcPair = currencyPair && currencyPair.toUpperCase().includes('BTC');
    const isGoldPair = currencyPair && (currencyPair.toUpperCase().includes('XAU') || currencyPair.toUpperCase() === 'GOLD');
    
    // Use centralized calculations
    const lotSize = calculatePositionSize(accountBalance, riskPercent, entryPrice, stopLoss, currencyPair);
    const rrRatio = calculateRiskReward(entryPrice, stopLoss, takeProfit, 'BUY'); // Direction doesn't matter for R:R
    const riskAmount = (accountBalance * riskPercent) / 100;
    const potentialProfit = riskAmount * rrRatio;
    const breakEvenWinRate = rrRatio > 0 ? (1 / (1 + rrRatio)) * 100 : 100;
    
    // Calculate pip-based metrics using centralized functions
    const pipsAtRisk = Math.abs(calculatePips(entryPrice, stopLoss, currencyPair));
    const rewardPips = Math.abs(calculatePips(entryPrice, takeProfit, currencyPair));
    const positionSizeStandardLots = lotSize; // Already in correct format from centralized function
    const pipValue = pipsAtRisk > 0 ? riskAmount / pipsAtRisk : 0;
    
    // Risk Analysis and Warnings
    const warnings = [];
    const riskLevel = riskPercent > 5 ? 'HIGH' : riskPercent > 2 ? 'MEDIUM' : 'LOW';
    
    // Check if trade setup is inverted (immediate loss scenario)
    const tradeDirection = entryPrice < takeProfit ? 'BUY' : 'SELL';
    const isImmediateLoss = (tradeDirection === 'BUY' && stopLoss > entryPrice) || 
                           (tradeDirection === 'SELL' && stopLoss < entryPrice);
    
    if (isImmediateLoss) {
      warnings.push({
        type: 'CRITICAL',
        message: '⚠️ CRITICAL: Trade will enter immediate loss! Check stop loss placement.'
      });
    }
    
    if (rrRatio < 1) {
      warnings.push({
        type: 'WARNING',
        message: `⚠️ Poor risk/reward ratio (1:${rrRatio.toFixed(2)}). Target should be further from entry.`
      });
    }
    
    if (riskPercent > 5) {
      warnings.push({
        type: 'CRITICAL',
        message: '🚨 Risk per trade exceeds 5%! Extremely dangerous - reduce immediately.'
      });
    } else if (riskPercent > 3) {
      warnings.push({
        type: 'WARNING', 
        message: '⚠️ High risk per trade (>3%). Consider reducing position size.'
      });
    }
    
    if (breakEvenWinRate > 70) {
      warnings.push({
        type: 'INFO',
        message: `📊 High accuracy needed: ${breakEvenWinRate.toFixed(1)}% win rate required to break even.`
      });
    }
    
    // Asset-specific warnings
    if (isBtcPair) {
      if (Math.abs(entryPrice - stopLoss) < 500) {
        warnings.push({
          type: 'INFO',
          message: '₿ Bitcoin stop loss seems very tight (<$500). Consider volatility.'
        });
      }
      if (Math.abs(entryPrice - stopLoss) > 5000) {
        warnings.push({
          type: 'INFO',
          message: '₿ Bitcoin stop loss is wide (>$5000). High risk per pip.'
        });
      }
    }
    
    if (isGoldPair) {
      if (Math.abs(entryPrice - stopLoss) < 5) {
        warnings.push({
          type: 'INFO',
          message: '🏅 Gold stop loss is tight (<$5). Consider volatility and spreads.'
        });
      }
    }
    
    setRiskResults({
      riskAmount: parseFloat(riskAmount.toFixed(2)),
      pipsAtRisk: parseFloat((pipsAtRisk || 0).toFixed(1)),
      rewardPips: parseFloat((rewardPips || 0).toFixed(1)),
      rrRatio: parseFloat(rrRatio.toFixed(2)),
      lotSize: isGoldPair || isBtcPair ? parseFloat(lotSize.toFixed(4)) : Math.round(lotSize),
      positionSizeStandardLots: parseFloat((positionSizeStandardLots || 0).toFixed(4)),
      pipValue: parseFloat((pipValue || 0).toFixed(2)),
      potentialProfit: parseFloat(potentialProfit.toFixed(2)),
      breakEvenWinRate: parseFloat(breakEvenWinRate.toFixed(1)),
      instrumentType: isGoldPair ? 'oz' : isBtcPair ? 'BTC' : 'lots',
      riskLevel,
      warnings,
      isValidTrade: !isImmediateLoss && lotSize > 0 && !isNaN(rrRatio)
    });
  };

  useEffect(() => {
    calculateRisk();
  }, [riskInputs]);

  // Live price state and cache
  const [livePrices, setLivePrices] = useState({});
  const [lastPriceUpdate, setLastPriceUpdate] = useState(Date.now());
  const [priceErrors, setPriceErrors] = useState({});

  // TradingView symbol mapping
  const getTradingViewSymbol = (pair) => {
    const pairUpper = pair.toUpperCase();
    const symbolMap = {
      'EURUSD': 'FX:EURUSD',
      'GBPUSD': 'FX:GBPUSD',
      'USDJPY': 'FX:USDJPY',
      'USDCHF': 'FX:USDCHF',
      'AUDUSD': 'FX:AUDUSD',
      'USDCAD': 'FX:USDCAD',
      'NZDUSD': 'FX:NZDUSD',
      'EURJPY': 'FX:EURJPY',
      'GBPJPY': 'FX:GBPJPY',
      'EURGBP': 'FX:EURGBP',
      'AUDCAD': 'FX:AUDCAD',
      'GBPAUD': 'FX:GBPAUD',
      'XAUUSD': 'FOREXCOM:XAUUSD',
      'BTCUSD': 'BITSTAMP:BTCUSD',
      'ETHUSD': 'BITSTAMP:ETHUSD'
    };
    return symbolMap[pairUpper] || `FX:${pairUpper}`;
  };

  // Import comprehensive trading pairs data
  import('./utils/data/tradingPairs.js').then(module => {
    // We'll use this dynamically
  }).catch(console.error);

  // Comprehensive fallback price data covering all supported pairs
  const fallbackPriceData = {
    // Major Forex
    'EURUSD': { current: 1.0850, spread: 0.0020 },
    'GBPUSD': { current: 1.2650, spread: 0.0025 },
    'USDJPY': { current: 149.50, spread: 0.025 },
    'USDCHF': { current: 0.8750, spread: 0.0020 },
    'AUDUSD': { current: 0.6450, spread: 0.0020 },
    'USDCAD': { current: 1.3650, spread: 0.0025 },
    'NZDUSD': { current: 0.5850, spread: 0.0025 },
    
    // Minor Forex
    'EURJPY': { current: 162.25, spread: 0.030 },
    'GBPJPY': { current: 189.15, spread: 0.035 },
    'EURGBP': { current: 0.8580, spread: 0.0015 },
    'EURAUD': { current: 1.6820, spread: 0.0035 },
    'EURCHF': { current: 0.9510, spread: 0.0025 },
    'EURCAD': { current: 1.4810, spread: 0.0035 },
    'GBPAUD': { current: 1.9220, spread: 0.0045 },
    'GBPCAD': { current: 1.7280, spread: 0.0040 },
    'GBPCHF': { current: 1.1050, spread: 0.0035 },
    'AUDCAD': { current: 0.8805, spread: 0.0030 },
    'AUDJPY': { current: 96.45, spread: 0.025 },
    'AUDCHF': { current: 0.5640, spread: 0.0025 },
    'CADJPY': { current: 109.55, spread: 0.025 },
    'CHFJPY': { current: 170.85, spread: 0.030 },
    'NZDJPY': { current: 87.65, spread: 0.025 },
    'NZDCAD': { current: 0.7990, spread: 0.0035 },
    'NZDCHF': { current: 0.5120, spread: 0.0030 },
    
    // Exotic Forex
    'USDZAR': { current: 18.7500, spread: 0.15 },
    'USDTRY': { current: 28.9500, spread: 0.25 },
    'USDHKD': { current: 7.8250, spread: 0.005 },
    'USDSGD': { current: 1.3420, spread: 0.0035 },
    'EURTRY': { current: 31.4200, spread: 0.30 },
    'EURZAR': { current: 20.3500, spread: 0.18 },
    'GBPTRY': { current: 36.6500, spread: 0.35 },
    'USDSEK': { current: 10.8500, spread: 0.08 },
    'USDNOK': { current: 10.6800, spread: 0.08 },
    'USDDKK': { current: 7.0850, spread: 0.05 },
    'USDPLN': { current: 4.0250, spread: 0.03 },
    'USDCZK': { current: 22.8500, spread: 0.18 },
    'USDHUF': { current: 358.50, spread: 2.5 },
    
    // Cryptocurrencies
    'BTCUSD': { current: 67500.00, spread: 500.00 },
    'ETHUSD': { current: 3250.00, spread: 50.00 },
    'LTCUSD': { current: 95.50, spread: 2.00 },
    'XRPUSD': { current: 0.6250, spread: 0.005 },
    'ADAUSD': { current: 0.4850, spread: 0.005 },
    'DOTUSD': { current: 7.25, spread: 0.10 },
    'LINKUSD': { current: 15.80, spread: 0.20 },
    'SOLUSD': { current: 98.50, spread: 2.00 },
    'MATICUSD': { current: 0.8950, spread: 0.01 },
    'AVAXUSD': { current: 38.50, spread: 0.50 },
    'BTCEUR': { current: 62200.00, spread: 600.00 },
    'ETHEUR': { current: 2995.00, spread: 60.00 },
    'BTCGBP': { current: 53400.00, spread: 650.00 },
    'ETHBTC': { current: 0.0482, spread: 0.0005 },
    
    // Commodities
    'XAUUSD': { current: 2385.50, spread: 5.00 },
    'XAGUSD': { current: 28.45, spread: 0.15 },
    'XAUEUR': { current: 2198.50, spread: 6.00 },
    'XAUJPY': { current: 356850, spread: 150 },
    'CRUDE': { current: 78.25, spread: 0.50 },
    'BRENT': { current: 82.15, spread: 0.50 },
    'NATGAS': { current: 2.85, spread: 0.05 },
    'WHEAT': { current: 585.50, spread: 5.0 },
    'CORN': { current: 485.25, spread: 4.0 },
    'COPPER': { current: 3.8250, spread: 0.05 },
    'PLATINUM': { current: 1025.50, spread: 8.0 },
    'PALLADIUM': { current: 1185.25, spread: 12.0 },
    
    // Indices
    'SPX500': { current: 4785.50, spread: 2.5 },
    'NAS100': { current: 16850.25, spread: 5.0 },
    'US30': { current: 37250.50, spread: 8.0 },
    'GER40': { current: 16825.75, spread: 4.0 },
    'UK100': { current: 7685.25, spread: 3.0 },
    'JPN225': { current: 32850.50, spread: 12.0 },
    'FRA40': { current: 7485.25, spread: 3.5 },
    'ESP35': { current: 10125.50, spread: 5.0 },
    'AUS200': { current: 7285.50, spread: 4.0 },
    'HKG33': { current: 17825.25, spread: 8.0 },
    
    // Major Stocks
    'AAPL': { current: 195.25, spread: 0.05 },
    'GOOGL': { current: 142.85, spread: 0.10 },
    'MSFT': { current: 415.50, spread: 0.08 },
    'AMZN': { current: 152.25, spread: 0.12 },
    'TSLA': { current: 248.50, spread: 0.15 },
    'META': { current: 485.25, spread: 0.20 },
    'NFLX': { current: 485.50, spread: 0.25 },
    'NVDA': { current: 875.25, spread: 0.50 },
    'JPM': { current: 185.50, spread: 0.08 },
    'JNJ': { current: 158.25, spread: 0.06 }
  };

  // Fetch live prices using multiple reliable sources
  const fetchLivePrices = async (symbols = []) => {
    const symbolsToFetch = symbols.length > 0 ? symbols : Object.keys(fallbackPriceData);
    
    try {
      const newPrices = {};
      const errors = {};
      
      // Process symbols in smaller batches to improve success rate
      const batchSize = 3;
      for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
        const batch = symbolsToFetch.slice(i, i + batchSize);
        
        const promises = batch.map(async (symbol) => {
          // Try multiple sources for each symbol
          const sources = [
            () => fetchFromYahooFinance(symbol),
            () => fetchFromExchangeRate(symbol),
            () => fetchFromCoinGecko(symbol)
          ];

          for (const fetchSource of sources) {
            try {
              const result = await fetchSource();
              if (result && result.current && !isNaN(result.current)) {
                return {
                  symbol,
                  ...result,
                  timestamp: Date.now(),
                  isLive: true
                };
              }
            } catch (error) {
              console.log(`Source failed for ${symbol}:`, error.message);
            }
          }

          // All sources failed, use fallback
          const fallback = fallbackPriceData[symbol];
          if (fallback) {
            errors[symbol] = 'All sources failed';
            return {
              symbol,
              current: fallback.current,
              spread: fallback.spread,
              change: 0,
              changePercent: 0,
              timestamp: Date.now(),
              isLive: false,
              source: 'Fallback'
            };
          }
          
          return null;
        });

        const batchResults = await Promise.all(promises);
        batchResults.forEach(result => {
          if (result) {
            newPrices[result.symbol] = result;
          }
        });

        // Delay between batches
        if (i + batchSize < symbolsToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setLivePrices(newPrices);
      setPriceErrors(errors);
      setLastPriceUpdate(Date.now());
      
      // Log success stats
      const liveCount = Object.values(newPrices).filter(p => p.isLive).length;
      const fallbackCount = Object.values(newPrices).filter(p => !p.isLive).length;
      console.log(`Price update: ${liveCount} live, ${fallbackCount} fallback, ${Object.keys(errors).length} errors`);
      
    } catch (error) {
      console.error('Error fetching live prices:', error);
      setPriceErrors({ general: error.message });
    }
  };

  // Yahoo Finance with better error handling
  const fetchFromYahooFinance = async (symbol) => {
    const yahooSymbol = getYahooSymbol(symbol);
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    
    const response = await fetch(proxyUrl + encodeURIComponent(yahooUrl));
    if (!response.ok) throw new Error('Yahoo Finance request failed');
    
    const proxyData = await response.json();
    const data = JSON.parse(proxyData.contents);
    const result = data.chart?.result?.[0];
    
    if (!result) throw new Error('No data in response');
    
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    const prevClose = meta.previousClose || meta.chartPreviousClose;
    
    if (!currentPrice || isNaN(currentPrice)) {
      throw new Error('Invalid price data');
    }
    
    const change = prevClose ? currentPrice - prevClose : 0;
    const changePercent = prevClose ? ((change / prevClose) * 100) : 0;
    
    return {
      current: parseFloat(currentPrice),
      change: change,
      changePercent: changePercent,
      spread: fallbackPriceData[symbol]?.spread || 0.0020,
      source: 'Yahoo Finance'
    };
  };

  // Exchange rate API for forex pairs
  const fetchFromExchangeRate = async (symbol) => {
    // Only use for forex pairs
    if (!symbol.includes('USD') || symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('XAU')) {
      throw new Error('Not a forex pair');
    }

    const base = symbol.slice(0, 3);
    const quote = symbol.slice(3, 6);
    
    if (base === quote) throw new Error('Same currency pair');
    
    // Free exchange rate API
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    if (!response.ok) throw new Error('Exchange rate API failed');
    
    const data = await response.json();
    const rate = data.rates[quote];
    
    if (!rate || isNaN(rate)) throw new Error('Rate not found');
    
    return {
      current: parseFloat(rate),
      change: 0, // This API doesn't provide change data
      changePercent: 0,
      spread: fallbackPriceData[symbol]?.spread || 0.0020,
      source: 'ExchangeRate API'
    };
  };

  // CoinGecko for crypto prices
  const fetchFromCoinGecko = async (symbol) => {
    // Comprehensive crypto mapping
    const cryptoMap = {
      'BTCUSD': 'bitcoin', 'BTCEUR': 'bitcoin', 'BTCGBP': 'bitcoin',
      'ETHUSD': 'ethereum', 'ETHEUR': 'ethereum', 'ETHBTC': 'ethereum',
      'LTCUSD': 'litecoin', 'XRPUSD': 'ripple', 'ADAUSD': 'cardano',
      'DOTUSD': 'polkadot', 'LINKUSD': 'chainlink', 'SOLUSD': 'solana',
      'MATICUSD': 'matic-network', 'AVAXUSD': 'avalanche-2'
    };

    const cryptoId = cryptoMap[symbol.toUpperCase()];
    if (!cryptoId) {
      throw new Error('Crypto not supported by CoinGecko');
    }

    // Determine the vs_currency based on symbol
    let vsCurrency = 'usd';
    if (symbol.includes('EUR')) vsCurrency = 'eur';
    else if (symbol.includes('GBP')) vsCurrency = 'gbp';
    else if (symbol.includes('BTC') && symbol !== 'BTCUSD' && symbol !== 'BTCEUR' && symbol !== 'BTCGBP') vsCurrency = 'btc';
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=${vsCurrency}&include_24hr_change=true`
    );
    if (!response.ok) throw new Error('CoinGecko API failed');
    
    const data = await response.json();
    const priceData = data[cryptoId];
    
    if (!priceData || !priceData[vsCurrency]) throw new Error('No price data');
    
    const changeKey = `${vsCurrency}_24h_change`;
    
    return {
      current: parseFloat(priceData[vsCurrency]),
      change: 0, // CoinGecko provides percentage change, not absolute
      changePercent: priceData[changeKey] || 0,
      spread: fallbackPriceData[symbol]?.spread || 500,
      source: 'CoinGecko'
    };
  };

  // Comprehensive Yahoo Finance symbol mapping
  const getYahooSymbol = (pair) => {
    const pairUpper = pair.toUpperCase();
    const yahooMap = {
      // Major Forex
      'EURUSD': 'EURUSD=X', 'GBPUSD': 'GBPUSD=X', 'USDJPY': 'USDJPY=X',
      'USDCHF': 'USDCHF=X', 'AUDUSD': 'AUDUSD=X', 'USDCAD': 'USDCAD=X', 'NZDUSD': 'NZDUSD=X',
      
      // Minor Forex
      'EURJPY': 'EURJPY=X', 'GBPJPY': 'GBPJPY=X', 'EURGBP': 'EURGBP=X', 'EURAUD': 'EURAUD=X',
      'EURCHF': 'EURCHF=X', 'EURCAD': 'EURCAD=X', 'GBPAUD': 'GBPAUD=X', 'GBPCAD': 'GBPCAD=X',
      'GBPCHF': 'GBPCHF=X', 'AUDCAD': 'AUDCAD=X', 'AUDJPY': 'AUDJPY=X', 'AUDCHF': 'AUDCHF=X',
      'CADJPY': 'CADJPY=X', 'CHFJPY': 'CHFJPY=X', 'NZDJPY': 'NZDJPY=X', 'NZDCAD': 'NZDCAD=X', 'NZDCHF': 'NZDCHF=X',
      
      // Exotic Forex
      'USDZAR': 'USDZAR=X', 'USDTRY': 'USDTRY=X', 'USDHKD': 'USDHKD=X', 'USDSGD': 'USDSGD=X',
      'EURTRY': 'EURTRY=X', 'EURZAR': 'EURZAR=X', 'GBPTRY': 'GBPTRY=X', 'USDSEK': 'USDSEK=X',
      'USDNOK': 'USDNOK=X', 'USDDKK': 'USDDKK=X', 'USDPLN': 'USDPLN=X', 'USDCZK': 'USDCZK=X', 'USDHUF': 'USDHUF=X',
      
      // Cryptocurrencies
      'BTCUSD': 'BTC-USD', 'ETHUSD': 'ETH-USD', 'LTCUSD': 'LTC-USD', 'XRPUSD': 'XRP-USD',
      'ADAUSD': 'ADA-USD', 'DOTUSD': 'DOT-USD', 'LINKUSD': 'LINK-USD', 'SOLUSD': 'SOL-USD',
      'MATICUSD': 'MATIC-USD', 'AVAXUSD': 'AVAX-USD', 'BTCEUR': 'BTC-EUR', 'ETHEUR': 'ETH-EUR',
      'BTCGBP': 'BTC-GBP', 'ETHBTC': 'ETH-BTC',
      
      // Commodities
      'XAUUSD': 'GC=F', 'XAGUSD': 'SI=F', 'XAUEUR': 'GC=F', 'XAUJPY': 'GC=F',
      'CRUDE': 'CL=F', 'BRENT': 'BZ=F', 'NATGAS': 'NG=F', 'WHEAT': 'ZW=F',
      'CORN': 'ZC=F', 'COPPER': 'HG=F', 'PLATINUM': 'PL=F', 'PALLADIUM': 'PA=F',
      
      // Indices
      'SPX500': '^GSPC', 'NAS100': '^NDX', 'US30': '^DJI', 'GER40': '^GDAXI',
      'UK100': '^FTSE', 'JPN225': '^N225', 'FRA40': '^FCHI', 'ESP35': '^IBEX',
      'AUS200': '^AXJO', 'HKG33': '^HSI',
      
      // Stocks (already correct)
      'AAPL': 'AAPL', 'GOOGL': 'GOOGL', 'MSFT': 'MSFT', 'AMZN': 'AMZN',
      'TSLA': 'TSLA', 'META': 'META', 'NFLX': 'NFLX', 'NVDA': 'NVDA',
      'JPM': 'JPM', 'JNJ': 'JNJ'
    };
    
    return yahooMap[pairUpper] || `${pairUpper}=X`;
  };

  // Get current price with live updates
  const getCurrencyPairPrices = (pair) => {
    const pairUpper = pair.toUpperCase();
    const livePrice = livePrices[pairUpper];
    
    if (livePrice) {
      return livePrice;
    }
    
    // Fallback to static data
    const fallback = fallbackPriceData[pairUpper];
    if (fallback) {
      return {
        current: fallback.current,
        spread: fallback.spread,
        isLive: false,
        source: 'Static'
      };
    }
    
    return { current: 1.0000, spread: 0.0020, isLive: false, source: 'Default' };
  };

  // Set up live price updates
  useEffect(() => {
    // Initial price fetch
    fetchLivePrices();
    
    // Update prices every 45 seconds (respectful of rate limits with multiple APIs)
    const priceInterval = setInterval(() => {
      fetchLivePrices();
    }, 45000);
    
    return () => clearInterval(priceInterval);
  }, []);

  const handleRiskInputChange = (field, value) => {
    setRiskInputs(prev => {
      const newInputs = {
        ...prev,
        [field]: parseFloat(value) || value
      };

      // Auto-update prices when currency pair changes
      if (field === 'currencyPair') {
        const prices = getCurrencyPairPrices(value);
        const currentPrice = prices.current;
        const spread = prices.spread;
        
        // Set realistic entry, stop loss, and take profit based on pair
        const isForex = !value.toUpperCase().includes('BTC') && 
                       !value.toUpperCase().includes('ETH') && 
                       !value.toUpperCase().includes('XAU');
        
        if (isForex) {
          // For forex pairs, use smaller pip-based distances
          newInputs.entryPrice = currentPrice;
          newInputs.stopLoss = currentPrice - spread * 10; // 10x spread as stop loss
          newInputs.takeProfit = currentPrice + spread * 20; // 20x spread as take profit (2:1 R:R)
        } else if (value.toUpperCase().includes('XAU')) {
          // Gold specific pricing
          newInputs.entryPrice = currentPrice;
          newInputs.stopLoss = currentPrice - 15.00; // $15 stop loss
          newInputs.takeProfit = currentPrice + 30.00; // $30 take profit (2:1 R:R)
        } else if (value.toUpperCase().includes('BTC')) {
          // Bitcoin specific pricing
          newInputs.entryPrice = currentPrice;
          newInputs.stopLoss = currentPrice - 1000; // $1000 stop loss
          newInputs.takeProfit = currentPrice + 2000; // $2000 take profit (2:1 R:R)
        } else {
          // Default for other crypto/assets
          newInputs.entryPrice = currentPrice;
          newInputs.stopLoss = currentPrice * 0.98; // 2% stop loss
          newInputs.takeProfit = currentPrice * 1.04; // 4% take profit
        }
      }

      return newInputs;
    });
  };

  // Calculate user's actual risk behavior from trading history
  const calculateActualRiskProfile = () => {
    const trades = dataManager.trades;
    if (trades.length === 0) return 2; // Default 2%

    const riskPerTrades = trades
      .filter(trade => trade.pnl !== undefined && riskInputs.accountBalance > 0)
      .map(trade => {
        const riskAmount = Math.abs(trade.pnl);
        const accountAtTime = riskInputs.accountBalance; // Could be improved with historical balance
        return (riskAmount / accountAtTime) * 100;
      });

    if (riskPerTrades.length === 0) return 2;

    // Calculate average actual risk taken
    const avgRisk = riskPerTrades.reduce((sum, risk) => sum + risk, 0) / riskPerTrades.length;
    return Math.min(Math.max(avgRisk, 0.5), 10); // Cap between 0.5% and 10%
  };

  const getRiskLevel = () => {
    // Get user's actual risk behavior if they have trading history
    const actualRisk = dataManager.trades.length >= 5 ? calculateActualRiskProfile() : riskInputs.riskPercent;
    const currentRisk = riskInputs.riskPercent;
    
    // Adjust thresholds based on user's actual behavior
    const conservativeThreshold = Math.max(1, actualRisk * 0.5);
    const moderateThreshold = Math.max(2, actualRisk * 1.0);
    const aggressiveThreshold = Math.max(5, actualRisk * 1.5);

    let level, color, bg, suggestion = '';

    if (currentRisk <= conservativeThreshold) {
      level = 'Conservative';
      color = 'text-green-600';
      bg = 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 backdrop-blur-sm border border-green-200/30 dark:border-green-700/30 shadow-lg shadow-green-200/20';
    } else if (currentRisk <= moderateThreshold) {
      level = 'Moderate';
      color = 'text-blue-600';
      bg = 'bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 shadow-lg shadow-blue-200/20';
    } else if (currentRisk <= aggressiveThreshold) {
      level = 'Aggressive';
      color = 'text-orange-600';
      bg = 'bg-gradient-to-br from-orange-50/80 to-yellow-50/80 dark:from-orange-900/30 dark:to-yellow-900/30 backdrop-blur-sm border border-orange-200/30 dark:border-orange-700/30 shadow-lg shadow-orange-200/20';
    } else {
      level = 'High Risk';
      color = 'text-red-600';
      bg = 'bg-gradient-to-br from-red-50/80 to-rose-50/80 dark:from-red-900/30 dark:to-rose-900/30 backdrop-blur-sm border border-red-200/30 dark:border-red-700/30 shadow-lg shadow-red-200/20';
    }

    // Add personalized suggestions based on trading history
    if (dataManager.trades.length >= 5) {
      const stats = dataManager.statistics;
      if (stats.winRate < 50 && currentRisk > actualRisk) {
        suggestion = ` Consider reducing risk - your win rate is ${stats.winRate}%`;
      } else if (stats.winRate > 70 && currentRisk < actualRisk) {
        suggestion = ` Your ${stats.winRate}% win rate suggests you could handle slightly more risk`;
      }
    }

    return { level, color, bg, suggestion, actualRisk: Math.round(actualRisk * 100) / 100 };
  };

  // Enhanced File Parsing Functions
  const parseBrokerCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const parsedTrades = [];
    let accountInfo = {};
    
    // Extract account metadata (first few lines)
    let headerLineIndex = -1;
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const line = lines[i].toLowerCase();
      
      // Extract metadata
      if (lines[i].includes(':') && i < 10) {
        const parts = lines[i].split(';');
        const keyValue = parts[0].split(':');
        if (keyValue.length >= 2) {
          const key = keyValue[0].trim();
          const value = parts[3] || keyValue[1] || '';
          accountInfo[key] = value.trim();
        }
      }
      
      // Find actual data header
      if (line.includes('time') && line.includes('symbol') && line.includes('type') && line.includes('volume')) {
        headerLineIndex = i;
        break;
      }
    }
    
    if (headerLineIndex === -1) {
      // Fallback to standard CSV parsing
      return parseCSVFile(csvText);
    }
    
    // Parse header to understand column structure
    const headerCols = lines[headerLineIndex].split(';').map(col => col.trim().toLowerCase());
    
    // Process data rows
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith(';;;;;')) continue;
      
      try {
        const columns = line.split(';').map(col => col.trim());
        
        if (columns.length >= 10) {
          // Helper function to parse European number format with input validation
          const parseEuropeanNumber = (numStr) => {
            if (!numStr || numStr === '') return 0;
            
            // Input sanitization - only allow numbers, dots, commas, spaces, and minus sign
            const sanitized = String(numStr).replace(/[^\d.,-\s]/g, '');
            
            // Prevent extremely long inputs that could cause performance issues
            if (sanitized.length > 20) return 0;
            
            const str = sanitized.replace(/\s/g, '');
            
            // Validate that we have at least some digits
            if (!/\d/.test(str)) return 0;
            
            let result = 0;
            
            // If it contains both comma and dot, determine which is decimal separator
            if (str.includes(',') && str.includes('.')) {
              // European format: 1.234,56 (dot as thousands, comma as decimal)
              if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
                result = parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
              }
              // US format: 1,234.56 (comma as thousands, dot as decimal)
              else {
                result = parseFloat(str.replace(/,/g, '')) || 0;
              }
            }
            // Only comma - likely European decimal separator
            else if (str.includes(',') && !str.includes('.')) {
              result = parseFloat(str.replace(',', '.')) || 0;
            }
            // Only dot or no separators - standard parsing
            else {
              result = parseFloat(str) || 0;
            }
            
            // Validate result is finite and within reasonable bounds
            if (!isFinite(result)) return 0;
            if (Math.abs(result) > Number.MAX_SAFE_INTEGER / 1000) return 0;
            
            return result;
          };
          
          // Use standardized date parsing function
          const parseDate = parseStandardDate;
          
          // Map columns based on the detected structure
          const trade = {
            id: generateId(),
            date: parseDate(columns[0]), // Open Time
            pair: columns[2] || 'UNKNOWN', // Symbol
            type: (columns[3] || 'buy').toUpperCase(), // Type
            entry: parseEuropeanNumber(columns[5]), // Entry Price
            exit: parseEuropeanNumber(columns[9]), // Exit Price  
            stopLoss: parseEuropeanNumber(columns[6]), // S/L
            takeProfit: parseEuropeanNumber(columns[7]), // T/P
            lotSize: parseEuropeanNumber(columns[4]), // Volume
            pnl: parseEuropeanNumber(columns[12]), // Profit
            rawPnl: columns[12], // Keep raw value for debugging
            commission: parseEuropeanNumber(columns[10]) || 0, // Commission
            swap: parseEuropeanNumber(columns[11]) || 0, // Swap
            position: columns[1] || '', // Position ID
            openTime: columns[0] || '', // Full open time
            closeTime: columns[8] || '', // Full close time
            notes: `Imported from broker CSV - Position: ${columns[1]}`,
            setup: 'Imported Trade'
          };
          
          // For imported trades, the PnL is already calculated by the broker
          // Don't apply our asset-specific calculations during import
          trade.netPnL = trade.pnl + trade.commission + trade.swap;
          
          // Mark as imported to avoid double-calculation
          trade.isImported = true;
          
          // Determine status
          trade.status = trade.exit && trade.exit > 0 ? 'closed' : 'open';
          
          // Calculate R:R ratio
          if (trade.entry && trade.stopLoss && trade.takeProfit) {
            const risk = Math.abs(trade.entry - trade.stopLoss);
            const reward = Math.abs(trade.takeProfit - trade.entry);
            trade.rr = risk > 0 ? reward / risk : 1;
          } else {
            trade.rr = 1;
          }
          
          // Clean up symbol name
          if (trade.pair.endsWith('s') && trade.pair !== 'USDILS') {
            trade.pair = trade.pair.slice(0, -1);
          }
          
          // Validate trade has essential data
          if (trade.entry > 0 && trade.lotSize > 0 && trade.pair) {
            parsedTrades.push(trade);
          }
        }
      } catch (error) {
        console.log(`Error parsing broker CSV line ${i + 1}:`, error);
      }
    }
    
    // Add account info to first trade for reference
    if (parsedTrades.length > 0 && Object.keys(accountInfo).length > 0) {
      parsedTrades[0].accountInfo = accountInfo;
    }
    
    return parsedTrades;
  };

  // Enhanced CSV parsing with broker format detection
  // Robust ID generation utility
  const generateId = () => {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback: Generate a more robust ID using timestamp + random components
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    const extraRandom = Math.random().toString(36).substr(2, 5);
    
    return `${timestamp}-${randomPart}-${extraRandom}`;
  };

  // Input sanitization functions
  const sanitizeTextInput = (input, maxLength = 500) => {
    if (!input) return '';
    
    const sanitized = String(input)
      .slice(0, maxLength) // Prevent excessively long inputs
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"&]/g, match => { // Escape remaining dangerous characters
        const escapeMap = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return escapeMap[match] || match;
      });
    
    return sanitized.trim();
  };

  const sanitizeNumericInput = (input, min = -Number.MAX_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) => {
    const num = parseFloat(input);
    if (!isFinite(num)) return 0;
    return Math.min(Math.max(num, min), max);
  };

  // Standardized date parsing function used across all import methods
  const parseStandardDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    const datePart = dateStr.split(' ')[0]; // Remove time if present
    
    // Handle different date formats consistently
    if (datePart.includes('-') || datePart.includes('/') || datePart.includes('.')) {
      // Normalize all separators to hyphens
      return datePart.replace(/[/.]/g, '-');
    }
    
    // If no separators found, return current date as fallback
    return new Date().toISOString().split('T')[0];
  };

  const parseCSVFile = (csvText) => {
    // First, try to detect if this is a broker-specific format
    const firstLines = csvText.split('\n').slice(0, 10).join('\n').toLowerCase();
    
    // Check for broker-specific indicators
    if (firstLines.includes('trade history report') || 
        firstLines.includes('account:') || 
        firstLines.includes('company:') ||
        (firstLines.includes('time;position;symbol') && firstLines.includes('volume;price'))) {
      console.log('Detected broker CSV format, using enhanced parser');
      return parseBrokerCSV(csvText);
    }
    
    // Fallback to original parsing logic
    const lines = csvText.trim().split('\n');
    const parsedTrades = [];
    
    // Try to detect headers
    const firstLine = lines[0].toLowerCase();
    const hasHeaders = firstLine.includes('date') || firstLine.includes('time') || firstLine.includes('symbol') || firstLine.includes('type');
    const dataStartIndex = hasHeaders ? 1 : 0;
    
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by comma, handling quoted values
      const columns = line.split(',').map(col => col.replace(/^"(.*)"$/, '$1').trim());
      
      if (columns.length >= 6) {
        try {
          // Flexible column mapping
          let trade = {};
          
          if (hasHeaders) {
            const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
            const getValue = (patterns) => {
              for (const pattern of patterns) {
                const index = headers.findIndex(h => h.includes(pattern));
                if (index !== -1 && columns[index]) return columns[index];
              }
              return null;
            };
            
            trade = {
              date: getValue(['date', 'open time', 'time']) || new Date().toISOString().split('T')[0],
              pair: getValue(['symbol', 'pair', 'instrument']) || 'EURUSD',
              type: (getValue(['type', 'side', 'action']) || 'buy').toUpperCase(),
              entry: parseFloat(getValue(['entry', 'open price', 'price', 'open']) || 0),
              exit: parseFloat(getValue(['exit', 'close price', 'close']) || 0) || null,
              stopLoss: parseFloat(getValue(['stop loss', 'sl', 's/l']) || 0) || null,
              takeProfit: parseFloat(getValue(['take profit', 'tp', 't/p']) || 0) || null,
              lotSize: parseFloat(getValue(['volume', 'size', 'lots', 'amount']) || 0.01),
              pnl: parseFloat(getValue(['profit', 'pnl', 'p&l', 'net']) || 0),
              notes: 'Imported from CSV file',
              setup: 'Imported Trade'
            };
          } else {
            // Standard order assumption
            trade = {
              date: columns[0].replace(/[/.]/g, '-'),
              pair: columns[4] || 'EURUSD',
              type: (columns[2] || 'buy').toUpperCase(),
              entry: parseFloat(columns[5]) || 0,
              exit: parseFloat(columns[8]) || null,
              stopLoss: parseFloat(columns[6]) || null,
              takeProfit: parseFloat(columns[7]) || null,
              lotSize: parseFloat(columns[3]) || 0.01,
              pnl: parseFloat(columns[9]) || 0,
              notes: 'Imported from CSV file',
              setup: 'Imported Trade'
            };
          }
          
          // Validate and add trade
          if (trade.entry && trade.lotSize && trade.pair) {
            // Calculate additional fields
            if (trade.entry && trade.exit && trade.entry !== trade.exit) {
              trade.status = 'closed';
              if (trade.takeProfit && trade.stopLoss) {
                trade.rr = Math.abs((trade.takeProfit - trade.entry) / (trade.entry - trade.stopLoss));
              } else {
                trade.rr = 1;
              }
            } else {
              trade.status = 'open';
              trade.rr = 1;
            }
            
            trade.id = generateId();
            parsedTrades.push(trade);
          }
        } catch (error) {
          console.log(`Error parsing CSV line ${i + 1}:`, error);
        }
      }
    }
    
    return parsedTrades;
  };

  const handleFileUpload = async (file) => {
    const fileName = file.name.toLowerCase();
    const fileType = fileName.split('.').pop();
    
    try {
      const text = await readFileAsText(file);
      let parsedTrades = [];
      
      switch (fileType) {
        case 'csv':
          parsedTrades = parseCSVFile(text);
          break;
        case 'txt':
          parsedTrades = parseCSVFile(text); // Many brokers export as TXT with CSV format
          break;
        default:
          // Try to auto-detect format
          if (text.includes(',') && text.split('\n').length > 1) {
            parsedTrades = parseCSVFile(text);
          }
      }
      
      if (parsedTrades.length > 0) {
        const analysis = analyzeImportedTrades(parsedTrades);
        setImportResults({
          trades: parsedTrades,
          analysis: analysis,
          fileName: file.name,
          fileType: fileType.toUpperCase(),
          accountInfo: parsedTrades[0]?.accountInfo || null
        });
        setSelectedImports(parsedTrades.map((_, index) => index));
      } else {
        showNotification('No valid trades found in the file. Please check the file format and try again.', 'warning');
      }
    } catch (error) {
      showNotification(`Error reading file: ${error.message}`, 'error');
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return ['csv', 'txt'].includes(extension);
    });
    
    if (validFile) {
      handleFileUpload(validFile);
    } else {
      showNotification('Please upload a valid file format: CSV or TXT', 'warning');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const parseTradeHistory = (text) => {
    const lines = text.trim().split('\n');
    const parsedTrades = [];
    
    // Common patterns for different broker formats
    const patterns = {
      // MT4/MT5 format
      mt4: /(\d{4}\.\d{2}\.\d{2})\s+(\d{2}:\d{2}:\d{2})\s+(buy|sell)\s+([\d.]+)\s+([A-Z]{6}|XAUUSD|BTCUSD)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d{4}\.\d{2}\.\d{2})\s+(\d{2}:\d{2}:\d{2})\s+([\d.]+)\s+[\d.-]+\s+[\d.-]+\s+([-\d.]+)/i,
      // CSV format
      csv: /(\d{4}[-/.]\d{2}[-/.]\d{2}),(\d{2}:\d{2}:\d{2}),(buy|sell),([\d.]+),([A-Z]{6}|XAUUSD|BTCUSD),([\d.]+),([\d.]+),([\d.]+),(\d{4}[-/.]\d{2}[-/.]\d{2}),(\d{2}:\d{2}:\d{2}),([\d.]+),([-\d.]+)/i,
      // Simple format
      simple: /([A-Z]{6}|XAUUSD|BTCUSD)\s+(buy|sell)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([-+]?[\d.]+)/i,
      // Tab separated
      tab: /([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t([^\t]+)/,
    };

    lines.forEach((line, index) => {
      if (!line.trim() || line.includes('Date') || line.includes('Time') || line.includes('Symbol')) return;
      
      let match = null;
      let format = '';
      
      for (const [formatName, pattern] of Object.entries(patterns)) {
        match = line.match(pattern);
        if (match) {
          format = formatName;
          break;
        }
      }
      
      if (match) {
        let trade = {};
        
        try {
          switch (format) {
            case 'mt4':
              trade = {
                date: match[1].replace(/\./g, '-'),
                pair: match[5],
                type: match[3].toUpperCase(),
                entry: parseFloat(match[6]),
                stopLoss: parseFloat(match[7]),
                takeProfit: parseFloat(match[8]),
                exit: parseFloat(match[11]),
                lotSize: parseFloat(match[4]),
                pnl: parseFloat(match[12]),
                notes: `Imported from ${format.toUpperCase()} format`,
                setup: 'Imported Trade'
              };
              break;
              
            case 'csv':
              trade = {
                date: match[1].replace(/[/.]/g, '-'),
                pair: match[5],
                type: match[3].toUpperCase(),
                entry: parseFloat(match[6]),
                stopLoss: parseFloat(match[7]),
                takeProfit: parseFloat(match[8]),
                exit: parseFloat(match[11]),
                lotSize: parseFloat(match[4]),
                pnl: parseFloat(match[12]),
                notes: `Imported from CSV format`,
                setup: 'Imported Trade'
              };
              break;
              
            case 'simple':
              trade = {
                date: new Date().toISOString().split('T')[0],
                pair: match[1],
                type: match[2].toUpperCase(),
                entry: parseFloat(match[4]),
                stopLoss: parseFloat(match[5]),
                takeProfit: parseFloat(match[6]),
                exit: parseFloat(match[7]),
                lotSize: parseFloat(match[3]),
                pnl: parseFloat(match[8]),
                notes: `Imported from simple format`,
                setup: 'Imported Trade'
              };
              break;
              
            case 'tab':
              const cols = match.slice(1);
              if (cols.length >= 8) {
                trade = {
                  date: parseStandardDate(cols[0]),
                  pair: cols.find(col => /^[A-Z]{6}$|^XAUUSD$|^BTCUSD$/.test(col)) || 'EURUSD',
                  type: cols.find(col => /^(buy|sell)$/i.test(col))?.toUpperCase() || 'BUY',
                  entry: parseFloat(cols.find(col => /^\d+\.\d{4,5}$/.test(col)) || cols[3]) || 0,
                  stopLoss: parseFloat(cols[4]) || 0,
                  takeProfit: parseFloat(cols[5]) || 0,
                  exit: parseFloat(cols[6]) || 0,
                  lotSize: parseFloat(cols.find(col => /^0\.\d+$/.test(col)) || cols[2]) || 0.1,
                  pnl: parseFloat(cols[cols.length - 1]) || 0,
                  notes: `Imported from tab-separated format`,
                  setup: 'Imported Trade'
                };
              }
              break;
          }
          
          // Calculate additional fields
          if (trade.entry && trade.exit && trade.entry !== trade.exit) {
            trade.status = 'closed';
            trade.rr = Math.abs((trade.takeProfit - trade.entry) / (trade.entry - trade.stopLoss));
          } else {
            trade.status = 'open';
            trade.rr = 1;
          }
          
          // Validate trade data
          if (trade.pair && trade.entry && trade.lotSize) {
            trade.id = generateId();
            parsedTrades.push(trade);
          }
        } catch (error) {
          console.log(`Error parsing line ${index + 1}:`, error);
        }
      }
    });
    
    return parsedTrades.filter(t => t.entry && t.lotSize && t.pair);
  };

  const analyzeImportedTrades = (trades) => {
    const analysis = {
      totalTrades: trades.length,
      validTrades: trades.filter(t => t.pair && t.entry && t.lotSize).length,
      closedTrades: trades.filter(t => t.status === 'closed').length,
      openTrades: trades.filter(t => t.status === 'open').length,
      totalPnL: trades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      pairs: [...new Set(trades.map(t => t.pair))],
      dateRange: {
        from: trades.reduce((min, t) => t.date < min ? t.date : min, trades[0]?.date || ''),
        to: trades.reduce((max, t) => t.date > max ? t.date : max, trades[0]?.date || '')
      },
      avgLotSize: trades.length > 0 ? trades.reduce((sum, t) => sum + (t.lotSize || 0), 0) / trades.length : 0,
      winRate: trades.filter(t => t.status === 'closed').length > 0 ? 
        (trades.filter(t => t.pnl > 0).length / trades.filter(t => t.status === 'closed').length) * 100 : 0
    };
    
    return analysis;
  };

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

  const importSelectedTrades = async () => {
    if (!importResults || selectedImports.length === 0) {
      console.log('No import results or selected imports');
      return;
    }
    
    try {
      setImporting(true);
    console.log('Starting import of', selectedImports.length, 'trades');
    const tradesToImport = selectedImports.map(index => importResults.trades[index]);
    
    // Process trades for database format
    const processedTrades = tradesToImport.map(trade => ({
      ...trade,
      id: trade.id || generateId(),
      pnl: trade.pnl || 0,
      status: trade.status || (trade.exit ? 'closed' : 'open'),
      rr: trade.rr || (trade.takeProfit && trade.stopLoss && trade.entry ? 
        Math.abs((parseFloat(trade.takeProfit) - parseFloat(trade.entry)) / 
                (parseFloat(trade.entry) - parseFloat(trade.stopLoss))) : null),
      isImported: true // Preserve import flag for proper database handling
    }));

    // Use optimized import system with progress tracking
    setShowImportProgress(true);
    setImportJob({
      id: `csv_import_${Date.now()}`,
      status: 'initializing',
      totalTrades: processedTrades.length,
      processedTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      duplicateTrades: 0,
      filename: 'CSV Import',
      progress: 0,
      currentPhase: 'preparing'
    });
    
    const result = await importManager.startOptimizedImport(processedTrades, session.user.id, {
      chunkSize: 500,
      skipDuplicates: false, // Temporarily disable to test if this is causing the issue
      lazyCalculation: true,
      filename: 'CSV Import',
      progressCallback: (progress) => {
        setImportJob(prev => ({
          ...prev,
          ...progress,
          lastUpdate: Date.now()
        }));
      }
    });
    
    let savedTrades = [];
    let loadResult = null;
    
    if (result.success) {
      console.log('Successfully batch imported', result.imported, 'trades');
      // Load the newly imported trades from database with progress tracking
      loadResult = await loadTradesFromDatabase(session.user.id, (progress) => {
        setImportJob(prev => ({
          ...prev,
          currentPhase: 'loading',
          progress: 90 + (progress.loaded / progress.total) * 10
        }));
      });
      if (loadResult.success) {
        // Match trades by their unique characteristics instead of position
        savedTrades = processedTrades.map(originalTrade => {
          // Find matching trade from database by date, pair, and entry price
          const matchedTrade = loadResult.trades.find(dbTrade => 
            dbTrade.date === originalTrade.date &&
            dbTrade.pair === originalTrade.pair &&
            Math.abs(parseFloat(dbTrade.entry) - parseFloat(originalTrade.entry)) < 0.0001 &&
            dbTrade.type === originalTrade.type
          );
          
          // Return the database version with proper ID, or fallback to original
          return matchedTrade || {...originalTrade, id: `temp_${generateId()}`};
        });
      } else {
        savedTrades = processedTrades;
      }
    } else {
      console.error('Batch import failed, falling back to individual saves:', result.error);
      // Fallback to individual saves if batch fails
      savedTrades = [];
      for (const trade of processedTrades) {
        const individualResult = await addTradeToDatabase(trade, session.user.id);
        if (individualResult.success) {
          savedTrades.push(individualResult.trade);
        } else {
          savedTrades.push({...trade, id: generateId()});
        }
      }
    }
    
    console.log('Reloading all trades from database after import');
    console.log('Import result:', { success: result.success, imported: result.imported });
    console.log('Load result:', { success: loadResult?.success, tradesCount: loadResult?.trades?.length });
    
    // Reload all trades from database after successful import to ensure consistency
    if (result.success && loadResult && loadResult.success && loadResult.trades.length > 0) {
      console.log(`🔍 TRACE AppContent: About to call dataManager.setTrades with ${loadResult.trades.length} trades`);
      // Aggressive cache clearing before loading imported trades
      tradeCache.clearAll();
      tradeCache.invalidateUserCache(session.user.id);
      
      dataManager.setTrades(loadResult.trades, riskInputs.accountBalance, { 
        useCache: false,
        batchProcess: true,
        lazyCalculation: false
      });
      console.log('✅ Successfully updated dataManager with', loadResult.trades.length, 'trades from database');
    } else {
      // Fallback: add imported trades individually if database reload failed
      console.log('⚠️ Database reload failed or no trades loaded, using fallback');
      console.log('Fallback: Adding', savedTrades.length, 'trades to dataManager individually');
      savedTrades.forEach(trade => {
        dataManager.addTrade(trade, riskInputs.accountBalance);
      });
      
      // If no trades were added at all, this is a critical issue
      if (savedTrades.length === 0) {
        console.error('❌ CRITICAL: No trades were added to dataManager!');
        showNotification('Import failed: No trades were processed', 'error');
        return;
      }
    }
    
    // Update import status to completed
    const finalImportedCount = loadResult?.trades?.length || savedTrades.length;
    const actualImportedCount = result.imported || 0;
    
    setImportJob(prev => ({
      ...prev,
      status: 'completed',
      progress: 100,
      currentPhase: 'completed',
      successfulTrades: finalImportedCount,
      duplicateTrades: result.duplicatesSkipped || 0,
      debugInfo: {
        ...prev.debugInfo,
        final: {
          originalCount: processedTrades.length,
          databaseImported: actualImportedCount,
          uiLoaded: finalImportedCount,
          discrepancy: actualImportedCount !== finalImportedCount
        },
        issues: [
          ...(prev.debugInfo?.issues || []),
          ...(actualImportedCount === 0 ? ['No trades were successfully imported to database'] : []),
          ...(finalImportedCount === 0 ? ['No trades loaded in UI after import'] : []),
          ...(actualImportedCount !== finalImportedCount ? [`Database shows ${actualImportedCount} imported, but UI loaded ${finalImportedCount}`] : [])
        ]
      }
    }));
    
    // Show success notification
    if (finalImportedCount > 0) {
      const duplicatesCount = result.duplicatesSkipped || 0;
      showNotification(
        `Successfully imported ${finalImportedCount} trades${duplicatesCount > 0 ? ` (${duplicatesCount} duplicates skipped)` : ''}!`, 
        'success'
      );
    } else {
      showNotification(
        `Import completed but no trades were loaded. Check the import progress for details.`, 
        'warning'
      );
    }
    
    // Clear import state
    setImportText('');
    setImportResults(null);
    setSelectedImports([]);
    setShowImportModal(false);
    
      console.log('Import process completed');
      setImporting(false);
    } catch (error) {
      console.error('Import failed:', error);
      
      // Update import status to failed
      setImportJob(prev => ({
        ...prev,
        status: 'failed',
        error: error.message,
        currentPhase: 'failed'
      }));
      
      setImporting(false);
      alert(`Import failed: ${error.message}`);
    }
  };

  const toggleTradeSelection = (index) => {
    setSelectedImports(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // DISABLED AI ANALYSIS FUNCTIONS - All AI analysis code has been disabled
  /*
  const analyzeTradesWithClaude = async (analysisType = 'performance') => {
    if (!anthropicApiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setAnalysisLoading(true);
    
    try {
      const stats = calculateStats();
      const recentTrades = trades.slice(-10);
      
      let prompt = '';
      switch (analysisType) {
        case 'performance':
          prompt = `As a professional trading analyst, analyze this trading performance data:

ACCOUNT PERFORMANCE:
- Total Trades: ${stats.totalTrades}
- Win Rate: ${stats.winRate}%
- Total P&L: ${stats.totalPnL}
- Profit Factor: ${stats.profitFactor}
- Average Win: ${stats.avgWin}
- Average Loss: ${stats.avgLoss}

RECENT TRADES (Last 10):
${recentTrades.map(t => `${t.date}: ${t.pair} ${t.type} ${t.lotSize} lots - Entry: ${t.entry} Exit: ${t.exit || 'Open'} P&L: ${t.pnl}`).join('\n')}

Provide specific, actionable insights focusing on:
1. Performance strengths and weaknesses
2. Risk management assessment 
3. Trading pattern analysis
4. Concrete improvement recommendations
5. Market conditions suitability

Be professional, specific, and provide actionable advice.`;
          break;
          
        case 'risk':
          prompt = `Analyze the risk management of this trading account:

RISK METRICS:
- Account Balance: ${riskInputs.accountBalance}
- Current Risk Per Trade: ${riskInputs.riskPercent}%
- Open Trades: ${stats.openTrades}
- Win Rate: ${stats.winRate}%
- Profit Factor: ${stats.profitFactor}

POSITION SIZING:
- Current Position Size: ${riskResults.positionSizeStandardLots} lots
- Risk Amount: ${riskResults.riskAmount}
- R:R Ratio: 1:${riskResults.rrRatio}

Evaluate risk management and provide specific recommendations for position sizing, risk percentage, and overall risk strategy.`;
          break;
          
        case 'strategy':
          prompt = `Analyze trading strategy and patterns from this data:

TRADING PATTERNS:
${trades.map(t => `${t.setup}: ${t.pair} ${t.type} - ${t.status} - P&L: ${t.pnl}`).join('\n')}

Identify successful patterns, unsuccessful patterns, and recommend strategy improvements. Focus on setup types, currency pair performance, and timing patterns.`;
          break;
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      setClaudeAnalysis(data.content[0].text);
    } catch (error) {
      setClaudeAnalysis(`Error: ${error.message}. Please check your API key and try again.`);
    } finally {
      setAnalysisLoading(false);
    }
  };
  */
  // END DISABLED AI ANALYSIS FUNCTIONS

  // Trading Goals Functions
  const addGoal = () => {
    const goal = {
      id: generateId(),
      ...newGoal,
      status: 'not-started',
      milestones: newGoal.milestones.map((m, index) => ({
        id: generateId(),
        title: m.title,
        completed: false,
        dueDate: m.dueDate
      }))
    };
    
    setTradingGoals(prev => [...prev, goal]);
    setNewGoal({
      title: '',
      description: '',
      targetDate: '',
      priority: 'medium',
      milestones: []
    });
    setShowGoalModal(false);
  };

  const updateGoal = (goalId, updates) => {
    setTradingGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, ...updates } : goal
    ));
  };

  const deleteGoal = (goalId) => {
    setTradingGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  const toggleMilestone = (goalId, milestoneId) => {
    setTradingGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? {
            ...goal,
            milestones: goal.milestones.map(milestone =>
              milestone.id === milestoneId
                ? { ...milestone, completed: !milestone.completed }
                : milestone
            )
          }
        : goal
    ));
  };

  const addMilestone = (goalId, milestone) => {
    setTradingGoals(prev => prev.map(goal =>
      goal.id === goalId
        ? {
            ...goal,
            milestones: [...goal.milestones, {
              id: generateId(),
              title: milestone,
              completed: false,
              dueDate: ''
            }]
          }
        : goal
    ));
  };

  // Robust decimal parsing function that handles both US and European formats
  const parseDecimal = (value) => {
    if (!value || value === '' || value === null || value === undefined) {
      return 0;
    }
    
    const str = String(value).trim();
    
    // Handle empty or non-numeric strings
    if (str === '' || str === '-' || str === 'N/A' || str === 'null') {
      return 0;
    }
    
    // If it contains both comma and dot, determine which is decimal separator
    if (str.includes(',') && str.includes('.')) {
      // European format: 1.234,56 (dot as thousands, comma as decimal)
      if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
        return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
      }
      // US format: 1,234.56 (comma as thousands, dot as decimal)
      else {
        return parseFloat(str.replace(/,/g, '')) || 0;
      }
    }
    // Only comma - likely European decimal separator
    else if (str.includes(',') && !str.includes('.')) {
      return parseFloat(str.replace(',', '.')) || 0;
    }
    // Only dot or no separators - standard parsing
    else {
      return parseFloat(str) || 0;
    }
  };

  // Simple PnL calculation - no multipliers, user enters actual P&L values
  const calculatePnL = (entry, exit, lotSize, pair, type) => {
    if (!exit || !entry || !lotSize) return 0;
    
    const entryPrice = parseFloat(entry);
    const exitPrice = parseFloat(exit);
    const size = parseFloat(lotSize);
    const tradeDirection = type.toUpperCase() === 'BUY' ? 1 : -1;
    
    // Simple price difference calculation - let users enter their actual P&L
    // This removes all the complex multipliers and asset-specific calculations
    return (exitPrice - entryPrice) * tradeDirection * size;
  };

  // Trade Management Functions using centralized data manager
  const addTrade = async () => {
    if (!newTrade.entry || !newTrade.stopLoss || !newTrade.takeProfit || !newTrade.lotSize) return;
    
    const trade = {
      id: generateId(),
      ...newTrade,
      entry: parseFinancialNumber(newTrade.entry),
      exit: newTrade.exit ? parseFinancialNumber(newTrade.exit) : null,
      stopLoss: parseFinancialNumber(newTrade.stopLoss),
      takeProfit: parseFinancialNumber(newTrade.takeProfit),
      lotSize: parseFinancialNumber(newTrade.lotSize),
      status: newTrade.exit ? 'closed' : 'open',
      // Preserve any PnL that was calculated (e.g., from risk calculator or manual entry)
      pnl: newTrade.pnl || (newTrade.exit ? calculatePnL(
        parseFinancialNumber(newTrade.entry),
        parseFinancialNumber(newTrade.exit),
        parseFinancialNumber(newTrade.lotSize),
        newTrade.type,
        newTrade.pair
      ) : 0)
    };
    
    try {
      // Save to database first
      const result = await addTradeToDatabase(trade, session.user.id);
      
      if (result.success) {
        // Add to centralized data manager
        dataManager.addTrade(result.trade, riskInputs.accountBalance);
        showNotification('Trade added successfully', 'success');
      } else {
        // Fallback to local storage if database fails
        console.error('Failed to save to database, using local storage:', result.error);
        dataManager.addTrade(trade, riskInputs.accountBalance);
        showNotification('Trade saved locally (database sync failed)', 'warning');
      }
    } catch (error) {
      console.error('Error adding trade:', error);
      // Fallback to local data manager and inform user
      dataManager.addTrade(trade, riskInputs.accountBalance);
      showNotification('Trade saved locally (database connection failed)', 'warning');
    }
    
    // Reset form
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

  const deleteTrade = async (id) => {
    try {
      // Delete from database first
      const result = await deleteTradeFromDatabase(id, session.user.id);
      
      if (result.success) {
        // Remove from centralized data manager
        dataManager.removeTrade(id, riskInputs.accountBalance);
      } else {
        // Fallback to local deletion if database fails
        console.error('Failed to delete from database, removing locally:', result.error);
        dataManager.removeTrade(id, riskInputs.accountBalance);
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      // Fallback to local data manager
      dataManager.removeTrade(id, riskInputs.accountBalance);
    }
  };

  const editTrade = (trade) => {
    setEditingTrade(trade);
    setNewTrade({
      date: trade.date,
      pair: trade.pair,
      type: trade.type,
      entry: trade.entry.toString(),
      exit: trade.exit ? trade.exit.toString() : '',
      stopLoss: trade.stopLoss.toString(),
      takeProfit: trade.takeProfit.toString(),
      lotSize: trade.lotSize.toString(),
      notes: trade.notes,
      setup: trade.setup
    });
    setShowAddTrade(true);
  };

  const updateTrade = async () => {
    if (!editingTrade) return;
    
    const updatedTrade = {
      ...editingTrade,
      ...newTrade,
      entry: parseFinancialNumber(newTrade.entry),
      exit: newTrade.exit ? parseFinancialNumber(newTrade.exit) : null,
      stopLoss: parseFinancialNumber(newTrade.stopLoss),
      takeProfit: parseFinancialNumber(newTrade.takeProfit),
      lotSize: parseFinancialNumber(newTrade.lotSize),
      status: newTrade.exit ? 'closed' : 'open'
    };
    
    try {
      // Update in database first
      const result = await updateTradeInDatabase(updatedTrade, session.user.id);
      
      if (result.success) {
        // Update in centralized data manager
        dataManager.updateTrade(editingTrade.id, updatedTrade, riskInputs.accountBalance);
      } else {
        // Fallback to local update if database fails
        console.error('Failed to update in database, updating locally:', result.error);
        dataManager.updateTrade(editingTrade.id, updatedTrade, riskInputs.accountBalance);
      }
    } catch (error) {
      console.error('Error updating trade:', error);
      // Fallback to local data manager
      dataManager.updateTrade(editingTrade.id, updatedTrade, riskInputs.accountBalance);
    }
    
    setEditingTrade(null);
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

  // Calendar Functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getTradesForDate = (dateStr) => {
    return dataManager.getTradesForDate(dateStr);
  };

  const getDayPnL = (dateStr) => {
    return dataManager.getPnLForDate(dateStr);
  };

  // Helper functions for real-time streak calculation
  const calculateMaxWinStreak = () => {
    const closedTrades = dataManager.trades.filter(t => t.status === 'closed');
    let currentStreak = 0;
    let maxStreak = 0;
    
    closedTrades.forEach(trade => {
      if (trade.pnl > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return maxStreak;
  };

  const calculateMaxLossStreak = () => {
    const closedTrades = dataManager.trades.filter(t => t.status === 'closed');
    let currentStreak = 0;
    let maxStreak = 0;
    
    closedTrades.forEach(trade => {
      if (trade.pnl < 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return maxStreak;
  };

  // Enhanced Statistics with Database Metrics Integration
  const calculateStats = () => {
    // Use centralized data manager for consistent statistics
    return dataManager.statistics || {
      totalTrades: 0,
      closedTrades: 0,
      openTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnL: 0,
      worthScore: 0
    };
  };

  // Migration Functions
  const handleMigrateToDatabase = async () => {
    if (dataManager.trades.length === 0) {
      setMigrationMessage('No trades to migrate');
      return;
    }

    setMigrationStatus('migrating');
    setMigrationMessage(`Migrating ${dataManager.trades.length} trades to database...`);

    const result = await migrateLocalTradesToDatabase(dataManager.trades, session.user.id);
    
    if (result.success) {
      setMigrationStatus('success');
      setMigrationMessage(`Successfully migrated ${result.count} trades to database!`);
      
      // Load trades from database to replace local state
      setTimeout(() => {
        loadTradesFromDatabaseHandler();
      }, 2000);
    } else {
      setMigrationStatus('error');
      setMigrationMessage(`Migration failed: ${result.error}`);
    }
  };

  const loadTradesFromDatabaseHandler = async () => {
    const result = await loadTradesFromDatabase(session.user.id);
      // Clear cache to ensure fresh data is used
      tradeCache.invalidateUserCache(session.user.id);
    
      console.log(`🔍 TRACE AppContent: About to call dataManager.setTrades with ${result.trades.length} trades from loadTradesFromDatabaseHandler`);
    if (result.success) {
      // Aggressive cache clearing before loading
      tradeCache.clearAll();
      tradeCache.invalidateUserCache(session.user.id);
      
      dataManager.setTrades(result.trades, riskInputs.accountBalance, { 
        useCache: false,
        batchProcess: true,
        lazyCalculation: false
      });
      setMigrationMessage('Trades loaded from database successfully!');
      // Also load profile metrics
      await loadProfileMetrics(session.user.id);
    } else {
      setMigrationMessage(`Failed to load trades: ${result.error}`);
    }
  };

  // Load profile metrics from database
  const loadProfileMetrics = async (userId) => {
    try {
      const result = await fetchProfileMetrics(userId);
      
      if (result.success) {
        setProfileMetrics(result.metrics);
      } else {
        console.error('Failed to load profile metrics:', result.error);
      }
    } catch (error) {
      console.error('Error loading profile metrics:', error);
    }
  };

  // Delete filtered trades function
  const handleDeleteFilteredTrades = async () => {
    console.log('handleDeleteFilteredTrades called');
    console.log('filteredTrades.length:', filteredTrades.length);
    
    if (filteredTrades.length === 0) {
      showNotification('No trades to delete with current filters', 'warning');
      setShowDeleteFilteredModal(false);
      return;
    }

    // Set loading state
    setDeletingFiltered(true);

    const tradeIds = filteredTrades.map(trade => trade.id);
    console.log('Trade IDs to delete:', tradeIds);
    console.log('First few trade objects:', filteredTrades.slice(0, 3));
    console.log('Trade ID types:', tradeIds.slice(0, 5).map(id => ({ id, type: typeof id, length: id?.length })));
    
    try {
      // If user is authenticated and we have database trades, delete from database
      if (session?.user?.id) {
        console.log('User authenticated, batch deleting from database');
        console.log('Session user ID:', session.user.id);
        console.log('Trade IDs for batch deletion:', tradeIds);
        
        // Use batch delete for much better performance
        const result = await batchDeleteTrades(tradeIds, session.user.id);
        console.log('Batch delete result:', result);
        
        if (result.success && result.deletedCount > 0) {
          // Reload all trades from database to reflect changes
          const loadResult = await loadTradesFromDatabase(session.user.id);
          if (loadResult.success) {
            tradeCache.clearAll();
            tradeCache.invalidateUserCache(session.user.id);
            dataManager.setTrades(loadResult.trades, riskInputs.accountBalance, { 
              useCache: false,
              batchProcess: true,
              lazyCalculation: false
            });
          }
          
          const message = result.fallback 
            ? `Successfully deleted ${result.deletedCount} trades (using fallback method)`
            : `Successfully deleted ${result.deletedCount} filtered trades`;
          showNotification(message, 'success');
        } else {
          showNotification(`Failed to delete trades: ${result.error || 'Unknown error'}`, 'error');
        }
      } else {
        // For local storage mode, remove from dataManager
        tradeIds.forEach(tradeId => {
          dataManager.removeTrade(tradeId, riskInputs.accountBalance);
        });
        showNotification(`Successfully deleted ${tradeIds.length} filtered trades`, 'success');
      }
      
      // Reset pagination to first page
      setCurrentPage(1);
      
    } catch (error) {
      console.error('Error deleting filtered trades:', error);
      showNotification('Failed to delete trades', 'error');
    } finally {
      // Always reset loading state and close modal
      setDeletingFiltered(false);
      setShowDeleteFilteredModal(false);
    }
  };

  // Debug function to log trade data
  const debugTrades = () => {
    console.log('=== TRADE DEBUG INFO ===');
    console.log('Total trades:', dataManager.trades.length);
    console.log('Unique pairs:', [...new Set(dataManager.trades.map(t => t.pair))]);
    console.log('All trades:', dataManager.trades.map(t => ({ id: t.id, pair: t.pair, pnl: t.pnl, status: t.status })));
    console.log('Filtered trades:', filteredTrades.length);
    console.log('Filter states:');
    console.log('  filterStatus:', filterStatus);
    console.log('  filterPair:', filterPair);
    console.log('  filterType:', filterType);
    console.log('  filterSetup:', filterSetup);
    console.log('  dateFrom:', dateFrom);
    console.log('  dateTo:', dateTo);
    console.log('  searchTerm:', searchTerm);
    console.log('=======================');
  };

  // Auto-show migration modal on first load if we have local trades
  const checkForMigrationNeeded = async () => {
    console.log('Checking for migration needed...');
    
    // First, always try to load existing trades from database
    const dbResult = await loadTradesFromDatabase(session.user.id);
    
    if (dbResult.success && dbResult.trades.length > 0) {
      // User already has trades in database - use those and skip migration
      console.log('Found', dbResult.trades.length, 'trades in database, loading them');
      // Aggressive cache clearing to ensure fresh data
      tradeCache.clearAll(); // Clear all caches
      tradeCache.invalidateUserCache(session.user.id); // Invalidate user-specific cache
      
      console.log(`🔍 TRACE AppContent: About to call dataManager.setTrades with ${dbResult.trades.length} trades from handleDatabaseCheck`);
      dataManager.setTrades(dbResult.trades, riskInputs.accountBalance, { 
        useCache: false,
        batchProcess: true,
        lazyCalculation: false  // Force full calculations
      });
      console.log(`✅ Successfully loaded ${dbResult.trades.length} trades from database in handleDatabaseCheck`);
      showNotification(`Loaded ${dbResult.trades.length} existing trades from database`, 'info');
      return;
    }
    
    // Only consider migration if we have local trades AND no database trades
    if (dataManager.trades.length > 0) {
      console.log('Found', dataManager.trades.length, 'local trades and no database trades');
      // Only show migration modal for non-sample data or if user explicitly wants to migrate
      if (dataManager.trades.length > 3 || !dataManager.trades.every(t => [1,2,3].includes(t.id))) {
        // setShowMigrationModal(true); // Hidden for production use
        console.log('Migration modal disabled for production');
      } else {
        console.log('Detected sample trades, not showing auto-migration modal');
      }
    }
  };

  // Quick migration for trade journal button
  const handleQuickMigration = async () => {
    if (dataManager.trades.length === 0) {
      showNotification('No trades to migrate', 'warning');
      return;
    }

    setQuickMigrating(true);
    const result = await migrateLocalTradesToDatabase(dataManager.trades, session.user.id);
    
    if (result.success) {
      // Load fresh data from database
      const loadResult = await loadTradesFromDatabase(session.user.id);
      if (loadResult.success) {
        dataManager.setTrades(loadResult.trades, riskInputs.accountBalance, { useCache: false });
        showNotification(`Successfully migrated ${result.count} trades to database!`, 'success');
      }
    } else {
      showNotification(`Migration failed: ${result.error}`, 'error');
    }
    
    setQuickMigrating(false);
  };

  // Emergency cleanup function
  const handleEmergencyCleanup = async () => {
    setCleaning(true);
    const result = await deleteAllUserTrades(session.user.id);
    
    if (result.success) {
      dataManager.setTrades([], riskInputs.accountBalance);
      showNotification(`Successfully deleted ${result.deletedCount} trades from database`, 'success');
      setShowCleanupModal(false);
    } else {
      showNotification(`Cleanup failed: ${result.error}`, 'error');
    }
    
    setCleaning(false);
  };

  const stats = calculateStats();
  const riskLevel = getRiskLevel();

  // Load user profile for avatar
  useEffect(() => {
    const loadUserProfile = async () => {
      if (session?.user?.id) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('profile_picture_url, avatar_url')
            .eq('id', session.user.id)
            .single();
          
          if (profileData) {
            setUserProfile(profileData);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    };

    loadUserProfile();
  }, [session?.user?.id]);

  // Check for migration on component mount
  useEffect(() => {
    checkForMigrationNeeded();
  }, [session.user.id]);

  // Enhanced filtering logic
  const filteredTrades = dataManager.getFilteredTrades({
    status: filterStatus,
    pair: filterPair,
    type: filterType,
    setup: filterSetup,
    dateFrom,
    dateTo,
    search: searchTerm
  }) || [];
  
  // Pagination logic
  const totalPages = tradesPerPage === -1 ? 1 : Math.ceil(filteredTrades.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const paginatedTrades = tradesPerPage === -1 ? filteredTrades : filteredTrades.slice(startIndex, startIndex + tradesPerPage);
  
  // Get unique values for filter options
  const filterOptions = dataManager.getFilterOptions();
  const uniquePairs = filterOptions.pairs;
  const uniqueSetups = filterOptions.setups;
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterPair, filterType, filterSetup, dateFrom, dateTo, searchTerm]);

  // Notification Component
  const NotificationComponent = ({ notifications }) => (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`max-w-sm p-4 rounded-lg shadow-lg border transform transition-all duration-300 ease-in-out ${
            notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          } animate-slide-in`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium flex-1">{notification.message}</p>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">

      {/* Glassmorphic Header with Responsive Navigation */}
      <header className={`border-b border-slate-200/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 transition-all duration-300 ${
        isMobile ? 'static' : 'sticky top-0'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: App Branding */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/tradeworth-logo.png" 
                  alt="TradeWorth Logo" 
                  className="h-10 w-auto"
                />
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">TradeWorth</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Professional Trading Platform</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full p-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Home },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'journal', label: 'Journal', icon: BookOpen },
                { id: 'risk-calculator', label: 'Calculator', icon: Calculator },
                { id: 'charts', label: 'Charts', icon: LineChart },
                { id: 'calendar', label: 'Calendar', icon: Calendar },
                { id: 'news', label: 'News', icon: Newspaper },
                { id: 'goals', label: 'Goals', icon: Target }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-lg'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{tab.label}</span>
                      {activeTab === tab.id && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Right: User Actions */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Trader'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Balance: ${riskInputs.accountBalance.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full overflow-hidden flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                    title="Profile Settings"
                  >
                    {(() => {
                      const avatarUrl = userProfile?.profile_picture_url || session?.user?.user_metadata?.avatar_url;
                      return avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null;
                    })()}
                    <User className="w-5 h-5 text-white" style={{ 
                      display: (userProfile?.profile_picture_url || session?.user?.user_metadata?.avatar_url) ? 'none' : 'block' 
                    }} />
                  </button>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 hover:text-red-700 transition-all"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Bar - Sticky at top with scroll behavior */}
        {isMobile && (
          <nav className={`sticky bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/30 dark:border-slate-700/30 transition-all duration-300 z-40 ${
            isNavVisible ? 'top-0 translate-y-0' : 'top-0 -translate-y-full'
          }`}>
            <div className="flex justify-around items-center px-2 py-3 overflow-x-auto">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Home },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'journal', label: 'Journal', icon: BookOpen },
                { id: 'risk-calculator', label: 'Risk Calc', icon: Calculator },
                { id: 'charts', label: 'Charts', icon: LineChart },
                { id: 'news', label: 'News', icon: Newspaper },
                { id: 'calendar', label: 'Calendar', icon: Calendar },
                { id: 'goals', label: 'Goals', icon: Target },
                { id: 'profile', label: 'Profile', icon: User }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg min-w-0 flex-shrink-0 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Main Content Area */}
        <div className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="container mx-auto px-6 py-8">

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <Dashboard accountBalance={riskInputs.accountBalance} />
      )}


      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Profile 
          supabase={supabase} 
          user={session?.user} 
          accountBalance={riskInputs.accountBalance}
          onProfileUpdate={(updatedProfile) => {
            setUserProfile(updatedProfile);
          }}
        />
      )}

      {/* Enhanced Analytics Tab */}
      {activeTab === 'analytics' && (
        <Analytics supabase={supabase} user={session?.user} />
      )}

      {/* Risk Calculator Tab */}
      {activeTab === 'risk-calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center mb-6">
                <Calculator className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">Trade Parameters</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Balance ($)</label>
                  <input
                    type="number"
                    value={riskInputs.accountBalance}
                    onChange={(e) => handleRiskInputChange('accountBalance', e.target.value)}
                    className="w-full px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Risk Per Trade (%)</label>
                  <input
                    type="number"
                    value={riskInputs.riskPercent}
                    onChange={(e) => handleRiskInputChange('riskPercent', e.target.value)}
                    className="w-full px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                    step="0.1"
                  />
                  <div className={`mt-2 px-3 py-2 rounded-lg ${riskLevel.bg}`}>
                    <span className={`font-medium ${riskLevel.color}`}>Risk Level: {riskLevel.level}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency Pair {riskInputs.currencyPair && (
                      <span className="inline-flex items-center ml-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {getCurrencyPairIcon(riskInputs.currencyPair)}
                        {riskInputs.currencyPair}
                      </span>
                    )}
                    {riskInputs.currencyPair && (() => {
                      const priceData = getCurrencyPairPrices(riskInputs.currencyPair);
                      const bgColor = priceData.isLive ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700';
                      const dotColor = priceData.isLive ? 'bg-green-500' : 'bg-orange-500';
                      const dotAnimation = priceData.isLive ? 'animate-pulse' : '';
                      
                      return (
                        <span className={`inline-flex items-center ml-2 px-2 py-1 ${bgColor} rounded-full text-xs`}>
                          <div className={`w-2 h-2 ${dotColor} rounded-full mr-1 ${dotAnimation}`}></div>
                          {priceData.current.toFixed(priceData.current > 100 ? 2 : 5)}
                          {priceData.change !== undefined && priceData.changePercent !== undefined && (
                            <span className={`ml-1 ${priceData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {priceData.change >= 0 ? '+' : ''}{priceData.changePercent.toFixed(2)}%
                            </span>
                          )}
                          {priceData.source && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({priceData.source === 'Yahoo Finance' ? 'YF' : 
                                priceData.source === 'ExchangeRate API' ? 'ER' :
                                priceData.source === 'CoinGecko' ? 'CG' : 
                                priceData.source === 'Fallback' ? 'FB' : 'ST'})
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </label>
                  <PairSearchInput
                    value={riskInputs.currencyPair}
                    onChange={(pair) => handleRiskInputChange('currencyPair', pair)}
                    placeholder="Search trading pairs (e.g., EURUSD, BTCUSD, XAUUSD)..."
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:ring-blue-500/50 focus:border-blue-500/50 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                    maxResults={20}
                    showCategories={true}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Entry Price</label>
                    <input
                      type="number"
                      value={riskInputs.entryPrice}
                      onChange={(e) => handleRiskInputChange('entryPrice', e.target.value)}
                      className="w-full px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                      step="0.0001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss</label>
                    <input
                      type="number"
                      value={riskInputs.stopLoss}
                      onChange={(e) => handleRiskInputChange('stopLoss', e.target.value)}
                      className="w-full px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                      step="0.0001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Take Profit</label>
                    <input
                      type="number"
                      value={riskInputs.takeProfit}
                      onChange={(e) => handleRiskInputChange('takeProfit', e.target.value)}
                      className="w-full px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                      step="0.0001"
                    />
                  </div>
                </div>

                {/* Live Price Status */}
                <div className="text-center py-2 border-t border-gray-200/50">
                  <div className="text-xs text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${Object.values(livePrices).some(p => p.isLive) ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                      <span>
                        {Object.values(livePrices).some(p => p.isLive) 
                          ? `Live prices from multiple sources • Updates every 45s` 
                          : 'Using fallback prices'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Last update: {new Date(lastPriceUpdate).toLocaleTimeString()}
                      {Object.keys(priceErrors).length > 0 && (
                        <span className="text-orange-500 ml-2">• Some symbols failed</span>
                      )}
                    </div>
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
                      lotSize: riskResults.positionSizeStandardLots,
                      pnl: riskResults.potentialProfit
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
          </div>

          <div className="space-y-6">
            <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative p-6">
                <div className="flex items-center mb-4">
                  <Target className="h-6 w-6 text-green-600 mr-2" />
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">Position Sizing Results</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 rounded-xl p-4 shadow-lg shadow-blue-200/30">
                    <p className="text-sm text-gray-600 mb-1">Position Size</p>
                    <p className="text-2xl font-bold text-blue-600">{riskResults.positionSizeStandardLots} lots</p>
                    <p className="text-xs text-gray-500">{riskResults.lotSize} {riskResults.instrumentType}</p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50/80 to-rose-50/80 dark:from-red-900/30 dark:to-rose-900/30 backdrop-blur-sm border border-red-200/30 dark:border-red-700/30 rounded-xl p-4 shadow-lg shadow-red-200/30">
                    <p className="text-sm text-gray-600 mb-1">Risk Amount</p>
                    <p className="text-2xl font-bold text-red-600">${riskResults.riskAmount}</p>
                    <p className="text-xs text-gray-500">{riskInputs.riskPercent}% of balance</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 backdrop-blur-sm border border-green-200/30 dark:border-green-700/30 rounded-xl p-4 shadow-lg shadow-green-200/30">
                    <p className="text-sm text-gray-600 mb-1">Potential Profit</p>
                    <p className="text-2xl font-bold text-green-600">${riskResults.potentialProfit}</p>
                    <p className="text-xs text-gray-500">{riskResults.rewardPips} pips</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50/80 to-violet-50/80 dark:from-purple-900/30 dark:to-violet-900/30 backdrop-blur-sm border border-purple-200/30 dark:border-purple-700/30 rounded-xl p-4 shadow-lg shadow-purple-200/30">
                    <p className="text-sm text-gray-600 mb-1">Risk/Reward</p>
                    <p className="text-2xl font-bold text-purple-600">1:{riskResults.rrRatio}</p>
                    <p className="text-xs text-gray-500">{riskResults.pipsAtRisk} pips risk</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/20 dark:border-slate-700/30 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-orange-600 mr-2" />
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">Risk Analysis</h2>
                {riskResults.riskLevel && (
                  <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border ${
                    riskResults.riskLevel === 'HIGH' ? 'bg-red-100/80 text-red-800 border-red-200/30 shadow-lg shadow-red-200/20' :
                    riskResults.riskLevel === 'MEDIUM' ? 'bg-yellow-100/80 text-yellow-800 border-yellow-200/30 shadow-lg shadow-yellow-200/20' :
                    'bg-green-100/80 text-green-800 border-green-200/30 shadow-lg shadow-green-200/20'
                  }`}>
                    {riskResults.riskLevel} RISK
                  </span>
                )}
              </div>
              
              {/* Risk Warnings */}
              {riskResults.warnings && riskResults.warnings.length > 0 && (
                <div className="mb-6 space-y-2">
                  {riskResults.warnings.map((warning, index) => (
                    <div key={`warning-${index}-${warning.type}-${warning.message.substring(0, 20)}`} className={`p-3 rounded-lg border-l-4 ${
                      warning.type === 'CRITICAL' ? 'bg-red-50 border-red-500 text-red-800' :
                      warning.type === 'WARNING' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                      'bg-blue-50 border-blue-500 text-blue-800'
                    }`}>
                      <p className="text-sm font-medium">{warning.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Pip Value</span>
                  <span className="font-semibold">${riskResults.pipValue}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Break-even Win Rate</span>
                  <span className="font-semibold">{riskResults.breakEvenWinRate}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Trade Setup</span>
                  <span className={`font-semibold ${riskResults.isValidTrade ? 'text-green-600' : 'text-red-600'}`}>
                    {riskResults.isValidTrade ? '✓ Valid' : '✗ Invalid'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/20 dark:border-slate-700/30 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent flex items-center">
                <LineChart className="h-6 w-6 text-green-600 mr-2" />
                Professional Trading Charts
              </h2>
              <div className="text-sm text-gray-600">
                Powered by TradingView • Live Market Data
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 rounded-xl p-4 mb-6 shadow-lg shadow-blue-200/30">
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
                  </p>
                </div>
              </div>
            </div>

            <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300" style={{ height: '700px' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative h-full">
              <TradingViewWidget />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 backdrop-blur-sm border border-green-200/30 dark:border-green-700/30 rounded-xl p-4 text-center shadow-lg shadow-green-200/20">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-semibold text-green-800 mb-1">Real-Time Data</h4>
                <p className="text-sm text-green-700">Live market feeds from global exchanges</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 rounded-xl p-4 text-center shadow-lg shadow-blue-200/20">
                <div className="text-2xl mb-2">🛠️</div>
                <h4 className="font-semibold text-blue-800 mb-1">Pro Tools</h4>
                <p className="text-sm text-blue-700">Full suite of technical analysis tools</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50/80 to-violet-50/80 dark:from-purple-900/30 dark:to-violet-900/30 backdrop-blur-sm border border-purple-200/30 dark:border-purple-700/30 rounded-xl p-4 text-center shadow-lg shadow-purple-200/20">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold text-purple-800 mb-1">Indicators</h4>
                <p className="text-sm text-purple-700">100+ technical indicators available</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50/80 to-yellow-50/80 dark:from-orange-900/30 dark:to-yellow-900/30 backdrop-blur-sm border border-orange-200/30 dark:border-orange-700/30 rounded-xl p-4 text-center shadow-lg shadow-orange-200/20">
                <div className="text-2xl mb-2">💾</div>
                <h4 className="font-semibold text-orange-800 mb-1">Save Layouts</h4>
                <p className="text-sm text-orange-700">Preserve your chart configurations</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market News Tab */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent mb-2">Market News & Economic Calendar</h2>
            <p className="text-gray-600">Stay informed with real-time market news and upcoming economic events</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Market News Section */}
            <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative p-6">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-lg">📰</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">Market News</h3>
                  <p className="text-sm text-gray-600">Real-time financial news and market updates</p>
                </div>
              </div>

              <div className="border border-slate-200/30 dark:border-slate-700/30 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20">
                <TradingViewNewsWidget />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 rounded-xl p-3 text-center shadow-lg shadow-blue-200/20">
                  <div className="text-sm font-semibold text-blue-800">Breaking News</div>
                  <div className="text-xs text-blue-600">Market-moving events</div>
                </div>
                <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 backdrop-blur-sm border border-green-200/30 dark:border-green-700/30 rounded-xl p-3 text-center shadow-lg shadow-green-200/20">
                  <div className="text-sm font-semibold text-green-800">Analysis</div>
                  <div className="text-xs text-green-600">Expert insights</div>
                </div>
              </div>
              </div>
            </div>

            {/* Economic Calendar Section */}
            <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative p-6">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 text-lg">📅</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">Economic Calendar</h3>
                  <p className="text-sm text-gray-600">Upcoming economic events and data releases</p>
                </div>
              </div>

              <div className="border border-slate-200/30 dark:border-slate-700/30 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20">
                <TradingViewCalendarWidget />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-red-50/80 to-rose-50/80 dark:from-red-900/30 dark:to-rose-900/30 backdrop-blur-sm border border-red-200/30 dark:border-red-700/30 rounded-xl p-2 text-center shadow-lg shadow-red-200/20">
                  <div className="text-xs font-semibold text-red-800">High Impact</div>
                  <div className="text-xs text-red-600">🔴</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50/80 to-orange-50/80 dark:from-yellow-900/30 dark:to-orange-900/30 backdrop-blur-sm border border-yellow-200/30 dark:border-yellow-700/30 rounded-xl p-2 text-center shadow-lg shadow-yellow-200/20">
                  <div className="text-xs font-semibold text-yellow-800">Medium Impact</div>
                  <div className="text-xs text-yellow-600">🟡</div>
                </div>
                <div className="bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl p-2 text-center shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20">
                  <div className="text-xs font-semibold text-gray-800">Low Impact</div>
                  <div className="text-xs text-gray-600">⚪</div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Trading Tips Section */}
          <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative p-6">
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
                <div key={`indicator-${index}-${indicator.name.replace(/\s+/g, '-').toLowerCase()}`} className="bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl p-4 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20">
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
        </div>
      )}

      {/* Trade Journal Tab */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:justify-between lg:items-center">
            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setShowAddTrade(true)}
                className="bg-gradient-to-r from-blue-500/80 to-cyan-500/80 backdrop-blur-sm border border-blue-300/30 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-blue-600/90 hover:to-cyan-600/90 transition-all duration-300 flex items-center justify-center shadow-lg shadow-blue-500/25 text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Add New Trade
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 backdrop-blur-sm border border-green-300/30 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-green-600/90 hover:to-emerald-600/90 transition-all duration-300 flex items-center justify-center shadow-lg shadow-green-500/25 text-sm sm:text-base"
              >
                <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:inline">Import Trade History</span>
                <span className="sm:hidden">Import</span>
              </button>

              {/* Secondary Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                {/* Delete Filtered Trades Button */}
                <button
                  onClick={() => setShowDeleteFilteredModal(true)}
                  disabled={filteredTrades.length === 0}
                  className={`backdrop-blur-sm border text-white px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 flex items-center text-xs sm:text-sm shadow-lg ${
                    filteredTrades.length === 0 
                      ? 'bg-gray-400/60 border-gray-300/30 cursor-not-allowed shadow-gray-400/25'
                      : 'bg-gradient-to-r from-orange-500/80 to-red-500/80 border-orange-300/30 hover:from-orange-600/90 hover:to-red-600/90 shadow-orange-500/25'
                  }`}
                  title={`Delete ${filteredTrades.length} filtered trades`}
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Delete Filtered ({filteredTrades.length})</span>
                  <span className="sm:hidden">Del ({filteredTrades.length})</span>
                </button>

                <button
                  onClick={() => setShowCleanupModal(true)}
                  className="bg-gradient-to-r from-red-500/80 to-rose-500/80 backdrop-blur-sm border border-red-300/30 text-white px-3 sm:px-4 py-2 rounded-xl hover:from-red-600/90 hover:to-rose-600/90 transition-all duration-300 flex items-center text-xs sm:text-sm shadow-lg shadow-red-500/25"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Clear All</span>
                  <span className="sm:hidden">Clear</span>
                </button>
              </div>
            </div>

            {/* Hidden dev/debug buttons */}
            <div className="hidden">
              <button
                onClick={debugTrades}
                className="bg-gradient-to-r from-yellow-500/80 to-orange-500/80 backdrop-blur-sm border border-yellow-300/30 text-white px-6 py-3 rounded-xl hover:from-yellow-600/90 hover:to-orange-600/90 transition-all duration-300 flex items-center shadow-lg shadow-yellow-500/25"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                Debug Trades
              </button>

              <button
                onClick={handleQuickMigration}
                disabled={quickMigrating}
                className="bg-gradient-to-r from-purple-500/80 to-violet-500/80 backdrop-blur-sm border border-purple-300/30 text-white px-6 py-3 rounded-xl hover:from-purple-600/90 hover:to-violet-600/90 transition-all duration-300 flex items-center shadow-lg shadow-purple-500/25 disabled:from-purple-400/60 disabled:to-violet-400/60 disabled:cursor-not-allowed"
              >
                {quickMigrating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Migrating...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Migrate to DB
                  </>
                )}
              </button>
            </div>
            
            {/* Trade Count Display */}
            <div className="text-sm text-gray-600 text-center lg:text-right">
              Showing {paginatedTrades.length} of {filteredTrades.length} trades
            </div>
          </div>
          
          {/* Enhanced Filters */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/20 dark:border-slate-700/30 rounded-xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
            <div className="flex items-center mb-4">
              <Filter className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Filters & Search</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pair, notes, setup..."
                  className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                />
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              {/* Pair Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pair</label>
                <select
                  value={filterPair}
                  onChange={(e) => setFilterPair(e.target.value)}
                  className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                >
                  <option value="all">All Pairs</option>
                  {uniquePairs.map(pair => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
              </div>
              
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                >
                  <option value="all">All Types</option>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              
              {/* Setup Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Setup</label>
                <select
                  value={filterSetup}
                  onChange={(e) => setFilterSetup(e.target.value)}
                  className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                >
                  <option value="all">All Setups</option>
                  {uniqueSetups.map(setup => (
                    <option key={setup} value={setup}>{setup}</option>
                  ))}
                </select>
              </div>
              
              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterPair('all');
                    setFilterType('all');
                    setFilterSetup('all');
                    setDateFrom('');
                    setDateTo('');
                    setCurrentPage(1);
                  }}
                  className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 shadow-lg shadow-slate-200/10 dark:shadow-slate-900/10"
                />
              </div>
            </div>
          </div>

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
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">Supported Text Formats</h4>
                          <div className="text-sm text-blue-700 space-y-2">
                            <p><strong>MT4/MT5:</strong> Copy trade history directly from MetaTrader</p>
                            <p><strong>CSV:</strong> Date,Time,Type,Size,Symbol,Entry,SL,TP,ExitDate,ExitTime,Exit,Profit</p>
                            <p><strong>Simple:</strong> EURUSD BUY 0.10 1.2500 1.2450 1.2600 1.2580 +80.00</p>
                            <p><strong>Tab-separated:</strong> Most broker export formats</p>
                          </div>
                        </div>

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
                        </div>

                        <div className="flex space-x-4">
                          <button
                            onClick={handleImportAnalysis}
                            disabled={!importText.trim()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Analyze & Preview
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-800 mb-2">Supported File Formats</h4>
                          <div className="text-sm text-green-700 space-y-2">
                            <p><strong>📊 CSV Files:</strong> Standard broker exports, Excel files saved as CSV</p>
                            <p><strong>🏦 Broker CSV:</strong> MT4/MT5, cTrader, proprietary broker formats</p>
                            <p><strong>📝 TXT Files:</strong> Plain text exports, custom formats</p>
                            <p><strong>🔧 Auto-Detection:</strong> European number formats, account metadata</p>
                          </div>
                        </div>

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
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-3">
                        Import Analysis
                        {importResults.fileName && (
                          <span className="ml-2 text-sm font-normal">
                            📁 {importResults.fileName} ({importResults.fileType})
                          </span>
                        )}
                        {importResults.accountInfo && (
                          <div className="mt-2 text-sm font-normal">
                            🏦 Account: {importResults.accountInfo.Account || importResults.accountInfo.Name || 'Unknown'}
                          </div>
                        )}
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
                      <div className="mt-3 text-sm text-green-700">
                        <p><strong>Pairs:</strong> {importResults.analysis.pairs.join(', ')}</p>
                        <p><strong>Date Range:</strong> {importResults.analysis.dateRange.from} to {importResults.analysis.dateRange.to}</p>
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

                      <div className="max-h-64 overflow-y-auto border border-slate-200/30 dark:border-slate-700/30 rounded-xl backdrop-blur-sm">
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
                              <tr key={`import-${index}-${trade.date}-${trade.pair}-${trade.entry}`} className={`border-t ${selectedImports.includes(index) ? 'bg-blue-50' : ''}`}>
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
                        disabled={selectedImports.length === 0 || importing}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {importing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                            Importing...
                          </>
                        ) : (
                          `Import ${selectedImports.length} Selected Trades`
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add/Edit Trade Form */}
          {showAddTrade && (
            <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative p-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingTrade ? 'Edit Trade' : 'Add New Trade'}
              </h3>
              
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
                  <PairSearchInput
                    value={newTrade.pair}
                    onChange={(pair) => setNewTrade(prev => ({...prev, pair}))}
                    placeholder="Search any trading pair..."
                    className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    maxResults={15}
                    showCategories={true}
                  />
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
                  onClick={editingTrade ? updateTrade : addTrade}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingTrade ? 'Update Trade' : 'Add Trade'}
                </button>
                <button
                  onClick={() => {
                    setShowAddTrade(false);
                    setEditingTrade(null);
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
            </div>
          )}

          {/* Trades List */}
          <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-gray-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/20 dark:border-slate-700/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lots</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R:R</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm divide-y divide-slate-200/30 dark:divide-slate-700/30">
                  {paginatedTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 border-b border-slate-200/20 dark:border-slate-700/20">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trade.pair}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border ${
                          trade.type === 'BUY' ? 'bg-green-100/80 text-green-800 border-green-200/30' : 'bg-red-100/80 text-red-800 border-red-200/30'
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1:{trade.rr.toFixed(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {trade.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editTrade(trade)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTrade(trade.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
          <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent flex items-center">
              <Calendar className="h-6 w-6 text-blue-600 mr-2" />
              Trading Calendar
            </h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 backdrop-blur-sm rounded-xl transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 backdrop-blur-sm rounded-xl transition-all duration-200"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 border-b">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, index) => (
              <div key={`empty-${currentDate.getFullYear()}-${currentDate.getMonth()}-${index}`} className="p-4 h-24"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: getDaysInMonth(currentDate) }).map((_, index) => {
              const day = index + 1;
              const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
              const dayTrades = getTradesForDate(dateStr);
              const dayPnL = getDayPnL(dateStr);
              const isToday = dateStr === formatDate(new Date());
              
              // Calculate heat intensity based on PnL
              const maxDayPnL = Math.max(...Array.from({ length: getDaysInMonth(currentDate) })
                .map((_, i) => Math.abs(getDayPnL(formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1))))));
              const intensity = maxDayPnL > 0 ? Math.min(Math.abs(dayPnL) / maxDayPnL, 1) : 0;
              const intensityLevel = intensity > 0.7 ? '500' : intensity > 0.4 ? '300' : intensity > 0.1 ? '100' : '50';
              
              const getBackgroundColor = () => {
                if (dayPnL === 0 || dayTrades.length === 0) return isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50';
                if (isToday) return dayPnL > 0 ? 'bg-blue-100 border-blue-300' : 'bg-blue-100 border-blue-300';
                return dayPnL > 0 ? `bg-green-${intensityLevel} border-green-200 hover:bg-green-${intensityLevel === '50' ? '100' : '400'}` : 
                                   `bg-red-${intensityLevel} border-red-200 hover:bg-red-${intensityLevel === '50' ? '100' : '400'}`;
              };

              return (
                <div
                  key={day}
                  className={`p-2 h-24 border rounded-lg cursor-pointer transition-colors ${getBackgroundColor()}`}
                  onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                >
                  <div className="text-sm font-semibold text-gray-900 mb-1">{day}</div>
                  {dayTrades.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">{dayTrades.length} trade{dayTrades.length > 1 ? 's' : ''}</div>
                      <div className={`text-xs font-semibold ${
                        dayPnL > 0 ? 'text-green-600' : dayPnL < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        ${dayPnL.toFixed(0)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h4>
              {getTradesForDate(formatDate(selectedDate)).length > 0 ? (
                <div className="space-y-2">
                  {getTradesForDate(formatDate(selectedDate)).map(trade => (
                    <div key={trade.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.type}
                        </span>
                        <span className="font-medium">{trade.pair}</span>
                        <span className="text-sm text-gray-600">{trade.setup}</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          trade.pnl > 0 ? 'text-green-600' : trade.pnl < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          ${trade.pnl.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">{trade.lotSize} lots</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No trades on this date</p>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {/* Old Analytics Tab - This section was removed and replaced with the new Analytics component at line 1293 */}

      {/* DISABLED AI ANALYSIS TAB
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
                  <span className="text-blue-800 font-medium">Claude AI Integration</span>
                </div>
                <p className="text-blue-700 text-sm mt-2">
                  Get professional-grade trading insights powered by Claude AI analysis of your trading data.
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
        </div>
      )}

      {/* Trading Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent flex items-center">
              <Target className="h-6 w-6 text-blue-600 mr-2" />
              Trading Goals & Planning
            </h2>
            <button
              onClick={() => setShowGoalModal(true)}
              className="bg-gradient-to-r from-blue-500/80 to-cyan-500/80 backdrop-blur-sm border border-blue-300/30 text-white px-6 py-3 rounded-xl hover:from-blue-600/90 hover:to-cyan-600/90 transition-all duration-300 flex items-center shadow-lg shadow-blue-500/25"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Goal
            </button>
          </div>

          {/* Add Goal Form */}
          {showGoalModal && (
            <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative p-6">
              <h3 className="text-xl font-semibold mb-4">Create New Trading Goal</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal(prev => ({...prev, title: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Achieve 65% Win Rate"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({...prev, description: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Detailed description of what you want to achieve..."
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
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                    <input
                      type="date"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal(prev => ({...prev, targetDate: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={addGoal}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Goal
                </button>
                <button
                  onClick={() => {
                    setShowGoalModal(false);
                    setNewGoal({
                      title: '',
                      description: '',
                      targetDate: '',
                      priority: 'medium',
                      milestones: []
                    });
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
              </div>
            </div>
          )}

          {/* Goals List */}
          <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-yellow-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative">
            <div className="divide-y divide-gray-200">
              {tradingGoals.map((goal) => (
                <div key={goal.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{goal.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                          goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                          goal.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {goal.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Target Date: {goal.targetDate}</div>
                    
                    {goal.milestones && goal.milestones.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Milestones:</h5>
                        <div className="space-y-1">
                          {goal.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleMilestone(goal.id, milestone.id)}
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  milestone.completed 
                                    ? 'bg-green-500 border-green-500' 
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {milestone.completed && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </button>
                              <span className={`text-sm ${
                                milestone.completed ? 'line-through text-gray-500' : 'text-gray-700'
                              }`}>
                                {milestone.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      )}
      */

      {/* DISABLED API KEY MODAL - AI Analysis has been removed */}

      {/* Migration Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Migrate Your Trades to Database
            </h3>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Database Migration Required</h4>
                    <p className="text-sm text-blue-700">
                      We found {dataManager.trades.length} trades in local storage. To enable Dashboard metrics and Analytics, 
                      these trades need to be saved to the database.
                    </p>
                  </div>
                </div>
              </div>

              {migrationMessage && (
                <div className={`p-3 rounded-lg ${
                  migrationStatus === 'success' ? 'bg-green-50 border border-green-200' :
                  migrationStatus === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-yellow-50 border border-yellow-200'
                }`}>
                  <p className={`text-sm ${
                    migrationStatus === 'success' ? 'text-green-700' :
                    migrationStatus === 'error' ? 'text-red-700' :
                    'text-yellow-700'
                  }`}>
                    {migrationMessage}
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                {migrationStatus === 'success' ? (
                  <button
                    onClick={() => setShowMigrationModal(false)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Done
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleMigrateToDatabase}
                      disabled={migrationStatus === 'migrating'}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {migrationStatus === 'migrating' ? 'Migrating...' : 'Migrate Now'}
                    </button>
                    <button
                      onClick={() => setShowMigrationModal(false)}
                      disabled={migrationStatus === 'migrating'}
                      className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400"
                    >
                      Later
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-red-800 mb-4">
              ⚠️ Delete ALL Trades
            </h3>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-700 text-sm">
                  <p className="font-medium mb-2">This will permanently delete ALL trades from your account!</p>
                  <p>• All trades in the database will be removed</p>
                  <p>• Dashboard metrics will reset to zero</p>
                  <p>• This action CANNOT be undone</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleEmergencyCleanup}
                  disabled={cleaning}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
                >
                  {cleaning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete ALL Trades'
                  )}
                </button>
                <button
                  onClick={() => setShowCleanupModal(false)}
                  disabled={cleaning}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Filtered Trades Modal */}
      {showDeleteFilteredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-orange-800 mb-4">
              🗑️ Delete Filtered Trades
            </h3>
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-orange-700 text-sm">
                  <p className="font-medium mb-2">Delete {filteredTrades.length} currently displayed trades?</p>
                  <p>• Only trades matching current filters will be deleted</p>
                  <p>• Other trades will remain untouched</p>
                  <p>• This action CANNOT be undone</p>
                  {filteredTrades.length > 10 && (
                    <p className="font-medium text-orange-800 mt-2">
                      ⚠️ This will delete {filteredTrades.length} trades!
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteFilteredTrades}
                  disabled={deletingFiltered}
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-400 disabled:cursor-not-allowed"
                >
                  {deletingFiltered ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Deleting...
                    </>
                  ) : (
                    `Delete ${filteredTrades.length} Trades`
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteFilteredModal(false)}
                  disabled={deletingFiltered}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          </div>
        </div>

        {/* Import Progress Modal */}
        <ImportProgressModal
          isOpen={showImportProgress}
          onClose={() => setShowImportProgress(false)}
          importJob={importJob}
          onCancel={(jobId) => {
            if (importManager.cancelImport) {
              importManager.cancelImport(jobId);
            }
            setShowImportProgress(false);
          }}
          showDetails={true}
        />

        {/* Notification System */}
        <NotificationComponent notifications={notifications} />
      </div>
  );
};

export default TradingJournal;