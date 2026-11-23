-- ============================================================================
-- 012 — At most one active subscription per user
-- Prepared: 2026-11-23
-- Status: NOT APPLIED. Requires staging review + backup.
--
-- Problem:
--   stripe-webhook does select-then-insert on yayika_subscriptions and there is
--   no unique constraint on user_id. Renewal/retry events can create duplicate
--   active rows, making the app show the wrong plan or renewal date.
--
-- Do NOT apply until the duplicate report in diagnostics/schema_drift.sql
-- returns zero rows for non-active subscriptions and a data-owner decision has
-- been made about existing duplicates.
-- ============================================================================

-- Preflight: duplicates that would block the index.
SELECT user_id, count(*) AS rows
FROM public.yayika_subscriptions
WHERE status IN ('active', 'trialing', 'past_due')
GROUP BY user_id
HAVING count(*) > 1
ORDER BY rows DESC;

-- Preflight: active subscriptions whose paid period already ended.
SELECT id, user_id, status, current_period_end, grace_period_end
FROM public.yayika_subscriptions
WHERE status IN ('active', 'trialing')
  AND current_period_end IS NOT NULL
  AND current_period_end <= now();

-- Apply only after resolving the rows above. CONCURRENTLY avoids blocking
-- writes, so run it outside an explicit transaction in the SQL editor.
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS ux_yayika_subscriptions_active_user
--   ON public.yayika_subscriptions (user_id)
--   WHERE status IN ('active', 'trialing', 'past_due');

-- Recommended follow-up (also pending review): make the webhook use an upsert
-- keyed on (user_id, stripe_subscription_id) instead of select-then-insert.
