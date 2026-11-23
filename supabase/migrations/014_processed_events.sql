-- ============================================================================
-- 014 — Stripe webhook idempotency ledger
-- Prepared: 2026-11-23
-- Status: NOT APPLIED. Requires staging review + backup.
--
-- Why:
--   Stripe redelivers events on timeouts/retries. The current webhook has no
--   deduplication, so a redelivery inserts another purchase, activity log row
--   and entitlement. The webhook now claims event.id before doing any work.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yayika_processed_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_yayika_processed_events_processed_at
  ON public.yayika_processed_events (processed_at);

-- No policies on purpose: only service_role (the webhook) may read or write.
ALTER TABLE public.yayika_processed_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.yayika_processed_events IS
  'Stripe event ids already handled by the webhook. Insert fails with 23505 on duplicates.';

-- Optional retention (review before enabling): events older than 90 days can
-- be deleted to keep the table small; Stripe does not redeliver that far back.
-- DELETE FROM public.yayika_processed_events WHERE processed_at < now() - interval '90 days';
