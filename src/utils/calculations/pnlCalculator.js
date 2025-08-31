// src/utils/pnlCalculator.js
// Centralized PnL calculation system to ensure consistency across the app

/**
 * Universal PnL Calculator for all trading instruments
 * Handles Forex, Gold, Bitcoin, and other assets with proper pip values
 */

// Standard pip values for different instruments
const INSTRUMENT_SPECS = {
  // Major Forex pairs
  'EURUSD': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  'GBPUSD': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  'USDJPY': { pipValue: 0.01, pipPosition: 2, contractSize: 100000 },
  'USDCHF': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  'AUDUSD': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  'USDCAD': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  'NZDUSD': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  
  // JPY pairs
  'EURJPY': { pipValue: 0.01, pipPosition: 2, contractSize: 100000 },
  'GBPJPY': { pipValue: 0.01, pipPosition: 2, contractSize: 100000 },
  'AUDJPY': { pipValue: 0.01, pipPosition: 2, contractSize: 100000 },
  'CADJPY': { pipValue: 0.01, pipPosition: 2, contractSize: 100000 },
  'CHFJPY': { pipValue: 0.01, pipPosition: 2, contractSize: 100000 },
  'NZDJPY': { pipValue: 0.01, pipPosition: 2, contractSize: 100000 },
  
  // Cross pairs
  'EURGBP': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  'EURAUD': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  'EURCHF': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  'EURCAD': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  'GBPAUD': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  'GBPCAD': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  'AUDCAD': { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 },
  
  // Commodities
  'XAUUSD': { pipValue: 0.01, pipPosition: 2, contractSize: 100 }, // Gold
  'XAGUSD': { pipValue: 0.001, pipPosition: 3, contractSize: 5000 }, // Silver
  'XAUEUR': { pipValue: 0.01, pipPosition: 2, contractSize: 100 },
  'GOLD': { pipValue: 0.01, pipPosition: 2, contractSize: 100 },
  'SILVER': { pipValue: 0.001, pipPosition: 3, contractSize: 5000 },
  
  // Cryptocurrencies
  'BTCUSD': { pipValue: 1, pipPosition: 0, contractSize: 1 },
  'ETHUSD': { pipValue: 0.01, pipPosition: 2, contractSize: 1 },
  'LTCUSD': { pipValue: 0.01, pipPosition: 2, contractSize: 1 },
  'XRPUSD': { pipValue: 0.00001, pipPosition: 5, contractSize: 1 },
  'BITCOIN': { pipValue: 1, pipPosition: 0, contractSize: 1 },
  'ETHEREUM': { pipValue: 0.01, pipPosition: 2, contractSize: 1 },
  
  // Indices
  'US30': { pipValue: 1, pipPosition: 0, contractSize: 1 },
  'SPX500': { pipValue: 0.1, pipPosition: 1, contractSize: 1 },
  'NAS100': { pipValue: 0.25, pipPosition: 2, contractSize: 1 },
  'GER40': { pipValue: 1, pipPosition: 0, contractSize: 1 },
  'UK100': { pipValue: 1, pipPosition: 0, contractSize: 1 },
  'JPN225': { pipValue: 1, pipPosition: 0, contractSize: 1 },
  
  // Oil
  'CRUDE': { pipValue: 0.01, pipPosition: 2, contractSize: 1000 },
  'BRENT': { pipValue: 0.01, pipPosition: 2, contractSize: 1000 },
  'USOIL': { pipValue: 0.01, pipPosition: 2, contractSize: 1000 },
  'UKOIL': { pipValue: 0.01, pipPosition: 2, contractSize: 1000 }
};

/**
 * Parse financial number from string, handling various formats
 */
export const parseFinancialNumber = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = String(value).trim();
  if (str === '' || str === '-' || str === 'N/A') return 0;
  
  // Remove currency symbols and whitespace
  const cleaned = str.replace(/[$€£¥₹₩,\s]/g, '');
  
  // Handle percentage
  if (cleaned.includes('%')) {
    return parseFloat(cleaned.replace('%', '')) / 100;
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Get instrument specifications
 */
export const getInstrumentSpec = (symbol) => {
  if (!symbol) return { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 };
  
  const upperSymbol = symbol.toUpperCase().replace(/[^A-Z]/g, '');
  
  // Direct match
  if (INSTRUMENT_SPECS[upperSymbol]) {
    return INSTRUMENT_SPECS[upperSymbol];
  }
  
  // Fuzzy matching for common variations
  if (upperSymbol.includes('GOLD') || upperSymbol.includes('XAU')) {
    return INSTRUMENT_SPECS.XAUUSD;
  }
  if (upperSymbol.includes('SILVER') || upperSymbol.includes('XAG')) {
    return INSTRUMENT_SPECS.XAGUSD;
  }
  if (upperSymbol.includes('BTC') || upperSymbol.includes('BITCOIN')) {
    return INSTRUMENT_SPECS.BTCUSD;
  }
  if (upperSymbol.includes('ETH') || upperSymbol.includes('ETHEREUM')) {
    return INSTRUMENT_SPECS.ETHUSD;
  }
  if (upperSymbol.includes('OIL') || upperSymbol.includes('CRUDE')) {
    return INSTRUMENT_SPECS.CRUDE;
  }
  
  // JPY pair detection
  if (upperSymbol.includes('JPY')) {
    return { pipValue: 0.01, pipPosition: 2, contractSize: 100000 };
  }
  
  // Default to major forex pair
  return { pipValue: 0.0001, pipPosition: 4, contractSize: 100000 };
};

/**
 * Calculate pip difference between two prices
 */
export const calculatePips = (entryPrice, exitPrice, symbol) => {
  const entry = parseFinancialNumber(entryPrice);
  const exit = parseFinancialNumber(exitPrice);
  
  if (entry === 0 || exit === 0) return 0;
  
  const spec = getInstrumentSpec(symbol);
  const priceDiff = exit - entry;
  const pips = priceDiff / spec.pipValue;
  
  return Math.round(pips * 10) / 10; // Round to 1 decimal
};

/**
 * Calculate P&L from trade parameters with proper instrument specifications
 * This accounts for different contract sizes and pip values for different instruments
 */
export const calculatePnL = (entryPrice, exitPrice, lotSize, tradeType, symbol) => {
  const entry = parseFinancialNumber(entryPrice);
  const exit = parseFinancialNumber(exitPrice);
  const lots = parseFinancialNumber(lotSize);
  
  if (entry === 0 || exit === 0 || lots === 0) return 0;
  
  let priceDiff = exit - entry;
  
  // Reverse for sell trades
  if (tradeType?.toLowerCase() === 'sell' || tradeType?.toLowerCase() === 'short') {
    priceDiff = -priceDiff;
  }
  
  // Get instrument specifications for proper calculation
  const spec = getInstrumentSpec(symbol);
  const upperSymbol = (symbol || '').toUpperCase();
  
  let pnl = 0;
  
  // Different calculation methods based on instrument type
  if (upperSymbol.includes('BTC')) {
    // Bitcoin: Simple price difference * lots
    pnl = priceDiff * lots;
  } else if (upperSymbol.includes('XAU') || upperSymbol.includes('GOLD')) {
    // Gold: Price difference * lots * contract size (100 oz per lot)
    pnl = priceDiff * lots * spec.contractSize;
  } else if (upperSymbol.includes('XAG') || upperSymbol.includes('SILVER')) {
    // Silver: Price difference * lots * contract size (5000 oz per lot)
    pnl = priceDiff * lots * spec.contractSize;
  } else {
    // Forex pairs: Standard forex calculation
    // For USD as base currency (USDJPY, USDCHF, etc.)
    if (upperSymbol.startsWith('USD') && !upperSymbol.startsWith('USDX')) {
      pnl = (priceDiff * lots * 100000) / exit; // Adjust for quote currency
    } else {
      // For pairs with USD as quote currency (EURUSD, GBPUSD, etc.)
      pnl = priceDiff * lots * 100000; // Standard lot size
    }
  }
  
  return Math.round(pnl * 100) / 100;
};

/**
 * Calculate Risk/Reward ratio - allows negative values to show potential losses
 */
export const calculateRiskReward = (entryPrice, stopLoss, takeProfit, tradeType) => {
  const entry = parseFinancialNumber(entryPrice);
  const stop = parseFinancialNumber(stopLoss);
  const target = parseFinancialNumber(takeProfit);
  
  if (entry === 0 || stop === 0 || target === 0) return 0;
  
  const type = (tradeType || '').toLowerCase();
  const isBuyTrade = type.includes('buy') || type === 'long';
  const isSellTrade = type.includes('sell') || type === 'short';
  
  let risk, reward;
  
  if (isBuyTrade) {
    // BUY trade calculation
    risk = entry - stop;    // Positive if stop below entry (correct)
    reward = target - entry; // Positive if target above entry (correct)
  } else if (isSellTrade) {
    // SELL trade calculation
    risk = stop - entry;    // Positive if stop above entry (correct)  
    reward = entry - target; // Positive if target below entry (correct)
  } else {
    // Unknown trade type - calculate both directions and show actual result
    risk = Math.abs(entry - stop);
    reward = target - entry; // Keep signed value to show direction
  }
  
  // Always return a ratio, even if negative (shows potential loss)
  if (risk <= 0) {
    return 0; // No risk = no ratio
  }
  
  const rr = reward / risk;
  
  // Don't warn about negative ratios - user needs to see the actual loss potential
  return Math.round(rr * 100) / 100; // Round to 2 decimal places, keep sign
};

/**
 * Lazy PnL calculation - only calculate when needed
 */
export const processTradeCalculationsLazy = (trade, forceCalculate = false) => {
  if (!trade) return trade;
  
  // For imports with existing PnL, skip calculation unless forced
  if (!forceCalculate && (trade.isImported || trade.source === 'import') && 
      trade.pnl !== undefined && trade.pnl !== null) {
    return {
      ...trade,
      pnl: parseFinancialNumber(trade.pnl),
      rr: trade.rr || (trade.stopLoss && trade.takeProfit ? 
          calculateRiskReward(trade.entry, trade.stopLoss, trade.takeProfit, trade.type) : null),
      status: trade.status || (trade.exit ? 'closed' : 'open'),
      calculationsSkipped: true
    };
  }
  
  // Only calculate PnL for closed trades during bulk operations
  if (!forceCalculate && trade.status === 'open') {
    return {
      ...trade,
      pnl: 0,
      rr: trade.rr || (trade.stopLoss && trade.takeProfit ? 
          calculateRiskReward(trade.entry, trade.stopLoss, trade.takeProfit, trade.type) : null),
      status: 'open',
      calculationsDeferred: true
    };
  }
  
  return processTradeCalculations(trade);
};

/**
 * Process trade calculations with proper P&L and metrics
 */
export const processTradeCalculations = (trade) => {
  if (!trade) return trade;
  
  // If trade is marked as imported and has PnL, preserve the broker's calculation
  if ((trade.isImported || trade.source === 'import') && trade.pnl !== undefined && trade.pnl !== null) {
    return {
      ...trade,
      pnl: parseFinancialNumber(trade.pnl),
      rr: trade.rr || calculateRiskReward(trade.entry, trade.stopLoss, trade.takeProfit, trade.type),
      status: trade.status || (trade.exit ? 'closed' : 'open')
    };
  }
  
  // For user-entered trades, preserve existing PnL if available, otherwise calculate
  let calculatedPnL = 0;
  
  if (trade.pnl !== undefined && trade.pnl !== null && trade.pnl !== '') {
    // Preserve existing PnL (from manual entry or risk calculator)
    calculatedPnL = parseFinancialNumber(trade.pnl);
  } else if (trade.entry && trade.exit && trade.lotSize) {
    // Calculate PnL if we have the required fields
    calculatedPnL = calculatePnL(
      trade.entry, 
      trade.exit, 
      trade.lotSize, 
      trade.type, 
      trade.pair
    );
  }
  
  return {
    ...trade,
    pnl: parseFinancialNumber(calculatedPnL),
    rr: calculateRiskReward(trade.entry, trade.stopLoss, trade.takeProfit, trade.type),
    status: trade.status || (trade.exit ? 'closed' : 'open')
  };
};

/**
 * Batch process trades with lazy calculation for performance
 */
export const batchProcessTrades = (trades, options = {}) => {
  const { 
    lazyCalculation = true, 
    chunkSize = 1000,
    progressCallback = null 
  } = options;
  
  if (!Array.isArray(trades) || trades.length === 0) {
    return [];
  }
  
  console.log(`Batch processing ${trades.length} trades with lazy calculation: ${lazyCalculation}`);
  
  const processed = [];
  const chunks = Math.ceil(trades.length / chunkSize);
  
  for (let i = 0; i < trades.length; i += chunkSize) {
    const chunk = trades.slice(i, i + chunkSize);
    const chunkIndex = Math.floor(i / chunkSize);
    
    const processedChunk = chunk.map(trade => {
      return lazyCalculation ? 
        processTradeCalculationsLazy(trade, false) : 
        processTradeCalculations(trade);
    });
    
    processed.push(...processedChunk);
    
    if (progressCallback) {
      progressCallback({
        processed: processed.length,
        total: trades.length,
        chunk: chunkIndex + 1,
        totalChunks: chunks,
        progress: (processed.length / trades.length) * 100
      });
    }
    
    console.log(`Processed chunk ${chunkIndex + 1}/${chunks}: ${processedChunk.length} trades`);
  }
  
  return processed;
};

/**
 * Calculate PnL only for trades that need it (deferred calculation)
 */
export const calculateDeferredPnL = (trades) => {
  if (!Array.isArray(trades)) return trades;
  
  return trades.map(trade => {
    if (trade.calculationsDeferred && trade.status === 'closed') {
      return processTradeCalculations(trade);
    }
    return trade;
  });
};

/**
 * Validate trade data completeness and logic
 */
export const validateTrade = (trade) => {
  const errors = [];
  const warnings = [];
  
  // Required field validation
  if (!trade.pair) errors.push('Currency pair is required');
  if (!trade.entry || parseFinancialNumber(trade.entry) <= 0) errors.push('Valid entry price is required');
  if (!trade.lotSize || parseFinancialNumber(trade.lotSize) <= 0) errors.push('Valid lot size is required');
  if (!trade.type) errors.push('Trade type is required');
  
  // Price validation
  const entry = parseFinancialNumber(trade.entry);
  const stopLoss = parseFinancialNumber(trade.stopLoss);
  const takeProfit = parseFinancialNumber(trade.takeProfit);
  
  if (trade.stopLoss && stopLoss <= 0) errors.push('Invalid stop loss price');
  if (trade.takeProfit && takeProfit <= 0) errors.push('Invalid take profit price');
  
  // Trade logic validation
  if (entry > 0 && stopLoss > 0 && takeProfit > 0) {
    const type = (trade.type || '').toLowerCase();
    const isBuyTrade = type.includes('buy') || type === 'long';
    const isSellTrade = type.includes('sell') || type === 'short';
    
    if (isBuyTrade) {
      // BUY trade validation
      if (stopLoss >= entry) {
        errors.push('BUY trade: Stop Loss must be below Entry Price');
      }
      if (takeProfit <= entry) {
        errors.push('BUY trade: Take Profit must be above Entry Price');
      }
      
      // Risk/reward warnings
      const risk = entry - stopLoss;
      const reward = takeProfit - entry;
      if (risk > 0 && reward > 0) {
        const rr = reward / risk;
        if (rr < 1) {
          warnings.push(`Poor risk/reward ratio: ${rr.toFixed(2)}:1 (consider 1:1 minimum)`);
        }
      }
    } else if (isSellTrade) {
      // SELL trade validation
      if (stopLoss <= entry) {
        errors.push('SELL trade: Stop Loss must be above Entry Price');
      }
      if (takeProfit >= entry) {
        errors.push('SELL trade: Take Profit must be below Entry Price');
      }
      
      // Risk/reward warnings
      const risk = stopLoss - entry;
      const reward = entry - takeProfit;
      if (risk > 0 && reward > 0) {
        const rr = reward / risk;
        if (rr < 1) {
          warnings.push(`Poor risk/reward ratio: ${rr.toFixed(2)}:1 (consider 1:1 minimum)`);
        }
      }
    }
  }
  
  // Date validation
  if (trade.date && !isValidDate(trade.date)) {
    errors.push('Invalid date format');
  }
  
  // Exit validation for closed trades
  if (trade.status === 'closed') {
    if (!trade.exit || parseFinancialNumber(trade.exit) <= 0) {
      errors.push('Closed trade requires valid exit price');
    }
  }
  
  // Lot size warnings
  const lotSize = parseFinancialNumber(trade.lotSize);
  if (lotSize > 100) {
    warnings.push('Very large lot size - please verify');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0
  };
};

/**
 * Check if date string is valid
 */
const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && date.getFullYear() > 1900;
};

/**
 * Format P&L for display with proper currency symbols
 */
export const formatPnL = (pnl, currency = 'USD', decimals = 2) => {
  const amount = parseFinancialNumber(pnl);
  const formatted = Math.abs(amount).toFixed(decimals);
  
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥'
  };
  
  const symbol = symbols[currency] || '$';
  const sign = amount >= 0 ? '+' : '-';
  
  return `${sign}${symbol}${formatted}`;
};

/**
 * Calculate position size based on risk parameters with validation
 */
export const calculatePositionSize = (accountBalance, riskPercent, entryPrice, stopLoss, symbol, tradeType = 'buy') => {
  const balance = parseFinancialNumber(accountBalance);
  const risk = parseFinancialNumber(riskPercent);
  const entry = parseFinancialNumber(entryPrice);
  const stop = parseFinancialNumber(stopLoss);
  
  if (balance <= 0 || risk <= 0 || entry <= 0 || stop <= 0) {
    console.warn('Invalid position size parameters');
    return 0;
  }
  
  const type = (tradeType || '').toLowerCase();
  const isBuyTrade = type.includes('buy') || type === 'long';
  const isSellTrade = type.includes('sell') || type === 'short';
  
  // Validate stop loss placement
  if (isBuyTrade && stop >= entry) {
    console.warn('Invalid BUY setup: Stop loss should be below entry price');
    return 0;
  }
  
  if (isSellTrade && stop <= entry) {
    console.warn('Invalid SELL setup: Stop loss should be above entry price');
    return 0;
  }
  
  const riskAmount = (balance * risk) / 100;
  const priceRisk = Math.abs(entry - stop);
  const spec = getInstrumentSpec(symbol);
  
  if (priceRisk <= 0) {
    console.warn('Risk distance is zero or negative');
    return 0;
  }
  
  let positionSize = 0;
  
  // Calculate position size based on instrument type
  if (symbol?.toUpperCase().includes('BTC')) {
    // Bitcoin: Direct calculation
    positionSize = riskAmount / priceRisk;
  } else if (symbol?.toUpperCase().includes('XAU') || symbol?.toUpperCase().includes('GOLD')) {
    // Gold: Account for contract size
    positionSize = riskAmount / (priceRisk * spec.contractSize);
  } else if (symbol?.toUpperCase().includes('JPY')) {
    // JPY pairs: Different pip value
    const pipsRisk = priceRisk / spec.pipValue;
    positionSize = pipsRisk > 0 ? riskAmount / (pipsRisk * (spec.contractSize / 100000)) : 0;
  } else {
    // Standard Forex pairs
    const pipsRisk = priceRisk / spec.pipValue;
    positionSize = pipsRisk > 0 ? riskAmount / (pipsRisk * (spec.contractSize / 100000)) : 0;
  }
  
  // Round to reasonable precision
  if (positionSize > 100) {
    return Math.round(positionSize * 100) / 100; // 2 decimal places
  } else if (positionSize > 1) {
    return Math.round(positionSize * 1000) / 1000; // 3 decimal places
  } else {
    return Math.round(positionSize * 100000) / 100000; // 5 decimal places
  }
};

/**
 * Calculate risk amount for a trade
 */
export const calculateRiskAmount = (entryPrice, stopLoss, lotSize, symbol) => {
  const entry = parseFinancialNumber(entryPrice);
  const stop = parseFinancialNumber(stopLoss);
  const lots = parseFinancialNumber(lotSize);
  
  if (entry === 0 || stop === 0 || lots === 0) return 0;
  
  const priceRisk = Math.abs(entry - stop);
  const spec = getInstrumentSpec(symbol);
  
  // Calculate risk amount based on instrument type
  if (symbol?.toUpperCase().includes('BTC')) {
    return priceRisk * lots;
  } else if (symbol?.toUpperCase().includes('XAU')) {
    return priceRisk * lots * spec.contractSize;
  } else {
    // Forex pairs
    return priceRisk * lots * spec.contractSize;
  }
};

/**
 * Convert lot size to units
 */
export const lotsToUnits = (lotSize, symbol) => {
  const lots = parseFinancialNumber(lotSize);
  const spec = getInstrumentSpec(symbol);
  
  return lots * spec.contractSize;
};

/**
 * Convert units to lot size
 */
export const unitsToLots = (units, symbol) => {
  const unitAmount = parseFinancialNumber(units);
  const spec = getInstrumentSpec(symbol);
  
  return spec.contractSize > 0 ? unitAmount / spec.contractSize : 0;
};