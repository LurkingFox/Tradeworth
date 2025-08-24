-- COMPLETE FRESH SCHEMA - Use this ONLY if you want to delete everything and start over
-- WARNING: This will DELETE ALL your existing data! Use MIGRATION_SCHEMA.sql instead to keep data.

-- ================================================================
-- STEP 1: Drop existing tables (WARNING: DELETES ALL DATA)
-- ================================================================

-- Uncomment these lines ONLY if you want to delete everything:
/*
DROP TABLE IF EXISTS trade_tag_associations CASCADE;
DROP TABLE IF EXISTS trade_tags CASCADE;
DROP TABLE IF EXISTS goal_milestones CASCADE;
DROP TABLE IF EXISTS trading_goals CASCADE;
DROP TABLE IF EXISTS trading_sessions CASCADE;
DROP TABLE IF EXISTS account_snapshots CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS monthly_stats CASCADE;
DROP TABLE IF EXISTS behavioral_insights CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS trade_type CASCADE;
DROP TYPE IF EXISTS trade_status CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS goal_priority CASCADE;
DROP TYPE IF EXISTS trade_outcome CASCADE;

-- Drop views
DROP VIEW IF EXISTS user_trading_stats CASCADE;
DROP VIEW IF EXISTS monthly_performance CASCADE;
DROP VIEW IF EXISTS daily_performance CASCADE;
*/

-- ================================================================
-- COMPLETE SCHEMA WITH ALL FEATURES
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
-- PROFILES TABLE (COMPLETE WITH ALL FEATURES)
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
    trading_experience TEXT,
    risk_tolerance DECIMAL(5,2) DEFAULT 2.00,
    
    -- Worth Score components (0-100 scale)
    worth_score DECIMAL(5,2) DEFAULT 0,
    win_rate_score DECIMAL(5,2) DEFAULT 0,
    timing_score DECIMAL(5,2) DEFAULT 0,
    discipline_score DECIMAL(5,2) DEFAULT 0,
    risk_management_score DECIMAL(5,2) DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 0,
    
    -- Analytics summary fields
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
-- TRADES TABLE (COMPLETE WITH ALL FEATURES)
-- ================================================================

CREATE TABLE trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Trade identification
    date DATE NOT NULL,
    entry_time TIME,
    exit_time TIME,
    pair TEXT NOT NULL,
    type trade_type NOT NULL,
    
    -- Price levels
    entry DECIMAL(10,5) NOT NULL,
    exit DECIMAL(10,5),
    stop_loss DECIMAL(10,5),
    take_profit DECIMAL(10,5),
    
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
    
    -- Behavioral analysis fields
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ================================================================
-- CONTINUE WITH ALL OTHER EXISTING TABLES...
-- (Include all your existing tables: trading_goals, goal_milestones, 
-- trading_sessions, trade_tags, trade_tag_associations, account_snapshots)
-- Plus all the new tables from MIGRATION_SCHEMA.sql
-- ================================================================

-- [Rest of schema would continue here with all tables, indexes, policies, etc.]