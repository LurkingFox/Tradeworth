-- ================================================================
-- COMPLETE TRADING JOURNAL DATABASE SCHEMA
-- ================================================================
-- 
-- Complete fresh start with ALL features from original schema
-- PLUS optimizations for efficient importer
-- 
-- ⚠️ WARNING: This will DELETE ALL existing data!
-- 
-- Features:
-- ✅ All original tables, functions, and views
-- ✅ Worth Score calculation and tracking  
-- ✅ Enhanced behavioral analysis
-- ✅ Trading goals and milestones
-- ✅ Trading sessions and tags
-- ✅ Account snapshots and daily/monthly stats
-- ✅ Optimized for efficient CSV importer
-- ✅ Handles various broker data formats
-- ✅ Performance indexes for large datasets
-- ✅ Complete RLS security policies
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

-- Clean up any orphaned policies
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

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- STEP 3: CREATE OPTIMIZED ENUM TYPES FOR IMPORTER
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '📝 Creating importer-optimized enum types...';
END $$;

-- Trade types - lowercase to match efficient importer output
CREATE TYPE trade_type AS ENUM ('buy', 'sell', 'long', 'short');
CREATE TYPE trade_status AS ENUM ('open', 'closed', 'cancelled');
CREATE TYPE trade_outcome AS ENUM ('win', 'loss', 'breakeven');

-- Goal management (unchanged from original)
CREATE TYPE goal_status AS ENUM ('not-started', 'in-progress', 'completed', 'cancelled');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');

-- ================================================================
-- STEP 4: CREATE ALL ORIGINAL TABLES (IMPORTER-OPTIMIZED)
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '🗂️ Creating all tables with importer optimizations...';
END $$;

-- ================================================================
-- PROFILES TABLE (Complete from original)
-- ================================================================

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

-- ================================================================
-- TRADES TABLE (Optimized for importer + all original features)
-- ================================================================

CREATE TABLE trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic trade identification
    date DATE NOT NULL,
    entry_time TIME,
    exit_time TIME,
    pair VARCHAR(20) NOT NULL,        -- Expanded for broker variations (EURUSD, EUR/USD, etc.)
    type trade_type,                  -- Nullable to handle parsing errors gracefully
    
    -- Price levels - high precision for all instruments
    entry DECIMAL(18,8) NOT NULL,     -- Handles crypto, forex, stocks, commodities
    exit DECIMAL(18,8),
    stop_loss DECIMAL(18,8),
    take_profit DECIMAL(18,8),
    
    -- Position details - flexible for all broker formats
    lot_size DECIMAL(18,8) NOT NULL,  -- Handles micro-lots to large institutional sizes
    pnl DECIMAL(15,2) DEFAULT 0,
    pnl_percentage DECIMAL(8,4) DEFAULT 0,
    status trade_status DEFAULT 'open',
    outcome trade_outcome,
    
    -- Analysis fields
    setup TEXT,                       -- Unlimited length for complex strategies
    notes TEXT,                       -- Unlimited length for detailed notes
    rr DECIMAL(12,6),                 -- High precision for extreme RR values from imports
    
    -- Enhanced behavioral analysis fields (all from original)
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

-- ================================================================
-- TRADING GOALS TABLE (Complete from original)
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
-- GOAL MILESTONES TABLE (Complete from original)
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
-- TRADING SESSIONS TABLE (Complete from original)
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
-- TRADE TAGS TABLE (Complete from original)
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
-- TRADE TAG ASSOCIATIONS TABLE (Complete from original)
-- ================================================================

CREATE TABLE trade_tag_associations (
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES trade_tags(id) ON DELETE CASCADE,
    
    PRIMARY KEY (trade_id, tag_id)
);

-- ================================================================
-- ACCOUNT SNAPSHOTS TABLE (Complete from original)
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
-- DAILY STATS TABLE (Complete from original)
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
-- MONTHLY STATS TABLE (Complete from original)
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
-- BEHAVIORAL INSIGHTS TABLE (Complete from original)
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
-- STEP 5: CREATE PERFORMANCE INDEXES (All from original + importer optimized)
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '📊 Creating comprehensive performance indexes...';
END $$;

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_worth_score ON profiles(worth_score DESC);

-- Trades indexes (optimized for importer and analytics)
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_date ON trades(date DESC);
CREATE INDEX idx_trades_pair ON trades(pair);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_outcome ON trades(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX idx_trades_setup ON trades(setup);
CREATE INDEX idx_trades_user_date ON trades(user_id, date DESC);
CREATE INDEX idx_trades_market_session ON trades(market_session);
CREATE INDEX idx_trades_entry_time ON trades(date, entry_time);
CREATE INDEX idx_trades_type ON trades(type) WHERE type IS NOT NULL;
CREATE INDEX idx_trades_user_pnl ON trades(user_id, pnl) WHERE pnl <> 0;
CREATE INDEX idx_trades_analytics ON trades(user_id, date, pnl, type) WHERE type IS NOT NULL;

-- All other indexes from original schema
CREATE INDEX idx_trading_goals_user_id ON trading_goals(user_id);
CREATE INDEX idx_trading_goals_status ON trading_goals(status);
CREATE INDEX idx_trading_goals_target_date ON trading_goals(target_date);

CREATE INDEX idx_goal_milestones_goal_id ON goal_milestones(goal_id);
CREATE INDEX idx_goal_milestones_due_date ON goal_milestones(due_date);

CREATE INDEX idx_trading_sessions_user_id ON trading_sessions(user_id);
CREATE INDEX idx_trading_sessions_date ON trading_sessions(session_date DESC);

CREATE INDEX idx_trade_tags_user_id ON trade_tags(user_id);
CREATE INDEX idx_trade_tags_name ON trade_tags(user_id, name);

CREATE INDEX idx_account_snapshots_user_id ON account_snapshots(user_id);
CREATE INDEX idx_account_snapshots_date ON account_snapshots(snapshot_date DESC);

CREATE INDEX idx_daily_stats_user_id ON daily_stats(user_id);
CREATE INDEX idx_daily_stats_date ON daily_stats(stat_date DESC);
CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, stat_date DESC);

CREATE INDEX idx_monthly_stats_user_id ON monthly_stats(user_id);
CREATE INDEX idx_monthly_stats_year_month ON monthly_stats(year DESC, month DESC);

CREATE INDEX idx_behavioral_insights_user_id ON behavioral_insights(user_id);
CREATE INDEX idx_behavioral_insights_type ON behavioral_insights(insight_type);
CREATE INDEX idx_behavioral_insights_unread ON behavioral_insights(user_id, is_read) WHERE is_read = false;

-- ================================================================
-- STEP 6: CREATE ALL ORIGINAL FUNCTIONS (IMPORTER COMPATIBLE)
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '⚙️ Creating all database functions...';
END $$;

-- Updated timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers (all from original)
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trading_goals_updated_at BEFORE UPDATE ON trading_goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_goal_milestones_updated_at BEFORE UPDATE ON goal_milestones FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trading_sessions_updated_at BEFORE UPDATE ON trading_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON daily_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_monthly_stats_updated_at BEFORE UPDATE ON monthly_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ================================================================
-- ENHANCED TRADE METRICS CALCULATION (Complete from original)
-- ================================================================

CREATE OR REPLACE FUNCTION calculate_enhanced_trade_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate PnL only if not already provided (frontend calculates with proper instrument specifications)
    IF NEW.exit IS NOT NULL AND NEW.status = 'closed' AND (NEW.pnl IS NULL OR NEW.pnl = 0) THEN
        -- Simple fallback calculation for imports without PnL
        IF NEW.type = 'buy' THEN
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
            risk DECIMAL(18,8);
            reward DECIMAL(18,8);
        BEGIN
            IF NEW.type = 'buy' THEN
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
-- WORTH SCORE CALCULATION (Complete from original)
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
        WHEN avg_hold_time <= 2 THEN 100
        WHEN avg_hold_time <= 8 THEN 90
        WHEN avg_hold_time <= 24 THEN 70
        ELSE 50
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
-- REFRESH USER METRICS (Complete from original)
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
-- USER PROFILE CREATION (Complete from original)
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
-- STEP 7: COMPREHENSIVE RLS POLICIES (All from original)
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '🔒 Setting up comprehensive Row Level Security policies...';
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
-- STEP 8: COMPREHENSIVE ANALYTICS VIEWS (All from original)
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '📈 Creating comprehensive analytics views...';
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
-- STEP 9: CONFIGURE STORAGE (From original)
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
-- STEP 10: GRANT PERMISSIONS (All from original)
-- ================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON trades TO authenticated;
GRANT ALL ON trading_goals TO authenticated;
GRANT ALL ON goal_milestones TO authenticated;
GRANT ALL ON trading_sessions TO authenticated;
GRANT ALL ON trade_tags TO authenticated;
GRANT ALL ON trade_tag_associations TO authenticated;
GRANT ALL ON account_snapshots TO authenticated;
GRANT ALL ON daily_stats TO authenticated;
GRANT ALL ON monthly_stats TO authenticated;
GRANT ALL ON behavioral_insights TO authenticated;
GRANT SELECT ON user_trading_stats TO authenticated;
GRANT SELECT ON monthly_performance TO authenticated;
GRANT SELECT ON daily_performance TO authenticated;

-- ================================================================
-- STEP 11: COMPLETION & VERIFICATION
-- ================================================================

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    view_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count created objects for verification
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO function_count FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    SELECT COUNT(*) INTO view_count FROM information_schema.views WHERE table_schema = 'public';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE '%trades%';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ============================================================';
    RAISE NOTICE '🚀 COMPLETE TRADING JOURNAL DATABASE REBUILT WITH ALL FEATURES!';
    RAISE NOTICE '🎉 ============================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database Objects Created:';
    RAISE NOTICE '   ✅ Tables: % (All original tables + importer optimizations)', table_count;
    RAISE NOTICE '   ✅ Functions: % (Worth Score, PnL calc, metrics refresh)', function_count;
    RAISE NOTICE '   ✅ Views: % (comprehensive analytics)', view_count;
    RAISE NOTICE '   ✅ Security Policies: %', policy_count;
    RAISE NOTICE '   ✅ Trade Indexes: % (optimized for import + analytics)', index_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔥 ALL ORIGINAL FEATURES INCLUDED:';
    RAISE NOTICE '   🎯 Trading goals and milestones tracking';
    RAISE NOTICE '   📝 Trading sessions and detailed notes';
    RAISE NOTICE '   🏷️  Trade tags and categorization';
    RAISE NOTICE '   📊 Account snapshots and balance tracking';
    RAISE NOTICE '   📈 Daily and monthly statistics';
    RAISE NOTICE '   🧠 Behavioral insights and analysis';
    RAISE NOTICE '   💯 Worth Score calculation system';
    RAISE NOTICE '   🔧 Complete PnL calculation engine';
    RAISE NOTICE '   📷 Profile picture storage';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 PLUS EFFICIENT IMPORTER OPTIMIZATIONS:';
    RAISE NOTICE '   ✅ Lowercase trade types (buy, sell, long, short)';
    RAISE NOTICE '   ✅ High precision fields for all broker formats';
    RAISE NOTICE '   ✅ Nullable type field handles parsing errors';
    RAISE NOTICE '   ✅ Expanded pair field for broker variations';
    RAISE NOTICE '   ✅ Performance indexes for 3617+ trade imports';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 READY FOR:';
    RAISE NOTICE '   📥 Efficient CSV imports (all 3617 trades)';
    RAISE NOTICE '   📊 Full analytics and reporting';
    RAISE NOTICE '   🎪 Complete trading journal experience';
    RAISE NOTICE '============================================================';
END $$;