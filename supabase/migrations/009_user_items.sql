-- ============================================================================
-- YAYIKA APP - MIGRATION 009: STREAK FREEZE / SHIELD INVENTORY
-- Created: 2026-10-19
-- Description: yayika_user_items was referenced by streak-insurance and
--              retention-check-in edge functions but never created.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yayika_user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_yayika_user_items_user ON public.yayika_user_items(user_id);

DROP TRIGGER IF EXISTS set_yayika_user_items_updated_at ON public.yayika_user_items;
CREATE TRIGGER set_yayika_user_items_updated_at
  BEFORE UPDATE ON public.yayika_user_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.yayika_user_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own items" ON public.yayika_user_items;
CREATE POLICY "Users can view own items"
  ON public.yayika_user_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own items" ON public.yayika_user_items;
CREATE POLICY "Users can insert own items"
  ON public.yayika_user_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own items" ON public.yayika_user_items;
CREATE POLICY "Users can update own items"
  ON public.yayika_user_items FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- Table: yayika_user_items (freeze/shield inventory, unique per user+item)
-- RLS policies: 3 (own rows only)
-- ============================================================================
