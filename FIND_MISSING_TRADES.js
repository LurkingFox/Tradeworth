// ================================================================
// MISSING TRADES FINDER
// ================================================================
// 
// This script helps identify which trades from your import file
// are missing from the database
//
// Run this in your browser console while on your trading journal app
// ================================================================

window.findMissingTrades = async function() {
  console.log('🔍 Starting missing trades analysis...');
  
  try {
    // Step 1: Get all trades currently in database
    console.log('📊 Fetching all trades from database...');
    const { data: dbTrades, error: dbError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user.id);
    
    if (dbError) {
      console.error('❌ Failed to fetch database trades:', dbError);
      return;
    }
    
    console.log(`✅ Found ${dbTrades.length} trades in database`);
    
    // Step 2: Get trades from your app's data manager
    const appTrades = window.dataManager?.getAllTrades() || [];
    console.log(`✅ Found ${appTrades.length} trades in app memory`);
    
    if (appTrades.length === 0) {
      console.log('⚠️ No trades found in app memory. Make sure your trades are loaded.');
      return;
    }
    
    // Step 3: Create hash function for comparison (same as import code)
    function createTradeHash(trade) {
      const date = trade.date || '';
      const pair = trade.pair || '';
      const type = trade.type || '';
      const entry = trade.entry || '';
      const lotSize = trade.lotSize || trade.lot_size || '';
      const exit = trade.exit || 'open';
      
      const hashString = `${date}_${pair}_${type}_${entry}_${lotSize}_${exit}`;
      let hash = 0;
      for (let i = 0; i < hashString.length; i++) {
        const char = hashString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    }
    
    // Step 4: Create hash sets for comparison
    console.log('🔄 Creating hash sets for comparison...');
    
    const dbTradeHashes = new Set();
    const dbTradesByHash = new Map();
    
    dbTrades.forEach(trade => {
      const hash = createTradeHash(trade);
      dbTradeHashes.add(hash);
      dbTradesByHash.set(hash, trade);
    });
    
    const appTradeHashes = new Set();
    const appTradesByHash = new Map();
    
    appTrades.forEach(trade => {
      const hash = createTradeHash(trade);
      appTradeHashes.add(hash);
      appTradesByHash.set(hash, trade);
    });
    
    // Step 5: Find missing trades
    const missingTrades = [];
    const duplicateDbTrades = [];
    
    console.log('🔍 Analyzing trade differences...');
    
    appTrades.forEach(trade => {
      const hash = createTradeHash(trade);
      if (!dbTradeHashes.has(hash)) {
        missingTrades.push({
          hash: hash,
          trade: trade,
          reason: 'not_in_database'
        });
      }
    });
    
    // Also check for trades that might be in DB but not in app
    dbTrades.forEach(trade => {
      const hash = createTradeHash(trade);
      if (!appTradeHashes.has(hash)) {
        duplicateDbTrades.push({
          hash: hash,
          trade: trade,
          reason: 'in_db_not_in_app'
        });
      }
    });
    
    // Step 6: Results summary
    console.log('');
    console.log('📊 MISSING TRADES ANALYSIS RESULTS');
    console.log('=====================================');
    console.log(`Total trades in app: ${appTrades.length}`);
    console.log(`Total trades in database: ${dbTrades.length}`);
    console.log(`Missing from database: ${missingTrades.length}`);
    console.log(`In database but not in app: ${duplicateDbTrades.length}`);
    console.log('');
    
    if (missingTrades.length > 0) {
      console.log('❌ MISSING TRADES (first 10):');
      missingTrades.slice(0, 10).forEach((missing, idx) => {
        const t = missing.trade;
        console.log(`${idx + 1}. ${t.date} ${t.pair} ${t.type} ${t.entry} (lot: ${t.lotSize || t.lot_size})`);
      });
      console.log('');
      
      // Group missing trades by potential reasons
      const missingByDate = {};
      missingTrades.forEach(missing => {
        const date = missing.trade.date || 'unknown';
        missingByDate[date] = (missingByDate[date] || 0) + 1;
      });
      
      console.log('📅 Missing trades by date (top 10):');
      Object.entries(missingByDate)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([date, count]) => {
          console.log(`${date}: ${count} trades`);
        });
      
      // Store missing trades globally for import
      window.missingTradesForImport = missingTrades.map(m => m.trade);
      console.log('');
      console.log('✅ Missing trades stored in window.missingTradesForImport');
      console.log('✅ You can now run window.importMissingTrades() to import them');
    } else {
      console.log('🎉 All trades are in the database! No missing trades found.');
    }
    
    if (duplicateDbTrades.length > 0) {
      console.log('');
      console.log('⚠️ TRADES IN DATABASE BUT NOT IN APP:');
      console.log('(These might be from previous import attempts)');
      duplicateDbTrades.slice(0, 5).forEach((extra, idx) => {
        const t = extra.trade;
        console.log(`${idx + 1}. ${t.date} ${t.pair} ${t.type} ${t.entry}`);
      });
    }
    
    return {
      appTradesCount: appTrades.length,
      dbTradesCount: dbTrades.length,
      missingCount: missingTrades.length,
      missingTrades: missingTrades,
      extraDbTrades: duplicateDbTrades
    };
    
  } catch (error) {
    console.error('❌ Error analyzing missing trades:', error);
  }
};

window.importMissingTrades = async function() {
  if (!window.missingTradesForImport || window.missingTradesForImport.length === 0) {
    console.log('❌ No missing trades found. Run window.findMissingTrades() first.');
    return;
  }
  
  console.log(`🚀 Starting import of ${window.missingTradesForImport.length} missing trades...`);
  
  try {
    // Use the app's existing import system
    if (window.importManager && window.importManager.startOptimizedImport) {
      const userId = (await supabase.auth.getUser()).data.user.id;
      
      const result = await window.importManager.startOptimizedImport(
        window.missingTradesForImport,
        userId,
        {
          chunkSize: 200,
          skipDuplicates: false, // We already identified these as missing
          enableBackgroundProcessing: true,
          progressCallback: (progress) => {
            console.log(`Import progress: ${Math.round(progress.progress || 0)}% (${progress.processed}/${progress.total})`);
          }
        }
      );
      
      console.log('Import result:', result);
      
      if (result.success) {
        console.log(`✅ Successfully imported ${result.imported} missing trades!`);
        console.log('🔄 Reloading app to see all trades...');
        
        // Reload the page to refresh everything
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        console.error(`❌ Import failed: ${result.error}`);
      }
      
    } else {
      console.error('❌ Import system not available. Make sure the app is fully loaded.');
    }
    
  } catch (error) {
    console.error('❌ Error importing missing trades:', error);
  }
};

console.log('🔍 Missing Trades Finder loaded!');
console.log('');
console.log('📋 Available commands:');
console.log('  • window.findMissingTrades() - Find which trades are missing from database');
console.log('  • window.importMissingTrades() - Import the missing trades');
console.log('');
console.log('🚀 Run: window.findMissingTrades()');