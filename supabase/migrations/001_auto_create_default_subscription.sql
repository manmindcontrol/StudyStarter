-- Migration: Auto-create default free tier subscription for new users
-- This prevents app crashes when users access dashboard without a subscription

-- ============================================
-- STEP 1: Backfill existing users without subscriptions
-- ============================================

-- Create default free tier subscriptions for any users who don't have one
INSERT INTO user_subscriptions (user_id, tier_id, stripe_subscription_status)
SELECT
  up.id as user_id,
  'free' as tier_id,
  'active' as stripe_subscription_status
FROM user_profiles up
LEFT JOIN user_subscriptions us ON up.id = us.user_id
WHERE us.user_id IS NULL;

-- ============================================
-- STEP 2: Create trigger function
-- ============================================

-- Function that automatically creates a free tier subscription when a user profile is created
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a default free tier subscription for the new user
  INSERT INTO user_subscriptions (
    user_id,
    tier_id,
    stripe_subscription_status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW()
  )
  -- Handle case where subscription already exists (should not happen, but safe)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Create trigger on user_profiles table
-- ============================================

-- Drop trigger if it already exists (for re-running migration)
DROP TRIGGER IF EXISTS trigger_create_default_subscription ON user_profiles;

-- Create trigger that fires AFTER a new user profile is inserted
CREATE TRIGGER trigger_create_default_subscription
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- ============================================
-- STEP 4: Create initial usage tracking record function
-- ============================================

-- Function that automatically creates initial usage tracking when subscription is created
CREATE OR REPLACE FUNCTION create_initial_usage_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert initial usage tracking record for the new subscription
  INSERT INTO usage_tracking (
    user_id,
    period_start,
    period_end,
    pdf_conversions_used,
    materials_uploaded,
    notes_generations_used,
    questions_generations_used,
    created_at,
    updated_at
  ) VALUES (
    NEW.user_id,
    DATE_TRUNC('month', NOW()),
    DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day',
    0,
    0,
    0,
    0,
    NOW(),
    NOW()
  )
  -- Handle case where tracking already exists
  ON CONFLICT (user_id, period_start) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Create trigger on user_subscriptions table
-- ============================================

-- Drop trigger if it already exists
DROP TRIGGER IF EXISTS trigger_create_initial_usage_tracking ON user_subscriptions;

-- Create trigger that fires AFTER a new subscription is inserted
CREATE TRIGGER trigger_create_initial_usage_tracking
  AFTER INSERT ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_usage_tracking();

-- ============================================
-- VERIFICATION QUERIES (commented out)
-- ============================================

-- Uncomment these to verify the migration worked:

-- Check users without subscriptions (should return 0 rows):
-- SELECT up.id, up.email
-- FROM user_profiles up
-- LEFT JOIN user_subscriptions us ON up.id = us.user_id
-- WHERE us.user_id IS NULL;

-- Check all subscriptions:
-- SELECT * FROM user_subscriptions ORDER BY created_at DESC;

-- Check if triggers exist:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name IN ('trigger_create_default_subscription', 'trigger_create_initial_usage_tracking');
