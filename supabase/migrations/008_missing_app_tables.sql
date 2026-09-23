-- 008: tables referenced by the app but missing from earlier migrations
-- Consolidates scripts/fix-finance-db.js, scripts/fix-circles-db.js, and code-only tables

-- ─── Daily action completions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.yayika_daily_action_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  xp_awarded INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_yayika_daily_action_completions_user
  ON public.yayika_daily_action_completions(user_id, completed_at DESC);

ALTER TABLE public.yayika_daily_action_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily action completions" ON public.yayika_daily_action_completions;
CREATE POLICY "Users can view own daily action completions"
  ON public.yayika_daily_action_completions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily action completions" ON public.yayika_daily_action_completions;
CREATE POLICY "Users can insert own daily action completions"
  ON public.yayika_daily_action_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── Feature flags ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.yayika_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.yayika_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feature flags readable by authenticated" ON public.yayika_feature_flags;
CREATE POLICY "Feature flags readable by authenticated"
  ON public.yayika_feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- ─── User badges ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.yayika_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_yayika_user_badges_user
  ON public.yayika_user_badges(user_id);

ALTER TABLE public.yayika_user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badges" ON public.yayika_user_badges;
CREATE POLICY "Users can view own badges"
  ON public.yayika_user_badges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own badges" ON public.yayika_user_badges;
CREATE POLICY "Users can insert own badges"
  ON public.yayika_user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── Budget (from scripts/fix-finance-db.js) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.yayika_budget (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_income DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.yayika_budget ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own budget" ON public.yayika_budget;
CREATE POLICY "Users can view own budget"
  ON public.yayika_budget FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own budget" ON public.yayika_budget;
CREATE POLICY "Users can insert own budget"
  ON public.yayika_budget FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own budget" ON public.yayika_budget;
CREATE POLICY "Users can update own budget"
  ON public.yayika_budget FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_yayika_budget_user ON public.yayika_budget(user_id);

-- ─── Circles (from scripts/fix-circles-db.js) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.yayika_circles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '💜',
  category TEXT DEFAULT 'general',
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 20,
  is_private BOOLEAN DEFAULT false,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.yayika_circle_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.yayika_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.yayika_circle_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.yayika_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  reply_to UUID REFERENCES public.yayika_circle_messages(id),
  edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.yayika_circle_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.yayika_circles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_circles_creator ON public.yayika_circles(creator_id);
CREATE INDEX IF NOT EXISTS idx_circles_category ON public.yayika_circles(category);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON public.yayika_circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user ON public.yayika_circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_messages_circle ON public.yayika_circle_messages(circle_id, created_at);
CREATE INDEX IF NOT EXISTS idx_circle_messages_user ON public.yayika_circle_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_invites_circle ON public.yayika_circle_invites(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_invites_user ON public.yayika_circle_invites(invited_user_id);

ALTER TABLE public.yayika_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yayika_circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yayika_circle_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yayika_circle_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public circles visible to all" ON public.yayika_circles;
CREATE POLICY "Public circles visible to all"
  ON public.yayika_circles FOR SELECT
  USING (is_private = false);

DROP POLICY IF EXISTS "Private circles visible to members" ON public.yayika_circles;
CREATE POLICY "Private circles visible to members"
  ON public.yayika_circles FOR SELECT
  USING (
    is_private = false
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.yayika_circle_members
      WHERE circle_id = id AND user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can create circles" ON public.yayika_circles;
CREATE POLICY "Users can create circles"
  ON public.yayika_circles FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update their circles" ON public.yayika_circles;
CREATE POLICY "Creators can update their circles"
  ON public.yayika_circles FOR UPDATE
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Members can view circle members" ON public.yayika_circle_members;
CREATE POLICY "Members can view circle members"
  ON public.yayika_circle_members FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM public.yayika_circle_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join circles" ON public.yayika_circle_members;
CREATE POLICY "Users can join circles"
  ON public.yayika_circle_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave circles" ON public.yayika_circle_members;
CREATE POLICY "Users can leave circles"
  ON public.yayika_circle_members FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can view messages" ON public.yayika_circle_messages;
CREATE POLICY "Members can view messages"
  ON public.yayika_circle_messages FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM public.yayika_circle_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can send messages" ON public.yayika_circle_messages;
CREATE POLICY "Members can send messages"
  ON public.yayika_circle_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND circle_id IN (
      SELECT circle_id FROM public.yayika_circle_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can edit own messages" ON public.yayika_circle_messages;
CREATE POLICY "Users can edit own messages"
  ON public.yayika_circle_messages FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON public.yayika_circle_messages;
CREATE POLICY "Users can delete own messages"
  ON public.yayika_circle_messages FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Circle members can view invites" ON public.yayika_circle_invites;
CREATE POLICY "Circle members can view invites"
  ON public.yayika_circle_invites FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM public.yayika_circle_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create invites" ON public.yayika_circle_invites;
CREATE POLICY "Members can create invites"
  ON public.yayika_circle_invites FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND circle_id IN (
      SELECT circle_id FROM public.yayika_circle_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
