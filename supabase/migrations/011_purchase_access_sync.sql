-- ============================================================================
-- 011 — Reconcile yayika_purchases (Stripe webhook) with
--       yayika_user_purchases (catalog access checks)
-- Prepared: 2026-11-23
-- Status: NOT APPLIED. Requires staging review + backup.
--
-- Problem:
--   stripe-webhook inserts one-time purchases into yayika_purchases.
--   ai-product-catalog grants paid lesson access only when a matching row
--   exists in yayika_user_purchases. Paid buyers may therefore see locked
--   content.
--
-- Approach:
--   1. Add optional product_id/status columns to yayika_purchases (additive).
--   2. Mirror future webhook rows into yayika_user_purchases with a trigger.
--   3. Leave historical backfill commented out until the product mapping is
--      confirmed against real data (see supabase/diagnostics/schema_drift.sql).
--
-- The webhook must be updated separately to populate product_id/status.
-- ============================================================================

-- Preflight (read only). Run these first and review the results.
-- SELECT * FROM supabase/diagnostics/schema_drift.sql; -- conceptual reference
SELECT count(*) AS purchase_rows, count(user_id) AS rows_with_user
FROM public.yayika_purchases;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'yayika_purchases'
ORDER BY ordinal_position;

-- 1. Additive schema changes. Safe if the columns already exist.
ALTER TABLE public.yayika_purchases
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.yayika_products(id) ON DELETE SET NULL;

ALTER TABLE public.yayika_purchases
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';

CREATE INDEX IF NOT EXISTS idx_yayika_purchases_user_id ON public.yayika_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_yayika_purchases_product_id ON public.yayika_purchases(product_id);

-- 2. Mirror new webhook purchases into the access table. The NOT EXISTS guard
--    avoids granting duplicate access and does not require a unique index on a
--    table that may already contain duplicates.
CREATE OR REPLACE FUNCTION public.yayika_mirror_purchase_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.product_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NEW.status NOT IN ('active', 'completed') THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.yayika_user_purchases (user_id, product_id, amount, status)
  SELECT NEW.user_id, NEW.product_id, NEW.amount_total::numeric, 'completed'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.yayika_user_purchases p
    WHERE p.user_id = NEW.user_id
      AND p.product_id = NEW.product_id
      AND p.status IN ('active', 'completed')
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS yayika_mirror_purchase_access ON public.yayika_purchases;
CREATE TRIGGER yayika_mirror_purchase_access
  AFTER INSERT ON public.yayika_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.yayika_mirror_purchase_access();

-- 3. Historical backfill — INTENTIONALLY NOT ENABLED.
--    It needs a confirmed mapping from the legacy text in yayika_purchases.product
--    to yayika_products.id. Uncomment only after reviewing the mapping with the
--    product owner; a wrong mapping would grant paid content for free.
--
-- INSERT INTO public.yayika_user_purchases (user_id, product_id, amount, status)
-- SELECT pr.id, prod.id, pur.amount_total::numeric, 'completed'
-- FROM public.yayika_purchases pur
-- JOIN public.yayika_profiles pr ON lower(pr.email) = lower(pur.user_email)
-- JOIN public.yayika_products prod
--   ON prod.name = pur.product OR prod.id::text = pur.product
-- WHERE pur.status IN ('active', 'completed')
--   AND pur.product_id IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM public.yayika_user_purchases existing
--     WHERE existing.user_id = pr.id
--       AND existing.product_id = prod.id
--       AND existing.status IN ('active', 'completed')
--   );
