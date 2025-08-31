// ================================================================
// DEBUG IMPORT ANALYZER
// ================================================================
// 
// Copy this code into your browser's console before importing
// to analyze your trade data and identify potential issues
//
// ================================================================

window.debugImportAnalyzer = {
  
  // Analyze trades before import
  analyzeTrades: function(trades) {
    console.log('=== IMPORT DEBUG ANALYZER ===');
    console.log(`Total trades to analyze: ${trades.length}`);
    
    // Check required fields
    const missingFields = trades.filter(t => !t.pair || !t.date || !t.entry || !t.lotSize);
    console.log(`Trades missing required fields: ${missingFields.length}`);
    if (missingFields.length > 0) {
      console.log('Sample missing fields:', missingFields.slice(0, 3).map(t => ({
        pair: t.pair,
        date: t.date, 
        entry: t.entry,
        lotSize: t.lotSize
      })));
    }
    
    // Check for potential duplicates
    const hashes = new Set();
    let duplicates = 0;
    trades.forEach(trade => {
      const hashString = `${trade.date}_${trade.pair}_${trade.type}_${trade.entry}_${trade.lotSize}_${trade.exit || 'open'}`;
      if (hashes.has(hashString)) {
        duplicates++;
      } else {
        hashes.add(hashString);
      }
    });
    
    console.log(`Potential duplicates found: ${duplicates}`);
    console.log(`Unique trades after deduplication: ${trades.length - duplicates}`);
    
    // Analyze data quality
    const pairs = [...new Set(trades.map(t => t.pair))];
    const dates = [...new Set(trades.map(t => t.date))].sort();
    
    console.log(`Unique pairs: ${pairs.length} (${pairs.slice(0, 5).join(', ')}...)`);
    console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
    
    // Check for unusual values
    const unusualEntries = trades.filter(t => !t.entry || isNaN(parseFloat(t.entry)));
    const unusualLotSizes = trades.filter(t => !t.lotSize || isNaN(parseFloat(t.lotSize)));
    
    console.log(`Trades with unusual entry prices: ${unusualEntries.length}`);
    console.log(`Trades with unusual lot sizes: ${unusualLotSizes.length}`);
    
    if (unusualEntries.length > 0) {
      console.log('Sample unusual entries:', unusualEntries.slice(0, 3));
    }
    
    console.log('=== ANALYSIS COMPLETE ===');
    
    return {
      total: trades.length,
      missingFields: missingFields.length,
      duplicates: duplicates,
      uniqueAfterDedup: trades.length - duplicates,
      unusualEntries: unusualEntries.length,
      unusualLotSizes: unusualLotSizes.length
    };
  },
  
  // Test duplicate detection algorithm
  testDuplicateDetection: function(trades, sampleSize = 100) {
    console.log('=== TESTING DUPLICATE DETECTION ===');
    
    const sample = trades.slice(0, sampleSize);
    const hashes = new Map();
    
    sample.forEach((trade, index) => {
      const hashString = `${trade.date}_${trade.pair}_${trade.type}_${trade.entry}_${trade.lotSize}_${trade.exit || 'open'}`;
      
      if (hashes.has(hashString)) {
        console.log(`Duplicate detected at index ${index}:`, {
          original: hashes.get(hashString),
          duplicate: { pair: trade.pair, date: trade.date, entry: trade.entry },
          hashString
        });
      } else {
        hashes.set(hashString, { pair: trade.pair, date: trade.date, entry: trade.entry, index });
      }
    });
    
    console.log(`Tested ${sample.length} trades for duplicates`);
    console.log('=== DUPLICATE TEST COMPLETE ===');
  }
};

console.log('📊 Debug Import Analyzer loaded!');
console.log('Usage:');
console.log('- window.debugImportAnalyzer.analyzeTrades(yourTradesArray)');
console.log('- window.debugImportAnalyzer.testDuplicateDetection(yourTradesArray)');