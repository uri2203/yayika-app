-- Secret Badges (10 new)
-- These are hidden badges that unlock through special actions

INSERT INTO badges (id, name, description, icon, xp_reward, category, is_secret) VALUES
-- Secret Action Badges
('badge_night_owl', 'Noctámbula', 'Registra un check-in después de las 11 PM', '🦉', 25, 'secret', true),
('badge_early_bird', 'Madrugadora', 'Registra un check-in antes de las 6 AM', '🐦', 25, 'secret', true),
('badge_perfectionist', 'Perfeccionista', 'Completa 7 días consecutivos sin fallar', '💎', 50, 'secret', true),
('badge_compassionate', 'Compasiva', 'Ayuda a 3 mujeres en la comunidad', '💜', 40, 'secret', true),
('badge_fearless', 'Intrépida', 'Prueba todas las fases del ciclo en un mes', '⚡', 60, 'secret', true),

-- Secret Time Badges
('badge_full_moon', 'Luna Llena', 'Activa tu cuenta en luna llena', '🌕', 30, 'secret', true),
('badge_new_moon', 'Luna Nueva', 'Activa tu cuenta en luna nueva', '🌑', 30, 'secret', true),
('badge_equinox', 'Equinoccio', 'Activa tu cuenta en equinoccio', '🌸', 40, 'secret', true),

-- Secret Achievement Badges
('badge_streak_30', 'Leyenda', 'Mantén una racha de 30 días', '👑', 100, 'secret', true),
('badge_xp_1000', 'Maestra', 'Acumula 1000 XP', '🏆', 75, 'secret', true);

-- Seasonal Events Table
CREATE TABLE IF NOT EXISTS seasonal_events (
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

-- Insert seasonal events for 2026
INSERT INTO seasonal_events (season, event_name, description, start_date, end_date, xp_bonus, badge_id) VALUES
-- Spring: Renewal and growth
('spring', 'Renacer Primaveral', 'Renueva tu compromiso con tu bienestar. Check-ins dobles de XP.', '2026-03-20', '2026-06-20', 10, 'badge_spring_renewal'),

-- Summer: Energy and vitality  
('summer', 'Fuego Veraniego', 'Aprovecha tu energía máxima. Desafíos especiales de verano.', '2026-06-21', '2026-09-22', 15, 'badge_summer_fire'),

-- Autumn: Harvest and gratitude
('autumn', 'Cosecha de Logros', 'Recoge los frutos de tu esfuerzo. Recompensas extra.', '2026-09-23', '2026-12-21', 10, 'badge_autumn_harvest'),

-- Winter: Rest and reflection
('winter', 'Reposo Invernal', 'Descansa y reflexiona. Check-ins de bienestar.', '2026-12-22', '2027-03-19', 5, 'badge_winter_rest');

-- Phase-specific content table
CREATE TABLE IF NOT EXISTS phase_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL CHECK (phase IN ('menstrual', 'follicular', 'ovulatory', 'luteal')),
  content_type TEXT NOT NULL CHECK (content_type IN ('exercise', 'nutrition', 'mindfulness', 'productivity', 'social')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert phase-specific content
INSERT INTO phase_content (phase, content_type, title, description, xp_reward) VALUES
-- Menstrual Phase (Days 1-5): Rest and reflection
('menstrual', 'exercise', 'Yoga suave', '15 minutos de estiramientos suaves', 5),
('menstrual', 'nutrition', 'Alimentos ricos en hierro', 'Incluye espinacas, lentejas o carne roja', 5),
('menstrual', 'mindfulness', 'Meditación guiada', '10 minutos de meditación para la introspección', 5),
('menstrual', 'productivity', 'Planificación suave', 'Organiza tus ideas sin presión', 5),
('menstrual', 'social', 'Tiempo contigo misma', 'Dedica 30 minutos a tus hobbies', 5),

-- Follicular Phase (Days 6-13): Energy and new beginnings
('follicular', 'exercise', 'Cardio moderado', '30 minutos de caminata o bicicleta', 5),
('follicular', 'nutrition', 'Proteínas vegetales', 'Incluye quinoa, tofu o legumbres', 5),
('follicular', 'mindfulness', 'Visualización creativa', 'Imagina tus metas y sueños', 5),
('follicular', 'productivity', 'Nuevo proyecto', 'Empieza algo que te apasione', 5),
('follicular', 'social', 'Conexión social', 'Planea una salida con amigas', 5),

-- Ovulatory Phase (Days 14-16): Peak energy and expression
('ovulatory', 'exercise', 'Entrenamiento intenso', 'Clase de baile o HIIT', 5),
('ovulatory', 'nutrition', 'Alimentos energéticos', 'Frutas frescas y carbohidratos complejos', 5),
('ovulatory', 'mindfulness', 'Afirmaciones poderosas', 'Repite afirmaciones de poder personal', 5),
('ovulatory', 'productivity', 'Liderazgo', 'Toma la iniciativa en un proyecto', 5),
('ovulatory', 'social', 'Expresión auténtica', 'Comparte tus ideas con confianza', 5),

-- Luteal Phase (Days 17-28): Preparation and completion
('luteal', 'exercise', 'Ejercicio moderado', 'Pilates o natación suave', 5),
('luteal', 'nutrition', 'Alimentos calmantes', 'Té de manzanilla y chocolate oscuro', 5),
('luteal', 'mindfulness', 'Escritura reflexiva', 'Escribe en tu diario sobre tus emociones', 5),
('luteal', 'productivity', 'Completar tareas', 'Termina proyectos pendientes', 5),
('luteal', 'social', 'Círculo de confianza', 'Comparte con tus amigas más cercanas', 5);
