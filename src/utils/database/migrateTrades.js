import { supabase } from '../../supabase';
import { refreshUserMetrics } from './profileMetrics';

// Check if user already has trades in database
export const checkExistingTrades = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
      
    if (error) throw error;
    
    return { success: true, hasExistingTrades: data.length > 0, count: data.length };
    
  } catch (error) {
    console.error('Failed to check existing trades:', error);
    return { success: false, error: error.message };
  }
};

export const migrateLocalTradesToDatabase = async (localTrades, userId, skipDuplicateCheck = false) => {
  try {
    console.log('Starting migration of', localTrades.length, 'trades to database');
    
    // Only check for existing trades if not explicitly skipping (for imports)
    if (!skipDuplicateCheck) {
      const existingCheck = await checkExistingTrades(userId);
      if (existingCheck.success && existingCheck.hasExistingTrades) {
        return { 
          success: false, 
          error: 'User already has trades in database. Migration cancelled to prevent duplicates.' 
        };
      }
    }
    
    // Helper function for European number parsing
    const parseEuropeanNumber = (numStr) => {
      if (!numStr || numStr === '') return 0;
      const str = String(numStr).replace(/\s/g, '');
      
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

    // Transform local trades to match database schema
    const transformedTrades = localTrades.map(trade => ({
      user_id: userId,
      date: trade.date,
      pair: trade.pair,
      type: trade.type,
      entry: parseEuropeanNumber(trade.entry),
      exit: trade.exit ? parseEuropeanNumber(trade.exit) : null,
      stop_loss: trade.stopLoss ? parseEuropeanNumber(trade.stopLoss) : null,
      take_profit: trade.takeProfit ? parseEuropeanNumber(trade.takeProfit) : null,
      lot_size: parseEuropeanNumber(trade.lotSize),
      pnl: (trade.isImported || typeof trade.pnl === 'number') ? trade.pnl : parseEuropeanNumber(trade.pnl) || 0,
      status: trade.status,
      notes: trade.notes || '',
      setup: trade.setup || '',
      rr: trade.rr ? parseFloat(trade.rr) : null,
      // Add default values for new fields
      entry_time: null,
      exit_time: null,
      pnl_percentage: 0,
      outcome: trade.pnl > 0 ? 'win' : trade.pnl < 0 ? 'loss' : 'breakeven',
      hold_time_minutes: 0,
      slippage_pips: 0,
      commission: 0,
      emotion_before: null,
      emotion_after: null,
      chart_before: null,
      chart_after: null,
      market_session: null,
      volatility_level: null
    }));

    // Insert trades in batches to avoid timeout
    const batchSize = 50;
    const results = [];
    
    for (let i = 0; i < transformedTrades.length; i += batchSize) {
      const batch = transformedTrades.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('trades')
        .insert(batch)
        .select();
        
      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }
      
      results.push(...data);
      console.log(`Migrated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transformedTrades.length/batchSize)}`);
    }

    console.log('Successfully migrated', results.length, 'trades');
    
    // Refresh user metrics after migration
    await refreshUserMetrics(userId);
    
    return { success: true, count: results.length };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
};


export const loadTradesFromDatabase = async (userId) => {
  try {
    console.log('🔍 Loading trades from database for user:', userId);
    
    // Try multiple approaches to get all trades
    console.log('🔧 Attempting to load ALL trades with multiple strategies...');
    
    // First, let's check the total count in database
    const { count: totalCount, error: countError } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (countError) {
      console.log('⚠️ Could not get count:', countError);
    } else {
      console.log(`📊 Total trades in database for user: ${totalCount}`);
    }
    
    // Strategy 1: Use range() instead of limit() to bypass PostgREST limits
    let { data, error } = await supabase
      .from('trades')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(0, 50000); // Range-based pagination instead of limit
      
    // Check if we got all the trades we expected
    const expectedCount = totalCount || 10000; // Use total count or high default
    const receivedCount = data?.length || 0;
    
    console.log(`📊 Expected: ${expectedCount}, Received: ${receivedCount}`);
    
    if (error || receivedCount < expectedCount) {
      if (error) {
        console.log('❌ Range strategy failed, trying pagination approach:', error);
      } else {
        console.log(`❌ Range strategy returned only ${receivedCount}/${expectedCount} trades, trying pagination...`);
      }
      
      // Strategy 2: Pagination approach to load all trades
      console.log('🔄 Using pagination to load all trades...');
      const allTrades = [];
      let pageSize = 1000;
      let page = 0;
      let hasMore = true;
      
      while (hasMore && page < 50) { // Safety limit of 50 pages
        console.log(`📄 Loading page ${page + 1}...`);
        const { data: pageData, error: pageError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
          
        if (pageError) {
          console.log(`❌ Page ${page + 1} failed:`, pageError);
          break;
        }
        
        if (pageData && pageData.length > 0) {
          allTrades.push(...pageData);
          console.log(`✅ Loaded page ${page + 1}: ${pageData.length} trades (total: ${allTrades.length})`);
          hasMore = pageData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      if (allTrades.length > 0) {
        data = allTrades;
        error = null;
        console.log(`🎉 Pagination successful: ${allTrades.length} trades loaded total`);
      }
    }
    
    console.log(`🎯 Database query result: ${data?.length || 0} trades returned`);
      
    if (error) throw error;
    
    console.log(`✅ Loaded ${data?.length || 0} trades from database`);
    console.log(`🔍 TRACE: Raw database data length: ${data?.length || 0}`);
    console.log(`🔍 TRACE: First 3 trade IDs:`, data?.slice(0, 3)?.map(t => t.id) || []);
    console.log(`🔍 TRACE: Last 3 trade IDs:`, data?.slice(-3)?.map(t => t.id) || []);
    
    // Store debug info in localStorage for monitoring
    const debugInfo = {
      timestamp: new Date().toISOString(),
      event: 'loadTradesFromDatabase',
      userId: userId,
      dataLength: data?.length || 0,
      success: true
    };
    try {
      localStorage.setItem('tradejournal_debug_latest', JSON.stringify(debugInfo));
      const existingLogs = JSON.parse(localStorage.getItem('tradejournal_debug_log') || '[]');
      existingLogs.push(debugInfo);
      // Keep only last 50 debug entries
      if (existingLogs.length > 50) existingLogs.splice(0, existingLogs.length - 50);
      localStorage.setItem('tradejournal_debug_log', JSON.stringify(existingLogs));
    } catch (e) {}
    
    // Log sample of data
    if (data && data.length > 0) {
      console.log('First trade:', {
        id: data[0].id,
        date: data[0].date,
        pair: data[0].pair,
        pnl: data[0].pnl
      });
      console.log('Last trade:', {
        id: data[data.length - 1].id,
        date: data[data.length - 1].date,
        pair: data[data.length - 1].pair,
        pnl: data[data.length - 1].pnl
      });
    }
    
    // Transform database trades back to local format
    console.log(`🔍 TRACE: About to transform ${data.length} trades to local format`);
    const transformedTrades = data.map(trade => ({
      id: trade.id,
      date: trade.date,
      pair: trade.pair,
      type: trade.type,
      entry: trade.entry,
      exit: trade.exit,
      stopLoss: trade.stop_loss,
      takeProfit: trade.take_profit,
      lotSize: trade.lot_size,
      pnl: trade.pnl,
      status: trade.status,
      notes: trade.notes,
      setup: trade.setup,
      rr: trade.rr
    }));
    
    console.log(`🔍 TRACE: Returning ${transformedTrades.length} transformed trades to caller`);
    return { success: true, trades: transformedTrades };
    
  } catch (error) {
    console.error('Failed to load trades from database:', error);
    return { success: false, error: error.message };
  }
};

// Single trade operations
export const addTradeToDatabase = async (trade, userId) => {
  try {
    console.log('Attempting to save trade to database:', trade);
    console.log('User ID:', userId);
    
    // Validate required fields
    if (!trade.date || !trade.pair || !trade.type || !trade.entry || !trade.lotSize) {
      throw new Error(`Missing required fields: date=${trade.date}, pair=${trade.pair}, type=${trade.type}, entry=${trade.entry}, lotSize=${trade.lotSize}`);
    }

    // Helper function for European number parsing
    const parseEuropeanNumber = (numStr) => {
      if (!numStr || numStr === '') return 0;
      const str = String(numStr).replace(/\s/g, '');
      
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

    const transformedTrade = {
      user_id: userId,
      date: trade.date,
      pair: trade.pair,
      type: trade.type,
      entry: parseEuropeanNumber(trade.entry),
      exit: trade.exit ? parseEuropeanNumber(trade.exit) : null,
      stop_loss: trade.stopLoss ? parseEuropeanNumber(trade.stopLoss) : null,
      take_profit: trade.takeProfit ? parseEuropeanNumber(trade.takeProfit) : null,
      lot_size: parseEuropeanNumber(trade.lotSize),
      pnl: (trade.isImported || typeof trade.pnl === 'number') ? trade.pnl : parseEuropeanNumber(trade.pnl) || 0,
      status: trade.status || 'open',
      notes: trade.notes || '',
      setup: trade.setup || '',
      rr: trade.rr ? parseFloat(trade.rr) : null,
      entry_time: null,
      exit_time: null,
      pnl_percentage: 0,
      outcome: trade.pnl > 0 ? 'win' : trade.pnl < 0 ? 'loss' : 'breakeven',
      hold_time_minutes: 0,
      slippage_pips: 0,
      commission: 0,
      emotion_before: null,
      emotion_after: null,
      chart_before: null,
      chart_after: null,
      market_session: null,
      volatility_level: null
    };

    console.log('Transformed trade for database:', transformedTrade);

    const { data, error } = await supabase
      .from('trades')
      .insert([transformedTrade])
      .select()
      .single();
      
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    console.log('Successfully inserted trade into database:', data);
    
    // Transform back to local format
    const localTrade = {
      id: data.id,
      date: data.date,
      pair: data.pair,
      type: data.type,
      entry: data.entry,
      exit: data.exit,
      stopLoss: data.stop_loss,
      takeProfit: data.take_profit,
      lotSize: data.lot_size,
      pnl: data.pnl,
      status: data.status,
      notes: data.notes,
      setup: data.setup,
      rr: data.rr
    };

    console.log('Returning local format trade:', localTrade);
    
    // Refresh user metrics after adding trade
    await refreshUserMetrics(userId);
    
    return { success: true, trade: localTrade };
    
  } catch (error) {
    console.error('Failed to add trade to database:', error);
    return { success: false, error: error.message };
  }
};

export const updateTradeInDatabase = async (trade, userId) => {
  try {
    // Helper function for European number parsing
    const parseEuropeanNumber = (numStr) => {
      if (!numStr || numStr === '') return 0;
      const str = String(numStr).replace(/\s/g, '');
      
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

    const transformedTrade = {
      user_id: userId,
      date: trade.date,
      pair: trade.pair,
      type: trade.type,
      entry: parseEuropeanNumber(trade.entry),
      exit: trade.exit ? parseEuropeanNumber(trade.exit) : null,
      stop_loss: trade.stopLoss ? parseEuropeanNumber(trade.stopLoss) : null,
      take_profit: trade.takeProfit ? parseEuropeanNumber(trade.takeProfit) : null,
      lot_size: parseEuropeanNumber(trade.lotSize),
      pnl: (trade.isImported || typeof trade.pnl === 'number') ? trade.pnl : parseEuropeanNumber(trade.pnl) || 0,
      status: trade.status,
      notes: trade.notes || '',
      setup: trade.setup || '',
      rr: trade.rr ? parseFloat(trade.rr) : null,
      outcome: trade.pnl > 0 ? 'win' : trade.pnl < 0 ? 'loss' : 'breakeven'
    };

    const { data, error } = await supabase
      .from('trades')
      .update(transformedTrade)
      .eq('id', trade.id)
      .eq('user_id', userId)
      .select()
      .single();
      
    if (error) throw error;
    
    // Refresh user metrics after updating trade
    await refreshUserMetrics(userId);
    
    return { success: true, trade: data };
    
  } catch (error) {
    console.error('Failed to update trade in database:', error);
    return { success: false, error: error.message };
  }
};

export const deleteTradeFromDatabase = async (tradeId, userId) => {
  try {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', tradeId)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Refresh user metrics after deleting trade
    await refreshUserMetrics(userId);
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to delete trade from database:', error);
    return { success: false, error: error.message };
  }
};

// Batch delete multiple trades for better performance
export const batchDeleteTrades = async (tradeIds, userId) => {
  try {
    console.log(`Batch deleting ${tradeIds.length} trades for user:`, userId);
    console.log('Trade IDs:', tradeIds);
    console.log('User ID:', userId);
    
    // Validate inputs
    if (!tradeIds || tradeIds.length === 0) {
      return { success: false, error: 'No trade IDs provided', deletedCount: 0 };
    }
    
    if (!userId) {
      return { success: false, error: 'No user ID provided', deletedCount: 0 };
    }
    
    // Ensure trade IDs are properly formatted strings
    const cleanTradeIds = tradeIds.filter(id => id && typeof id === 'string' && id.trim() !== '');
    console.log('Clean trade IDs for batch delete:', cleanTradeIds);
    
    if (cleanTradeIds.length === 0) {
      return { success: false, error: 'No valid trade IDs after cleaning', deletedCount: 0 };
    }
    
    // Try batch delete first - use different approach for large arrays
    let data, error;
    
    if (cleanTradeIds.length > 100) {
      // For large arrays, break into smaller chunks
      console.log(`Large deletion (${cleanTradeIds.length} trades), using chunked approach...`);
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < cleanTradeIds.length; i += chunkSize) {
        chunks.push(cleanTradeIds.slice(i, i + chunkSize));
      }
      
      const allDeletedIds = [];
      let totalError = null;
      
      for (const chunk of chunks) {
        const { data: chunkData, error: chunkError } = await supabase
          .from('trades')
          .delete()
          .in('id', chunk)
          .eq('user_id', userId)
          .select('id');
          
        if (chunkError) {
          totalError = chunkError;
          break;
        } else if (chunkData) {
          allDeletedIds.push(...chunkData);
        }
      }
      
      data = allDeletedIds;
      error = totalError;
    } else {
      // For smaller arrays, use direct batch delete
      const result = await supabase
        .from('trades')
        .delete()
        .in('id', cleanTradeIds)
        .eq('user_id', userId)
        .select('id');
        
      data = result.data;
      error = result.error;
    }
      
    if (error) {
      console.error('Batch delete error details:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // If batch delete fails, try individual deletions as fallback
      console.log('Batch delete failed, trying individual deletions as fallback...');
      let deletedCount = 0;
      const deletedIds = [];
      
      for (const tradeId of tradeIds) {
        try {
          const { data: singleData, error: singleError } = await supabase
            .from('trades')
            .delete()
            .eq('id', tradeId)
            .eq('user_id', userId)
            .select('id');
            
          if (!singleError && singleData && singleData.length > 0) {
            deletedCount++;
            deletedIds.push(singleData[0].id);
          }
        } catch (singleErr) {
          console.error(`Failed to delete individual trade ${tradeId}:`, singleErr);
        }
      }
      
      if (deletedCount > 0) {
        await refreshUserMetrics(userId);
        return { 
          success: true, 
          deletedCount,
          deletedIds,
          fallback: true 
        };
      }
      
      throw error; // Re-throw original error if fallback also fails
    }
    
    const deletedCount = data ? data.length : 0;
    console.log(`Successfully batch deleted ${deletedCount} trades`);
    
    // Refresh user metrics after batch deletion
    await refreshUserMetrics(userId);
    
    return { 
      success: true, 
      deletedCount,
      deletedIds: data?.map(row => row.id) || []
    };
    
  } catch (error) {
    console.error('Failed to batch delete trades from database:', error);
    return { success: false, error: error.message, deletedCount: 0 };
  }
};

// Emergency function to delete ALL trades for a user (use with caution!)
export const deleteAllUserTrades = async (userId) => {
  try {
    console.log('WARNING: Deleting ALL trades for user:', userId);
    
    const { data, error } = await supabase
      .from('trades')
      .delete()
      .eq('user_id', userId)
      .select();
      
    if (error) throw error;
    
    console.log('Deleted', data.length, 'trades');
    
    // Refresh user metrics after bulk delete
    await refreshUserMetrics(userId);
    
    return { success: true, deletedCount: data.length };
    
  } catch (error) {
    console.error('Failed to delete user trades:', error);
    return { success: false, error: error.message };
  }
};