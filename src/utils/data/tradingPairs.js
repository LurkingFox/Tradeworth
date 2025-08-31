// Comprehensive trading pairs database with search functionality
// Includes Forex, Crypto, Commodities, Stocks, and Indices

export const TRADING_PAIRS_DATABASE = {
  // Major Forex Pairs
  forex_major: [
    { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'Major Forex', exchange: 'Forex' },
    { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'Major Forex', exchange: 'Forex' },
    { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'Major Forex', exchange: 'Forex' },
    { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', category: 'Major Forex', exchange: 'Forex' },
    { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', category: 'Major Forex', exchange: 'Forex' },
    { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', category: 'Major Forex', exchange: 'Forex' },
    { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', category: 'Major Forex', exchange: 'Forex' }
  ],

  // Minor Forex Pairs
  forex_minor: [
    { symbol: 'EURJPY', name: 'Euro / Japanese Yen', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'EURGBP', name: 'Euro / British Pound', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'EURAUD', name: 'Euro / Australian Dollar', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'EURCHF', name: 'Euro / Swiss Franc', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'EURCAD', name: 'Euro / Canadian Dollar', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'GBPAUD', name: 'British Pound / Australian Dollar', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'GBPCAD', name: 'British Pound / Canadian Dollar', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'GBPCHF', name: 'British Pound / Swiss Franc', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'AUDCAD', name: 'Australian Dollar / Canadian Dollar', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'AUDJPY', name: 'Australian Dollar / Japanese Yen', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'AUDCHF', name: 'Australian Dollar / Swiss Franc', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'CADJPY', name: 'Canadian Dollar / Japanese Yen', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'CHFJPY', name: 'Swiss Franc / Japanese Yen', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'NZDJPY', name: 'New Zealand Dollar / Japanese Yen', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'NZDCAD', name: 'New Zealand Dollar / Canadian Dollar', category: 'Minor Forex', exchange: 'Forex' },
    { symbol: 'NZDCHF', name: 'New Zealand Dollar / Swiss Franc', category: 'Minor Forex', exchange: 'Forex' }
  ],

  // Exotic Forex Pairs
  forex_exotic: [
    { symbol: 'USDZAR', name: 'US Dollar / South African Rand', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'USDTRY', name: 'US Dollar / Turkish Lira', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'USDHKD', name: 'US Dollar / Hong Kong Dollar', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'USDSGD', name: 'US Dollar / Singapore Dollar', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'EURTRY', name: 'Euro / Turkish Lira', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'EURZAR', name: 'Euro / South African Rand', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'GBPTRY', name: 'British Pound / Turkish Lira', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'USDSEK', name: 'US Dollar / Swedish Krona', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'USDNOK', name: 'US Dollar / Norwegian Krone', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'USDDKK', name: 'US Dollar / Danish Krone', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'USDPLN', name: 'US Dollar / Polish Zloty', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'USDCZK', name: 'US Dollar / Czech Koruna', category: 'Exotic Forex', exchange: 'Forex' },
    { symbol: 'USDHUF', name: 'US Dollar / Hungarian Forint', category: 'Exotic Forex', exchange: 'Forex' }
  ],

  // Cryptocurrencies
  crypto: [
    { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'LTCUSD', name: 'Litecoin / US Dollar', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'XRPUSD', name: 'XRP / US Dollar', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'ADAUSD', name: 'Cardano / US Dollar', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'DOTUSD', name: 'Polkadot / US Dollar', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'LINKUSD', name: 'Chainlink / US Dollar', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'SOLUSD', name: 'Solana / US Dollar', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'MATICUSD', name: 'Polygon / US Dollar', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'AVAXUSD', name: 'Avalanche / US Dollar', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'BTCEUR', name: 'Bitcoin / Euro', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'ETHEUR', name: 'Ethereum / Euro', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'BTCGBP', name: 'Bitcoin / British Pound', category: 'Cryptocurrency', exchange: 'Crypto' },
    { symbol: 'ETHBTC', name: 'Ethereum / Bitcoin', category: 'Cryptocurrency', exchange: 'Crypto' }
  ],

  // Commodities
  commodities: [
    { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'Precious Metals', exchange: 'Commodities' },
    { symbol: 'XAGUSD', name: 'Silver / US Dollar', category: 'Precious Metals', exchange: 'Commodities' },
    { symbol: 'XAUEUR', name: 'Gold / Euro', category: 'Precious Metals', exchange: 'Commodities' },
    { symbol: 'XAUJPY', name: 'Gold / Japanese Yen', category: 'Precious Metals', exchange: 'Commodities' },
    { symbol: 'CRUDE', name: 'Crude Oil', category: 'Energy', exchange: 'Commodities' },
    { symbol: 'BRENT', name: 'Brent Oil', category: 'Energy', exchange: 'Commodities' },
    { symbol: 'NATGAS', name: 'Natural Gas', category: 'Energy', exchange: 'Commodities' },
    { symbol: 'WHEAT', name: 'Wheat', category: 'Agriculture', exchange: 'Commodities' },
    { symbol: 'CORN', name: 'Corn', category: 'Agriculture', exchange: 'Commodities' },
    { symbol: 'COPPER', name: 'Copper', category: 'Industrial Metals', exchange: 'Commodities' },
    { symbol: 'PLATINUM', name: 'Platinum', category: 'Precious Metals', exchange: 'Commodities' },
    { symbol: 'PALLADIUM', name: 'Palladium', category: 'Precious Metals', exchange: 'Commodities' }
  ],

  // Stock Indices
  indices: [
    { symbol: 'SPX500', name: 'S&P 500 Index', category: 'US Indices', exchange: 'Indices' },
    { symbol: 'NAS100', name: 'NASDAQ 100 Index', category: 'US Indices', exchange: 'Indices' },
    { symbol: 'US30', name: 'Dow Jones 30 Index', category: 'US Indices', exchange: 'Indices' },
    { symbol: 'GER40', name: 'DAX 40 Index', category: 'European Indices', exchange: 'Indices' },
    { symbol: 'UK100', name: 'FTSE 100 Index', category: 'European Indices', exchange: 'Indices' },
    { symbol: 'JPN225', name: 'Nikkei 225 Index', category: 'Asian Indices', exchange: 'Indices' },
    { symbol: 'FRA40', name: 'CAC 40 Index', category: 'European Indices', exchange: 'Indices' },
    { symbol: 'ESP35', name: 'IBEX 35 Index', category: 'European Indices', exchange: 'Indices' },
    { symbol: 'AUS200', name: 'ASX 200 Index', category: 'Asian Indices', exchange: 'Indices' },
    { symbol: 'HKG33', name: 'Hang Seng Index', category: 'Asian Indices', exchange: 'Indices' }
  ],

  // Popular Stocks (Major Tech)
  stocks: [
    { symbol: 'AAPL', name: 'Apple Inc.', category: 'Technology Stocks', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', category: 'Technology Stocks', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'Technology Stocks', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'Technology Stocks', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Technology Stocks', exchange: 'NASDAQ' },
    { symbol: 'META', name: 'Meta Platforms Inc.', category: 'Technology Stocks', exchange: 'NASDAQ' },
    { symbol: 'NFLX', name: 'Netflix Inc.', category: 'Technology Stocks', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'Technology Stocks', exchange: 'NASDAQ' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', category: 'Financial Stocks', exchange: 'NYSE' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'Healthcare Stocks', exchange: 'NYSE' }
  ]
};

// Flatten all pairs into a single searchable array
export const ALL_TRADING_PAIRS = Object.values(TRADING_PAIRS_DATABASE).flat();

/**
 * Search trading pairs by symbol or name
 */
export const searchTradingPairs = (query, maxResults = 50) => {
  if (!query || query.length < 1) {
    // Return popular pairs by default
    return ALL_TRADING_PAIRS.slice(0, 20);
  }

  const searchQuery = query.toUpperCase().trim();
  const results = [];

  // Exact symbol matches first
  const exactMatches = ALL_TRADING_PAIRS.filter(pair => 
    pair.symbol === searchQuery
  );
  results.push(...exactMatches);

  // Symbol starts with query
  const symbolStartsWith = ALL_TRADING_PAIRS.filter(pair => 
    pair.symbol.startsWith(searchQuery) && !exactMatches.includes(pair)
  );
  results.push(...symbolStartsWith);

  // Symbol contains query
  const symbolContains = ALL_TRADING_PAIRS.filter(pair => 
    pair.symbol.includes(searchQuery) && 
    !exactMatches.includes(pair) && 
    !symbolStartsWith.includes(pair)
  );
  results.push(...symbolContains);

  // Name contains query
  const nameContains = ALL_TRADING_PAIRS.filter(pair => 
    pair.name.toUpperCase().includes(searchQuery) && 
    !results.includes(pair)
  );
  results.push(...nameContains);

  return results.slice(0, maxResults);
};

/**
 * Get pairs by category
 */
export const getPairsByCategory = (category) => {
  return ALL_TRADING_PAIRS.filter(pair => pair.category === category);
};

/**
 * Get popular trading pairs (most commonly traded)
 */
export const getPopularPairs = () => {
  return [
    ...TRADING_PAIRS_DATABASE.forex_major,
    ...TRADING_PAIRS_DATABASE.crypto.slice(0, 5),
    ...TRADING_PAIRS_DATABASE.commodities.slice(0, 3),
    ...TRADING_PAIRS_DATABASE.indices.slice(0, 4)
  ];
};

/**
 * Get all unique categories
 */
export const getAllCategories = () => {
  const categories = [...new Set(ALL_TRADING_PAIRS.map(pair => pair.category))];
  return categories.sort();
};

/**
 * Check if a pair exists in the database
 */
export const isPairSupported = (symbol) => {
  return ALL_TRADING_PAIRS.some(pair => 
    pair.symbol.toUpperCase() === symbol.toUpperCase()
  );
};

/**
 * Get pair information by symbol
 */
export const getPairInfo = (symbol) => {
  return ALL_TRADING_PAIRS.find(pair => 
    pair.symbol.toUpperCase() === symbol.toUpperCase()
  );
};

/**
 * Suggest similar pairs based on currencies
 */
export const getSimilarPairs = (symbol, maxResults = 10) => {
  if (!symbol || symbol.length < 3) return [];

  const upperSymbol = symbol.toUpperCase();
  
  // Extract currencies from the symbol (assume 6-character pairs like EURUSD)
  if (upperSymbol.length >= 6) {
    const baseCurrency = upperSymbol.substring(0, 3);
    const quoteCurrency = upperSymbol.substring(3, 6);
    
    // Find pairs with the same base or quote currency
    const similar = ALL_TRADING_PAIRS.filter(pair => {
      const pairSymbol = pair.symbol.toUpperCase();
      if (pairSymbol.length >= 6) {
        const pairBase = pairSymbol.substring(0, 3);
        const pairQuote = pairSymbol.substring(3, 6);
        
        return (pairBase === baseCurrency || pairQuote === baseCurrency ||
                pairBase === quoteCurrency || pairQuote === quoteCurrency) &&
               pairSymbol !== upperSymbol;
      }
      return false;
    });
    
    return similar.slice(0, maxResults);
  }
  
  // For non-standard symbols, search by partial match
  return searchTradingPairs(symbol.substring(0, 3), maxResults);
};

export default {
  TRADING_PAIRS_DATABASE,
  ALL_TRADING_PAIRS,
  searchTradingPairs,
  getPairsByCategory,
  getPopularPairs,
  getAllCategories,
  isPairSupported,
  getPairInfo,
  getSimilarPairs
};