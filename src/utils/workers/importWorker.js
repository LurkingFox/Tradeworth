// Background worker for processing large trade imports
// Handles intensive operations without blocking the main UI thread

class ImportWorker {
  constructor() {
    this.isWorker = typeof window === 'undefined' || typeof importScripts === 'function';
    this.tasks = new Map();
    this.maxConcurrentTasks = 3;
    this.activeTasks = 0;
    
    if (this.isWorker) {
      this.setupWorkerMessageHandling();
    }
    
    console.log('Import Worker initialized:', { isWorker: this.isWorker });
  }

  /**
   * Setup message handling for web worker context
   */
  setupWorkerMessageHandling() {
    if (typeof self !== 'undefined') {
      self.onmessage = (event) => {
        this.handleWorkerMessage(event);
      };
    }
  }

  /**
   * Handle incoming worker messages
   */
  async handleWorkerMessage(event) {
    const { taskId, type, data } = event.data;
    
    try {
      let result;
      
      switch (type) {
        case 'PROCESS_TRADES':
          result = await this.processTradesInBackground(data);
          break;
        case 'VALIDATE_TRADES':
          result = await this.validateTradesInBackground(data);
          break;
        case 'CALCULATE_STATISTICS':
          result = await this.calculateStatisticsInBackground(data);
          break;
        case 'DEDUPLICATE_TRADES':
          result = await this.deduplicateTradesInBackground(data);
          break;
        default:
          throw new Error(`Unknown task type: ${type}`);
      }
      
      this.postMessage({
        taskId,
        type: 'TASK_COMPLETE',
        result
      });
      
    } catch (error) {
      this.postMessage({
        taskId,
        type: 'TASK_ERROR',
        error: error.message
      });
    }
  }

  /**
   * Post message (worker or main thread)
   */
  postMessage(message) {
    if (typeof self !== 'undefined' && self.postMessage) {
      self.postMessage(message);
    }
  }

  /**
   * Process trades in background with chunked approach
   */
  async processTradesInBackground(data) {
    const { trades, options = {} } = data;
    const { 
      chunkSize = 1000, 
      validateOnly = false,
      calculatePnL = true 
    } = options;

    console.log(`Background processing ${trades.length} trades...`);
    
    const results = {
      processed: [],
      errors: [],
      statistics: {
        total: trades.length,
        valid: 0,
        invalid: 0,
        duplicates: 0
      }
    };

    // Process in chunks to avoid memory issues
    for (let i = 0; i < trades.length; i += chunkSize) {
      const chunk = trades.slice(i, i + chunkSize);
      
      for (const trade of chunk) {
        try {
          const processedTrade = await this.processSingleTrade(trade, {
            validateOnly,
            calculatePnL
          });
          
          if (processedTrade.isValid) {
            results.processed.push(processedTrade);
            results.statistics.valid++;
          } else {
            results.errors.push({
              trade,
              errors: processedTrade.errors
            });
            results.statistics.invalid++;
          }
          
        } catch (error) {
          results.errors.push({
            trade,
            errors: [error.message]
          });
          results.statistics.invalid++;
        }
      }
      
      // Progress update
      this.postMessage({
        type: 'PROGRESS_UPDATE',
        progress: {
          processed: Math.min(i + chunkSize, trades.length),
          total: trades.length,
          valid: results.statistics.valid,
          invalid: results.statistics.invalid,
          percentage: ((i + chunkSize) / trades.length) * 100
        }
      });
      
      // Yield control
      await this.sleep(1);
    }
    
    return results;
  }

  /**
   * Process a single trade with validation and calculations
   */
  async processSingleTrade(trade, options = {}) {
    const { validateOnly, calculatePnL } = options;
    
    // Basic validation
    const validation = this.validateTrade(trade);
    if (!validation.isValid) {
      return validation;
    }
    
    if (validateOnly) {
      return { ...trade, isValid: true };
    }
    
    // Enhanced processing
    let processedTrade = { ...trade, isValid: true };
    
    // Calculate PnL if needed
    if (calculatePnL && this.shouldCalculatePnL(trade)) {
      try {
        processedTrade.pnl = this.calculateTradePnL(trade);
        processedTrade.calculatedPnL = true;
      } catch (error) {
        processedTrade.pnlError = error.message;
      }
    }
    
    // Calculate risk/reward ratio
    if (trade.stopLoss && trade.takeProfit) {
      processedTrade.rr = this.calculateRiskReward(trade);
    }
    
    // Determine trade outcome
    if (trade.status === 'closed' && processedTrade.pnl !== undefined) {
      processedTrade.outcome = processedTrade.pnl > 0 ? 'win' : 
                              processedTrade.pnl < 0 ? 'loss' : 'breakeven';
    }
    
    // Generate trade hash for deduplication
    processedTrade.tradeHash = this.generateTradeHash(trade);
    
    return processedTrade;
  }

  /**
   * Validate trade data
   */
  validateTrade(trade) {
    const errors = [];
    
    // Required fields
    if (!trade.pair) errors.push('Currency pair is required');
    if (!trade.date) errors.push('Trade date is required');
    if (!trade.entry || isNaN(parseFloat(trade.entry))) errors.push('Valid entry price is required');
    if (!trade.lotSize || isNaN(parseFloat(trade.lotSize))) errors.push('Valid lot size is required');
    if (!trade.type) errors.push('Trade type is required');
    
    // Optional field validation
    if (trade.exit && isNaN(parseFloat(trade.exit))) errors.push('Exit price must be a valid number');
    if (trade.stopLoss && isNaN(parseFloat(trade.stopLoss))) errors.push('Stop loss must be a valid number');
    if (trade.takeProfit && isNaN(parseFloat(trade.takeProfit))) errors.push('Take profit must be a valid number');
    
    // Date validation
    if (trade.date && !this.isValidDate(trade.date)) {
      errors.push('Invalid date format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      trade: errors.length === 0 ? trade : null
    };
  }

  /**
   * Check if date is valid
   */
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Check if PnL should be calculated
   */
  shouldCalculatePnL(trade) {
    return trade.entry && trade.exit && trade.lotSize && 
           (trade.pnl === undefined || trade.pnl === null || trade.pnl === '');
  }

  /**
   * Calculate PnL for a trade (simplified version for worker)
   */
  calculateTradePnL(trade) {
    const entry = parseFloat(trade.entry);
    const exit = parseFloat(trade.exit);
    const lotSize = parseFloat(trade.lotSize);
    
    if (!entry || !exit || !lotSize) return 0;
    
    let priceDiff = exit - entry;
    
    // Reverse for sell trades
    if (trade.type?.toLowerCase().includes('sell')) {
      priceDiff = -priceDiff;
    }
    
    // Simplified calculation (would need proper instrument specs in real implementation)
    const upperSymbol = (trade.pair || '').toUpperCase();
    
    if (upperSymbol.includes('JPY')) {
      return Math.round((priceDiff * lotSize * 100000) * 100) / 100;
    } else if (upperSymbol.includes('BTC')) {
      return Math.round((priceDiff * lotSize) * 100) / 100;
    } else if (upperSymbol.includes('XAU') || upperSymbol.includes('GOLD')) {
      return Math.round((priceDiff * lotSize * 100) * 100) / 100;
    } else {
      // Standard forex calculation
      return Math.round((priceDiff * lotSize * 100000) * 100) / 100;
    }
  }

  /**
   * Calculate risk/reward ratio - allows negative values to show potential losses
   */
  calculateRiskReward(trade) {
    const entry = parseFloat(trade.entry);
    const stopLoss = parseFloat(trade.stopLoss);
    const takeProfit = parseFloat(trade.takeProfit);
    
    if (!entry || !stopLoss || !takeProfit) return 0;
    
    const type = (trade.type || '').toLowerCase();
    const isBuyTrade = type.includes('buy') || type === 'long';
    const isSellTrade = type.includes('sell') || type === 'short';
    
    let risk, reward;
    
    if (isBuyTrade) {
      // BUY trade calculation
      risk = entry - stopLoss;    // Positive if stop below entry (correct)
      reward = takeProfit - entry; // Positive if target above entry (correct)
    } else if (isSellTrade) {
      // SELL trade calculation
      risk = stopLoss - entry;    // Positive if stop above entry (correct)  
      reward = entry - takeProfit; // Positive if target below entry (correct)
    } else {
      // Unknown trade type - calculate both directions and show actual result
      risk = Math.abs(entry - stopLoss);
      reward = takeProfit - entry; // Keep signed value to show direction
    }
    
    // Always return a ratio, even if negative (shows potential loss)
    if (risk <= 0) {
      return 0; // No risk = no ratio
    }
    
    return Math.round((reward / risk) * 100) / 100; // Keep sign to show direction
  }

  /**
   * Generate trade hash for deduplication
   */
  generateTradeHash(trade) {
    const hashString = `${trade.date}_${trade.pair}_${trade.type}_${trade.entry}_${trade.lotSize}_${trade.exit || 'open'}`;
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Deduplicate trades in background
   */
  async deduplicateTradesInBackground(data) {
    const { trades } = data;
    
    console.log(`Deduplicating ${trades.length} trades...`);
    
    const uniqueTrades = [];
    const duplicates = [];
    const seenHashes = new Set();
    
    for (const trade of trades) {
      const hash = this.generateTradeHash(trade);
      
      if (seenHashes.has(hash)) {
        duplicates.push({ trade, hash, reason: 'Duplicate hash' });
      } else {
        seenHashes.add(hash);
        uniqueTrades.push({ ...trade, tradeHash: hash });
      }
    }
    
    return {
      unique: uniqueTrades,
      duplicates,
      statistics: {
        original: trades.length,
        unique: uniqueTrades.length,
        duplicates: duplicates.length
      }
    };
  }

  /**
   * Calculate statistics in background
   */
  async calculateStatisticsInBackground(data) {
    const { trades, accountBalance = 10000 } = data;
    
    console.log(`Calculating statistics for ${trades.length} trades...`);
    
    const closedTrades = trades.filter(t => t.status === 'closed');
    const wins = closedTrades.filter(t => t.pnl > 0);
    const losses = closedTrades.filter(t => t.pnl < 0);
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
    
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    
    // Calculate drawdown
    let runningPnL = 0;
    let maxDrawdown = 0;
    let peak = 0;
    
    const sortedTrades = [...closedTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    for (const trade of sortedTrades) {
      runningPnL += trade.pnl || 0;
      peak = Math.max(peak, runningPnL);
      const drawdown = peak - runningPnL;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return {
      totalTrades: trades.length,
      closedTrades: closedTrades.length,
      openTrades: trades.length - closedTrades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: Math.round(winRate * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossLoss: Math.round(grossLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      accountBalance: accountBalance,
      portfolioValue: accountBalance + totalPnL,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate trades in background
   */
  async validateTradesInBackground(data) {
    const { trades, strictValidation = false } = data;
    
    console.log(`Validating ${trades.length} trades...`);
    
    const results = {
      valid: [],
      invalid: [],
      warnings: []
    };
    
    for (const trade of trades) {
      const validation = this.validateTrade(trade);
      
      if (validation.isValid) {
        // Additional warnings for valid trades
        const warnings = [];
        
        if (!trade.notes) warnings.push('No trade notes provided');
        if (!trade.setup) warnings.push('No setup specified');
        if (trade.status === 'closed' && !trade.exit) warnings.push('Closed trade without exit price');
        
        results.valid.push({
          trade: validation.trade,
          warnings: strictValidation ? warnings : []
        });
      } else {
        results.invalid.push({
          trade,
          errors: validation.errors
        });
      }
    }
    
    return {
      ...results,
      statistics: {
        total: trades.length,
        valid: results.valid.length,
        invalid: results.invalid.length,
        warningCount: results.valid.reduce((sum, item) => sum + item.warnings.length, 0)
      }
    };
  }

  /**
   * Sleep function for yielding control
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get worker capabilities
   */
  getCapabilities() {
    return {
      isWorker: this.isWorker,
      maxConcurrentTasks: this.maxConcurrentTasks,
      supportedTasks: [
        'PROCESS_TRADES',
        'VALIDATE_TRADES', 
        'CALCULATE_STATISTICS',
        'DEDUPLICATE_TRADES'
      ]
    };
  }
}

// Initialize worker
const worker = new ImportWorker();

// Export for main thread usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImportWorker;
}

// For web worker context, worker is automatically initialized
console.log('Import Worker ready:', worker.getCapabilities());