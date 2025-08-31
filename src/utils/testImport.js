// Test import functionality with a single trade
import { supabase } from '../supabase.js';

const testSingleTradeImport = async () => {
  try {
    console.log('🧪 Testing single trade import...');
    
    // Get a user ID from auth (or use a test one)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000001';
    
    console.log('Using user ID:', userId);
    
    // Create a simple test trade
    const testTrade = {
      user_id: userId,
      date: new Date().toISOString().split('T')[0], // Today's date
      pair: 'EURUSD',
      type: 'buy', // Valid enum value
      entry: 1.0500,
      exit: null,
      stop_loss: null,
      take_profit: null,
      lot_size: 0.10,
      pnl: 0,
      status: 'open',
      notes: 'Test import trade',
      setup: 'Test setup',
      rr: null,
      entry_time: null,
      exit_time: null,
      pnl_percentage: 0,
      outcome: 'breakeven',
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
    
    console.log('Test trade data:', testTrade);
    
    // Try the insert
    const { data, error } = await supabase
      .from('trades')
      .insert([testTrade])
      .select();
    
    if (error) {
      console.error('❌ Import test failed:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.error('❌ Insert returned no data (possible RLS issue)');
      return false;
    }
    
    console.log('✅ Import test successful!');
    console.log('Inserted trade:', data[0]);
    
    // Clean up test trade
    await supabase
      .from('trades')
      .delete()
      .eq('id', data[0].id);
    
    console.log('✅ Test trade cleaned up');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return false;
  }
};

// Export for use
export { testSingleTradeImport };

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSingleTradeImport();
}