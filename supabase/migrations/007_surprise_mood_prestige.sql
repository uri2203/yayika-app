-- ============================================================
-- MIGRATION 007: Surprise Log, Badge Showcase, Prestige Level
-- ============================================================

-- 1. Tabla de registro de sorpresas (una por día por usuario)
CREATE TABLE IF NOT EXISTS yayika_surprise_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surprise_type TEXT NOT NULL,
  surprise_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, surprise_date)
);

-- 2. Tabla de entries de humor
CREATE TABLE IF NOT EXISTS yayika_mood_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  intensity INTEGER DEFAULT 5 CHECK (intensity BETWEEN 1 AND 10),
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Agregar columnas a user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS badge_showcase TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS prestige_level INTEGER DEFAULT 1;

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_surprise_log_user_date ON yayika_surprise_log(user_id, surprise_date);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user ON yayika_mood_entries(user_id, logged_at DESC);

-- 5. RLS
ALTER TABLE yayika_surprise_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE yayika_mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own surprise log" ON yayika_surprise_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own surprise log" ON yayika_surprise_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own mood entries" ON yayika_mood_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries" ON yayika_mood_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Vista de leaderboard pública (sin datos sensibles)
CREATE OR REPLACE VIEW public_leaderboard AS
SELECT
  user_id,
  display_name,
  avatar_url,
  streak,
  xp,
  prestige_level
FROM user_profiles
WHERE streak > 0 OR xp > 0
ORDER BY streak DESC, xp DESC
LIMIT 100;
