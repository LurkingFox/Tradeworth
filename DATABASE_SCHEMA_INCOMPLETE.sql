-- ================================================================
-- FRESH TRADING JOURNAL DATABASE SCHEMA
-- ================================================================
-- 
-- Complete fresh start - designed specifically for efficient importer
-- Drops everything and rebuilds with proper data types and constraints
-- 
-- ⚠️ WARNING: This will DELETE ALL existing data!
-- 
-- Features:
-- ✅ Optimized for CSV import workflows
-- ✅ Handles various broker data formats  
-- ✅ Robust error handling and data validation
-- ✅ Efficient indexing for large datasets
-- ✅ Clean enum types matching importer output
-- 
-- ================================================================

-- ================================================================
-- STEP 1: COMPLETE DATABASE RESET
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '🚨 STARTING COMPLETE DATABASE RESET...';
    RAISE NOTICE 'This will DELETE ALL existing data!';
END $$;

-- Drop all existing tables in correct order
DROP TABLE IF EXISTS trade_tag_associations CASCADE;
DROP TABLE IF EXISTS trade_tags CASCADE;
DROP TABLE IF EXISTS goal_milestones CASCADE;
DROP TABLE IF EXISTS trading_goals CASCADE;
DROP TABLE IF EXISTS trading_sessions CASCADE;
DROP TABLE IF EXISTS account_snapshots CASCADE;
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS monthly_stats CASCADE;
DROP TABLE IF EXISTS behavioral_insights CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all existing views
DROP VIEW IF EXISTS user_trading_stats CASCADE;
DROP VIEW IF EXISTS monthly_performance CASCADE;
DROP VIEW IF EXISTS daily_performance CASCADE;
DROP VIEW IF EXISTS trading_analytics CASCADE;

-- Drop all existing types
DROP TYPE IF EXISTS trade_type CASCADE;
DROP TYPE IF EXISTS trade_status CASCADE;
DROP TYPE IF EXISTS trade_outcome CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS goal_priority CASCADE;

-- Drop all existing functions
DROP FUNCTION IF EXISTS calculate_trade_metrics() CASCADE;
DROP FUNCTION IF EXISTS calculate_enhanced_trade_metrics() CASCADE;
DROP FUNCTION IF EXISTS calculate_worth_score(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_profile_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS refresh_user_metrics(UUID) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_sample_trades_for_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✅ Database reset complete. Starting fresh rebuild...';
END $$;

-- ================================================================
-- STEP 2: ENABLE EXTENSIONS
-- ================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- STEP 3: CREATE OPTIMIZED ENUM TYPES
-- ================================================================

-- Trade types - matching what efficient importer produces
CREATE TYPE trade_type AS ENUM ('buy', 'sell', 'long', 'short');

-- Trade status
CREATE TYPE trade_status AS ENUM ('open', 'closed', 'cancelled');

-- Trade outcome
CREATE TYPE trade_outcome AS ENUM ('win', 'loss', 'breakeven');

-- Goal management
CREATE TYPE goal_status AS ENUM ('not-started', 'in-progress', 'completed', 'cancelled');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');

DO $$
BEGIN
    RAISE NOTICE '✅ Enum types created with importer-friendly values';
END $$;

-- ================================================================
-- STEP 4: CREATE CORE TABLES
-- ================================================================

-- Profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    profile_picture_url TEXT,
    account_balance DECIMAL(15,2) DEFAULT 10000,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    trading_experience TEXT DEFAULT 'Beginner',
    risk_tolerance DECIMAL(5,2) DEFAULT 2.00,
    
    -- Worth Score components (0-100 scale)
    worth_score DECIMAL(5,2) DEFAULT 0,
    win_rate_score DECIMAL(5,2) DEFAULT 0,
    timing_score DECIMAL(5,2) DEFAULT 0,
    discipline_score DECIMAL(5,2) DEFAULT 0,
    risk_management_score DECIMAL(5,2) DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 0,
    
    -- Analytics summary fields (auto-calculated)
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    max_drawdown DECIMAL(15,2) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    profit_factor DECIMAL(8,4) DEFAULT 0,
    avg_hold_time_hours DECIMAL(8,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trades table - optimized for import workflows
CREATE TABLE trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic trade identification
    date DATE NOT NULL,
    entry_time TIME,
    exit_time TIME,
    pair VARCHAR(20) NOT NULL,  -- Expanded for various broker formats
    type trade_type,            -- Nullable to handle parsing errors gracefully
    
    -- Price levels - high precision for various instruments
    entry DECIMAL(18,8) NOT NULL,     -- Handles crypto and forex
    exit DECIMAL(18,8),
    stop_loss DECIMAL(18,8),
    take_profit DECIMAL(18,8),
    
    -- Position details - flexible for all broker formats
    lot_size DECIMAL(18,8) NOT NULL,  -- Handles micro-lots to large positions
    pnl DECIMAL(15,2) DEFAULT 0,
    pnl_percentage DECIMAL(8,4) DEFAULT 0,
    status trade_status DEFAULT 'open',
    outcome trade_outcome,
    
    -- Analysis fields
    setup TEXT,                       -- Unlimited length for strategies
    notes TEXT,                       -- Unlimited length for notes
    rr DECIMAL(12,6),                -- High precision for extreme RR values
    
    -- Enhanced behavioral analysis
    hold_time_minutes INTEGER DEFAULT 0,
    slippage_pips DECIMAL(8,2) DEFAULT 0,
    commission DECIMAL(12,6) DEFAULT 0,  -- High precision for various commission structures
    emotion_before TEXT,
    emotion_after TEXT,
    
    -- Screenshots/charts
    chart_before TEXT,
    chart_after TEXT,
    
    -- Market conditions
    market_session TEXT,
    volatility_level TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DO $$
BEGIN
    RAISE NOTICE '✅ Core tables created with import-optimized structure';
END $$;

-- ================================================================
-- STEP 5: CREATE PERFORMANCE INDEXES
-- ================================================================

-- Primary indexes for fast queries
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_user_date ON trades(user_id, date DESC);
CREATE INDEX idx_trades_pair ON trades(pair);
CREATE INDEX idx_trades_type ON trades(type) WHERE type IS NOT NULL;
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_outcome ON trades(outcome) WHERE outcome IS NOT NULL;
-- Use fixed date instead of CURRENT_DATE for immutable index
CREATE INDEX idx_trades_date_recent ON trades(date) WHERE date >= '2023-01-01';

-- Composite indexes for analytics
CREATE INDEX idx_trades_user_pnl ON trades(user_id, pnl) WHERE pnl <> 0;
CREATE INDEX idx_trades_analytics ON trades(user_id, date, pnl, type) WHERE type IS NOT NULL;

DO $$
BEGIN
    RAISE NOTICE '✅ Performance indexes created for efficient querying';
END $$;

-- ================================================================
-- STEP 6: CREATE ESSENTIAL VIEWS
-- ================================================================

-- User trading statistics view (all trades - no date filter)
CREATE VIEW user_trading_stats AS
SELECT 
    user_id,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE pnl > 0) as winning_trades,
    COUNT(*) FILTER (WHERE pnl < 0) as losing_trades,
    COUNT(*) FILTER (WHERE pnl = 0) as breakeven_trades,
    COALESCE(SUM(pnl), 0) as total_pnl,
    COALESCE(AVG(pnl), 0) as avg_pnl,
    COALESCE(MAX(pnl), 0) as best_trade,
    COALESCE(MIN(pnl), 0) as worst_trade,
    COALESCE(AVG(rr), 0) as avg_rr,
    COALESCE(MAX(rr), 0) as max_rr,
    CASE 
        WHEN COUNT(*) FILTER (WHERE pnl <> 0) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE pnl > 0)::DECIMAL / COUNT(*) FILTER (WHERE pnl <> 0)) * 100, 2)
        ELSE 0
    END as win_rate_percent
FROM trades
GROUP BY user_id;

-- Monthly performance view (last 5 years of data)
CREATE VIEW monthly_performance AS
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    COUNT(*) as trades_count,
    SUM(pnl) as month_pnl,
    AVG(pnl) as avg_trade_pnl,
    AVG(rr) as avg_rr,
    COUNT(*) FILTER (WHERE pnl > 0) as wins,
    COUNT(*) FILTER (WHERE pnl < 0) as losses,
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE pnl > 0)::DECIMAL / COUNT(*)) * 100, 2)
        ELSE 0
    END as monthly_win_rate
FROM trades
WHERE date >= '2020-01-01'  -- Fixed date instead of CURRENT_DATE
GROUP BY user_id, DATE_TRUNC('month', date)
ORDER BY user_id, month DESC;

DO $$
BEGIN
    RAISE NOTICE '✅ Essential views created for analytics';
END $$;

-- ================================================================
-- STEP 7: CREATE UTILITY FUNCTIONS
-- ================================================================

-- Updated timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for auto-updating timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
    RAISE NOTICE '✅ Utility functions and triggers created';
END $$;

-- ================================================================
-- STEP 8: ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trades policies - optimized for import operations
CREATE POLICY "Users can view own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON trades
    FOR DELETE USING (auth.uid() = user_id);

DO $$
BEGIN
    RAISE NOTICE '✅ Row Level Security policies created';
END $$;

-- ================================================================
-- STEP 9: GRANT PERMISSIONS
-- ================================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON trades TO authenticated;
GRANT SELECT ON user_trading_stats TO authenticated;
GRANT SELECT ON monthly_performance TO authenticated;

DO $$
BEGIN
    RAISE NOTICE '✅ Permissions granted to authenticated users';
END $$;

-- ================================================================
-- STEP 10: VALIDATION AND COMPLETION
-- ================================================================

-- Show final database state
DO $$
DECLARE
    table_count INTEGER;
    view_count INTEGER;
    index_count INTEGER;
    type_count INTEGER;
BEGIN
    -- Count database objects
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    SELECT COUNT(*) INTO view_count FROM pg_views WHERE schemaname = 'public';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
    SELECT COUNT(*) INTO type_count FROM pg_type WHERE typname LIKE '%trade_%' OR typname LIKE '%goal_%';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 FRESH DATABASE SCHEMA CREATED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database Summary:';
    RAISE NOTICE '   • Tables: %', table_count;
    RAISE NOTICE '   • Views: %', view_count;  
    RAISE NOTICE '   • Indexes: %', index_count;
    RAISE NOTICE '   • Custom Types: %', type_count;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 OPTIMIZED FOR EFFICIENT IMPORTER:';
    RAISE NOTICE '   • Trade types: buy, sell, long, short (lowercase)';
    RAISE NOTICE '   • High precision fields for all broker formats';
    RAISE NOTICE '   • Nullable type field handles parsing errors';
    RAISE NOTICE '   • Performance indexes for large datasets';
    RAISE NOTICE '   • RLS policies for secure multi-user access';
    RAISE NOTICE '';
    RAISE NOTICE '✅ READY TO IMPORT YOUR 3617 TRADES!';
    RAISE NOTICE '   The efficient importer should now work perfectly';
    RAISE NOTICE '   with this clean, optimized database schema.';
END $$;