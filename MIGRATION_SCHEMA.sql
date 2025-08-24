-- CRITICAL: Run this schema update in Supabase SQL Editor BEFORE using the new Dashboard and Analytics features
-- This adds all required tables and columns for Dashboard metrics, Worth Score, and enhanced Analytics

-- ================================================================
-- STEP 1: Add new columns to existing PROFILES table
-- ================================================================

-- Add Worth Score components to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worth_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS win_rate_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timing_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discipline_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS risk_management_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consistency_score DECIMAL(5,2) DEFAULT 0;

-- Add profile picture support
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add analytics summary fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_trades INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS winning_trades INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_pnl DECIMAL(15,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_drawdown DECIMAL(15,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sharpe_ratio DECIMAL(8,4) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profit_factor DECIMAL(8,4) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avg_hold_time_hours DECIMAL(8,2) DEFAULT 0;

-- ================================================================
-- STEP 2: Add new columns to existing TRADES table
-- ================================================================

-- Add enhanced trade tracking fields
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_time TIME;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_time TIME;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS pnl_percentage DECIMAL(8,4) DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS hold_time_minutes INTEGER DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS slippage_pips DECIMAL(8,2) DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS commission DECIMAL(10,4) DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS emotion_before TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS emotion_after TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS market_session TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS volatility_level TEXT;

-- Add trade outcome enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_outcome') THEN
        CREATE TYPE trade_outcome AS ENUM ('win', 'loss', 'breakeven');
    END IF;
END $$;

-- Add outcome column
ALTER TABLE trades ADD COLUMN IF NOT EXISTS outcome trade_outcome;

-- ================================================================
-- STEP 3: Create new tables for enhanced analytics
-- ================================================================

-- DAILY_STATS TABLE - Track daily performance metrics
CREATE TABLE IF NOT EXISTS daily_stats (
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

-- MONTHLY_STATS TABLE - Track monthly performance
CREATE TABLE IF NOT EXISTS monthly_stats (
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

-- BEHAVIORAL_INSIGHTS TABLE - Store AI-generated insights
CREATE TABLE IF NOT EXISTS behavioral_insights (
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
-- STEP 4: Create indexes for performance optimization
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
-- STEP 5: Enable RLS on new tables
-- ================================================================

-- Enable RLS on new tables
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_insights ENABLE ROW LEVEL SECURITY;

-- Daily stats policies
CREATE POLICY IF NOT EXISTS "Users can view own daily stats" ON daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own daily stats" ON daily_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own daily stats" ON daily_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own daily stats" ON daily_stats FOR DELETE USING (auth.uid() = user_id);

-- Monthly stats policies
CREATE POLICY IF NOT EXISTS "Users can view own monthly stats" ON monthly_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own monthly stats" ON monthly_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own monthly stats" ON monthly_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own monthly stats" ON monthly_stats FOR DELETE USING (auth.uid() = user_id);

-- Behavioral insights policies
CREATE POLICY IF NOT EXISTS "Users can view own insights" ON behavioral_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own insights" ON behavioral_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own insights" ON behavioral_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own insights" ON behavioral_insights FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- STEP 6: Create/Update triggers for new tables
-- ================================================================

-- Apply the updated_at trigger to new tables
CREATE TRIGGER IF NOT EXISTS update_daily_stats_updated_at 
    BEFORE UPDATE ON daily_stats 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_monthly_stats_updated_at 
    BEFORE UPDATE ON monthly_stats 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ================================================================
-- STEP 7: Enhanced trade metrics calculation function
-- ================================================================

-- Drop the old trigger to replace it
DROP TRIGGER IF EXISTS calculate_trade_metrics_trigger ON trades;

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

-- Create the new trigger
CREATE TRIGGER calculate_enhanced_trade_metrics_trigger 
    BEFORE INSERT OR UPDATE ON trades 
    FOR EACH ROW EXECUTE PROCEDURE calculate_enhanced_trade_metrics();

-- ================================================================
-- STEP 8: Create Worth Score calculation function
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
    risk_consistency DECIMAL(5,2);
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
    
    -- 2. Timing Score (based on average hold time - penalize overholding)
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
-- STEP 9: Create enhanced views for analytics
-- ================================================================

-- Drop existing views to recreate with new fields
DROP VIEW IF EXISTS user_trading_stats;
DROP VIEW IF EXISTS monthly_performance;

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
CREATE OR REPLACE VIEW daily_performance AS
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
-- STEP 10: Create storage bucket for profile pictures (Run in Supabase Dashboard)
-- ================================================================

-- Note: This SQL creates the bucket, but you need to set up policies in the Supabase dashboard
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STEP 11: Function to update profile statistics (optional automation)
-- ================================================================

CREATE OR REPLACE FUNCTION update_profile_stats(user_uuid UUID)
RETURNS void AS $$
DECLARE
    stats_record RECORD;
    worth_record RECORD;
BEGIN
    -- Calculate current stats
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
-- STEP 12: Sample data insertion (OPTIONAL - for testing)
-- ================================================================

-- Uncomment and modify the user ID to insert sample trades for testing
/*
DO $$
DECLARE
    sample_user_id UUID := 'your-actual-user-id-here'; -- Replace with real user ID from auth.users
BEGIN
    -- Insert sample trades for testing the dashboard
    INSERT INTO trades (user_id, date, entry_time, exit_time, pair, type, entry, exit, stop_loss, take_profit, lot_size, status, setup, notes, market_session) VALUES
    (sample_user_id, CURRENT_DATE, '09:30:00', '10:15:00', 'EURUSD', 'BUY', 1.2500, 1.2580, 1.2450, 1.2600, 0.1, 'closed', 'Trend Following', 'Bullish breakout above resistance', 'European'),
    (sample_user_id, CURRENT_DATE, '14:00:00', '15:30:00', 'GBPUSD', 'SELL', 1.3200, 1.3150, 1.3250, 1.3100, 0.15, 'closed', 'Reversal', 'Bearish divergence on RSI', 'US'),
    (sample_user_id, CURRENT_DATE - 1, '08:00:00', '09:45:00', 'USDJPY', 'BUY', 110.50, 111.20, 110.00, 111.50, 0.2, 'closed', 'Breakout', 'Breaking above key resistance', 'Asian'),
    (sample_user_id, CURRENT_DATE - 1, '16:00:00', '17:30:00', 'AUDUSD', 'SELL', 0.7500, 0.7480, 0.7520, 0.7450, 0.1, 'closed', 'Range Trading', 'Rejection at resistance', 'US'),
    (sample_user_id, CURRENT_DATE - 2, '10:00:00', '11:00:00', 'EURJPY', 'BUY', 130.00, 130.40, 129.50, 131.00, 0.05, 'closed', 'Momentum', 'Strong momentum break', 'European');
    
    -- Update profile statistics for the sample user
    PERFORM update_profile_stats(sample_user_id);
END $$;
*/

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

-- Insert a completion message
DO $$
BEGIN
    RAISE NOTICE 'Schema migration completed successfully!';
    RAISE NOTICE 'New features added:';
    RAISE NOTICE '- Worth Score calculation system';
    RAISE NOTICE '- Enhanced trade tracking fields';
    RAISE NOTICE '- Daily and monthly statistics tables';
    RAISE NOTICE '- Behavioral insights system';
    RAISE NOTICE '- Profile picture support';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Set up profile-pictures storage bucket policies in Supabase dashboard';
    RAISE NOTICE '2. Configure Google OAuth in Supabase Auth settings';
    RAISE NOTICE '3. Start trading and watch your Worth Score improve!';
END $$;