-- ================================================================
-- TEST DATABASE INSERT FUNCTIONALITY
-- ================================================================
-- 
-- This tests if we can insert a simple trade to diagnose the issue
--
-- Run this in your Supabase SQL Editor
-- ================================================================

-- First, let's see what the current trades table structure looks like
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 CURRENT TRADES TABLE STRUCTURE:';
    RAISE NOTICE '';
    
    FOR rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'trades' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  • %: % (nullable: %, default: %)', 
            rec.column_name, 
            rec.data_type, 
            rec.is_nullable, 
            COALESCE(rec.column_default, 'none');
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- Test if we can insert a simple trade manually
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the first user_id from auth.users or create a test UUID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        test_user_id := '00000000-0000-0000-0000-000000000001';
        RAISE NOTICE '⚠️ No users found, using test UUID: %', test_user_id;
    ELSE
        RAISE NOTICE '✅ Using existing user: %', test_user_id;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTING MANUAL TRADE INSERT...';
    
    -- Try to insert a minimal test trade
    BEGIN
        INSERT INTO trades (
            user_id, 
            date, 
            pair, 
            type,
            entry, 
            lot_size, 
            pnl,
            status,
            notes,
            setup
        ) VALUES (
            test_user_id,
            CURRENT_DATE,
            'EURUSD',
            'buy',
            1.0500,
            0.10,
            0.00,
            'open',
            'Test trade',
            'Test setup'
        );
        
        RAISE NOTICE '✅ Manual insert successful!';
        
        -- Clean up the test trade
        DELETE FROM trades WHERE notes = 'Test trade' AND user_id = test_user_id;
        RAISE NOTICE '✅ Test trade cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Manual insert failed: %', SQLERRM;
        RAISE NOTICE '❌ Error code: %', SQLSTATE;
    END;
    
    RAISE NOTICE '';
END $$;

-- Check current trade count
DO $$
DECLARE
    total_trades INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_trades FROM trades;
    RAISE NOTICE '📊 Current total trades in database: %', total_trades;
END $$;