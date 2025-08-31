-- ================================================================
-- ADD MISSING COLUMNS TO EXISTING TRADES TABLE
-- ================================================================
-- 
-- This adds the missing columns that your import code expects
-- but don't exist in your current database schema
--
-- Run this in your Supabase SQL Editor
-- ================================================================

-- Add the missing columns that the import code expects
ALTER TABLE trades ADD COLUMN IF NOT EXISTS broker_trade_id VARCHAR(200);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS import_batch_id UUID;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for broker_trade_id (for better performance and uniqueness)
CREATE INDEX IF NOT EXISTS idx_trades_broker_trade_id ON trades(broker_trade_id);

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ Missing columns added successfully!';
    RAISE NOTICE 'Your database now has the columns that the import code expects:';
    RAISE NOTICE '  - broker_trade_id (VARCHAR 200)';
    RAISE NOTICE '  - import_batch_id (UUID)'; 
    RAISE NOTICE '  - imported_at (TIMESTAMP)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Try importing your trades again - the PGRST204 error should be fixed!';
END $$;