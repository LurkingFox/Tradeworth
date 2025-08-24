# Supabase Setup Instructions

## ⚠️ CRITICAL: Database Schema Update Required

**You MUST run the database migration before the Dashboard and Analytics will display metrics correctly.**

### Step 1: Apply Database Migration

1. **Go to your Supabase dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire contents of `MIGRATION_SCHEMA.sql`**
4. **Click "Run" to execute the migration**

This migration will:
- ✅ Add Worth Score fields to profiles table
- ✅ Add enhanced tracking fields to trades table  
- ✅ Create daily_stats and monthly_stats tables
- ✅ Create behavioral_insights table
- ✅ Add profile picture support
- ✅ Create all necessary indexes and policies
- ✅ Set up triggers for automatic calculations

**⚠️ Without this migration, you'll see:**
- Zero values in Dashboard metrics
- Empty charts and graphs
- No Worth Score calculation
- Missing profile features

### Step 2: Storage Setup for Profile Pictures

**The migration creates the bucket automatically, but you need to verify:**

1. **Check Storage Bucket:**
   - Go to Supabase dashboard → Storage
   - Verify `profile-pictures` bucket exists and is public
   - If not created, manually create it with public access

2. **Storage Policies (Auto-created by migration):**
   The migration automatically creates these policies, but verify they exist:

   **Insert Policy:**
   ```sql
   CREATE POLICY "Users can upload own profile pictures" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'profile-pictures' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   **Select Policy:**
   ```sql
   CREATE POLICY "Profile pictures are publicly viewable" ON storage.objects
   FOR SELECT USING (bucket_id = 'profile-pictures');
   ```

   **Update Policy:**
   ```sql
   CREATE POLICY "Users can update own profile pictures" ON storage.objects
   FOR UPDATE USING (
     bucket_id = 'profile-pictures' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   **Delete Policy:**
   ```sql
   CREATE POLICY "Users can delete own profile pictures" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'profile-pictures' 
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

### Step 3: Google OAuth Setup

1. **Google Cloud Console Setup:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: Web application
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret

2. **Supabase OAuth Setup:**
   - Go to Supabase dashboard → Authentication → Providers
   - Find Google and enable it
   - Enter your Google Client ID and Client Secret
   - Save configuration

## ✅ **Immediate Impact After Migration**

Once you run `MIGRATION_SCHEMA.sql`, you'll immediately see:

1. **Dashboard displays real metrics** from your existing trades
2. **Worth Score calculated** from your trading history
3. **Monthly heatmap** showing daily P&L patterns
4. **Enhanced Analytics** with comprehensive trading statistics
5. **Profile page** with custom picture upload capability
6. **Google sign-in option** on login screen

## 🚀 **New Features Included**

### Dashboard Features:
- **Overview metrics:** Account balance, total P&L, win rate, total trades
- **Worth Score:** Behavioral analysis with radar chart showing:
  - Win Rate Score (0-100)
  - Timing Score (based on hold times)
  - Discipline Score (based on risk-reward ratios)
  - Risk Management Score (position sizing consistency)
  - Consistency Score (P&L volatility)
- **Intraday cumulative P&L chart**
- **Monthly performance chart**
- **Trading activity heatmap**
- **AI-generated trading insights**

### Enhanced Analytics:
- **Comprehensive metrics:** Sharpe ratio, profit factor, drawdown analysis
- **Time analysis:** Best/worst trading hours and days
- **Pair analysis:** Performance by currency pair
- **Setup analysis:** Performance by trading setup
- **Risk analysis:** Advanced risk ratios and metrics
- **Detailed performance tables**

### Profile Management:
- **Custom profile picture upload**
- **Manual account balance updates**
- **Trading preferences and settings**
- **Worth Score display**
- **Account statistics overview**

## Worth Score Calculation

The Worth Score is calculated using a weighted average of 5 components:

1. **Win Rate Score (25%):** Based on win percentage (60%+ = 100 points)
2. **Timing Score (20%):** Based on average hold time (shorter is better for day trading)
3. **Discipline Score (25%):** Based on risk-reward ratio adherence
4. **Risk Management Score (15%):** Based on position sizing consistency
5. **Consistency Score (15%):** Based on P&L volatility (lower volatility = higher score)

The overall Worth Score ranges from 0-100, with higher scores indicating better trading behavior and discipline.