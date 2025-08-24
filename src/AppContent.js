import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Calculator, TrendingUp, Shield, AlertTriangle, DollarSign, 
  Calendar, BookOpen, BarChart3, Target, Clock, Filter,
  Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight,
  TrendingDown, Activity, Award, AlertCircle, Upload, FileText,
  Brain, Zap, CheckCircle, Star, Flag, Users, Settings, LineChart,
  Newspaper, User, LogOut
} from 'lucide-react';

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
            "height": 400
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

const TradingJournal = ({ session, supabase }) => {
  const [activeTab, setActiveTab] = useState('risk-calculator');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // AI Analysis State
  const [claudeAnalysis, setClaudeAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // Trading Goals State
  const [tradingGoals, setTradingGoals] = useState([
    {
      id: 1,
      title: 'Achieve 15% Monthly Return',
      description: 'Maintain consistent profitable trading with 15% monthly account growth',
      targetDate: '2025-12-31',
      status: 'in-progress',
      priority: 'high',
      milestones: [
        { id: 1, title: 'Reach 5% weekly consistency', completed: false, dueDate: '2025-09-15' },
        { id: 2, title: 'Improve win rate to 65%', completed: false, dueDate: '2025-10-01' },
        { id: 3, title: 'Master risk management', completed: true, dueDate: '2025-08-30' }
      ]
    }
  ]);
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
    accountBalance: 10000,
    riskPercent: 2,
    entryPrice: 1.2500,
    stopLoss: 1.2450,
    takeProfit: 1.2600,
    currencyPair: 'EURUSD',
    accountCurrency: 'USD'
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
    },
    {
      id: 3,
      date: '2025-08-22',
      pair: 'XAUUSD',
      type: 'BUY',
      entry: 2050.00,
      exit: null,
      stopLoss: 2030.00,
      takeProfit: 2100.00,
      lotSize: 0.05,
      pnl: 0,
      status: 'open',
      notes: 'Support level hold, expecting bounce',
      setup: 'Support/Resistance',
      rr: 2.5
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
  const [editingTrade, setEditingTrade] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [selectedImports, setSelectedImports] = useState([]);
  const [importMethod, setImportMethod] = useState('paste'); // 'paste' or 'file'
  
  // Pagination and enhanced filters
  const [currentPage, setCurrentPage] = useState(1);
  const [tradesPerPage] = useState(10);
  const [filterPair, setFilterPair] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterSetup, setFilterSetup] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dragOver, setDragOver] = useState(false);

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
          // Helper function to parse European number format
          const parseEuropeanNumber = (numStr) => {
            if (!numStr || numStr === '') return 0;
            const cleaned = numStr.replace(/\s/g, '').replace(',', '.');
            const withMinus = cleaned.replace(/^-\s*/, '-');
            return parseFloat(withMinus) || 0;
          };
          
          // Helper function to parse date
          const parseDate = (dateStr) => {
            if (!dateStr) return new Date().toISOString().split('T')[0];
            const datePart = dateStr.split(' ')[0];
            return datePart.replace(/\./g, '-');
          };
          
          // Map columns based on the detected structure
          const trade = {
            id: Date.now() + i,
            date: parseDate(columns[0]), // Open Time
            pair: columns[2] || 'UNKNOWN', // Symbol
            type: (columns[3] || 'buy').toUpperCase(), // Type
            entry: parseEuropeanNumber(columns[5]), // Entry Price
            exit: parseEuropeanNumber(columns[9]), // Exit Price  
            stopLoss: parseEuropeanNumber(columns[6]), // S/L
            takeProfit: parseEuropeanNumber(columns[7]), // T/P
            lotSize: parseEuropeanNumber(columns[4]), // Volume
            pnl: parseEuropeanNumber(columns[12]), // Profit
            commission: parseEuropeanNumber(columns[10]) || 0, // Commission
            swap: parseEuropeanNumber(columns[11]) || 0, // Swap
            position: columns[1] || '', // Position ID
            openTime: columns[0] || '', // Full open time
            closeTime: columns[8] || '', // Full close time
            notes: `Imported from broker CSV - Position: ${columns[1]}`,
            setup: 'Imported Trade'
          };
          
          // Calculate net P&L including commission and swap
          trade.netPnL = trade.pnl + trade.commission + trade.swap;
          
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
            
            trade.id = Date.now() + i;
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
        alert('No valid trades found in the file. Please check the file format and try again.');
      }
    } catch (error) {
      alert(`Error reading file: ${error.message}`);
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
      alert('Please upload a valid file format: CSV or TXT');
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
                  date: cols[0].includes('-') || cols[0].includes('/') || cols[0].includes('.') ? 
                        cols[0].replace(/[/.]/g, '-') : new Date().toISOString().split('T')[0],
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
            trade.id = Date.now() + index;
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

  // AI Analysis Functions
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

  // Trading Goals Functions
  const addGoal = () => {
    const goal = {
      id: Date.now(),
      ...newGoal,
      status: 'not-started',
      milestones: newGoal.milestones.map((m, index) => ({
        id: Date.now() + index,
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
              id: Date.now(),
              title: milestone,
              completed: false,
              dueDate: ''
            }]
          }
        : goal
    ));
  };

  // Trade Management Functions
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

  const updateTrade = () => {
    if (!editingTrade) return;
    
    const pnl = newTrade.exit ? 
      (parseFloat(newTrade.exit) - parseFloat(newTrade.entry)) * parseFloat(newTrade.lotSize) * 10000 : 0;
    
    const updatedTrade = {
      ...editingTrade,
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
    
    setTrades(prev => prev.map(trade => 
      trade.id === editingTrade.id ? updatedTrade : trade
    ));
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
    return trades.filter(trade => trade.date === dateStr);
  };

  const getDayPnL = (dateStr) => {
    const dayTrades = getTradesForDate(dateStr);
    return dayTrades.reduce((total, trade) => total + trade.pnl, 0);
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

  // Enhanced filtering logic
  const filteredTrades = trades.filter(trade => {
    // Status filter
    if (filterStatus !== 'all' && trade.status !== filterStatus) return false;
    
    // Pair filter
    if (filterPair !== 'all' && trade.pair !== filterPair) return false;
    
    // Type filter
    if (filterType !== 'all' && trade.type !== filterType) return false;
    
    // Setup filter
    if (filterSetup !== 'all' && trade.setup !== filterSetup) return false;
    
    // Date range filter
    if (dateFrom && trade.date < dateFrom) return false;
    if (dateTo && trade.date > dateTo) return false;
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        trade.pair.toLowerCase().includes(searchLower) ||
        trade.notes.toLowerCase().includes(searchLower) ||
        trade.setup.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Pagination logic
  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + tradesPerPage);
  
  // Get unique values for filter options
  const uniquePairs = [...new Set(trades.map(t => t.pair))];
  const uniqueSetups = [...new Set(trades.map(t => t.setup))];
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterPair, filterType, filterSetup, dateFrom, dateTo, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with User Profile */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img 
                src="/tradeworth-logo.png" 
                alt="Tradeworth Logo" 
                className="h-10 w-auto mr-3"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Tradeworth</h1>
                <p className="text-sm text-gray-600">Professional trading management platform</p>
              </div>
            </div>
            
            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-700">
                    {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{session?.user?.email}</p>
                </div>
              </div>
              
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center mb-8 bg-white rounded-xl p-2 shadow-lg">
        {[
          { id: 'risk-calculator', label: 'Risk Calculator', icon: Calculator },
          { id: 'journal', label: 'Trade Journal', icon: BookOpen },
          { id: 'charts', label: 'Charts', icon: LineChart },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'news', label: 'Market News', icon: Newspaper },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'ai-analysis', label: 'AI Analysis', icon: Brain },
          { id: 'goals', label: 'Trading Goals', icon: Target }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 mx-1 rounded-lg transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{tab.label}</span>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Per Trade (%)</label>
                <input
                  type="number"
                  value={riskInputs.riskPercent}
                  onChange={(e) => handleRiskInputChange('riskPercent', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.0001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss</label>
                  <input
                    type="number"
                    value={riskInputs.stopLoss}
                    onChange={(e) => handleRiskInputChange('stopLoss', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.0001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Take Profit</label>
                  <input
                    type="number"
                    value={riskInputs.takeProfit}
                    onChange={(e) => handleRiskInputChange('takeProfit', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    lotSize: riskResults.positionSizeStandardLots
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

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Target className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-semibold text-gray-800">Position Sizing Results</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Position Size</p>
                  <p className="text-2xl font-bold text-blue-600">{riskResults.positionSizeStandardLots} lots</p>
                  <p className="text-xs text-gray-500">{riskResults.lotSize} {riskResults.instrumentType}</p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Risk Amount</p>
                  <p className="text-2xl font-bold text-red-600">${riskResults.riskAmount}</p>
                  <p className="text-xs text-gray-500">{riskInputs.riskPercent}% of balance</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Potential Profit</p>
                  <p className="text-2xl font-bold text-green-600">${riskResults.potentialProfit}</p>
                  <p className="text-xs text-gray-500">{riskResults.rewardPips} pips</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Risk/Reward</p>
                  <p className="text-2xl font-bold text-purple-600">1:{riskResults.rrRatio}</p>
                  <p className="text-xs text-gray-500">{riskResults.pipsAtRisk} pips risk</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-orange-600 mr-2" />
                <h2 className="text-2xl font-semibold text-gray-800">Risk Analysis</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Pip Value</span>
                  <span className="font-semibold">${riskResults.pipValue}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Break-even Win Rate</span>
                  <span className="font-semibold">{riskResults.breakEvenWinRate}%</span>
                </div>
              </div>
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
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: '700px' }}>
              <TradingViewWidget />
            </div>

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
          </div>
        </div>
      )}

      {/* Market News Tab */}
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

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <TradingViewNewsWidget />
              </div>

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

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <TradingViewCalendarWidget />
              </div>

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
                Import Trade History
              </button>

            </div>
            
            <div className="text-sm text-gray-600">
              Showing {paginatedTrades.length} of {filteredTrades.length} trades
            </div>
          </div>
          
          {/* Enhanced Filters */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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

          {/* Add/Edit Trade Form */}
          {showAddTrade && (
            <div className="bg-white rounded-xl shadow-lg p-6">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R:R</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTrades.map((trade) => (
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
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Calendar className="h-6 w-6 text-blue-600 mr-2" />
              Trading Calendar
            </h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
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
              <div key={index} className="p-4 h-24"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: getDaysInMonth(currentDate) }).map((_, index) => {
              const day = index + 1;
              const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
              const dayTrades = getTradesForDate(dateStr);
              const dayPnL = getDayPnL(dateStr);
              const isToday = dateStr === formatDate(new Date());

              return (
                <div
                  key={day}
                  className={`p-2 h-24 border rounded-lg cursor-pointer transition-colors ${
                    isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
                  }`}
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
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Performance Overview */}
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

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                Performance Metrics
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Winning Trades</span>
                  <span className="font-semibold text-green-600">{stats.winningTrades}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Losing Trades</span>
                  <span className="font-semibold text-red-600">{stats.losingTrades}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Average Win</span>
                  <span className="font-semibold text-green-600">${stats.avgWin}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Average Loss</span>
                  <span className="font-semibold text-red-600">$-{stats.avgLoss}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Profit Factor</span>
                  <span className={`font-semibold ${
                    parseFloat(stats.profitFactor) > 1 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.profitFactor}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Target className="h-5 w-5 text-purple-600 mr-2" />
                Trading Insights
              </h3>
              
              <div className="space-y-4">
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
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Target className="h-6 w-6 text-blue-600 mr-2" />
              Trading Goals & Planning
            </h2>
            <button
              onClick={() => setShowGoalModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Goal
            </button>
          </div>

          {/* Add Goal Form */}
          {showGoalModal && (
            <div className="bg-white rounded-xl shadow-lg p-6">
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
          )}

          {/* Goals List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
      </div>
    </div>
  );
};

export default TradingJournal;