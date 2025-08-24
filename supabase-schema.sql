-- Trading Journal Database Schema for Supabase
-- This schema supports the complete trading journal application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE trade_type AS ENUM ('BUY', 'SELL');
CREATE TYPE trade_status AS ENUM ('open', 'closed');
CREATE TYPE goal_status AS ENUM ('not-started', 'in-progress', 'completed', 'cancelled');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');

-- ================================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with additional profile information
-- ================================================================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    account_balance DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    trading_experience TEXT,
    risk_tolerance DECIMAL(5,2) DEFAULT 2.00, -- Default 2% risk per trade
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================================================
-- TRADES TABLE  
-- Core trading data with all trade information
-- ================================================================

CREATE TABLE trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Trade identification
    date DATE NOT NULL,
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
    status trade_status DEFAULT 'open',
    
    -- Analysis
    setup TEXT, -- e.g., 'Trend Following', 'Reversal'
    notes TEXT,
    rr DECIMAL(5,2), -- Risk to Reward ratio
    
    -- Screenshots/charts (URLs to uploaded images)
    chart_before TEXT, -- Chart before entry
    chart_after TEXT,  -- Chart after exit
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================================================
-- TRADING GOALS TABLE
-- User's trading goals and objectives  
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
-- Sub-goals/milestones for trading goals
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
-- Track daily/session-based trading performance
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
-- Flexible tagging system for trades
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
-- Many-to-many relationship between trades and tags
-- ================================================================

CREATE TABLE trade_tag_associations (
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES trade_tags(id) ON DELETE CASCADE,
    
    PRIMARY KEY (trade_id, tag_id)
);

-- ================================================================
-- ACCOUNT SNAPSHOTS TABLE  
-- Track account balance over time
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
-- INDEXES for performance optimization
-- ================================================================

-- Trades indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_date ON trades(date);
CREATE INDEX idx_trades_pair ON trades(pair);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_setup ON trades(setup);
CREATE INDEX idx_trades_user_date ON trades(user_id, date DESC);

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

-- Account snapshots indexes
CREATE INDEX idx_account_snapshots_user_id ON account_snapshots(user_id);
CREATE INDEX idx_account_snapshots_date ON account_snapshots(snapshot_date DESC);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure users can only access their own data
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

-- ================================================================
-- FUNCTIONS AND TRIGGERS
-- Automatically update timestamps and calculated fields
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

-- Function to automatically calculate trade PnL and RR ratio
CREATE OR REPLACE FUNCTION calculate_trade_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate PnL if exit price is provided
    IF NEW.exit IS NOT NULL AND NEW.status = 'closed' THEN
        IF NEW.type = 'BUY' THEN
            NEW.pnl = (NEW.exit - NEW.entry) * NEW.lot_size * 100000; -- Standard lot multiplier
        ELSE
            NEW.pnl = (NEW.entry - NEW.exit) * NEW.lot_size * 100000;
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

-- Apply trade metrics calculation trigger
CREATE TRIGGER calculate_trade_metrics_trigger 
    BEFORE INSERT OR UPDATE ON trades 
    FOR EACH ROW EXECUTE PROCEDURE calculate_trade_metrics();

-- Function to create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ================================================================
-- USEFUL VIEWS FOR ANALYTICS
-- Provide commonly used aggregations and calculations
-- ================================================================

-- View: User trading statistics
CREATE VIEW user_trading_stats AS
SELECT 
    u.id as user_id,
    p.username,
    COUNT(t.id) as total_trades,
    COUNT(CASE WHEN t.status = 'open' THEN 1 END) as open_trades,
    COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as closed_trades,
    COUNT(CASE WHEN t.status = 'closed' AND t.pnl > 0 THEN 1 END) as winning_trades,
    COUNT(CASE WHEN t.status = 'closed' AND t.pnl <= 0 THEN 1 END) as losing_trades,
    COALESCE(
        ROUND(
            (COUNT(CASE WHEN t.status = 'closed' AND t.pnl > 0 THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(CASE WHEN t.status = 'closed' THEN 1 END), 0)) * 100, 
            2
        ), 
        0
    ) as win_rate,
    COALESCE(SUM(CASE WHEN t.status = 'closed' THEN t.pnl ELSE 0 END), 0) as total_pnl,
    COALESCE(
        AVG(CASE WHEN t.status = 'closed' AND t.pnl > 0 THEN t.pnl END), 
        0
    ) as avg_win,
    COALESCE(
        ABS(AVG(CASE WHEN t.status = 'closed' AND t.pnl <= 0 THEN t.pnl END)), 
        0
    ) as avg_loss
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN trades t ON u.id = t.user_id
GROUP BY u.id, p.username;

-- View: Monthly trading performance
CREATE VIEW monthly_performance AS
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    COUNT(*) as trades_count,
    COUNT(CASE WHEN status = 'closed' AND pnl > 0 THEN 1 END) as wins,
    COUNT(CASE WHEN status = 'closed' AND pnl <= 0 THEN 1 END) as losses,
    SUM(CASE WHEN status = 'closed' THEN pnl ELSE 0 END) as monthly_pnl,
    ROUND(
        (COUNT(CASE WHEN status = 'closed' AND pnl > 0 THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(CASE WHEN status = 'closed' THEN 1 END), 0)) * 100, 
        2
    ) as win_rate
FROM trades
GROUP BY user_id, DATE_TRUNC('month', date)
ORDER BY user_id, month DESC;

-- ================================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================================

-- Note: This section can be uncommented to insert sample data for testing
-- Replace the user_id with actual UUID from auth.users table

/*
-- Sample profile
INSERT INTO profiles (id, username, full_name, account_balance, trading_experience, risk_tolerance)
VALUES (
    'your-user-uuid-here', 
    'sample_trader', 
    'Sample Trader', 
    10000.00, 
    'Intermediate', 
    2.00
);

-- Sample trades
INSERT INTO trades (user_id, date, pair, type, entry, exit, stop_loss, take_profit, lot_size, status, setup, notes)
VALUES 
    ('your-user-uuid-here', '2025-08-20', 'EURUSD', 'BUY', 1.2500, 1.2580, 1.2450, 1.2600, 0.1, 'closed', 'Trend Following', 'Bullish breakout above resistance'),
    ('your-user-uuid-here', '2025-08-21', 'GBPUSD', 'SELL', 1.3200, 1.3150, 1.3250, 1.3100, 0.15, 'closed', 'Reversal', 'Bearish divergence on RSI'),
    ('your-user-uuid-here', '2025-08-22', 'USDJPY', 'BUY', 110.50, NULL, 110.00, 111.50, 0.2, 'open', 'Breakout', 'Breaking above key resistance');

-- Sample trading goal
INSERT INTO trading_goals (user_id, title, description, target_date, status, priority, target_pnl, target_win_rate)
VALUES (
    'your-user-uuid-here',
    'Achieve 15% Monthly Return',
    'Maintain consistent profitable trading with 15% monthly account growth',
    '2025-12-31',
    'in-progress',
    'high',
    1500.00,
    65.00
);
*/

-- ================================================================
-- END OF SCHEMA
-- ================================================================

-- To apply this schema to your Supabase project:
-- 1. Copy this entire file
-- 2. Go to your Supabase dashboard
-- 3. Navigate to SQL Editor
-- 4. Paste and execute this script
-- 5. The schema will be created with all tables, indexes, policies, and functions