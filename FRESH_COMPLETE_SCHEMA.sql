-- ================================================================
-- COMPLETE FRESH TRADING JOURNAL SCHEMA
-- This is a complete schema rebuild with ALL features included
-- WARNING: This will DELETE all existing data - use only for fresh start
-- ================================================================

-- ================================================================
-- STEP 1: Clean slate - Drop everything first
-- ================================================================

-- Drop existing tables in correct order (foreign keys first)
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

-- Drop views
DROP VIEW IF EXISTS user_trading_stats CASCADE;
DROP VIEW IF EXISTS monthly_performance CASCADE;
DROP VIEW IF EXISTS daily_performance CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS trade_type CASCADE;
DROP TYPE IF EXISTS trade_status CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS goal_priority CASCADE;
DROP TYPE IF EXISTS trade_outcome CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_trade_metrics() CASCADE;
DROP FUNCTION IF EXISTS calculate_enhanced_trade_metrics() CASCADE;
DROP FUNCTION IF EXISTS calculate_worth_score(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_profile_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- ================================================================
-- STEP 2: Create fresh schema with all features
-- ================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE trade_type AS ENUM ('BUY', 'SELL');
CREATE TYPE trade_status AS ENUM ('open', 'closed');
CREATE TYPE goal_status AS ENUM ('not-started', 'in-progress', 'completed', 'cancelled');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE trade_outcome AS ENUM ('win', 'loss', 'breakeven');

-- ================================================================
-- PROFILES TABLE (COMPLETE WITH ALL DASHBOARD FEATURES)
-- ================================================================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    profile_picture_url TEXT, -- Custom uploaded profile picture
    account_balance DECIMAL(15,2) DEFAULT 10000,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    trading_experience TEXT DEFAULT 'Beginner',
    risk_tolerance DECIMAL(5,2) DEFAULT 2.00, -- Default 2% risk per trade
    
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
    total_pnl DECIMAL(15,2) DEFAULT 0,
    max_drawdown DECIMAL(15,2) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    profit_factor DECIMAL(8,4) DEFAULT 0,
    avg_hold_time_hours DECIMAL(8,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================================================
-- TRADES TABLE (COMPLETE WITH ALL TRACKING FEATURES)
-- ================================================================

CREATE TABLE trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Trade identification
    date DATE NOT NULL,
    entry_time TIME,
    exit_time TIME,
    pair TEXT NOT NULL, -- e.g., 'EURUSD', 'GBPJPY'
    type trade_type NOT NULL,
    
    -- Price levels
    entry DECIMAL(10,5) NOT NULL,
    exit DECIMAL(10,5),
    stop_loss DECIMAL(10,5),
    take_profit DECIMAL(10,5),
    
    -- Position details
    lot_size DECIMAL(10,2) NOT NULL,
    pnl DECIMAL(15,2) DEFAULT 0,
    pnl_percentage DECIMAL(8,4) DEFAULT 0, -- PnL as percentage of account
    status trade_status DEFAULT 'open',
    outcome trade_outcome, -- Calculated: win/loss/breakeven
    
    -- Analysis
    setup TEXT, -- e.g., 'Trend Following', 'Reversal'
    notes TEXT,
    rr DECIMAL(5,2), -- Risk to Reward ratio
    
    -- Enhanced behavioral analysis fields
    hold_time_minutes INTEGER DEFAULT 0, -- How long trade was held
    slippage_pips DECIMAL(8,2) DEFAULT 0, -- Slippage in pips
    commission DECIMAL(10,4) DEFAULT 0, -- Commission/fees
    emotion_before TEXT, -- Emotional state before trade
    emotion_after TEXT, -- Emotional state after trade
    
    -- Screenshots/charts (URLs to uploaded images)
    chart_before TEXT, -- Chart before entry
    chart_after TEXT,  -- Chart after exit
    
    -- Market conditions
    market_session TEXT, -- Asian/European/US session
    volatility_level TEXT, -- High/Medium/Low
    
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
    current_progress DECIMAL(5,2) DEFAULT 0, -- Percentage 0-100
    
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
    
    -- Session stats (calculated from trades)
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
    color TEXT DEFAULT '#3b82f6', -- Hex color for UI display
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
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id, snapshot_date)
);

-- ================================================================
-- DAILY STATS TABLE (NEW FOR DASHBOARD)
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
    
    -- Daily scores (for Worth Score calculation)
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
-- MONTHLY STATS TABLE (NEW FOR ANALYTICS)
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
-- BEHAVIORAL INSIGHTS TABLE (NEW FOR AI SUGGESTIONS)
-- ================================================================

CREATE TABLE behavioral_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    insight_type TEXT NOT NULL, -- 'suggestion', 'warning', 'achievement'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    
    -- Metadata
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================================================
-- INDEXES for performance optimization
-- ================================================================

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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

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

-- Goal milestones policies (via goal ownership)
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

-- Trade tag associations policies (via trade ownership)
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
-- FUNCTIONS AND TRIGGERS
-- ================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the updated_at trigger to all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trading_goals_updated_at BEFORE UPDATE ON trading_goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_goal_milestones_updated_at BEFORE UPDATE ON goal_milestones FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trading_sessions_updated_at BEFORE UPDATE ON trading_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON daily_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_monthly_stats_updated_at BEFORE UPDATE ON monthly_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enhanced trade metrics calculation function
CREATE OR REPLACE FUNCTION calculate_enhanced_trade_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate PnL if exit price is provided
    IF NEW.exit IS NOT NULL AND NEW.status = 'closed' THEN
        IF NEW.type = 'BUY' THEN
            NEW.pnl = (NEW.exit - NEW.entry) * NEW.lot_size * 100000; -- Standard lot multiplier
        ELSE
            NEW.pnl = (NEW.entry - NEW.exit) * NEW.lot_size * 100000;
        END IF;
        
        -- Calculate PnL percentage (assuming account balance from profiles)
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
            risk DECIMAL(10,5);
            reward DECIMAL(10,5);
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

-- Function to create profile for new users
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

-- Function to update profile statistics automatically
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
-- VIEWS FOR ANALYTICS AND DASHBOARD
-- ================================================================

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
-- STORAGE BUCKET SETUP
-- ================================================================

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- ================================================================

-- Function to create sample trades for testing
CREATE OR REPLACE FUNCTION create_sample_trades_for_user(user_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Insert sample trades for dashboard testing
    INSERT INTO trades (user_id, date, entry_time, exit_time, pair, type, entry, exit, stop_loss, take_profit, lot_size, status, setup, notes, market_session) VALUES
    (user_uuid, CURRENT_DATE, '09:30:00', '10:15:00', 'EURUSD', 'BUY', 1.2500, 1.2580, 1.2450, 1.2600, 0.1, 'closed', 'Trend Following', 'Bullish breakout above resistance', 'European'),
    (user_uuid, CURRENT_DATE, '14:00:00', '15:30:00', 'GBPUSD', 'SELL', 1.3200, 1.3150, 1.3250, 1.3100, 0.15, 'closed', 'Reversal', 'Bearish divergence on RSI', 'US'),
    (user_uuid, CURRENT_DATE - 1, '08:00:00', '09:45:00', 'USDJPY', 'BUY', 110.50, 111.20, 110.00, 111.50, 0.2, 'closed', 'Breakout', 'Breaking above key resistance', 'Asian'),
    (user_uuid, CURRENT_DATE - 1, '16:00:00', '17:30:00', 'AUDUSD', 'SELL', 0.7500, 0.7480, 0.7520, 0.7450, 0.1, 'closed', 'Range Trading', 'Rejection at resistance', 'US'),
    (user_uuid, CURRENT_DATE - 2, '10:00:00', '11:00:00', 'EURJPY', 'BUY', 130.00, 130.40, 129.50, 131.00, 0.05, 'closed', 'Momentum', 'Strong momentum break', 'European'),
    (user_uuid, CURRENT_DATE - 3, '13:00:00', '14:30:00', 'NZDUSD', 'BUY', 0.6200, 0.6180, 0.6180, 0.6250, 0.08, 'closed', 'Support Bounce', 'Bounce from key support level', 'US'),
    (user_uuid, CURRENT_DATE - 4, '11:00:00', '12:45:00', 'USDCAD', 'SELL', 1.3500, 1.3480, 1.3520, 1.3450, 0.12, 'closed', 'Range Trading', 'Resistance rejection', 'US'),
    (user_uuid, CURRENT_DATE - 5, '07:00:00', '08:30:00', 'GBPJPY', 'BUY', 150.00, 150.60, 149.50, 151.00, 0.06, 'closed', 'Breakout', 'Morning breakout', 'Asian');
    
    -- Update profile statistics
    PERFORM update_profile_stats(user_uuid);
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '🚀 FRESH TRADING JOURNAL SCHEMA CREATED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All tables created with enhanced features:';
    RAISE NOTICE '   - Profiles with Worth Score tracking';
    RAISE NOTICE '   - Enhanced trades with behavioral analysis';
    RAISE NOTICE '   - Daily/monthly statistics tables';
    RAISE NOTICE '   - Behavioral insights system';
    RAISE NOTICE '   - All RLS policies and triggers active';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Dashboard features ready:';
    RAISE NOTICE '   - Worth Score radar chart';
    RAISE NOTICE '   - Monthly trading heatmap';
    RAISE NOTICE '   - Real-time metrics calculation';
    RAISE NOTICE '   - Comprehensive analytics';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Next steps:';
    RAISE NOTICE '   1. Set up profile-pictures storage bucket in Supabase dashboard';
    RAISE NOTICE '   2. Configure Google OAuth in Auth settings';
    RAISE NOTICE '   3. Optional: Run create_sample_trades_for_user(''your-user-id'') for test data';
    RAISE NOTICE '   4. Start trading and watch your Worth Score grow!';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Your trading journal is now ready with Tradezella-style analytics!';
END $$;