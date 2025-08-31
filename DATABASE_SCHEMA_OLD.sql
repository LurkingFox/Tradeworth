-- ================================================================
-- TRADING JOURNAL - COMPLETE DATABASE RESET & REBUILD
-- ================================================================
-- 
-- ⚠️ WARNING: This will DELETE ALL existing data in your database!
-- This script completely resets your database and rebuilds everything fresh.
-- 
-- Updated: August 2025
-- 
-- Features:
-- ✅ Complete database reset (clears ALL existing tables)
-- ✅ Corrected PnL calculations (no multiplication factors)
-- ✅ Centralized data management system compatibility
-- ✅ Worth Score calculation and tracking
-- ✅ Enhanced behavioral analysis
-- ✅ Dashboard metrics and analytics
-- ✅ Row Level Security (RLS) policies
-- ✅ Performance optimizations
-- 
-- Usage:
-- 1. Run this ENTIRE script in Supabase SQL Editor
-- 2. This will delete ALL existing data and rebuild everything
-- 3. Perfect for fresh starts or major schema updates
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

-- Drop all existing tables in correct order (foreign keys first)
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

-- Drop any existing views
DROP VIEW IF EXISTS user_trading_stats CASCADE;
DROP VIEW IF EXISTS monthly_performance CASCADE;
DROP VIEW IF EXISTS daily_performance CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS trade_type CASCADE;
DROP TYPE IF EXISTS trade_status CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS goal_priority CASCADE;
DROP TYPE IF EXISTS trade_outcome CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS calculate_trade_metrics() CASCADE;
DROP FUNCTION IF EXISTS calculate_enhanced_trade_metrics() CASCADE;
DROP FUNCTION IF EXISTS calculate_worth_score(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_profile_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS refresh_user_metrics(UUID) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_sample_trades_for_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Clean up any orphaned policies (they'll be recreated)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "Users can view own ' || r.tablename || '" ON ' || r.schemaname || '.' || r.tablename;
            EXECUTE 'DROP POLICY IF EXISTS "Users can insert own ' || r.tablename || '" ON ' || r.schemaname || '.' || r.tablename;
            EXECUTE 'DROP POLICY IF EXISTS "Users can update own ' || r.tablename || '" ON ' || r.schemaname || '.' || r.tablename;
            EXECUTE 'DROP POLICY IF EXISTS "Users can delete own ' || r.tablename || '" ON ' || r.schemaname || '.' || r.tablename;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors for non-existent policies
            NULL;
        END;
    END LOOP;
END $$;

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
-- STEP 3: CREATE CUSTOM TYPES
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '📝 Creating custom types...';
END $$;

CREATE TYPE trade_type AS ENUM ('BUY', 'SELL', 'BUY LIMIT', 'SELL LIMIT', 'BUY STOP', 'SELL STOP');
CREATE TYPE trade_status AS ENUM ('open', 'closed');
CREATE TYPE goal_status AS ENUM ('not-started', 'in-progress', 'completed', 'cancelled');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE trade_outcome AS ENUM ('win', 'loss', 'breakeven');

-- ================================================================
-- STEP 4: CREATE MAIN TABLES
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '🗂️ Creating main tables...';
    RAISE NOTICE '   → Creating profiles table...';
END $$;

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

DO $$
BEGIN
    RAISE NOTICE '   → Creating trades table...';
END $$;

CREATE TABLE trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Trade identification
    date DATE NOT NULL,
    entry_time TIME,
    exit_time TIME,
    pair TEXT NOT NULL,
    type trade_type NOT NULL,
    
    -- Price levels (increased precision for crypto prices)
    entry DECIMAL(15,8) NOT NULL,
    exit DECIMAL(15,8),
    stop_loss DECIMAL(15,8),
    take_profit DECIMAL(15,8),
    
    -- Position details
    lot_size DECIMAL(10,2) NOT NULL,
    pnl DECIMAL(15,2) DEFAULT 0,
    pnl_percentage DECIMAL(8,4) DEFAULT 0,
    status trade_status DEFAULT 'open',
    outcome trade_outcome,
    
    -- Analysis
    setup TEXT,
    notes TEXT,
    rr DECIMAL(5,2),
    
    -- Enhanced behavioral analysis fields
    hold_time_minutes INTEGER DEFAULT 0,
    slippage_pips DECIMAL(8,2) DEFAULT 0,
    commission DECIMAL(10,4) DEFAULT 0,
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

-- ================================================================
-- TRADING GOALS TABLE
-- ================================================================

CREATE TABLE trading_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    status goal_status DEFAULT 'not-started',
    priority goal_priority DEFAULT 'medium',
    
    -- Quantitative targets
    target_pnl DECIMAL(15,2),
    target_win_rate DECIMAL(5,2),
    target_trades INTEGER,
    
    -- Progress tracking
    current_progress DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================================================
-- GOAL MILESTONES TABLE
-- ================================================================

CREATE TABLE goal_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID REFERENCES trading_goals(id) ON DELETE CASCADE NOT NULL,
    
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================================================
-- TRADING SESSIONS TABLE
-- ================================================================

CREATE TABLE trading_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- Session stats
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    
    -- Session notes
    market_conditions TEXT,
    emotional_state TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id, session_date)
);

-- ================================================================
-- TRADE TAGS TABLE
-- ================================================================

CREATE TABLE trade_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id, name)
);

-- ================================================================
-- TRADE TAG ASSOCIATIONS TABLE
-- ================================================================

CREATE TABLE trade_tag_associations (
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES trade_tags(id) ON DELETE CASCADE,
    
    PRIMARY KEY (trade_id, tag_id)
);

-- ================================================================
-- ACCOUNT SNAPSHOTS TABLE
-- ================================================================

CREATE TABLE account_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    snapshot_date DATE NOT NULL,
    balance DECIMAL(15,2) NOT NULL,
    equity DECIMAL(15,2),
    margin_used DECIMAL(15,2),
    free_margin DECIMAL(15,2),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id, snapshot_date)
);

-- ================================================================
-- DAILY STATS TABLE
-- ================================================================

CREATE TABLE daily_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    stat_date DATE NOT NULL,
    
    -- Daily performance
    trades_count INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    breakeven_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Daily scores
    timing_score DECIMAL(5,2) DEFAULT 0,
    discipline_score DECIMAL(5,2) DEFAULT 0,
    risk_score DECIMAL(5,2) DEFAULT 0,
    
    -- Volume and risk metrics
    total_volume DECIMAL(15,2) DEFAULT 0,
    max_risk_per_trade DECIMAL(8,4) DEFAULT 0,
    avg_hold_time_minutes INTEGER DEFAULT 0,
    
    -- Account balance at end of day
    end_balance DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id, stat_date)
);

-- ================================================================
-- MONTHLY STATS TABLE
-- ================================================================

CREATE TABLE monthly_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    
    -- Monthly performance
    trades_count INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Risk metrics
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    max_drawdown DECIMAL(15,2) DEFAULT 0,
    profit_factor DECIMAL(8,4) DEFAULT 0,
    
    -- Worth Score for the month
    monthly_worth_score DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id, year, month)
);

-- ================================================================
-- BEHAVIORAL INSIGHTS TABLE
-- ================================================================

CREATE TABLE behavioral_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    
    -- Metadata
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================================================
-- STEP 5: CREATE PERFORMANCE INDEXES
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '📊 Creating performance indexes...';
END $$;

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_worth_score ON profiles(worth_score DESC);

-- Trades indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_date ON trades(date DESC);
CREATE INDEX idx_trades_pair ON trades(pair);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_outcome ON trades(outcome);
CREATE INDEX idx_trades_setup ON trades(setup);
CREATE INDEX idx_trades_user_date ON trades(user_id, date DESC);
CREATE INDEX idx_trades_market_session ON trades(market_session);
CREATE INDEX idx_trades_entry_time ON trades(date, entry_time);

-- Trading goals indexes
CREATE INDEX idx_trading_goals_user_id ON trading_goals(user_id);
CREATE INDEX idx_trading_goals_status ON trading_goals(status);
CREATE INDEX idx_trading_goals_target_date ON trading_goals(target_date);

-- Goal milestones indexes
CREATE INDEX idx_goal_milestones_goal_id ON goal_milestones(goal_id);
CREATE INDEX idx_goal_milestones_due_date ON goal_milestones(due_date);

-- Trading sessions indexes
CREATE INDEX idx_trading_sessions_user_id ON trading_sessions(user_id);
CREATE INDEX idx_trading_sessions_date ON trading_sessions(session_date DESC);

-- Trade tags indexes
CREATE INDEX idx_trade_tags_user_id ON trade_tags(user_id);
CREATE INDEX idx_trade_tags_name ON trade_tags(user_id, name);

-- Account snapshots indexes
CREATE INDEX idx_account_snapshots_user_id ON account_snapshots(user_id);
CREATE INDEX idx_account_snapshots_date ON account_snapshots(snapshot_date DESC);

-- Daily stats indexes
CREATE INDEX idx_daily_stats_user_id ON daily_stats(user_id);
CREATE INDEX idx_daily_stats_date ON daily_stats(stat_date DESC);
CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, stat_date DESC);

-- Monthly stats indexes
CREATE INDEX idx_monthly_stats_user_id ON monthly_stats(user_id);
CREATE INDEX idx_monthly_stats_year_month ON monthly_stats(year DESC, month DESC);

-- Behavioral insights indexes
CREATE INDEX idx_behavioral_insights_user_id ON behavioral_insights(user_id);
CREATE INDEX idx_behavioral_insights_type ON behavioral_insights(insight_type);
CREATE INDEX idx_behavioral_insights_unread ON behavioral_insights(user_id, is_read) WHERE is_read = false;

-- ================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '🔒 Setting up Row Level Security policies...';
END $$;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_tag_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_insights ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trades policies
CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trades" ON trades FOR DELETE USING (auth.uid() = user_id);

-- Trading goals policies
CREATE POLICY "Users can view own goals" ON trading_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON trading_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON trading_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON trading_goals FOR DELETE USING (auth.uid() = user_id);

-- Goal milestones policies
CREATE POLICY "Users can view own goal milestones" ON goal_milestones FOR SELECT 
    USING (goal_id IN (SELECT id FROM trading_goals WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own goal milestones" ON goal_milestones FOR INSERT 
    WITH CHECK (goal_id IN (SELECT id FROM trading_goals WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own goal milestones" ON goal_milestones FOR UPDATE 
    USING (goal_id IN (SELECT id FROM trading_goals WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own goal milestones" ON goal_milestones FOR DELETE 
    USING (goal_id IN (SELECT id FROM trading_goals WHERE user_id = auth.uid()));

-- Trading sessions policies
CREATE POLICY "Users can view own sessions" ON trading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON trading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON trading_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON trading_sessions FOR DELETE USING (auth.uid() = user_id);

-- Trade tags policies
CREATE POLICY "Users can view own tags" ON trade_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tags" ON trade_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON trade_tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON trade_tags FOR DELETE USING (auth.uid() = user_id);

-- Trade tag associations policies
CREATE POLICY "Users can view own trade tag associations" ON trade_tag_associations FOR SELECT 
    USING (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own trade tag associations" ON trade_tag_associations FOR INSERT 
    WITH CHECK (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own trade tag associations" ON trade_tag_associations FOR DELETE 
    USING (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));

-- Account snapshots policies
CREATE POLICY "Users can view own snapshots" ON account_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON account_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own snapshots" ON account_snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own snapshots" ON account_snapshots FOR DELETE USING (auth.uid() = user_id);

-- Daily stats policies
CREATE POLICY "Users can view own daily stats" ON daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily stats" ON daily_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily stats" ON daily_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily stats" ON daily_stats FOR DELETE USING (auth.uid() = user_id);

-- Monthly stats policies
CREATE POLICY "Users can view own monthly stats" ON monthly_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monthly stats" ON monthly_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monthly stats" ON monthly_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own monthly stats" ON monthly_stats FOR DELETE USING (auth.uid() = user_id);

-- Behavioral insights policies
CREATE POLICY "Users can view own insights" ON behavioral_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON behavioral_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights" ON behavioral_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights" ON behavioral_insights FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- STEP 7: CREATE FUNCTIONS AND TRIGGERS
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '⚙️ Creating database functions and triggers...';
END $$;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trading_goals_updated_at BEFORE UPDATE ON trading_goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_goal_milestones_updated_at BEFORE UPDATE ON goal_milestones FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trading_sessions_updated_at BEFORE UPDATE ON trading_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON daily_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_monthly_stats_updated_at BEFORE UPDATE ON monthly_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ================================================================
-- ENHANCED TRADE METRICS CALCULATION FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION calculate_enhanced_trade_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate PnL only if not already provided (frontend calculates with proper instrument specifications)
    -- NOTE: PnL is calculated in frontend with instrument-specific contract sizes and pip values
    IF NEW.exit IS NOT NULL AND NEW.status = 'closed' AND (NEW.pnl IS NULL OR NEW.pnl = 0) THEN
        -- Simple fallback calculation (works for cryptocurrencies like BTCUSD)
        -- Forex pairs should be calculated by frontend with proper contract sizes
        IF NEW.type = 'BUY' THEN
            NEW.pnl = (NEW.exit - NEW.entry) * NEW.lot_size;
        ELSE
            NEW.pnl = (NEW.entry - NEW.exit) * NEW.lot_size;
        END IF;
        
        -- Calculate PnL percentage
        DECLARE
            account_bal DECIMAL(15,2);
        BEGIN
            SELECT account_balance INTO account_bal FROM profiles WHERE id = NEW.user_id;
            IF account_bal > 0 THEN
                NEW.pnl_percentage = (NEW.pnl / account_bal) * 100;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                NEW.pnl_percentage = 0;
        END;
        
        -- Determine outcome
        IF NEW.pnl > 0 THEN
            NEW.outcome = 'win';
        ELSIF NEW.pnl < 0 THEN
            NEW.outcome = 'loss';
        ELSE
            NEW.outcome = 'breakeven';
        END IF;
        
        -- Calculate hold time in minutes
        IF NEW.entry_time IS NOT NULL AND NEW.exit_time IS NOT NULL THEN
            NEW.hold_time_minutes = EXTRACT(EPOCH FROM (NEW.exit_time - NEW.entry_time)) / 60;
        END IF;
    END IF;

    -- Calculate Risk to Reward ratio
    IF NEW.stop_loss IS NOT NULL AND NEW.take_profit IS NOT NULL THEN
        DECLARE
            risk DECIMAL(15,8);
            reward DECIMAL(15,8);
        BEGIN
            IF NEW.type = 'BUY' THEN
                risk = ABS(NEW.entry - NEW.stop_loss);
                reward = ABS(NEW.take_profit - NEW.entry);
            ELSE
                risk = ABS(NEW.stop_loss - NEW.entry);
                reward = ABS(NEW.entry - NEW.take_profit);
            END IF;
            
            IF risk > 0 THEN
                NEW.rr = reward / risk;
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply enhanced trade metrics calculation trigger
CREATE TRIGGER calculate_enhanced_trade_metrics_trigger 
    BEFORE INSERT OR UPDATE ON trades 
    FOR EACH ROW EXECUTE PROCEDURE calculate_enhanced_trade_metrics();

-- ================================================================
-- USER PROFILE CREATION FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, username)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'preferred_username', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ================================================================
-- WORTH SCORE CALCULATION FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION calculate_worth_score(user_uuid UUID)
RETURNS TABLE(
    worth_score DECIMAL(5,2),
    win_rate_score DECIMAL(5,2),
    timing_score DECIMAL(5,2),
    discipline_score DECIMAL(5,2),
    risk_management_score DECIMAL(5,2),
    consistency_score DECIMAL(5,2)
) AS $$
DECLARE
    total_trades INTEGER;
    win_rate DECIMAL(5,2);
    avg_rr DECIMAL(5,2);
    avg_hold_time DECIMAL(8,2);
    final_worth_score DECIMAL(5,2);
    win_rate_calc DECIMAL(5,2);
    timing_calc DECIMAL(5,2);
    discipline_calc DECIMAL(5,2);
    risk_mgmt_calc DECIMAL(5,2);
    consistency_calc DECIMAL(5,2);
BEGIN
    -- Get basic stats
    SELECT COUNT(*), 
           COALESCE(AVG(CASE WHEN outcome = 'win' THEN 1.0 ELSE 0.0 END) * 100, 0),
           COALESCE(AVG(rr), 0),
           COALESCE(AVG(hold_time_minutes::DECIMAL / 60), 0)
    INTO total_trades, win_rate, avg_rr, avg_hold_time
    FROM trades 
    WHERE user_id = user_uuid AND status = 'closed';
    
    -- Return zeros if no trades
    IF total_trades = 0 THEN
        RETURN QUERY SELECT 0::DECIMAL(5,2), 0::DECIMAL(5,2), 0::DECIMAL(5,2), 
                           0::DECIMAL(5,2), 0::DECIMAL(5,2), 0::DECIMAL(5,2);
        RETURN;
    END IF;
    
    -- Calculate component scores (0-100 scale)
    
    -- 1. Win Rate Score (0-100, where 60%+ win rate = 100 points)
    win_rate_calc := LEAST(100, (win_rate / 60.0) * 100);
    
    -- 2. Timing Score (based on average hold time)
    timing_calc := CASE 
        WHEN avg_hold_time <= 2 THEN 100  -- Perfect for scalping/day trading
        WHEN avg_hold_time <= 8 THEN 90   -- Good for day trading
        WHEN avg_hold_time <= 24 THEN 70  -- Acceptable for swing trading
        ELSE 50 -- Penalty for very long holds
    END;
    
    -- 3. Discipline Score (based on RR ratio adherence)
    discipline_calc := CASE
        WHEN avg_rr >= 2.0 THEN 100
        WHEN avg_rr >= 1.5 THEN 80
        WHEN avg_rr >= 1.0 THEN 60
        ELSE 30
    END;
    
    -- 4. Risk Management Score (based on position sizing consistency)
    SELECT COALESCE(100 - (STDDEV(lot_size) / NULLIF(AVG(lot_size), 0) * 100), 100)
    INTO risk_mgmt_calc
    FROM trades 
    WHERE user_id = user_uuid AND status = 'closed';
    
    -- 5. Consistency Score (based on PnL volatility)
    SELECT COALESCE(100 - (STDDEV(pnl) / GREATEST(ABS(NULLIF(AVG(pnl), 0)), 1) * 10), 50)
    INTO consistency_calc
    FROM trades 
    WHERE user_id = user_uuid AND status = 'closed';
    
    -- Calculate final Worth Score (weighted average)
    final_worth_score := (
        win_rate_calc * 0.25 +
        timing_calc * 0.20 +
        discipline_calc * 0.25 +
        risk_mgmt_calc * 0.15 +
        consistency_calc * 0.15
    );
    
    -- Ensure all scores are between 0 and 100
    win_rate_calc := LEAST(100, GREATEST(0, win_rate_calc));
    timing_calc := LEAST(100, GREATEST(0, timing_calc));
    discipline_calc := LEAST(100, GREATEST(0, discipline_calc));
    risk_mgmt_calc := LEAST(100, GREATEST(0, risk_mgmt_calc));
    consistency_calc := LEAST(100, GREATEST(0, consistency_calc));
    final_worth_score := LEAST(100, GREATEST(0, final_worth_score));
    
    RETURN QUERY SELECT 
        final_worth_score,
        win_rate_calc,
        timing_calc,
        discipline_calc,
        risk_mgmt_calc,
        consistency_calc;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PROFILE STATS UPDATE FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION update_profile_stats(user_uuid UUID)
RETURNS void AS $$
DECLARE
    stats_record RECORD;
    worth_record RECORD;
BEGIN
    -- Calculate current stats from trades
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN outcome = 'win' THEN 1 END) as wins,
        COALESCE(SUM(pnl), 0) as total_pnl,
        COALESCE(AVG(hold_time_minutes::DECIMAL / 60), 0) as avg_hold_hours
    INTO stats_record
    FROM trades 
    WHERE user_id = user_uuid AND status = 'closed';
    
    -- Calculate Worth Score
    SELECT * INTO worth_record FROM calculate_worth_score(user_uuid);
    
    -- Update profile with calculated stats
    UPDATE profiles SET
        total_trades = stats_record.total,
        winning_trades = stats_record.wins,
        total_pnl = stats_record.total_pnl,
        avg_hold_time_hours = stats_record.avg_hold_hours,
        worth_score = worth_record.worth_score,
        win_rate_score = worth_record.win_rate_score,
        timing_score = worth_record.timing_score,
        discipline_score = worth_record.discipline_score,
        risk_management_score = worth_record.risk_management_score,
        consistency_score = worth_record.consistency_score,
        updated_at = NOW()
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- REFRESH USER METRICS FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION refresh_user_metrics(user_uuid UUID)
RETURNS void AS $$
DECLARE
    stats_record RECORD;
    worth_record RECORD;
BEGIN
    -- Calculate current stats from trades
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN outcome = 'win' THEN 1 END) as wins,
        COUNT(CASE WHEN outcome = 'loss' THEN 1 END) as losses,
        COALESCE(SUM(pnl), 0) as total_pnl,
        COALESCE(AVG(hold_time_minutes::DECIMAL / 60), 0) as avg_hold_hours
    INTO stats_record
    FROM trades 
    WHERE user_id = user_uuid AND status = 'closed';
    
    -- Calculate Worth Score
    SELECT * INTO worth_record FROM calculate_worth_score(user_uuid);
    
    -- Update profile with calculated stats
    UPDATE profiles SET
        total_trades = stats_record.total,
        winning_trades = stats_record.wins,
        losing_trades = stats_record.losses,
        total_pnl = stats_record.total_pnl,
        avg_hold_time_hours = stats_record.avg_hold_hours,
        worth_score = worth_record.worth_score,
        win_rate_score = worth_record.win_rate_score,
        timing_score = worth_record.timing_score,
        discipline_score = worth_record.discipline_score,
        risk_management_score = worth_record.risk_management_score,
        consistency_score = worth_record.consistency_score,
        updated_at = NOW()
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- STEP 8: CREATE ANALYTICS VIEWS
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '📈 Creating analytics views...';
END $$;

-- Enhanced user trading statistics view
CREATE VIEW user_trading_stats AS
SELECT 
    u.id as user_id,
    p.username,
    p.account_balance,
    p.worth_score,
    COUNT(t.id) as total_trades,
    COUNT(CASE WHEN t.status = 'open' THEN 1 END) as open_trades,
    COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as closed_trades,
    COUNT(CASE WHEN t.outcome = 'win' THEN 1 END) as winning_trades,
    COUNT(CASE WHEN t.outcome = 'loss' THEN 1 END) as losing_trades,
    COUNT(CASE WHEN t.outcome = 'breakeven' THEN 1 END) as breakeven_trades,
    COALESCE(
        ROUND(
            (COUNT(CASE WHEN t.outcome = 'win' THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(CASE WHEN t.status = 'closed' THEN 1 END), 0)) * 100, 
            2
        ), 
        0
    ) as win_rate,
    COALESCE(SUM(CASE WHEN t.status = 'closed' THEN t.pnl ELSE 0 END), 0) as total_pnl,
    COALESCE(AVG(CASE WHEN t.outcome = 'win' THEN t.pnl END), 0) as avg_win,
    COALESCE(ABS(AVG(CASE WHEN t.outcome = 'loss' THEN t.pnl END)), 0) as avg_loss,
    COALESCE(AVG(t.rr), 0) as avg_rr,
    COALESCE(AVG(t.hold_time_minutes), 0) as avg_hold_time_minutes
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN trades t ON u.id = t.user_id
GROUP BY u.id, p.username, p.account_balance, p.worth_score;

-- Enhanced monthly performance view
CREATE VIEW monthly_performance AS
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    EXTRACT(YEAR FROM date) as year,
    EXTRACT(MONTH FROM date) as month_num,
    COUNT(*) as trades_count,
    COUNT(CASE WHEN outcome = 'win' THEN 1 END) as wins,
    COUNT(CASE WHEN outcome = 'loss' THEN 1 END) as losses,
    COUNT(CASE WHEN outcome = 'breakeven' THEN 1 END) as breakeven,
    SUM(CASE WHEN status = 'closed' THEN pnl ELSE 0 END) as monthly_pnl,
    ROUND(
        (COUNT(CASE WHEN outcome = 'win' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(CASE WHEN status = 'closed' THEN 1 END), 0)) * 100, 
        2
    ) as win_rate,
    AVG(rr) as avg_rr,
    SUM(lot_size) as total_volume
FROM trades
WHERE status = 'closed'
GROUP BY user_id, DATE_TRUNC('month', date), EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
ORDER BY user_id, month DESC;

-- Daily performance view for heatmap
CREATE VIEW daily_performance AS
SELECT 
    user_id,
    date,
    COUNT(*) as trades_count,
    SUM(CASE WHEN status = 'closed' THEN pnl ELSE 0 END) as daily_pnl,
    COUNT(CASE WHEN outcome = 'win' THEN 1 END) as wins,
    COUNT(CASE WHEN outcome = 'loss' THEN 1 END) as losses
FROM trades
GROUP BY user_id, date
ORDER BY user_id, date DESC;

-- ================================================================
-- STEP 9: CONFIGURE STORAGE
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '🗄️ Setting up storage buckets...';
END $$;

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STEP 10: COMPLETION & VERIFICATION
-- ================================================================

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    view_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count created objects for verification
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO function_count FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    SELECT COUNT(*) INTO view_count FROM information_schema.views WHERE table_schema = 'public';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ============================================================';
    RAISE NOTICE '🚀 TRADING JOURNAL DATABASE COMPLETELY REBUILT!';
    RAISE NOTICE '🎉 ============================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database Objects Created:';
    RAISE NOTICE '   ✅ Tables: % (profiles, trades, goals, etc.)', table_count;
    RAISE NOTICE '   ✅ Functions: % (Worth Score, PnL calc, etc.)', function_count;
    RAISE NOTICE '   ✅ Views: % (analytics, performance)', view_count;
    RAISE NOTICE '   ✅ Security Policies: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔥 MAJOR FEATURES INCLUDED:';
    RAISE NOTICE '   🎯 Complete database reset (ALL old data cleared)';
    RAISE NOTICE '   💰 Corrected PnL calculations (no multiplication factors)';
    RAISE NOTICE '   📈 Worth Score calculation and tracking';
    RAISE NOTICE '   🧠 Enhanced behavioral analysis';
    RAISE NOTICE '   📊 Dashboard metrics and analytics';
    RAISE NOTICE '   🔒 Row Level Security (RLS) policies';
    RAISE NOTICE '   ⚡ Performance optimizations with indexes';
    RAISE NOTICE '   🖼️ Profile picture storage bucket';
    RAISE NOTICE '   🎨 Centralized data management compatibility';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 IMMEDIATE NEXT STEPS:';
    RAISE NOTICE '   1. ✅ Database schema is now COMPLETE';
    RAISE NOTICE '   2. 🔐 Configure Google OAuth in Supabase Auth settings';
    RAISE NOTICE '   3. 📸 Verify profile-pictures bucket in Storage';
    RAISE NOTICE '   4. 🚀 Start your trading journal application!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT REMINDER:';
    RAISE NOTICE '   🗑️  ALL previous data has been DELETED';
    RAISE NOTICE '   🆕 Your database is now completely fresh';
    RAISE NOTICE '   💯 Ready for your centralized data management system';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 RESULT: Enterprise-grade trading journal with Tradezella-style analytics!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
END $$;