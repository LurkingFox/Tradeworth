-- Updated Trading Journal Database Schema for Supabase
-- This schema supports the complete trading journal application with dashboard features
-- New additions for Worth Score, behavioral analysis, and enhanced analytics

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE trade_type AS ENUM ('BUY', 'SELL');
CREATE TYPE trade_status AS ENUM ('open', 'closed');
CREATE TYPE goal_status AS ENUM ('not-started', 'in-progress', 'completed', 'cancelled');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE trade_outcome AS ENUM ('win', 'loss', 'breakeven');

-- ================================================================
-- PROFILES TABLE (UPDATED)
-- Extends Supabase auth.users with additional profile information
-- ================================================================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    profile_picture_url TEXT, -- New: Custom uploaded profile picture
    account_balance DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    trading_experience TEXT,
    risk_tolerance DECIMAL(5,2) DEFAULT 2.00, -- Default 2% risk per trade
    
    -- Worth Score components (0-100 scale)
    worth_score DECIMAL(5,2) DEFAULT 0,
    win_rate_score DECIMAL(5,2) DEFAULT 0,
    timing_score DECIMAL(5,2) DEFAULT 0,
    discipline_score DECIMAL(5,2) DEFAULT 0,
    risk_management_score DECIMAL(5,2) DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 0,
    
    -- Additional analytics fields
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
-- TRADES TABLE (UPDATED)
-- Core trading data with all trade information
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
    pnl_percentage DECIMAL(8,4) DEFAULT 0, -- New: PnL as percentage of account
    status trade_status DEFAULT 'open',
    outcome trade_outcome, -- New: Calculated outcome
    
    -- Analysis
    setup TEXT, -- e.g., 'Trend Following', 'Reversal'
    notes TEXT,
    rr DECIMAL(5,2), -- Risk to Reward ratio
    
    -- Behavioral analysis fields
    hold_time_minutes INTEGER DEFAULT 0, -- New: How long trade was held
    slippage_pips DECIMAL(8,2) DEFAULT 0, -- New: Slippage in pips
    commission DECIMAL(10,4) DEFAULT 0, -- New: Commission/fees
    emotion_before TEXT, -- New: Emotional state before trade
    emotion_after TEXT, -- New: Emotional state after trade
    
    -- Screenshots/charts (URLs to uploaded images)
    chart_before TEXT, -- Chart before entry
    chart_after TEXT,  -- Chart after exit
    
    -- Market conditions
    market_session TEXT, -- New: Asian/European/US session
    volatility_level TEXT, -- New: High/Medium/Low
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================================================
-- DAILY_STATS TABLE (NEW)
-- Track daily performance metrics for dashboard and analytics
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL,
    
    UNIQUE(user_id, stat_date)
);

-- ================================================================
-- MONTHLY_STATS TABLE (NEW)
-- Track monthly performance for analytics
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
-- BEHAVIORAL_INSIGHTS TABLE (NEW)
-- Store AI-generated insights about trading behavior
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

-- Update existing tables with new columns (keeping original structure intact)

-- Add new columns to existing tables if they don't exist
-- These ALTER statements will be run only if the columns don't already exist

-- Add profile picture support to existing profiles table (if not already there)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE profiles ADD COLUMN profile_picture_url TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column profile_picture_url already exists in profiles.';
    END;
END $$;

-- Add Worth Score fields to existing profiles table (if not already there)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE profiles ADD COLUMN worth_score DECIMAL(5,2) DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN win_rate_score DECIMAL(5,2) DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN timing_score DECIMAL(5,2) DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN discipline_score DECIMAL(5,2) DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN risk_management_score DECIMAL(5,2) DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN consistency_score DECIMAL(5,2) DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Worth Score columns already exist in profiles.';
    END;
END $$;

-- Continue with the rest of existing schema...
-- (Including all the original tables: trading_goals, goal_milestones, trading_sessions, 
-- trade_tags, trade_tag_associations, account_snapshots)

-- ================================================================
-- Keep all existing tables as they are
-- ================================================================

-- TRADING GOALS TABLE (unchanged)
CREATE TABLE IF NOT EXISTS trading_goals (
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

-- GOAL MILESTONES TABLE (unchanged)
CREATE TABLE IF NOT EXISTS goal_milestones (
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

-- TRADING SESSIONS TABLE (unchanged)
CREATE TABLE IF NOT EXISTS trading_sessions (
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

-- TRADE TAGS TABLE (unchanged)
CREATE TABLE IF NOT EXISTS trade_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6', -- Hex color for UI display
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id, name)
);

-- TRADE TAG ASSOCIATIONS TABLE (unchanged)
CREATE TABLE IF NOT EXISTS trade_tag_associations (
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES trade_tags(id) ON DELETE CASCADE,
    
    PRIMARY KEY (trade_id, tag_id)
);

-- ACCOUNT SNAPSHOTS TABLE (unchanged)
CREATE TABLE IF NOT EXISTS account_snapshots (
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
-- NEW INDEXES for performance optimization
-- ================================================================

-- Daily stats indexes
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, stat_date DESC);

-- Monthly stats indexes
CREATE INDEX IF NOT EXISTS idx_monthly_stats_user_id ON monthly_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_stats_year_month ON monthly_stats(year DESC, month DESC);

-- Behavioral insights indexes
CREATE INDEX IF NOT EXISTS idx_behavioral_insights_user_id ON behavioral_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_insights_type ON behavioral_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_behavioral_insights_unread ON behavioral_insights(user_id, is_read) WHERE is_read = false;

-- Updated trades indexes for new columns
CREATE INDEX IF NOT EXISTS idx_trades_outcome ON trades(outcome);
CREATE INDEX IF NOT EXISTS idx_trades_market_session ON trades(market_session);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(date, entry_time);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR NEW TABLES
-- ================================================================

-- Enable RLS on new tables
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_insights ENABLE ROW LEVEL SECURITY;

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
-- UPDATED FUNCTIONS AND TRIGGERS
-- ================================================================

-- Function to update the updated_at timestamp (keep existing)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the updated_at trigger to new tables
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

    -- Calculate Risk to Reward ratio (keep existing logic)
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

-- Replace the old trade metrics trigger
DROP TRIGGER IF EXISTS calculate_trade_metrics_trigger ON trades;
CREATE TRIGGER calculate_enhanced_trade_metrics_trigger 
    BEFORE INSERT OR UPDATE ON trades 
    FOR EACH ROW EXECUTE PROCEDURE calculate_enhanced_trade_metrics();

-- Function to calculate Worth Score
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
    risk_consistency DECIMAL(5,2);
    final_worth_score DECIMAL(5,2);
BEGIN
    -- Get basic stats
    SELECT COUNT(*), 
           COALESCE(AVG(CASE WHEN outcome = 'win' THEN 1.0 ELSE 0.0 END) * 100, 0),
           COALESCE(AVG(rr), 0),
           COALESCE(AVG(hold_time_minutes::DECIMAL / 60), 0)
    INTO total_trades, win_rate, avg_rr, avg_hold_time
    FROM trades 
    WHERE user_id = user_uuid AND status = 'closed';
    
    -- Calculate component scores (0-100 scale)
    
    -- 1. Win Rate Score (0-100, where 60%+ win rate = 100 points)
    win_rate_score := LEAST(100, (win_rate / 60.0) * 100);
    
    -- 2. Timing Score (based on average hold time - penalize overholding)
    timing_score := CASE 
        WHEN avg_hold_time <= 2 THEN 100  -- Perfect for scalping/day trading
        WHEN avg_hold_time <= 8 THEN 90   -- Good for day trading
        WHEN avg_hold_time <= 24 THEN 70  -- Acceptable for swing trading
        ELSE 50 -- Penalty for very long holds
    END;
    
    -- 3. Discipline Score (based on RR ratio adherence)
    discipline_score := CASE
        WHEN avg_rr >= 2.0 THEN 100
        WHEN avg_rr >= 1.5 THEN 80
        WHEN avg_rr >= 1.0 THEN 60
        ELSE 30
    END;
    
    -- 4. Risk Management Score (based on position sizing consistency)
    SELECT COALESCE(100 - (STDDEV(lot_size) / AVG(lot_size) * 100), 100)
    INTO risk_management_score
    FROM trades 
    WHERE user_id = user_uuid AND status = 'closed';
    
    -- 5. Consistency Score (based on PnL volatility)
    SELECT COALESCE(100 - (STDDEV(pnl) / GREATEST(ABS(AVG(pnl)), 1) * 10), 50)
    INTO consistency_score
    FROM trades 
    WHERE user_id = user_uuid AND status = 'closed';
    
    -- Calculate final Worth Score (weighted average)
    final_worth_score := (
        win_rate_score * 0.25 +
        timing_score * 0.20 +
        discipline_score * 0.25 +
        risk_management_score * 0.15 +
        consistency_score * 0.15
    );
    
    -- Ensure all scores are between 0 and 100
    win_rate_score := LEAST(100, GREATEST(0, win_rate_score));
    timing_score := LEAST(100, GREATEST(0, timing_score));
    discipline_score := LEAST(100, GREATEST(0, discipline_score));
    risk_management_score := LEAST(100, GREATEST(0, risk_management_score));
    consistency_score := LEAST(100, GREATEST(0, consistency_score));
    final_worth_score := LEAST(100, GREATEST(0, final_worth_score));
    
    RETURN QUERY SELECT 
        final_worth_score,
        win_rate_score,
        timing_score,
        discipline_score,
        risk_management_score,
        consistency_score;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- UPDATED VIEWS FOR ENHANCED ANALYTICS
-- ================================================================

-- Enhanced user trading statistics view
DROP VIEW IF EXISTS user_trading_stats;
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
DROP VIEW IF EXISTS monthly_performance;
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