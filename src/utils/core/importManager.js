// Advanced import manager with memory-efficient processing and background jobs
// Handles large trade imports with progress tracking and error recovery

import { efficientImporter } from '../database/efficientImporter';
import { batchProcessTrades, processTradeCalculationsLazy } from '../calculations/pnlCalculator';
import { tradeCache } from './tradeCache';

class ImportManager {
  constructor() {
    this.activeImports = new Map();
    this.importHistory = [];
    this.maxConcurrentImports = 2;
    this.cleanupInterval = 60000; // 1 minute
    
    // Start cleanup timer
    setInterval(() => this.cleanupCompletedImports(), this.cleanupInterval);
    
    console.log('Import Manager initialized');
  }

  /**
   * Generate unique import job ID
   */
  generateJobId() {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Memory-efficient import flow for large datasets
   */
  async startOptimizedImport(trades, userId, options = {}) {
    const jobId = this.generateJobId();
    const {
      chunkSize = 500,
      maxMemoryUsage = 100, // MB
      enableBackgroundProcessing = true,
      skipDuplicates = true,
      lazyCalculation = true,
      progressCallback = null,
      filename = 'unknown'
    } = options;

    console.log(`Starting optimized import job ${jobId} with ${trades.length} trades`);
    console.log('Import settings:', { chunkSize, skipDuplicates, lazyCalculation });
    
    // Log sample of first few trades to verify data quality
    console.log('Sample trades to import:', trades.slice(0, 3).map(t => ({
      pair: t.pair,
      date: t.date,
      entry: t.entry,
      lotSize: t.lotSize,
      hasRequiredFields: !!(t.pair && t.date && t.entry && t.lotSize)
    })));

    // Create import job tracking
    const importJob = {
      id: jobId,
      userId,
      status: 'initializing',
      totalTrades: trades.length,
      processedTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      duplicateTrades: 0,
      filename,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      progress: 0,
      currentPhase: 'preparing',
      error: null,
      settings: {
        chunkSize,
        maxMemoryUsage,
        skipDuplicates,
        lazyCalculation
      }
    };

    this.activeImports.set(jobId, importJob);

    try {
      // Phase 1: Validation and preprocessing
      importJob.currentPhase = 'validating';
      this.updateJobProgress(jobId, { status: 'validating' });
      
      const validationResult = await this.validateAndPreprocess(trades, {
        skipDuplicates,
        lazyCalculation,
        progressCallback: (progress) => {
          const validationProgress = Math.min((progress.progress || 0) * 0.1, 10);
          this.updateJobProgress(jobId, {
            progress: validationProgress,
            processedTrades: progress.processed,
            debugInfo: {
              validation: {
                valid: progress.valid || 0,
                skipped: trades.length - (progress.valid || 0)
              }
            }
          });
          if (progressCallback) progressCallback({ 
            ...progress, 
            phase: 'validating',
            progress: validationProgress 
          });
        }
      });
      
      const validatedTrades = validationResult.validTrades;

      importJob.duplicateTrades = trades.length - validatedTrades.length;
      console.log(`Validation complete: ${trades.length} -> ${validatedTrades.length} trades (${importJob.duplicateTrades} duplicates removed)`);
      
      // Update job with validation debug info
      this.updateJobProgress(jobId, {
        debugInfo: {
          ...importJob.debugInfo,
          validation: {
            original: trades.length,
            valid: validatedTrades.length,
            skipped: trades.length - validatedTrades.length
          },
          issues: validationResult.debugInfo?.issues || []
        }
      });

      // Phase 2: Memory-efficient batch processing
      importJob.currentPhase = 'processing';
      this.updateJobProgress(jobId, { 
        status: 'processing',
        progress: 10
      });

      // Determine optimal chunk size based on memory constraints
      const optimalChunkSize = this.calculateOptimalChunkSize(validatedTrades, maxMemoryUsage);
      console.log(`Using optimal chunk size: ${optimalChunkSize} (requested: ${chunkSize})`);

      // Process in memory-efficient batches
      const result = await this.processInBatches(validatedTrades, userId, {
        chunkSize: Math.min(chunkSize, optimalChunkSize),
        progressCallback: (progress) => {
          const processingProgress = Math.min((progress.progress || 0) * 0.8, 80);
          const overallProgress = Math.min(10 + processingProgress, 90);
          this.updateJobProgress(jobId, {
            progress: overallProgress,
            processedTrades: progress.processed,
            successfulTrades: progress.successful || 0,
            failedTrades: progress.failed || 0,
            debugInfo: {
              ...importJob.debugInfo,
              database: {
                imported: progress.successful || 0,
                failed: progress.failed || 0,
                chunks: Math.ceil(validatedTrades.length / chunkSize)
              }
            }
          });
          if (progressCallback) progressCallback({ 
            ...progress, 
            phase: 'importing',
            progress: overallProgress 
          });
        }
      });

      // Phase 3: Finalization
      importJob.currentPhase = 'finalizing';
      this.updateJobProgress(jobId, { 
        status: 'finalizing',
        progress: 90
      });

      // Clear caches to free memory
      tradeCache.invalidateUserCache(userId);

      // Complete job
      const completedJob = {
        status: 'completed',
        progress: 100,
        successfulTrades: result.imported || 0,
        failedTrades: result.failed || 0,
        duplicateTrades: result.duplicatesSkipped || importJob.duplicateTrades,
        endTime: Date.now(),
        processingTime: Date.now() - importJob.startTime,
        currentPhase: 'completed'
      };

      this.updateJobProgress(jobId, completedJob);

      console.log(`Import job ${jobId} completed successfully:`, {
        imported: result.imported,
        duplicates: result.duplicatesSkipped,
        failed: result.failed,
        processingTime: completedJob.processingTime
      });

      return {
        success: true,
        jobId,
        imported: result.imported || 0,
        duplicatesSkipped: result.duplicatesSkipped || 0,
        failed: result.failed || 0,
        processingTime: completedJob.processingTime,
        importBatchId: result.importBatchId
      };

    } catch (error) {
      console.error(`Import job ${jobId} failed:`, error);
      
      this.updateJobProgress(jobId, {
        status: 'failed',
        error: error.message,
        endTime: Date.now()
      });

      return {
        success: false,
        jobId,
        error: error.message
      };
    }
  }

  /**
   * Validate and preprocess trades with memory efficiency
   */
  async validateAndPreprocess(trades, options = {}) {
    const { skipDuplicates, lazyCalculation, progressCallback } = options;
    
    console.log(`Preprocessing ${trades.length} trades...`);
    
    const validTrades = [];
    const seenHashes = new Set();
    const skippedTrades = [];
    const batchSize = 1000; // Process in small batches to avoid memory issues
    
    for (let i = 0; i < trades.length; i += batchSize) {
      const batch = trades.slice(i, i + batchSize);
      
      for (const trade of batch) {
        try {
          // Basic validation
          if (!trade.pair || !trade.entry || !trade.date) {
            skippedTrades.push({ reason: 'missing_required_fields', trade: { pair: trade.pair, entry: trade.entry, date: trade.date } });
            continue; // Skip invalid trades
          }

          // Generate hash for duplicate detection
          const tradeHash = this.generateTradeHash(trade);
          
          if (skipDuplicates && seenHashes.has(tradeHash)) {
            skippedTrades.push({ reason: 'duplicate', trade: { pair: trade.pair, date: trade.date, hash: tradeHash } });
            continue; // Skip duplicate
          }
          
          seenHashes.add(tradeHash);
          
          // Lazy process trade (minimal calculation)
          const processedTrade = lazyCalculation ? 
            processTradeCalculationsLazy(trade, false) : 
            trade;

          validTrades.push({
            ...processedTrade,
            tradeHash,
            brokerTradeId: tradeHash
          });
          
        } catch (error) {
          console.warn(`Failed to preprocess trade:`, error);
          skippedTrades.push({ reason: 'processing_error', trade: { pair: trade.pair, date: trade.date }, error: error.message });
        }
      }
      
      // Progress callback
      if (progressCallback) {
        const processed = Math.min(i + batchSize, trades.length);
        const progress = Math.min((processed / trades.length) * 100, 100);
        progressCallback({
          processed: processed,
          total: trades.length,
          valid: validTrades.length,
          progress: progress
        });
      }
      
      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    console.log(`Preprocessing complete: ${validTrades.length} valid trades from ${trades.length}`);
    
    // Log detailed breakdown of skipped trades
    const issues = [];
    if (skippedTrades.length > 0) {
      const skippedSummary = skippedTrades.reduce((acc, skip) => {
        acc[skip.reason] = (acc[skip.reason] || 0) + 1;
        return acc;
      }, {});
      console.log('Skipped trades breakdown:', skippedSummary);
      console.log('Sample skipped trades:', skippedTrades.slice(0, 5));
      
      // Generate user-friendly issue messages
      Object.entries(skippedSummary).forEach(([reason, count]) => {
        switch (reason) {
          case 'missing_required_fields':
            issues.push(`${count} trades missing required fields (pair, date, entry, lot size)`);
            break;
          case 'duplicate':
            issues.push(`${count} duplicate trades detected`);
            break;
          case 'processing_error':
            issues.push(`${count} trades failed processing`);
            break;
          default:
            issues.push(`${count} trades skipped (${reason})`);
        }
      });
    }
    
    return {
      validTrades,
      debugInfo: {
        skipped: skippedTrades.length,
        issues,
        skippedBreakdown: skippedTrades.reduce((acc, skip) => {
          acc[skip.reason] = (acc[skip.reason] || 0) + 1;
          return acc;
        }, {})
      }
    };
  }

  /**
   * Process trades in memory-efficient batches
   */
  async processInBatches(trades, userId, options = {}) {
    const { chunkSize, progressCallback } = options;
    
    // Use new efficient importer with proper chunking
    try {
      const result = await efficientImporter.importTrades(trades, userId, {
        chunkSize: Math.min(chunkSize, 100), // Safe chunk size
        onProgress: (progress) => {
          if (progressCallback) {
            progressCallback({
              processed: progress.processed,
              total: progress.total,
              successful: progress.imported,
              failed: progress.failed,
              progress: progress.progress
            });
          }
        },
        validateData: true // Enable data validation
      });
      
      return {
        imported: result.imported,
        failed: result.failed,
        duplicatesSkipped: result.transformErrors || 0
      };
      
    } catch (error) {
      console.error('Efficient import failed:', error);
      
      if (progressCallback) {
        progressCallback({
          processed: trades.length,
          total: trades.length,
          successful: 0,
          failed: trades.length,
          progress: 100
        });
      }
      
      return {
        imported: 0,
        failed: trades.length,
        duplicatesSkipped: 0
      };
    }
  }

  /**
   * Calculate optimal chunk size based on memory constraints
   */
  calculateOptimalChunkSize(trades, maxMemoryMB) {
    if (trades.length === 0) return 500;
    
    // Estimate memory per trade (rough calculation)
    const sampleTrade = trades[0];
    const tradeSize = JSON.stringify(sampleTrade).length * 2; // Rough estimate
    const memoryPerTrade = tradeSize / 1024; // KB per trade
    
    // Calculate max trades that fit in memory constraint
    const maxTradesInMemory = (maxMemoryMB * 1024) / memoryPerTrade;
    
    // Use conservative chunk size (25% of max memory)
    const optimalChunkSize = Math.floor(maxTradesInMemory * 0.25);
    
    // Constrain to reasonable bounds (increased upper limit for large datasets)
    return Math.max(100, Math.min(optimalChunkSize, 5000));
  }

  /**
   * Generate trade hash for duplicate detection
   */
  generateTradeHash(trade) {
    const hashString = `${trade.date}_${trade.pair}_${trade.type}_${trade.entry}_${trade.lotSize}_${trade.exit || 'open'}`;
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const finalHash = Math.abs(hash).toString(36);
    
    // Log hash generation for debugging (only first few)
    if (Math.random() < 0.001) { // 0.1% chance to log
      console.log('Hash generation:', { hashString, finalHash, trade: { pair: trade.pair, date: trade.date } });
    }
    
    return finalHash;
  }

  /**
   * Update import job progress
   */
  updateJobProgress(jobId, updates) {
    const job = this.activeImports.get(jobId);
    if (job) {
      Object.assign(job, updates, { lastUpdate: Date.now() });
      this.activeImports.set(jobId, job);
    }
  }

  /**
   * Get import job status
   */
  getImportStatus(jobId) {
    return this.activeImports.get(jobId) || null;
  }

  /**
   * Cancel active import
   */
  cancelImport(jobId) {
    const job = this.activeImports.get(jobId);
    if (job && ['initializing', 'validating', 'processing'].includes(job.status)) {
      this.updateJobProgress(jobId, {
        status: 'cancelled',
        endTime: Date.now()
      });
      return true;
    }
    return false;
  }

  /**
   * Get all active imports for a user
   */
  getUserActiveImports(userId) {
    const userImports = [];
    for (const [jobId, job] of this.activeImports) {
      if (job.userId === userId) {
        userImports.push({ jobId, ...job });
      }
    }
    return userImports;
  }

  /**
   * Clean up completed imports
   */
  cleanupCompletedImports() {
    const cutoff = Date.now() - (30 * 60 * 1000); // Keep for 30 minutes
    
    for (const [jobId, job] of this.activeImports) {
      if (['completed', 'failed', 'cancelled'].includes(job.status) && 
          job.lastUpdate < cutoff) {
        this.importHistory.push({ jobId, ...job });
        this.activeImports.delete(jobId);
      }
    }
    
    // Limit history size
    if (this.importHistory.length > 100) {
      this.importHistory = this.importHistory.slice(-50);
    }
  }

  /**
   * Get import statistics
   */
  getImportStats() {
    const activeCount = this.activeImports.size;
    const completedToday = this.importHistory.filter(job => 
      job.endTime && (Date.now() - job.endTime) < 24 * 60 * 60 * 1000
    ).length;
    
    return {
      activeImports: activeCount,
      completedToday,
      totalHistoryRecords: this.importHistory.length,
      maxConcurrentImports: this.maxConcurrentImports
    };
  }
}

// Create singleton instance
export const importManager = new ImportManager();

// React hook for import management
export const useImportManager = () => {
  return {
    startImport: (trades, userId, options) => importManager.startOptimizedImport(trades, userId, options),
    getStatus: (jobId) => importManager.getImportStatus(jobId),
    cancelImport: (jobId) => importManager.cancelImport(jobId),
    getUserImports: (userId) => importManager.getUserActiveImports(userId),
    getStats: () => importManager.getImportStats()
  };
};

export default importManager;