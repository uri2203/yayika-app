-- ============================================================================
-- YAYIKA APP - RETENTION PSYCHOLOGY SYSTEM
-- Created: 2026-09-01
-- Description: Tables for psychological retention mechanisms
-- ============================================================================

-- ============================================================================
-- 1. TRANSFORM HISTORY (El Espejo del Tiempo)
-- Tracks monthly transformation data for each user
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yayika_transform_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_date DATE NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  checkins_count INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  cycle_logs_count INTEGER DEFAULT 0,
  transactions_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  level_at_month INTEGER DEFAULT 1,
  data_snapshot JSONB DEFAULT '{}',
  comparison JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month_date)
);

CREATE INDEX IF NOT EXISTS idx_transform_history_user ON public.yayika_transform_history(user_id);
CREATE INDEX IF NOT EXISTS idx_transform_history_month ON public.yayika_transform_history(month_date DESC);

ALTER TABLE public.yayika_transform_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transform history" ON public.yayika_transform_history;
CREATE POLICY "Users can view own transform history"
  ON public.yayika_transform_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transform history" ON public.yayika_transform_history;
CREATE POLICY "Users can insert own transform history"
  ON public.yayika_transform_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transform history" ON public.yayika_transform_history;
CREATE POLICY "Users can update own transform history"
  ON public.yayika_transform_history FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. REWARD WHEEL (La Rueda de la Incertidumbre)
-- Daily spin tracking with variable rewards
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yayika_reward_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  spin_date DATE DEFAULT CURRENT_DATE,
  result_type TEXT NOT NULL,
  result_value INTEGER DEFAULT 0,
  result_data JSONB DEFAULT '{}',
  xp_awarded INTEGER DEFAULT 0,
  badge_key TEXT,
  content_unlocked TEXT,
  is_special BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, spin_date)
);

CREATE INDEX IF NOT EXISTS idx_reward_spins_user ON public.yayika_reward_spins(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_spins_date ON public.yayika_reward_spins(spin_date DESC);

ALTER TABLE public.yayika_reward_spins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reward spins" ON public.yayika_reward_spins;
CREATE POLICY "Users can view own reward spins"
  ON public.yayika_reward_spins FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reward spins" ON public.yayika_reward_spins;
CREATE POLICY "Users can insert own reward spins"
  ON public.yayika_reward_spins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. CYCLE REWARDS (Urgencia del Día Exacto)
-- Special rewards for specific cycle days
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yayika_cycle_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_day INTEGER NOT NULL,
  phase TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_title TEXT NOT NULL,
  reward_content TEXT,
  reward_xp INTEGER DEFAULT 0,
  reward_badge TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cycle_rewards_day ON public.yayika_cycle_rewards(cycle_day);
CREATE INDEX IF NOT EXISTS idx_cycle_rewards_phase ON public.yayika_cycle_rewards(phase);

ALTER TABLE public.yayika_cycle_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active cycle rewards" ON public.yayika_cycle_rewards;
CREATE POLICY "Anyone can view active cycle rewards"
  ON public.yayika_cycle_rewards FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- 4. USER CYCLE REWARDS (Tracking of claimed rewards)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yayika_user_cycle_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES public.yayika_cycle_rewards(id) ON DELETE CASCADE,
  cycle_id UUID,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, reward_id, cycle_id)
);

CREATE INDEX IF NOT EXISTS idx_user_cycle_rewards_user ON public.yayika_user_cycle_rewards(user_id);

ALTER TABLE public.yayika_user_cycle_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cycle rewards" ON public.yayika_user_cycle_rewards;
CREATE POLICY "Users can view own circle rewards"
  ON public.yayika_user_cycle_rewards FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cycle rewards" ON public.yayika_user_cycle_rewards;
CREATE POLICY "Users can insert own cycle rewards"
  ON public.yayika_user_cycle_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. CIRCLE ACTIVITY (La Trampa Social)
-- Tracks user activity visibility for social pressure
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yayika_circle_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  circle_name TEXT,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  is_visible BOOLEAN DEFAULT true,
  activity_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_circle_activity_user ON public.yayika_circle_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_activity_active ON public.yayika_circle_activity(last_active_at DESC);

DROP TRIGGER IF EXISTS set_yayika_circle_activity_updated_at ON public.yayika_circle_activity;
CREATE TRIGGER set_yayika_circle_activity_updated_at
  BEFORE UPDATE ON public.yayika_circle_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.yayika_circle_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own circle activity" ON public.yayika_circle_activity;
CREATE POLICY "Users can view own circle activity"
  ON public.yayika_circle_activity FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own circle activity" ON public.yayika_circle_activity;
CREATE POLICY "Users can insert own circle activity"
  ON public.yayika_circle_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own circle activity" ON public.yayika_circle_activity;
CREATE POLICY "Users can update own circle activity"
  ON public.yayika_circle_activity FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. LOSS WARNINGS (La Semilla del Dolor)
-- Tracks warnings shown and user response
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yayika_loss_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  warning_type TEXT NOT NULL,
  days_inactive INTEGER DEFAULT 0,
  streak_at_risk INTEGER DEFAULT 0,
  data_at_risk JSONB DEFAULT '{}',
  shown_at TIMESTAMPTZ DEFAULT now(),
  dismissed BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_loss_warnings_user ON public.yayika_loss_warnings(user_id);

ALTER TABLE public.yayika_loss_warnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own loss warnings" ON public.yayika_loss_warnings;
CREATE POLICY "Users can view own loss warnings"
  ON public.yayika_loss_warnings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own loss warnings" ON public.yayika_loss_warnings;
CREATE POLICY "Users can insert own loss warnings"
  ON public.yayika_loss_warnings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. FUTURE SELF (Portal de la Versión Futura)
-- Monthly projections and goals
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yayika_future_self (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  projection_date DATE NOT NULL,
  current_level INTEGER DEFAULT 1,
  projected_level INTEGER DEFAULT 1,
  current_badges INTEGER DEFAULT 0,
  projected_badges INTEGER DEFAULT 0,
  current_xp INTEGER DEFAULT 0,
  projected_xp INTEGER DEFAULT 0,
  goals JSONB DEFAULT '[]',
  achieved_goals JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, projection_date)
);

CREATE INDEX IF NOT EXISTS idx_future_self_user ON public.yayika_future_self(user_id);

ALTER TABLE public.yayika_future_self ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own future self" ON public.yayika_future_self;
CREATE POLICY "Users can view own future self"
  ON public.yayika_future_self FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own future self" ON public.yayika_future_self;
CREATE POLICY "Users can insert own future self"
  ON public.yayika_future_self FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own future self" ON public.yayika_future_self;
CREATE POLICY "Users can update own future self"
  ON public.yayika_future_self FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA - Cycle Rewards (1 cycle = 28 days)
-- ============================================================================

INSERT INTO public.yayika_cycle_rewards (cycle_day, phase, reward_type, reward_title, reward_xp, reward_badge) VALUES
-- Menstrual phase (days 1-5)
(1, 'menstrual', 'badge', 'Luna Nueva', 15, 'moon_new'),
(2, 'menstrual', 'xp', 'Energía de Renacimiento', 10, NULL),
(3, 'menstrual', 'content', 'Guía de Descanso Activo', 10, NULL),
(4, 'menstrual', 'xp', 'Claridad Mental', 10, NULL),
(5, 'menstrual', 'badge', 'Renacimiento', 15, 'rebirth'),

-- Follicular phase (days 6-13)
(6, 'follicular', 'content', 'Planificador de Proyectos Nuevos', 10, NULL),
(7, 'follicular', 'xp', 'Energía Creciente', 10, NULL),
(8, 'follicular', 'badge', 'Semilla que Brota', 15, 'sprout'),
(9, 'follicular', 'content', 'Técnicas de Brainstorming', 10, NULL),
(10, 'follicular', 'xp', 'Pico de Creatividad', 15, NULL),
(11, 'follicular', 'content', 'Guía de Aprendizaje Acelerado', 10, NULL),
(12, 'follicular', 'badge', 'Creadora', 15, 'creator'),
(13, 'follicular', 'xp', 'Preparación al Pico', 10, NULL),

-- Ovulatory phase (days 14-17)
(14, 'ovulatory', 'badge', 'Reina del Día', 25, 'queen_day'),
(15, 'ovulatory', 'content', 'Masterclass de Negociación', 20, NULL),
(16, 'ovulatory', 'xp', 'Máximo Poder', 20, NULL),
(17, 'ovulatory', 'badge', 'Líder Nata', 20, 'natural_leader'),

-- Luteal phase (days 18-28)
(18, 'luteal', 'content', 'Guía de Gestión Emocional', 10, NULL),
(19, 'luteal', 'xp', 'Sabiduría Interior', 10, NULL),
(20, 'luteal', 'badge', 'Reflexiva', 15, 'reflective'),
(21, 'luteal', 'content', 'Ejercicio de Journaling', 10, NULL),
(22, 'luteal', 'xp', 'Fuerza Tranquila', 10, NULL),
(23, 'luteal', 'content', 'Técnicas de Organización', 10, NULL),
(24, 'luteal', 'badge', 'Estratega', 15, 'strategist'),
(25, 'luteal', 'xp', 'Preparación Final', 10, NULL),
(26, 'luteal', 'content', 'Planificador del Próximo Ciclo', 10, NULL),
(27, 'luteal', 'xp', 'Cierre Sabio', 10, NULL),
(28, 'luteal', 'badge', 'Ciclo Completo', 25, 'cycle_complete')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- Tables created: 7 (transform_history, reward_spins, cycle_rewards, 
--                      user_cycle_rewards, circle_activity, loss_warnings, future_self)
-- RLS policies: 14
-- Indexes: 12
-- Triggers: 1 (updated_at on circle_activity)
-- Seed data: 28 cycle rewards (1 per day of cycle)
-- ============================================================================
