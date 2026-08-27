-- ============================================================
-- 000_drop_all.sql
-- Drops ALL yayika tables, triggers, policies, and functions.
-- Run this FIRST to cleanly wipe the schema before re-creating.
-- ============================================================

-- ── 1. Drop all triggers (avoid FK constraint errors) ────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_yayika_profiles_updated_at ON yayika_profiles;
DROP TRIGGER IF EXISTS update_yayika_subscriptions_updated_at ON yayika_subscriptions;
DROP TRIGGER IF EXISTS update_yayika_progress_updated_at ON yayika_progress;
DROP TRIGGER IF EXISTS update_yayika_products_updated_at ON yayika_products;
DROP TRIGGER IF EXISTS update_yayika_product_lessons_updated_at ON yayika_product_lessons;
DROP TRIGGER IF EXISTS update_yayika_user_purchases_updated_at ON yayika_user_purchases;
DROP TRIGGER IF EXISTS update_yayika_community_posts_updated_at ON yayika_community_posts;
DROP TRIGGER IF EXISTS update_yayika_onboarding_updated_at ON yayika_onboarding;
DROP TRIGGER IF EXISTS update_yayika_digest_prefs_updated_at ON yayika_digest_prefs;

-- ── 2. Drop all policies ─────────────────────────────────────
DO $$
DECLARE
  _rec RECORD;
BEGIN
  FOR _rec IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename LIKE 'yayika_%'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      _rec.policyname, _rec.schemaname, _rec.tablename
    );
  END LOOP;
END
$$;

DO $$
DECLARE
  _rec RECORD;
BEGIN
  FOR _rec IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('push_tokens', 'products', 'courses')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      _rec.policyname, _rec.schemaname, _rec.tablename
    );
  END LOOP;
END
$$;

-- ── 3. Drop all tables (CASCADE removes FK deps) ────────────

-- Core tables
DROP TABLE IF EXISTS yayika_profiles CASCADE;
DROP TABLE IF EXISTS yayika_progress CASCADE;
DROP TABLE IF EXISTS yayika_subscriptions CASCADE;
DROP TABLE IF EXISTS yayika_xp_events CASCADE;
DROP TABLE IF EXISTS yayika_checkins CASCADE;
DROP TABLE IF EXISTS yayika_cycle_log CASCADE;
DROP TABLE IF EXISTS yayika_cycle_coaching CASCADE;
DROP TABLE IF EXISTS yayika_daily_mood CASCADE;
DROP TABLE IF EXISTS yayika_daily_affirmations CASCADE;
DROP TABLE IF EXISTS yayika_weekly_challenges CASCADE;
DROP TABLE IF EXISTS yayika_user_challenges CASCADE;
DROP TABLE IF EXISTS yayika_growth_challenges CASCADE;
DROP TABLE IF EXISTS yayika_transactions CASCADE;

-- Community tables
DROP TABLE IF EXISTS yayika_community_categories CASCADE;
DROP TABLE IF EXISTS yayika_community_posts CASCADE;
DROP TABLE IF EXISTS yayika_community_reactions CASCADE;
DROP TABLE IF EXISTS yayika_community_comments CASCADE;
DROP TABLE IF EXISTS yayika_community_notifications CASCADE;
DROP TABLE IF EXISTS yayika_community_user_stats CASCADE;

-- Affiliates & sharing
DROP TABLE IF EXISTS yayika_affiliates CASCADE;
DROP TABLE IF EXISTS yayika_share_stats CASCADE;
DROP TABLE IF EXISTS yayika_share_cards CASCADE;
DROP TABLE IF EXISTS yayika_share_templates CASCADE;

-- Onboarding
DROP TABLE IF EXISTS yayika_onboarding CASCADE;
DROP TABLE IF EXISTS yayika_onboarding_days CASCADE;
DROP TABLE IF EXISTS yayika_onboarding_tasks CASCADE;

-- Products & purchases
DROP TABLE IF EXISTS yayika_products CASCADE;
DROP TABLE IF EXISTS yayika_product_lessons CASCADE;
DROP TABLE IF EXISTS yayika_user_purchases CASCADE;
DROP TABLE IF EXISTS yayika_user_lesson_progress CASCADE;

-- Notifications & digests
DROP TABLE IF EXISTS yayika_push_notifications CASCADE;
DROP TABLE IF EXISTS yayika_weekly_digests CASCADE;
DROP TABLE IF EXISTS yayika_digest_prefs CASCADE;
DROP TABLE IF EXISTS yayika_digest_history CASCADE;

-- Utility
DROP TABLE IF EXISTS yayika_rate_limits CASCADE;
DROP TABLE IF EXISTS yayika_regions CASCADE;

-- Legacy / non-prefixed tables
DROP TABLE IF EXISTS push_tokens CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- Old tables from the original schema (may or may not exist)
DROP TABLE IF EXISTS yayika_marketplace_products_v2 CASCADE;
DROP TABLE IF EXISTS yayika_marketplace_sales_v2 CASCADE;
DROP TABLE IF EXISTS yayika_seller_profiles CASCADE;
DROP TABLE IF EXISTS yayika_seller_balances CASCADE;
DROP TABLE IF EXISTS yayika_payout_requests_v2 CASCADE;
DROP TABLE IF EXISTS yayika_financial_transactions CASCADE;
DROP TABLE IF EXISTS yayika_marketplace_reviews CASCADE;
DROP TABLE IF EXISTS yayika_activity_log CASCADE;

-- ── 4. Drop functions ────────────────────────────────────────
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS calculate_xp_for_action(text) CASCADE;
DROP FUNCTION IF EXISTS award_xp(uuid, text, integer) CASCADE;
