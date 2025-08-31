// Advanced caching system for trade data and statistics
// Reduces computation load and improves performance for large datasets

class TradeCache {
  constructor() {
    this.statisticsCache = new Map();
    this.tradesByDateCache = new Map();
    this.pnlCalculationCache = new Map();
    this.chartDataCache = new Map();
    this.performanceCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Configuration  
    this.maxCacheSize = 10000; // Maximum cached items per cache type - increased for large datasets
    this.enablePersistentCache = true;
    
    console.log('Trade cache system initialized');
  }

  /**
   * Generate cache key from parameters
   */
  generateCacheKey(prefix, params) {
    const paramString = JSON.stringify(params);
    return `${prefix}_${this.hashString(paramString)}`;
  }

  /**
   * Simple string hash function
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if cache item is valid
   */
  isCacheValid(cacheItem) {
    if (!cacheItem) return false;
    
    const now = Date.now();
    const isExpired = (now - cacheItem.timestamp) > this.cacheTimeout;
    
    return !isExpired;
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache() {
    const now = Date.now();
    const caches = [
      this.statisticsCache,
      this.tradesByDateCache,
      this.pnlCalculationCache,
      this.chartDataCache,
      this.performanceCache
    ];

    caches.forEach(cache => {
      for (const [key, value] of cache.entries()) {
        if ((now - value.timestamp) > this.cacheTimeout) {
          cache.delete(key);
        }
      }
    });
  }

  /**
   * Limit cache size to prevent memory issues
   */
  limitCacheSize(cache) {
    if (cache.size > this.maxCacheSize) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 20% of entries
      const removeCount = Math.floor(this.maxCacheSize * 0.2);
      for (let i = 0; i < removeCount; i++) {
        cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Get cached statistics
   */
  getCachedStatistics(userId, tradesHash) {
    const key = this.generateCacheKey('stats', { userId, tradesHash });
    const cached = this.statisticsCache.get(key);
    
    if (this.isCacheValid(cached)) {
      console.log('Statistics cache hit for user:', userId);
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache statistics
   */
  setCachedStatistics(userId, tradesHash, statistics) {
    const key = this.generateCacheKey('stats', { userId, tradesHash });
    this.statisticsCache.set(key, {
      data: statistics,
      timestamp: Date.now()
    });
    
    this.limitCacheSize(this.statisticsCache);
    console.log('Statistics cached for user:', userId);
  }

  /**
   * Get cached PnL calculation
   */
  getCachedPnL(tradeParams) {
    const key = this.generateCacheKey('pnl', tradeParams);
    const cached = this.pnlCalculationCache.get(key);
    
    if (this.isCacheValid(cached)) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache PnL calculation
   */
  setCachedPnL(tradeParams, pnlResult) {
    const key = this.generateCacheKey('pnl', tradeParams);
    this.pnlCalculationCache.set(key, {
      data: pnlResult,
      timestamp: Date.now()
    });
    
    this.limitCacheSize(this.pnlCalculationCache);
  }

  /**
   * Get cached trades by date
   */
  getCachedTradesByDate(userId, dateRange) {
    const key = this.generateCacheKey('trades_date', { userId, dateRange });
    const cached = this.tradesByDateCache.get(key);
    
    if (this.isCacheValid(cached)) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache trades by date
   */
  setCachedTradesByDate(userId, dateRange, trades) {
    const key = this.generateCacheKey('trades_date', { userId, dateRange });
    this.tradesByDateCache.set(key, {
      data: trades,
      timestamp: Date.now()
    });
    
    this.limitCacheSize(this.tradesByDateCache);
  }

  /**
   * Get cached chart data
   */
  getCachedChartData(userId, chartType, params = {}) {
    const key = this.generateCacheKey('chart', { userId, chartType, ...params });
    const cached = this.chartDataCache.get(key);
    
    if (this.isCacheValid(cached)) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache chart data
   */
  setCachedChartData(userId, chartType, params, chartData) {
    const key = this.generateCacheKey('chart', { userId, chartType, ...params });
    this.chartDataCache.set(key, {
      data: chartData,
      timestamp: Date.now()
    });
    
    this.limitCacheSize(this.chartDataCache);
  }

  /**
   * Get cached performance metrics
   */
  getCachedPerformance(userId, metricType, timeframe) {
    const key = this.generateCacheKey('performance', { userId, metricType, timeframe });
    const cached = this.performanceCache.get(key);
    
    if (this.isCacheValid(cached)) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache performance metrics
   */
  setCachedPerformance(userId, metricType, timeframe, performanceData) {
    const key = this.generateCacheKey('performance', { userId, metricType, timeframe });
    this.performanceCache.set(key, {
      data: performanceData,
      timestamp: Date.now()
    });
    
    this.limitCacheSize(this.performanceCache);
  }

  /**
   * Invalidate all user cache
   */
  invalidateUserCache(userId) {
    const caches = [
      this.statisticsCache,
      this.tradesByDateCache,
      this.chartDataCache,
      this.performanceCache
    ];

    caches.forEach(cache => {
      for (const [key, value] of cache.entries()) {
        if (key.includes(userId)) {
          cache.delete(key);
        }
      }
    });
    
    this.lastCacheUpdate = Date.now();
    console.log('Cache invalidated for user:', userId);
  }

  /**
   * Invalidate specific cache type
   */
  invalidateCache(cacheType) {
    switch (cacheType) {
      case 'statistics':
        this.statisticsCache.clear();
        break;
      case 'trades':
        this.tradesByDateCache.clear();
        break;
      case 'pnl':
        this.pnlCalculationCache.clear();
        break;
      case 'charts':
        this.chartDataCache.clear();
        break;
      case 'performance':
        this.performanceCache.clear();
        break;
      case 'all':
        this.clearAll();
        break;
      default:
        console.warn('Unknown cache type:', cacheType);
    }
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.statisticsCache.clear();
    this.tradesByDateCache.clear();
    this.pnlCalculationCache.clear();
    this.chartDataCache.clear();
    this.performanceCache.clear();
    this.lastCacheUpdate = Date.now();
    
    console.log('All caches cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      statistics: {
        size: this.statisticsCache.size,
        hitRate: this.getHitRate('statistics')
      },
      tradesByDate: {
        size: this.tradesByDateCache.size,
        hitRate: this.getHitRate('tradesByDate')
      },
      pnlCalculations: {
        size: this.pnlCalculationCache.size,
        hitRate: this.getHitRate('pnl')
      },
      chartData: {
        size: this.chartDataCache.size,
        hitRate: this.getHitRate('chart')
      },
      performance: {
        size: this.performanceCache.size,
        hitRate: this.getHitRate('performance')
      },
      totalMemoryUsage: this.estimateMemoryUsage(),
      lastUpdate: this.lastCacheUpdate
    };
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    const caches = [
      this.statisticsCache,
      this.tradesByDateCache,
      this.pnlCalculationCache,
      this.chartDataCache,
      this.performanceCache
    ];

    caches.forEach(cache => {
      for (const [key, value] of cache.entries()) {
        totalSize += JSON.stringify(key).length;
        totalSize += JSON.stringify(value.data).length;
        totalSize += 16; // timestamp and metadata
      }
    });

    return Math.round(totalSize / 1024); // Return in KB
  }

  /**
   * Get hit rate for cache type (simplified)
   */
  getHitRate(cacheType) {
    // This would require tracking hits/misses in a real implementation
    return 'Not tracked';
  }

  /**
   * Periodic maintenance
   */
  startMaintenanceTimer() {
    setInterval(() => {
      this.cleanExpiredCache();
    }, 60000); // Run every minute
  }

  /**
   * Initialize cache with persistence if enabled
   */
  initialize() {
    if (this.enablePersistentCache) {
      // Could load from localStorage or IndexedDB here
      this.loadPersistentCache();
    }
    
    this.startMaintenanceTimer();
    console.log('Trade cache system fully initialized');
  }

  /**
   * Load persistent cache (placeholder)
   */
  loadPersistentCache() {
    try {
      const cached = localStorage.getItem('tradeCache');
      if (cached) {
        const data = JSON.parse(cached);
        // Restore cache if recent enough
        if (Date.now() - data.timestamp < this.cacheTimeout) {
          console.log('Restored cache from storage');
        }
      }
    } catch (error) {
      console.warn('Failed to load persistent cache:', error);
    }
  }

  /**
   * Save persistent cache (placeholder)
   */
  savePersistentCache() {
    try {
      const cacheData = {
        timestamp: Date.now(),
        stats: this.getCacheStats()
      };
      localStorage.setItem('tradeCache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save persistent cache:', error);
    }
  }
}

// Create singleton instance
export const tradeCache = new TradeCache();

// Initialize cache system
tradeCache.initialize();

// React hook for cache management
export const useTradeCache = () => {
  return {
    // Statistics caching
    getCachedStats: (userId, hash) => tradeCache.getCachedStatistics(userId, hash),
    setCachedStats: (userId, hash, stats) => tradeCache.setCachedStatistics(userId, hash, stats),
    
    // Chart data caching
    getCachedChart: (userId, type, params) => tradeCache.getCachedChartData(userId, type, params),
    setCachedChart: (userId, type, params, data) => tradeCache.setCachedChartData(userId, type, params, data),
    
    // Performance caching
    getCachedPerformance: (userId, type, timeframe) => tradeCache.getCachedPerformance(userId, type, timeframe),
    setCachedPerformance: (userId, type, timeframe, data) => tradeCache.setCachedPerformance(userId, type, timeframe, data),
    
    // Cache management
    invalidateUser: (userId) => tradeCache.invalidateUserCache(userId),
    invalidateCache: (type) => tradeCache.invalidateCache(type),
    clearAll: () => tradeCache.clearAll(),
    
    // Cache stats
    getCacheStats: () => tradeCache.getCacheStats()
  };
};

export default tradeCache;