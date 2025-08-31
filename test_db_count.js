// Test database query directly
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read supabase config  
let supabaseUrl, supabaseKey;
try {
  const apiConfig = fs.readFileSync('./src/apiConfig.js', 'utf8');
  const urlMatch = apiConfig.match(/supabaseUrl:\s*['"]([^'"]+)['"]/);
  const keyMatch = apiConfig.match(/supabaseAnonKey:\s*['"]([^'"]+)['"]/);
  if (urlMatch && keyMatch) {
    supabaseUrl = urlMatch[1];
    supabaseKey = keyMatch[1];
  }
} catch(e) {
  console.log('Could not read API config:', e.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTradeCount() {
  try {
    // Get count with exact count
    const { data, error, count } = await supabase
      .from('trades')
      .select('id', { count: 'exact' })
      .limit(5000);
      
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log('✅ Database query results:');
    console.log('   Count (exact):', count);
    console.log('   Data rows returned:', data?.length || 0);
    
  } catch (err) {
    console.log('❌ Query failed:', err.message);
  }
}

checkTradeCount().then(() => process.exit(0));