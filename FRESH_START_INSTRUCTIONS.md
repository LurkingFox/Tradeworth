# 🆕 Fresh Start Setup Instructions

## ⚠️ WARNING: This will DELETE ALL existing data!

Follow these steps to completely rebuild your schema with all new features.

## Step 1: Delete Existing Schema in Supabase

1. **Go to Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this deletion script first:**

```sql
-- Delete all existing tables and data
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

-- Success message
SELECT 'Old schema deleted successfully!' as status;
```

## Step 2: Apply Fresh Complete Schema

1. **In the same SQL Editor**
2. **Copy and paste the entire contents of `FRESH_COMPLETE_SCHEMA.sql`**
3. **Click "Run" to create everything fresh**

## Step 3: Set Up Storage (Profile Pictures)

1. **Go to Storage section**
2. **Create bucket named `profile-pictures`**
3. **Make it public**
4. **Set up policies (or run this SQL):**

```sql
-- Storage policies for profile pictures
CREATE POLICY "Users can upload own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile pictures are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update own profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile pictures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 4: Configure Google OAuth

1. **Go to Authentication → Providers**
2. **Enable Google**
3. **Add your Google OAuth credentials**

## Step 5: Test with Sample Data (Optional)

After logging in, run this in SQL Editor to create sample trades:

```sql
-- Replace 'your-user-id' with your actual auth.users ID
SELECT create_sample_trades_for_user('your-actual-user-id-here');
```

## ✅ What You'll Get After Fresh Setup

- **Clean database** with all new features
- **Worth Score system** fully functional
- **Enhanced Dashboard** with real metrics
- **Comprehensive Analytics** with advanced calculations
- **Monthly trading heatmap** with month switcher
- **Profile picture uploads**
- **Google OAuth sign-in**

## 🎯 Result

Your trading journal will now match Tradezella's behavioral analysis capabilities with your own **Worth Score** system!