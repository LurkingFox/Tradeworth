// Efficient Trade Import System
// Built specifically for the actual data structure from CSV parsers
// Handles large imports with chunking, progress tracking, and error recovery

import { supabase } from '../../supabase';
import { refreshUserMetrics } from './profileMetrics';

/**
 * Efficient Trade Importer Class
 * Designed for the specific trade object format from CSV parsers
 */
class EfficientTradeImporter {
  constructor() {
    this.isImporting = false;
    this.abortController = null;
  }

  /**
   * Transform parsed CSV trade to database format
   * Based on the actual structure from parseCSVFile and parseBrokerCSV
   */
  transformTradeForDB(trade, userId) {
    // Handle European number format parsing
    const parseNumber = (value) => {
      if (typeof value === 'number') return value;
      if (!value || value === '') return 0;
      
      const str = String(value).replace(/\s/g, '');
      // Handle European format: 1.234,56 -> 1234.56
      if (str.includes(',') && str.includes('.')) {
        if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
          return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
        } else {
          return parseFloat(str.replace(/,/g, '')) || 0;
        }
      }
      // Only comma as decimal separator
      else if (str.includes(',') && !str.includes('.')) {
        return parseFloat(str.replace(',', '.')) || 0;
      }
      // Standard parsing
      else {
        return parseFloat(str) || 0;
      }
    };

    // Handle date formats
    const parseDate = (dateStr) => {
      if (!dateStr) return new Date().toISOString().split('T')[0];
      
      // Handle various date formats
      let cleanDate = String(dateStr).trim();
      
      // Convert DD.MM.YYYY or DD/MM/YYYY to YYYY-MM-DD
      if (cleanDate.includes('.') || cleanDate.includes('/')) {
        const separator = cleanDate.includes('.') ? '.' : '/';
        const parts = cleanDate.split(separator);
        if (parts.length === 3) {
          // Assume DD.MM.YYYY format
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          cleanDate = `${year}-${month}-${day}`;
        }
      }
      
      return cleanDate;
    };

    // Handle trade type normalization
    const normalizeType = (type) => {
      if (!type) return 'buy';
      const normalized = String(type).toLowerCase().trim();
      
      // Map common variations to database enum values
      const typeMap = {
        'buy': 'buy',
        'sell': 'sell', 
        'long': 'buy',
        'short': 'sell',
        'b': 'buy',
        's': 'sell',
        '0': 'buy',  // Some brokers use 0/1
        '1': 'sell'
      };
      
      return typeMap[normalized] || 'buy';
    };

    return {
      user_id: userId,
      date: parseDate(trade.date),
      pair: String(trade.pair || trade.symbol || 'UNKNOWN').toUpperCase(),
      type: normalizeType(trade.type),
      entry: parseNumber(trade.entry),
      exit: trade.exit ? parseNumber(trade.exit) : null,
      stop_loss: trade.stopLoss ? parseNumber(trade.stopLoss) : null,
      take_profit: trade.takeProfit ? parseNumber(trade.takeProfit) : null,
      lot_size: parseNumber(trade.lotSize) || 0.01,
      pnl: parseNumber(trade.pnl) || 0,
      status: trade.exit ? 'closed' : 'open',
      notes: String(trade.notes || '').substring(0, 500), // Limit length
      setup: String(trade.setup || '').substring(0, 200), // Limit length
      rr: trade.rr ? parseNumber(trade.rr) : null,
      // Default values for additional fields
      entry_time: null,
      exit_time: null,
      pnl_percentage: 0,
      outcome: parseNumber(trade.pnl) > 0 ? 'win' : parseNumber(trade.pnl) < 0 ? 'loss' : 'breakeven',
      hold_time_minutes: 0,
      slippage_pips: 0,
      commission: parseNumber(trade.commission) || 0,
      emotion_before: null,
      emotion_after: null,
      chart_before: null,
      chart_after: null,
      market_session: null,
      volatility_level: null
    };
  }

  /**
   * Import trades with efficient chunking and progress tracking
   */
  async importTrades(trades, userId, options = {}) {
    const {
      chunkSize = 100, // Smaller, more reliable chunks
      onProgress = null,
      onChunkComplete = null,
      validateData = true
    } = options;

    if (this.isImporting) {
      throw new Error('Import already in progress');
    }

    this.isImporting = true;
    this.abortController = new AbortController();

    try {
      console.log(`🚀 Starting efficient import of ${trades.length} trades`);
      
      // Validate input
      if (!trades || !Array.isArray(trades) || trades.length === 0) {
        throw new Error('No trades provided for import');
      }

      if (!userId) {
        throw new Error('User ID is required for import');
      }

      // Test database connection
      await this.testDatabaseConnection(userId);

      // Transform all trades upfront with validation
      console.log('📝 Transforming trades...');
      const transformedTrades = [];
      const transformErrors = [];

      for (let i = 0; i < trades.length; i++) {
        try {
          const transformed = this.transformTradeForDB(trades[i], userId);
          
          if (validateData) {
            this.validateTransformedTrade(transformed, i);
          }
          
          transformedTrades.push(transformed);
        } catch (error) {
          transformErrors.push({ index: i, trade: trades[i], error: error.message });
          console.warn(`⚠️ Transform error at index ${i}:`, error.message);
        }
      }

      console.log(`✅ Transformed ${transformedTrades.length}/${trades.length} trades successfully`);
      if (transformErrors.length > 0) {
        console.log(`⚠️ ${transformErrors.length} transformation errors`);
      }

      // Process in chunks
      const chunks = this.createChunks(transformedTrades, chunkSize);
      console.log(`📦 Created ${chunks.length} chunks (size: ${chunkSize})`);

      let totalImported = 0;
      let totalFailed = 0;
      const results = [];
      const errors = [];

      // Process each chunk
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        if (this.abortController.signal.aborted) {
          throw new Error('Import cancelled by user');
        }

        const chunk = chunks[chunkIndex];
        console.log(`📊 Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} trades)`);

        try {
          const chunkResult = await this.importChunk(chunk, chunkIndex);
          
          totalImported += chunkResult.imported;
          totalFailed += chunkResult.failed;
          results.push(...chunkResult.data);
          
          if (chunkResult.errors) {
            errors.push(...chunkResult.errors);
          }

          // Progress callback
          if (onProgress) {
            onProgress({
              processed: totalImported + totalFailed,
              total: transformedTrades.length,
              imported: totalImported,
              failed: totalFailed,
              progress: Math.round(((chunkIndex + 1) / chunks.length) * 100),
              currentChunk: chunkIndex + 1,
              totalChunks: chunks.length
            });
          }

          // Chunk complete callback
          if (onChunkComplete) {
            onChunkComplete(chunkResult);
          }

          // Brief pause between chunks to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (chunkError) {
          console.error(`❌ Chunk ${chunkIndex + 1} failed:`, chunkError);
          totalFailed += chunk.length;
          errors.push({
            chunk: chunkIndex + 1,
            error: chunkError.message,
            trades: chunk.length
          });
          
          // Continue with remaining chunks
          continue;
        }
      }

      // Final verification
      const verification = await this.verifyImport(userId, totalImported);
      
      // Refresh user metrics
      if (totalImported > 0) {
        console.log('🔄 Refreshing user metrics...');
        await refreshUserMetrics(userId);
      }

      const finalResult = {
        success: totalImported > 0,
        imported: totalImported,
        failed: totalFailed,
        total: trades.length,
        transformErrors: transformErrors.length,
        errors: errors,
        verification: verification,
        duration: Date.now() - Date.now() // Will be set by caller
      };

      console.log('🎉 Import completed:', finalResult);
      return finalResult;

    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    } finally {
      this.isImporting = false;
      this.abortController = null;
    }
  }

  /**
   * Import a single chunk of transformed trades
   */
  async importChunk(chunk) {
    const { data, error } = await supabase
      .from('trades')
      .insert(chunk)
      .select('id');

    if (error) {
      // Handle specific error types
      if (error.code === '23505') {
        console.warn('⚠️ Duplicate key violation in chunk, some trades may already exist');
        return { imported: 0, failed: chunk.length, data: [], errors: [error] };
      } else if (error.code === '22003') {
        console.warn('⚠️ Numeric value out of range in chunk');
        return { imported: 0, failed: chunk.length, data: [], errors: [error] };
      } else if (error.code === '22P02') {
        console.warn('⚠️ Invalid enum value in chunk');
        return { imported: 0, failed: chunk.length, data: [], errors: [error] };
      }
      
      throw error;
    }

    return {
      imported: data?.length || 0,
      failed: chunk.length - (data?.length || 0),
      data: data || [],
      errors: []
    };
  }

  /**
   * Test database connection and permissions
   */
  async testDatabaseConnection(userId) {
    console.log('🔌 Testing database connection...');
    
    const { data, error } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found", which is fine
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('✅ Database connection verified');
  }

  /**
   * Validate transformed trade data
   */
  validateTransformedTrade(trade, index) {
    if (!trade.user_id) throw new Error('Missing user_id');
    if (!trade.date) throw new Error('Missing date');
    if (!trade.pair || trade.pair === 'UNKNOWN') throw new Error('Missing or invalid pair');
    if (!trade.entry || trade.entry <= 0) throw new Error('Missing or invalid entry price');
    if (!trade.lot_size || trade.lot_size <= 0) throw new Error('Missing or invalid lot size');
    if (!['buy', 'sell'].includes(trade.type)) throw new Error(`Invalid type: ${trade.type}`);
  }

  /**
   * Create chunks from array
   */
  createChunks(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Verify import results
   */
  async verifyImport(userId, expectedCount) {
    console.log(`🔍 Verifying import (expected: ${expectedCount})...`);
    
    const { data, error } = await supabase
      .from('trades')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (error) {
      console.warn('⚠️ Could not verify import:', error.message);
      return { verified: false, error: error.message };
    }

    const actualCount = data?.length || 0;
    const verified = actualCount >= expectedCount;

    console.log(`📊 Verification: ${actualCount} trades in database (expected: ${expectedCount})`);
    
    return {
      verified,
      actualCount,
      expectedCount,
      difference: actualCount - expectedCount
    };
  }

  /**
   * Cancel ongoing import
   */
  cancelImport() {
    if (this.abortController) {
      this.abortController.abort();
      console.log('🛑 Import cancelled by user');
    }
  }
}

// Export singleton instance
export const efficientImporter = new EfficientTradeImporter();

// Export class for testing
export { EfficientTradeImporter };