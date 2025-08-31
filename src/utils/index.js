// Central exports for all utility functions
// This creates a clean import interface for components

// Core data management
export { useDataManager, dataManager } from './core/dataManager';

// Calculation utilities  
export {
  parseFinancialNumber,
  calculatePositionSize,
  calculatePnL,
  calculateRiskReward,
  processTradeCalculations,
  validateTrade,
  formatPnL,
  calculateRiskAmount,
  lotsToUnits,
  unitsToLots,
  calculatePips,
  getInstrumentSpec
} from './calculations/pnlCalculator';

export {
  calculateTradingStatistics,
  getConsistentStatistics,
  getConsistentWorthScore
} from './calculations/statisticsCalculator';

// Database utilities
export {
  migrateLocalTradesToDatabase,
  loadTradesFromDatabase,
  addTradeToDatabase,
  updateTradeInDatabase,
  deleteTradeFromDatabase,
  checkExistingTrades,
  deleteAllUserTrades
} from './database/migrateTrades';

export {
  fetchProfileMetrics,
  calculateEnhancedWorthScore,
  formatMetricValue,
  getPerformanceGrade,
  getEnhancedPerformanceGrade
} from './database/profileMetrics';