-- ============================================================================
-- 013 — Lock entitlement tables against client-side writes
-- Prepared: 2026-11-23
-- Status: NOT APPLIED. Requires staging review + backup.
--
-- Why:
--   The RLS policies on yayika_subscriptions / yayika_user_purchases allow
--   `auth.uid() = user_id` for INSERT and UPDATE. That lets any authenticated
--   user grant themselves plan=diamante, status=active, current_period_end in
--   the future, or insert a fake completed purchase to unlock paid lessons.
--   These tables must be written only by the Stripe webhook (service_role).
--
-- Safety:
--   REVOKE only removes privileges; it does not delete rows or change RLS
--   policies. SELECT remains for the owner. The webhook uses service_role,
--   which bypasses RLS and these grants.
-- ============================================================================

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.yayika_subscriptions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.yayika_user_purchases FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.yayika_user_items FROM anon, authenticated;

-- Verify after applying (all should be false):
-- SELECT has_table_privilege('authenticated', 'public.yayika_subscriptions', 'UPDATE');
-- SELECT has_table_privilege('authenticated', 'public.yayika_user_purchases', 'INSERT');
-- SELECT has_table_privilege('authenticated', 'public.yayika_user_items', 'UPDATE');

-- Emergency rollback ONLY if an app write path is found to depend on these
-- grants. Re-applying this migration is then mandatory.
-- GRANT INSERT, UPDATE, DELETE ON public.yayika_subscriptions TO authenticated;
-- GRANT INSERT, UPDATE, DELETE ON public.yayika_user_purchases TO authenticated;
-- GRANT INSERT, UPDATE, DELETE ON public.yayika_user_items TO authenticated;
