-- ============================================================================
-- 015 — Seasonal events and phase content tables
-- Prepared: 2026-11-23
-- Status: APPLIED to production 2026-11-23 after logical backup.
--
-- Why:
--   `seasonal-events` Edge Function calls `seasonal_events` (get_active) and
--   `phase_content` (get_phase_content), but migration 006 was never applied in
--   the live project. Both actions failed with 400 "relation does not exist".
--   This migration recreates only those two tables, idempotently, with the
--   original seed data and read-only RLS policies.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.seasonal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season TEXT NOT NULL CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
  event_name TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  xp_bonus INTEGER DEFAULT 0,
  badge_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_seasonal_events_season_start
  ON public.seasonal_events (season, start_date);

CREATE TABLE IF NOT EXISTS public.phase_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL CHECK (phase IN ('menstrual', 'follicular', 'ovulatory', 'luteal')),
  content_type TEXT NOT NULL CHECK (content_type IN ('exercise', 'nutrition', 'mindfulness', 'productivity', 'social')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_phase_content_phase_type_title
  ON public.phase_content (phase, content_type, title);

INSERT INTO public.seasonal_events (season, event_name, description, start_date, end_date, xp_bonus, badge_id) VALUES
  ('spring', 'Renacer Primaveral', 'Renueva tu compromiso con tu bienestar. Check-ins dobles de XP.', '2026-03-20', '2026-06-20', 10, 'badge_spring_renewal'),
  ('summer', 'Fuego Veraniego', 'Aprovecha tu energía máxima. Desafíos especiales de verano.', '2026-06-21', '2026-09-22', 15, 'badge_summer_fire'),
  ('autumn', 'Cosecha de Logros', 'Recoge los frutos de tu esfuerzo. Recompensas extra.', '2026-09-23', '2026-12-21', 10, 'badge_autumn_harvest'),
  ('winter', 'Reposo Invernal', 'Descansa y reflexiona. Check-ins de bienestar.', '2026-12-22', '2027-03-19', 5, 'badge_winter_rest')
ON CONFLICT (season, start_date) DO NOTHING;

INSERT INTO public.phase_content (phase, content_type, title, description, xp_reward) VALUES
  ('menstrual', 'exercise', 'Yoga suave', '15 minutos de estiramientos suaves', 5),
  ('menstrual', 'nutrition', 'Alimentos ricos en hierro', 'Incluye espinacas, lentejas o carne roja', 5),
  ('menstrual', 'mindfulness', 'Meditación guiada', '10 minutos de meditación para la introspección', 5),
  ('menstrual', 'productivity', 'Planificación suave', 'Organiza tus ideas sin presión', 5),
  ('menstrual', 'social', 'Tiempo contigo misma', 'Dedica 30 minutos a tus hobbies', 5),
  ('follicular', 'exercise', 'Cardio moderado', '30 minutos de caminata o bicicleta', 5),
  ('follicular', 'nutrition', 'Proteínas vegetales', 'Incluye quinoa, tofu o legumbres', 5),
  ('follicular', 'mindfulness', 'Visualización creativa', 'Imagina tus metas y sueños', 5),
  ('follicular', 'productivity', 'Nuevo proyecto', 'Empieza algo que te apasione', 5),
  ('follicular', 'social', 'Conexión social', 'Planea una salida con amigas', 5),
  ('ovulatory', 'exercise', 'Entrenamiento intenso', 'Clase de baile o HIIT', 5),
  ('ovulatory', 'nutrition', 'Alimentos energéticos', 'Frutas frescas y carbohidratos complejos', 5),
  ('ovulatory', 'mindfulness', 'Afirmaciones poderosas', 'Repite afirmaciones de poder personal', 5),
  ('ovulatory', 'productivity', 'Liderazgo', 'Toma la iniciativa en un proyecto', 5),
  ('ovulatory', 'social', 'Expresión auténtica', 'Comparte tus ideas con confianza', 5),
  ('luteal', 'exercise', 'Ejercicio moderado', 'Pilates o natación suave', 5),
  ('luteal', 'nutrition', 'Alimentos calmantes', 'Té de manzanilla y chocolate oscuro', 5),
  ('luteal', 'mindfulness', 'Escritura reflexiva', 'Escribe en tu diario sobre tus emociones', 5),
  ('luteal', 'productivity', 'Completar tareas', 'Termina proyectos pendientes', 5),
  ('luteal', 'social', 'Círculo de confianza', 'Comparte con tus amigas más cercanas', 5)
ON CONFLICT (phase, content_type, title) DO NOTHING;

ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active seasonal events" ON public.seasonal_events;
CREATE POLICY "Anyone can view active seasonal events"
  ON public.seasonal_events FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view active phase content" ON public.phase_content;
CREATE POLICY "Anyone can view active phase content"
  ON public.phase_content FOR SELECT
  USING (is_active = true);
