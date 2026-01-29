# Database Migrations

This directory contains SQL migrations for the application database.

## Migration 001: Auto-create Default Subscription

**File**: `001_auto_create_default_subscription.sql`

**Purpose**: Fixes the critical issue where new users don't have a subscription record, causing the app to crash when they access the dashboard.

### What This Migration Does

1. **Backfills existing users** - Creates free tier subscriptions for any users who don't have one
2. **Creates database trigger** - Automatically creates a free tier subscription when a new user profile is created
3. **Creates usage tracking trigger** - Automatically initializes usage tracking records for new subscriptions

### How to Apply This Migration

#### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `001_auto_create_default_subscription.sql`
4. Paste into the SQL Editor
5. Click **Run**

#### Option 2: Using the Node.js Script

```bash
node scripts/apply-subscription-migration.js
```

**Note**: The script can backfill existing users but may not be able to create database triggers (requires direct database access). If you see warnings about DDL queries, use Option 1 to create the triggers.

#### Option 3: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

### Verification

After applying the migration, verify it worked:

```sql
-- Check users without subscriptions (should return 0 rows)
SELECT up.id, up.email
FROM user_profiles up
LEFT JOIN user_subscriptions us ON up.id = us.user_id
WHERE us.user_id IS NULL;

-- Check if triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_create_default_subscription', 'trigger_create_initial_usage_tracking');
```

### Rollback

If you need to rollback this migration:

```sql
-- Remove triggers
DROP TRIGGER IF EXISTS trigger_create_default_subscription ON user_profiles;
DROP TRIGGER IF EXISTS trigger_create_initial_usage_tracking ON user_subscriptions;

-- Remove functions
DROP FUNCTION IF EXISTS create_default_subscription();
DROP FUNCTION IF EXISTS create_initial_usage_tracking();

-- Optional: Remove auto-created subscriptions (BE CAREFUL!)
-- DELETE FROM user_subscriptions WHERE tier_id = 'free' AND stripe_subscription_id IS NULL;
```

### Testing

After applying the migration, test by:

1. Creating a new user account
2. Logging in and accessing the dashboard
3. Verify no crashes occur
4. Check that the new user has a subscription record in `user_subscriptions` table

## Future Migrations

Add new migration files with incrementing numbers:
- `002_description.sql`
- `003_description.sql`
- etc.
