-- ============================================================================
-- Yayika — read-only schema drift diagnostics
-- Run in the Supabase SQL editor (or staging) before preparing Block B
-- migrations. This file performs SELECTs only; it changes nothing.
-- ============================================================================

-- 1. Columns of the tables involved in the audit.
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'yayika_profiles',
    'yayika_subscriptions',
    'yayika_purchases',
    'yayika_user_purchases',
    'yayika_products',
    'yayika_product_lessons',
    'yayika_user_lesson_progress',
    'yayika_cycle_log',
    'yayika_cycle_logs',
    'yayika_push_tokens',
    'yayika_affiliates',
    'yayika_affiliate_referrals'
  )
ORDER BY table_name, ordinal_position;

-- 2. Which of the expected tables actually exist.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'yayika_profiles',
    'yayika_subscriptions',
    'yayika_purchases',
    'yayika_user_purchases',
    'yayika_products',
    'yayika_product_lessons',
    'yayika_user_lesson_progress',
    'yayika_cycle_log',
    'yayika_cycle_logs',
    'yayika_push_tokens',
    'yayika_affiliates',
    'yayika_affiliate_referrals'
  )
ORDER BY table_name;

-- 3. Current RLS policies on the sensitive tables.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'yayika_profiles',
    'yayika_subscriptions',
    'yayika_purchases',
    'yayika_user_purchases',
    'yayika_xp_events',
    'yayika_reward_spins',
    'yayika_affiliates',
    'yayika_affiliate_referrals'
  )
ORDER BY tablename, policyname;

-- 4. RLS status (relrowsecurity / relforcerowsecurity).
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'yayika_profiles',
    'yayika_subscriptions',
    'yayika_purchases',
    'yayika_user_purchases',
    'yayika_xp_events',
    'yayika_reward_spins',
    'yayika_push_tokens',
    'yayika_affiliates'
  )
ORDER BY c.relname;

-- 5. Purchase pipeline: are payments landing in one table only?
SELECT 'yayika_purchases' AS source, count(*) AS rows, max(created_at) AS latest
FROM public.yayika_purchases
UNION ALL
SELECT 'yayika_user_purchases' AS source, count(*) AS rows, max(created_at) AS latest
FROM public.yayika_user_purchases;

-- 6. Subscriptions with more than one row per user (the webhook does
--    select-then-insert and there is no unique constraint on user_id).
SELECT user_id, count(*) AS rows
FROM public.yayika_subscriptions
GROUP BY user_id
HAVING count(*) > 1
ORDER BY rows DESC;

-- 7. Active subscriptions whose paid period already ended.
SELECT id, user_id, plan, status, current_period_end, grace_period_end
FROM public.yayika_subscriptions
WHERE status = 'active'
  AND current_period_end IS NOT NULL
  AND current_period_end <= now()
ORDER BY current_period_end;

-- 8. Sample of lesson access columns (confirm whether content lives in
--    yayika_product_lessons.content).
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'yayika_product_lessons'
ORDER BY ordinal_position;
