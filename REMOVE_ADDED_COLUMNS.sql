-- ================================================================
-- REMOVE ADDED COLUMNS TO RESTORE WORKING STATE
-- ================================================================
-- 
-- This removes the columns we added that caused the complexity
-- and restores your database to its original working state
--
-- Run this in your Supabase SQL Editor
-- ================================================================

-- Remove the columns we added that caused issues
ALTER TABLE trades DROP COLUMN IF EXISTS broker_trade_id;
ALTER TABLE trades DROP COLUMN IF EXISTS import_batch_id;  
ALTER TABLE trades DROP COLUMN IF EXISTS imported_at;

-- Remove the index we created
DROP INDEX IF EXISTS idx_trades_broker_trade_id;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ Reverted database to original working state!';
    RAISE NOTICE 'Removed columns:';
    RAISE NOTICE '  - broker_trade_id';
    RAISE NOTICE '  - import_batch_id'; 
    RAISE NOTICE '  - imported_at';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Database is now back to its original schema';
    RAISE NOTICE '📊 Your 2712 existing trades should still be intact';
END $$;